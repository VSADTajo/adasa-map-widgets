import { describe, expect, it } from 'vitest'
import { buildHydrograph } from './hydrograph'
import { at, fakeLocale } from './chart.fixtures'
import type { HydroPoint, HydrographProps } from '@/charts/types/HydrographProps'

const points = (...values: number[]): HydroPoint[] => values.map((v, i) => [at(i), v])

const props: HydrographProps = {
  discharge: {
    observed: points(10, 12),
    forecasts: [
      {
        id: 'eps',
        name: 'EPS',
        values: points(12, 20),
        percentiles: {
          p10: points(10, 15),
          p25: points(11, 17),
          p75: points(13, 23),
          p90: points(14, 26),
        },
      },
      { id: 'harmonie', name: 'Harmonie', values: points(12, 30) },
    ],
  },
  precipitation: {
    observed: points(1, 2),
    forecasts: [{ id: 'harmonie', name: 'Harmonie', values: points(3, 4) }],
  },
  thresholds: [{ value: 25, level: 'naranja' }],
}

const build = (extra: Partial<HydrographProps> = {}) =>
  buildHydrograph({ ...props, ...extra }, fakeLocale.t)

describe('buildHydrograph', () => {
  it('con precipitación crea dos paneles: lluvia (35 %) arriba y caudal abajo', () => {
    expect(build().panels).toEqual([
      { id: 'precipitation', weight: 0.35 },
      { id: 'discharge', weight: 0.65 },
    ])
  })

  it('sin precipitación, un solo panel', () => {
    expect(build({ precipitation: undefined }).panels).toEqual([{ id: 'discharge' }])
  })

  it('invierte el eje de precipitación y pone las unidades por defecto', () => {
    const [rain, flow] = build().yAxes!
    expect(rain).toMatchObject({
      id: 'precipitation',
      inverse: true,
      unit: 'mm',
      label: 'Precipitación',
    })
    expect(flow).toMatchObject({
      id: 'discharge',
      unit: 'm³/s',
      label: 'Caudal',
      beginAtZero: true,
    })
  })

  it('magnitude="level" cambia unidad y título, y no fuerza el 0', () => {
    expect(build({ magnitude: 'level' }).yAxes![1]).toMatchObject({
      unit: 'm',
      label: 'Nivel',
      beginAtZero: false,
    })
  })

  it('observado sólido y previsto discontinuo', () => {
    const series = build().series
    const observed = series.find((s) => s.id === 'discharge-observed')!
    expect(observed.type).toBe('line')
    expect(observed.lineStyle ?? 'solid').toBe('solid')
    expect(series.find((s) => s.id === 'discharge-eps')).toMatchObject({
      type: 'line',
      lineStyle: 'dashed',
    })
  })

  it('la misma fuente comparte color en lluvia y caudal; el observado usa el 1.º de la paleta', () => {
    const series = build().series
    const color = (id: string) => series.find((s) => s.id === id)!.color
    expect(color('discharge-observed')).toBe('var(--as-data-cat-1)')
    expect(color('precipitation-observed')).toBe('var(--as-data-cat-1)')
    expect(color('discharge-harmonie')).toBe(color('precipitation-harmonie'))
    expect(color('discharge-eps')).not.toBe(color('discharge-harmonie'))
  })

  it('dibuja las bandas p10–p90 y p25–p75 antes que las líneas, sin entrada en la leyenda', () => {
    const ids = build().series.map((s) => s.id)
    const bands = ['discharge-eps-p10-p90', 'discharge-eps-p25-p75']
    expect(ids.indexOf(bands[0]!)).toBeLessThan(ids.indexOf('discharge-observed'))
    const band = build().series.find((s) => s.id === bands[0])!
    expect(band).toMatchObject({ type: 'range', legend: false, opacity: 0.15, name: 'EPS p10–p90' })
    expect(band.data[1]).toEqual([at(1), 15, 26])
  })

  it('bands limita qué bandas se dibujan', () => {
    const ids = build({ bands: ['p25-p75'] }).series.map((s) => s.id)
    expect(ids).toContain('discharge-eps-p25-p75')
    expect(ids).not.toContain('discharge-eps-p10-p90')
  })

  it('convierte los umbrales en anotaciones del eje de caudal', () => {
    expect(build().annotations?.y).toEqual([
      { yAxis: 'discharge', value: 25, level: 'naranja', label: 'Umbral naranja' },
    ])
  })

  it('"ahora" por defecto; now: false lo quita', () => {
    expect(build().now).toBe(true)
    expect(build({ now: false }).now).toBe(false)
    expect(build({ now: at(3) }).now).toEqual(at(3))
  })

  it('las series extra van por defecto al eje de caudal', () => {
    const extra = build({
      extraSeries: [{ id: 'x', name: 'X', type: 'line', data: [] }],
    }).series.at(-1)
    expect(extra).toMatchObject({ id: 'x', yAxis: 'discharge' })
  })

  it('pasa tal cual el motor y las opciones de interacción', () => {
    expect(build({ chartLibrary: 'chartjs', zoom: true, tooltip: false })).toMatchObject({
      chartLibrary: 'chartjs',
      zoom: true,
      tooltip: false,
    })
  })
})
