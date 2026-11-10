import { describe, expect, it } from 'vitest'
import type { TimePoint } from '@/detail/types/hydro'
import {
  aggregateByInterval,
  alertLevelOf,
  exceedanceSegments,
  hasThresholds,
  intervalStart,
  summarizeSeries,
  worstLevel,
} from './hydro'

const h = (hour: number, day = 19) => new Date(2026, 9, day, hour)
const thresholds = { amarillo: 40, naranja: 70, rojo: 90 }

describe('alertLevelOf', () => {
  it.each([
    [0, 'normal'],
    [39.99, 'normal'],
    [40, 'amarillo'],
    [69.9, 'amarillo'],
    [70, 'naranja'],
    [90, 'rojo'],
    [500, 'rojo'],
  ] as const)('%s → %s (el umbral cuenta como superado)', (value, level) => {
    expect(alertLevelOf(value, thresholds)).toBe(level)
  })

  it('sin valor o sin umbrales, normal; los umbrales que faltan no se evalúan', () => {
    expect(alertLevelOf(null, thresholds)).toBe('normal')
    expect(alertLevelOf(Number.NaN, thresholds)).toBe('normal')
    expect(alertLevelOf(100, undefined)).toBe('normal')
    expect(alertLevelOf(100, { amarillo: 40 })).toBe('amarillo')
    expect(alertLevelOf(100, { rojo: null, naranja: 80 })).toBe('naranja')
  })
})

describe('worstLevel', () => {
  it('el más grave; sin niveles, normal', () => {
    expect(worstLevel(['amarillo', 'rojo', 'normal'])).toBe('rojo')
    expect(worstLevel([])).toBe('normal')
  })
})

describe('summarizeSeries', () => {
  it('último, máximo y mínimo con su fecha, sin importar el orden ni los huecos', () => {
    const data: TimePoint[] = [
      [h(6), 30],
      [h(0), 10],
      [h(12), null],
      [h(3), 50],
      [h(9), 50],
    ]
    expect(summarizeSeries(data)).toEqual({
      last: [h(9), 50],
      max: [h(3), 50],
      min: [h(0), 10],
      count: 4,
    })
  })

  it('sin datos, todo null', () => {
    expect(summarizeSeries([[h(0), null]])).toEqual({ last: null, max: null, min: null, count: 0 })
  })
})

describe('exceedanceSegments', () => {
  const data: TimePoint[] = [
    [h(0), 10],
    [h(1), 45],
    [h(2), null],
    [h(3), 50],
    [h(4), 75],
    [h(5), 95],
    [h(6), 30],
    [h(7), 41],
  ]

  it('agrupa los valores seguidos del mismo nivel; los huecos no cortan', () => {
    expect(exceedanceSegments(data, thresholds)).toEqual([
      { level: 'amarillo', start: h(1), end: h(3), peak: 50 },
      { level: 'naranja', start: h(4), end: h(4), peak: 75 },
      { level: 'rojo', start: h(5), end: h(5), peak: 95 },
      { level: 'amarillo', start: h(7), end: h(7), peak: 41 },
    ])
  })

  it('sin umbrales no hay tramos', () => {
    expect(exceedanceSegments(data, undefined)).toEqual([])
  })
})

describe('intervalStart', () => {
  it('intervalos que dividen el día se cuentan desde las 00:00 locales', () => {
    const six = 6 * 3_600_000
    expect(intervalStart(new Date(2026, 9, 19, 5, 59), six)).toEqual(h(0))
    expect(intervalStart(new Date(2026, 9, 19, 6, 0), six)).toEqual(h(6))
    expect(intervalStart(new Date(2026, 9, 19, 23, 30), six)).toEqual(h(18))
  })
})

describe('aggregateByInterval', () => {
  it('mínimo, media y máximo de cada intervalo, en orden', () => {
    const data: TimePoint[] = [
      [h(7), 30],
      [h(1), 10],
      [h(2), 20],
      [h(8), null],
      [h(6), 60],
    ]
    expect(aggregateByInterval(data, 6 * 3_600_000)).toEqual([
      { start: h(0), min: 10, max: 20, mean: 15, count: 2 },
      { start: h(6), min: 30, max: 60, mean: 45, count: 2 },
    ])
  })
})

describe('hasThresholds', () => {
  it.each([
    [undefined, false],
    [{}, false],
    [{ rojo: null }, false],
    [{ naranja: 0 }, true],
  ])('%j → %s', (value, expected) => {
    expect(hasThresholds(value)).toBe(expected)
  })
})
