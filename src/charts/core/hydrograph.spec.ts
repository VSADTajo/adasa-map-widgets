import { describe, expect, it } from 'vitest'
import { buildHydrograph } from './hydrograph'
import { at, fakeLocale } from './chart.fixtures'
import type { HydroForecast, HydroPoint, HydrographProps } from '@/charts/types/HydrographProps'

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

  it('dibuja las bandas p10–p90 y p25–p75 antes que las líneas, con su entrada en la leyenda', () => {
    const ids = build().series.map((s) => s.id)
    const bands = ['discharge-eps-p10-p90', 'discharge-eps-p25-p75']
    expect(ids.indexOf(bands[0]!)).toBeLessThan(ids.indexOf('discharge-observed'))
    const band = build().series.find((s) => s.id === bands[0])!
    expect(band).toMatchObject({ type: 'range', legend: true, opacity: 0.15, name: 'EPS p10–p90' })
    expect(band.data[1]).toEqual([at(1), 15, 26])
  })

  it('pasa currentTime y syncGroup a ASChart', () => {
    const built = build({ currentTime: at(1), syncGroup: 'cuenca' })
    expect(built.currentTime).toEqual(at(1))
    expect(built.syncGroup).toBe('cuenca')
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

describe('buildHydrograph · entrada, salida, volumen y nivel', () => {
  const reservoir: HydrographProps = {
    inflow: { observed: points(40, 55) },
    outflow: {
      observed: points(20, 25),
      forecasts: [{ id: 'eps', name: 'EPS', values: points(25, 30) }],
    },
    volume: { observed: points(812, 815) },
    level: {
      observed: points(651.2, 651.4),
      unit: 'msnm',
      forecasts: [
        {
          id: 'eps',
          name: 'EPS',
          values: points(651.4, 651.9),
          percentiles: { p10: points(651.3, 651.5), p90: points(651.5, 652.3) },
        },
      ],
    },
  }
  const buildReservoir = (extra: Partial<HydrographProps> = {}) =>
    buildHydrograph({ ...reservoir, ...extra }, fakeLocale.t)
  const byId = (chart: ReturnType<typeof build>, id: string) =>
    chart.series.find((s) => s.id === id)

  it('entrada y salida comparten el eje de caudal (m³/s); volumen y nivel, cada uno el suyo', () => {
    const chart = buildReservoir()
    expect(chart.yAxes!.map((a) => [a.id, a.unit, a.position])).toEqual([
      ['discharge', 'm³/s', 'left'],
      ['volume', 'hm³', 'right'],
      ['level', 'msnm', 'right'],
    ])
    expect(byId(chart, 'inflow-observed')).toMatchObject({
      yAxis: 'discharge',
      name: 'Caudal de entrada',
    })
    expect(byId(chart, 'outflow-observed')).toMatchObject({
      yAxis: 'discharge',
      name: 'Caudal de salida',
    })
    expect(byId(chart, 'volume-observed')).toMatchObject({ yAxis: 'volume', name: 'Volumen' })
    expect(byId(chart, 'level-observed')).toMatchObject({ yAxis: 'level', name: 'Nivel' })
  })

  it('todos en el panel principal; volumen y nivel sin forzar el 0 ni rejilla propia', () => {
    const chart = buildReservoir()
    expect(chart.panels).toEqual([{ id: 'discharge' }])
    expect(chart.yAxes!.every((axis) => axis.panel === 'discharge')).toBe(true)
    expect(chart.yAxes![1]).toMatchObject({ beginAtZero: false, grid: false })
  })

  it('colores fijos por variable, sin depender de las fuentes de previsión', () => {
    const chart = buildReservoir()
    expect(
      ['inflow', 'outflow', 'volume', 'level'].map((key) => byId(chart, `${key}-observed`)!.color),
    ).toEqual([
      'var(--as-data-cat-4)',
      'var(--as-data-cat-5)',
      'var(--as-data-cat-6)',
      'var(--as-data-cat-7)',
    ])
  })

  it('sus previsiones: "Variable · Fuente", color de la variable, discontinuas y con bandas', () => {
    const chart = buildReservoir()
    expect(byId(chart, 'level-eps')).toMatchObject({
      name: 'Nivel · EPS',
      color: 'var(--as-data-cat-7)',
      lineStyle: 'dashed',
      yAxis: 'level',
    })
    expect(byId(chart, 'level-eps-p10-p90')).toMatchObject({ type: 'range', yAxis: 'level' })
    expect(byId(chart, 'outflow-eps')).toMatchObject({ name: 'Caudal de salida · EPS' })
  })

  it('con precipitación superpuesta, volumen y nivel van al lado con menos ejes', () => {
    const chart = buildReservoir({
      precipitation: { observed: points(1, 2) },
      precipitationLayout: 'overlay',
    })
    expect(chart.yAxes!.map((a) => [a.id, a.position])).toEqual([
      ['precipitation', 'right'],
      ['discharge', 'left'],
      ['volume', 'right'],
      ['level', 'left'],
    ])
  })

  it('caudal, entrada y salida juntos: un solo eje de caudal', () => {
    const chart = build({ inflow: { observed: points(5, 6) }, outflow: { observed: points(4, 4) } })
    expect(chart.yAxes!.map((a) => a.id)).toEqual(['precipitation', 'discharge'])
    expect(byId(chart, 'discharge-observed')!.name).toBe('Observado')
  })

  it('sin caudal, entrada ni salida, el primer eje es el del nivel, a la izquierda', () => {
    const chart = buildHydrograph({ level: { observed: points(651, 652) } }, fakeLocale.t)
    expect(chart.yAxes).toMatchObject([{ id: 'level', position: 'left', unit: 'm' }])
  })

  it('label, unit, observedName y observedColor propios de cada variable', () => {
    const chart = buildReservoir({
      volume: {
        observed: points(1, 2),
        label: 'Embalsado',
        unit: 'hm3',
        observedName: 'Vol.',
        observedColor: '#123456',
      },
    })
    expect(chart.yAxes![1]).toMatchObject({ label: 'Embalsado', unit: 'hm3' })
    expect(byId(chart, 'volume-observed')).toMatchObject({ name: 'Vol.', color: '#123456' })
  })

  it('cada umbral va al eje de su variable; sin esa variable, al principal', () => {
    const chart = buildReservoir({
      thresholds: [
        { value: 80, level: 'naranja' },
        { value: 830, level: 'amarillo', variable: 'volume' },
        { value: 652.5, level: 'rojo', variable: 'level', label: 'Cota máxima' },
      ],
    })
    expect(
      chart.annotations!.y!.map((a) => [a.yAxis, (a as { value: number }).value, a.label]),
    ).toEqual([
      ['discharge', 80, 'Umbral naranja'],
      ['volume', 830, 'Umbral amarillo'],
      ['level', 652.5, 'Cota máxima'],
    ])
    const onlyLevel = buildHydrograph(
      {
        level: { observed: points(1, 2) },
        thresholds: [{ value: 3, level: 'rojo', variable: 'volume' }],
      },
      fakeLocale.t,
    )
    expect(onlyLevel.annotations!.y![0]!.yAxis).toBe('level')
  })

  it('yAxisOverrides y seriesOverrides también valen para volumen y nivel', () => {
    const chart = buildReservoir({
      yAxisOverrides: { level: { min: 640, max: 655 } },
      seriesOverrides: { 'volume-observed': { lineStyle: 'dotted' } },
    })
    expect(chart.yAxes!.find((a) => a.id === 'level')).toMatchObject({ min: 640, max: 655 })
    expect(byId(chart, 'volume-observed')!.lineStyle).toBe('dotted')
  })
})

describe('buildHydrograph · estilo de cada serie (color, grosor y trazo)', () => {
  const byId = (chart: ReturnType<typeof build>, id: string) =>
    chart.series.find((s) => s.id === id)

  it('por defecto: observado continuo y previsiones discontinuas, de 2 px', () => {
    const chart = build()
    expect(byId(chart, 'discharge-observed')).toMatchObject({ lineStyle: 'solid', lineWidth: 2 })
    expect(byId(chart, 'discharge-eps')).toMatchObject({ lineStyle: 'dashed', lineWidth: 2 })
  })

  it('style de la variable (observado) y de cada previsión fijan color, grosor y trazo', () => {
    const chart = build({
      discharge: {
        observed: points(10, 12),
        style: { color: '#123456', width: 3, type: 'solid' },
        forecasts: [
          {
            id: 'eps',
            name: 'EPS',
            values: points(12, 20),
            style: { color: '#ff0000', width: 1, type: 'dotted' },
          },
          { id: 'harmonie', name: 'Harmonie', values: points(12, 30), style: { type: 'dashdot' } },
        ],
      },
    })
    expect(byId(chart, 'discharge-observed')).toMatchObject({
      color: '#123456',
      lineWidth: 3,
      lineStyle: 'solid',
    })
    expect(byId(chart, 'discharge-eps')).toMatchObject({
      color: '#ff0000',
      lineWidth: 1,
      lineStyle: 'dotted',
    })
    expect(byId(chart, 'discharge-harmonie')).toMatchObject({ lineStyle: 'dashdot', lineWidth: 2 })
  })

  it('el color del estilo también tiñe las bandas de la previsión y sus barras de lluvia', () => {
    const chart = build({
      discharge: {
        forecasts: [
          {
            id: 'harmonie',
            name: 'Harmonie',
            values: points(1, 2),
            style: { color: '#00aa00' },
            percentiles: { p10: points(0, 1), p90: points(2, 3) },
          },
        ],
      },
      precipitation: {
        forecasts: [
          { id: 'harmonie', name: 'Harmonie', values: points(1, 2), style: { color: '#00aa00' } },
        ],
      },
    })
    expect(byId(chart, 'discharge-harmonie-p10-p90')!.color).toBe('#00aa00')
    expect(byId(chart, 'precipitation-harmonie')!.color).toBe('#00aa00')
  })

  it('style.color y style.color tienen prioridad sobre observedColor y color (obsoletos)', () => {
    const chart = build({
      discharge: {
        observed: points(1, 2),
        observedColor: '#aaaaaa',
        style: { color: '#bbbbbb' },
        forecasts: [
          {
            id: 'eps',
            name: 'EPS',
            values: points(1, 2),
            color: '#cccccc',
            style: { color: '#dddddd' },
          },
        ],
      },
    })
    expect(byId(chart, 'discharge-observed')!.color).toBe('#bbbbbb')
    expect(byId(chart, 'discharge-eps')!.color).toBe('#dddddd')
    const legacy = build({ discharge: { observed: points(1, 2), observedColor: '#aaaaaa' } })
    expect(byId(legacy, 'discharge-observed')!.color).toBe('#aaaaaa')
  })

  it('también en entrada, salida, volumen y nivel', () => {
    const chart = buildHydrograph(
      {
        level: {
          observed: points(1, 2),
          style: { type: 'dotted', width: 4 },
          forecasts: [
            {
              id: 'eps',
              name: 'EPS',
              values: points(2, 3),
              style: { type: 'dashdot', color: '#654321' },
            },
          ],
        },
      },
      fakeLocale.t,
    )
    expect(byId(chart, 'level-observed')).toMatchObject({
      lineStyle: 'dotted',
      lineWidth: 4,
      color: 'var(--as-data-cat-7)',
    })
    expect(byId(chart, 'level-eps')).toMatchObject({ lineStyle: 'dashdot', color: '#654321' })
  })
})

describe('buildHydrograph · aspecto de los percentiles (bandStyle)', () => {
  const withBands = (bandStyle: HydroForecast['bandStyle']) =>
    build({
      discharge: {
        forecasts: [
          {
            id: 'eps',
            name: 'EPS',
            values: points(1, 2),
            style: { color: '#05a873' },
            percentiles: {
              p10: points(0, 1),
              p25: points(1, 1),
              p75: points(2, 2),
              p90: points(3, 3),
            },
            bandStyle,
          },
        ],
      },
    })
  const band = (chart: ReturnType<typeof build>, range: string) =>
    chart.series.find((s) => s.id === `discharge-eps-${range}`)!

  it('por defecto: el color de la previsión, opacidad 0,15 / 0,3 y en la leyenda', () => {
    const chart = withBands(undefined)
    expect(band(chart, 'p10-p90')).toMatchObject({ color: '#05a873', opacity: 0.15, legend: true })
    expect(band(chart, 'p25-p75')).toMatchObject({ color: '#05a873', opacity: 0.3, legend: true })
  })

  it('cada banda con su color, opacidad, nombre y leyenda propios', () => {
    const chart = withBands({
      'p10-p90': { color: '#7c3aed', opacity: 0.1, name: 'EPS (80 %)' },
      'p25-p75': { opacity: 0.5, legend: false },
    })
    expect(band(chart, 'p10-p90')).toMatchObject({
      color: '#7c3aed',
      opacity: 0.1,
      name: 'EPS (80 %)',
      legend: true,
    })
    expect(band(chart, 'p25-p75')).toMatchObject({
      color: '#05a873',
      opacity: 0.5,
      name: 'EPS p25–p75',
      legend: false,
    })
  })
})

describe('buildHydrograph · unidad de la precipitación', () => {
  it("mm por defecto; 'mm/h' para intensidad, en el eje y en los valores", () => {
    expect(build().yAxes![0]!.unit).toBe('mm')
    const chart = build({ precipitation: { observed: points(1, 2), unit: 'mm/h' } })
    expect(chart.yAxes![0]).toMatchObject({ id: 'precipitation', unit: 'mm/h' })
  })
})
