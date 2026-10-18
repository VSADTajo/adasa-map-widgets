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

describe('buildHydrograph · disposición de la precipitación', () => {
  it('overlay: un solo panel, con la precipitación en un eje a la derecha', () => {
    const chart = build({ precipitationLayout: 'overlay' })
    expect(chart.panels).toEqual([{ id: 'discharge' }])
    expect(chart.yAxes![0]).toMatchObject({
      id: 'precipitation',
      panel: 'discharge',
      position: 'right',
      inverse: true,
      grid: false,
    })
  })

  it('overlay: estira el eje de lluvia para que las barras ocupen ~el 40 % superior', () => {
    // Máximo de lluvia en los datos: 4 mm → 4 × 2,5 = 10.
    expect(build({ precipitationLayout: 'overlay' }).yAxes![0]!.max).toBe(10)
  })

  it('precipitationInverted: false hace que las barras crezcan desde abajo', () => {
    expect(build({ precipitationInverted: false }).yAxes![0]!.inverse).toBe(false)
    expect(
      build({ precipitationLayout: 'overlay', precipitationInverted: false }).yAxes![0]!.inverse,
    ).toBe(false)
  })

  it('pasa la posición de la leyenda y los valores en la leyenda', () => {
    expect(build({ legend: 'bottom', legendValues: true })).toMatchObject({
      legend: 'bottom',
      legendValues: true,
    })
  })
})

describe('buildHydrograph · nombres, colores y ejes de cada serie', () => {
  it('nombre y color propios del observado, por variable', () => {
    const series = build({
      discharge: { ...props.discharge, observedName: 'Caudal medido', observedColor: '#111111' },
      precipitation: { ...props.precipitation, observedName: 'Lluvia medida' },
    }).series
    expect(series.find((s) => s.id === 'discharge-observed')).toMatchObject({
      name: 'Caudal medido',
      color: '#111111',
    })
    expect(series.find((s) => s.id === 'precipitation-observed')).toMatchObject({
      name: 'Lluvia medida',
      color: 'var(--as-data-cat-1)',
    })
  })

  it('seriesOverrides cambia nombre, color, eje y estilo de cualquier serie generada', () => {
    const series = build({
      extraYAxes: [{ id: 'nivel', unit: 'm', position: 'right' }],
      seriesOverrides: {
        'discharge-eps': { name: 'EPS (mediana)', color: '#7c3aed', yAxis: 'nivel' },
        'discharge-eps-p10-p90': { legend: true },
      },
    }).series
    expect(series.find((s) => s.id === 'discharge-eps')).toMatchObject({
      name: 'EPS (mediana)',
      color: '#7c3aed',
      yAxis: 'nivel',
      lineStyle: 'dashed',
    })
    expect(series.find((s) => s.id === 'discharge-eps-p10-p90')!.legend).toBe(true)
  })

  it('seriesOverrides no puede cambiar el id ni los datos', () => {
    const overrides = { 'discharge-observed': { id: 'otro', data: [] } } as never
    const observed = build({ seriesOverrides: overrides }).series.find(
      (s) => s.id === 'discharge-observed',
    )!
    expect(observed.data).toHaveLength(2)
  })

  it('yAxisOverrides retoca los ejes generados y los extra se añaden detrás', () => {
    const chart = build({
      yAxisOverrides: { discharge: { label: 'Q', position: 'right', max: 500 } },
      extraYAxes: [{ id: 'nivel' }],
    })
    expect(chart.yAxes!.map((a) => a.id)).toEqual(['precipitation', 'discharge', 'nivel'])
    expect(chart.yAxes![1]).toMatchObject({ label: 'Q', position: 'right', max: 500, unit: 'm³/s' })
  })

  it('pasa la barra de herramientas', () => {
    expect(build({ toolbar: true }).toolbar).toBe(true)
  })
})
