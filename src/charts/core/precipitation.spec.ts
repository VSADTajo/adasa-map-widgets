import { describe, expect, it } from 'vitest'
import type { HydroPoint } from '@/charts/types/HydrographProps'
import {
  aggregateDepth,
  convertPrecipitation,
  cumulativeAt,
  intervalHours,
  sortByTime,
  toCumulative,
  toDepth,
  toIntensity,
  typicalIntervalMinutes,
} from './precipitation'

const T0 = new Date(2026, 9, 18, 0, 0)
/** Instante a `minutes` de T0. */
const at = (minutes: number) => new Date(T0.getTime() + minutes * 60_000)
const series = (...pairs: [number, number | null][]): HydroPoint[] =>
  pairs.map(([minutes, value]) => [at(minutes), value])
const values = (points: HydroPoint[]) => points.map(([, value]) => value)

describe('sortByTime', () => {
  it('ordena por fecha sin tocar la serie original', () => {
    const input = series([60, 2], [0, 1], [30, 3])
    expect(values(sortByTime(input))).toEqual([1, 3, 2])
    expect(values(input)).toEqual([2, 1, 3])
  })
})

describe('intervalHours', () => {
  it('distancia al punto anterior; el primero, la mediana de los intervalos', () => {
    expect(intervalHours(series([0, 0], [60, 0], [120, 0], [300, 0]))).toEqual([1, 1, 1, 3])
  })

  it('con intervalMinutes, el mismo para todos (aunque haya huecos)', () => {
    expect(intervalHours(series([0, 0], [10, 0], [600, 0]), { intervalMinutes: 10 })).toEqual([
      1 / 6,
      1 / 6,
      1 / 6,
    ])
  })

  it('un solo punto: 1 h; instantes repetidos: el intervalo típico, nunca 0', () => {
    expect(intervalHours(series([0, 1]))).toEqual([1])
    expect(intervalHours(series([0, 0], [60, 0], [60, 0], [120, 0]))).toEqual([1, 1, 1, 1])
  })
})

describe('toIntensity (mm por intervalo → mm/h)', () => {
  it.each([
    ['horario', series([0, 2], [60, 3]), [2, 3]],
    ['cada 10 min', series([0, 1], [10, 0.5], [20, 2]), [6, 3, 12]],
    ['cada 3 h', series([0, 6], [180, 3]), [2, 1]],
  ] as const)('%s', (_name, input, expected) => {
    expect(values(toIntensity(input))).toEqual(expected)
  })

  it('el primer punto usa el intervalo típico, no 0 (no hay caída falsa al principio)', () => {
    expect(values(toIntensity(series([0, 4], [60, 4], [120, 4])))).toEqual([4, 4, 4])
  })

  it('ordena, pone a 0 los negativos y respeta los huecos', () => {
    expect(values(toIntensity(series([120, -1], [0, 1], [60, null])))).toEqual([1, null, 0])
  })
})

describe('toDepth (mm/h → mm por intervalo)', () => {
  it('multiplica por la duración del intervalo', () => {
    expect(values(toDepth(series([0, 6], [10, 12], [20, 3])))).toEqual([1, 2, 0.5])
  })

  it('es la inversa de toIntensity', () => {
    const depths = series([0, 1.2], [15, 0.4], [30, 2.5], [90, 3])
    expect(values(toDepth(toIntensity(depths)))).toEqual(values(depths))
  })
})

describe('convertPrecipitation', () => {
  const depths = series([0, 1], [30, 2])
  it.each([
    ['depth', 'intensity', [2, 4]],
    ['intensity', 'depth', [0.5, 1]],
    ['depth', 'depth', [1, 2]],
  ] as const)('de %s a %s', (from, to, expected) => {
    expect(values(convertPrecipitation(depths, from, to))).toEqual(expected)
  })

  it('sin conversión también ordena y quita negativos', () => {
    expect(values(convertPrecipitation(series([60, -3], [0, 1]), 'depth', 'depth'))).toEqual([1, 0])
  })
})

describe('toCumulative', () => {
  it('suma corrida que nunca baja: negativos como 0 y huecos sin sumar', () => {
    expect(values(toCumulative(series([0, 1], [60, -2], [120, null], [180, 2.5])))).toEqual([
      1, 1, 1, 3.5,
    ])
  })

  it('desde un instante: los anteriores no cuentan ni se dibujan', () => {
    const cumulative = toCumulative(series([0, 5], [60, 1], [120, 2]), { from: at(60) })
    expect(cumulative.map(([date]) => date)).toEqual([at(60), at(120)])
    expect(values(cumulative)).toEqual([1, 3])
  })

  it('con start, continúa otro total (la previsión tras el observado)', () => {
    expect(values(toCumulative(series([0, 1], [60, 2]), { start: 10 }))).toEqual([11, 13])
  })

  it('sin errores de coma flotante a la vista', () => {
    expect(values(toCumulative(series([0, 0.1], [60, 0.2])))).toEqual([0.1, 0.3])
  })
})

describe('cumulativeAt', () => {
  const cumulative = series([0, 1], [60, 3], [120, 6])
  it.each([
    [-10, 0],
    [0, 1],
    [90, 3],
    [500, 6],
  ])('a los %s min → %s', (minutes, expected) => {
    expect(cumulativeAt(cumulative, at(minutes))).toBe(expected)
  })
})

describe('aggregateDepth', () => {
  it('suma los mm de cada hora; cada valor va a la hora que lo contiene (marca el final)', () => {
    const tenMinutes = series([10, 1], [20, 1], [60, 1], [70, 2], [120, 0.5])
    expect(aggregateDepth(tenMinutes, 60)).toEqual(series([60, 3], [120, 2.5]))
  })

  it('alineado a la medianoche local: con 180 min, 03:00, 06:00...', () => {
    const points = series([30, 1], [200, 2], [360, 1])
    expect(aggregateDepth(points, 180).map(([date]) => date.getHours())).toEqual([3, 6])
  })

  it('negativos como 0; intervalo con solo huecos, null; sin datos, no aparece', () => {
    expect(aggregateDepth(series([10, -1], [20, 2], [130, null]), 60)).toEqual(
      series([60, 2], [180, null]),
    )
  })

  it('sin intervalo válido, solo ordena', () => {
    expect(values(aggregateDepth(series([60, 2], [0, 1]), 0))).toEqual([1, 2])
  })
})

describe('typicalIntervalMinutes', () => {
  it.each([
    [series([0, 0], [10, 0], [20, 0]), 10],
    [series([0, 0], [180, 0], [360, 0], [600, 0]), 180],
    [series([0, 0]), 0],
  ])('%#', (points, expected) => {
    expect(typicalIntervalMinutes(points)).toBe(expected)
  })
})
