import { describe, expect, it } from 'vitest'
import { resolveSpec } from '@/charts/core/resolveSpec'
import { buildHydrograph } from '@/charts/core/hydrograph'
import { at, fakeLocale, fakeTokens, T0 } from '@/charts/core/chart.fixtures'
import type { HydroPoint } from '@/charts/types/HydrographProps'
import { toEChartsOption } from './echarts'
import { toChartJsConfigs } from './chartjs'
import { toApexOptions } from './apexcharts'
import {
  alignedTimeTicks,
  axisTitleFits,
  fittedAxisTitle,
  layoutPanels,
  legendGroups,
  legendSample,
  niceRound,
  niceTickCount,
  ticksForHeight,
} from './types'

type Any = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

const points = (...values: number[]): HydroPoint[] => values.map((v, i) => [at(i), v])

/** Hidrograma de referencia: 2 paneles, eje invertido, una banda, un umbral y "ahora". */
const spec = resolveSpec(
  buildHydrograph(
    {
      discharge: {
        observed: [{ id: 'o', name: 'Observado', values: points(10, 12) }],
        forecasts: [
          {
            id: 'eps',
            name: 'EPS',
            values: points(12, 20),
            percentiles: { p10: points(10, 15), p90: points(14, 26) },
          },
        ],
      },
      precipitation: { observed: [{ id: 'o', name: 'Observado', values: points(1, 2) }] },
      thresholds: [{ value: 25, level: 'rojo' }],
      now: T0,
      bands: ['p10-p90'],
    },
    fakeLocale.t,
  ),
  fakeTokens(),
  fakeLocale,
)

describe('toEChartsOption', () => {
  const option = toEChartsOption(spec, 400) as Any

  it('un grid y un eje X por panel; solo el último muestra etiquetas', () => {
    expect(option.grid).toHaveLength(2)
    expect(option.xAxis.map((x: Any) => x.axisLabel.show)).toEqual([false, true])
    expect(option.axisPointer.link).toEqual([{ xAxisIndex: 'all' }])
  })

  it('el eje de precipitación va invertido y en su panel', () => {
    expect(option.yAxis[0]).toMatchObject({ inverse: true, gridIndex: 0 })
    expect(option.yAxis[1]).toMatchObject({ inverse: false, gridIndex: 1 })
  })

  it('la banda son dos series apiladas: inferior invisible y diferencia con relleno', () => {
    const band = option.series.filter((s: Any) => s.stack === 'discharge-eps-p10-p90__band')
    expect(band.map((s: Any) => s.id)).toEqual([
      'discharge-eps-p10-p90__low',
      'discharge-eps-p10-p90',
    ])
    expect(band[1].data[1]).toEqual([at(1).getTime(), 26 - 15])
    expect(band[1].areaStyle).toBeDefined()
  })

  it('el umbral es un markLine en el eje de caudal, con el color del nivel', () => {
    const marks = option.series.find((s: Any) => s.id === '__annotations-y-1').markLine.data
    expect(marks).toEqual([
      expect.objectContaining({
        yAxis: 25,
        lineStyle: expect.objectContaining({ color: '#strong-rojo' }),
      }),
    ])
  })

  it('"Ahora" aparece en los dos paneles, con la etiqueta solo en el primero', () => {
    const now = [0, 1].map(
      (p) => option.series.find((s: Any) => s.id === `__annotations-x-${p}`).markLine.data[0],
    )
    expect(now.map((m: Any) => m.xAxis)).toEqual([T0.getTime(), T0.getTime()])
    expect(now.map((m: Any) => m.label.show)).toEqual([true, false])
  })

  it('la leyenda incluye las bandas de percentiles (y la lluvia, con su nombre completo)', () => {
    expect(option.legend.data).toEqual([
      'Precipitación · Observado',
      'EPS p10–p90',
      'Observado',
      'EPS',
    ])
  })
})

describe('toChartJsConfigs', () => {
  const configs = toChartJsConfigs(spec) as unknown as [Any, Any]

  it('un lienzo por panel; solo el último muestra las etiquetas del eje X', () => {
    expect(configs).toHaveLength(2)
    expect(configs.map((c) => c.options.scales.x.ticks.display)).toEqual([false, true])
  })

  it('el eje de precipitación va invertido', () => {
    expect(configs[0].options.scales.precipitation.reverse).toBe(true)
    expect(configs[1].options.scales.discharge.reverse).toBe(false)
  })

  it('la banda son dos datasets: el superior rellena hasta el inferior', () => {
    const band = configs[1].data.datasets.filter((d: Any) =>
      d.asId.startsWith('discharge-eps-p10-p90'),
    )
    expect(band.map((d: Any) => d.fill)).toEqual([false, '-1'])
  })

  it('el umbral y "Ahora" son anotaciones; la etiqueta de "Ahora" solo en el primer panel', () => {
    const annotations = configs.map((c) => c.options.plugins.annotation.annotations)
    expect(annotations[1].y0).toMatchObject({
      scaleID: 'discharge',
      value: 25,
      borderColor: '#strong-rojo',
    })
    expect(annotations.map((a) => a.x0.value)).toEqual([T0.getTime(), T0.getTime()])
    expect(annotations.map((a) => a.x0.label.display)).toEqual([true, false])
  })

  it('usa la leyenda HTML común (la nativa, desactivada)', () => {
    expect(configs.every((c) => c.options.plugins.legend.display === false)).toBe(true)
  })
})

describe('toApexOptions', () => {
  const options = toApexOptions(spec, [140, 260], 'g') as [Any, Any]

  it('un gráfico por panel, sincronizados en el mismo grupo', () => {
    expect(options.map((o) => o.chart.group)).toEqual(['g', 'g'])
    expect(options.map((o) => o.xaxis.labels.show)).toEqual([false, true])
  })

  it('el eje de precipitación va invertido', () => {
    expect(options[0].yaxis[0].reversed).toBe(true)
  })

  it('la banda es una serie rangeArea con [inferior, superior]', () => {
    const band = options[1].series.find((s: Any) => s.type === 'rangeArea')
    expect(band.data[1]).toEqual({ x: at(1).getTime(), y: [15, 26] })
    expect(options[1].chart.type).toBe('rangeArea')
  })

  it('el umbral y "Ahora" son anotaciones; la previsión, discontinua', () => {
    expect(options[1].annotations.yaxis[0]).toMatchObject({ y: 25, borderColor: '#strong-rojo' })
    expect(options.map((o) => o.annotations.xaxis[0].x)).toEqual([T0.getTime(), T0.getTime()])
    const dashed = options[1].series.findIndex((s: Any) => s.name === 'discharge-eps')
    expect(options[1].stroke.dashArray[dashed]).toBeGreaterThan(0)
  })

  it('amplía el eje hasta el umbral redondeando a un valor "bonito"', () => {
    expect(options[1].yaxis[0].max).toBe(30)
  })

  it('un eje por serie (Apex asigna por posición): visible solo el primero de cada eje, misma escala', () => {
    const panel = options[1]
    expect(panel.yaxis).toHaveLength(panel.series.length)
    expect(panel.yaxis.map((y: Any) => y.seriesName)).toEqual(panel.series.map((s: Any) => s.name))
    expect(panel.yaxis.filter((y: Any) => y.show)).toHaveLength(1)
    expect(new Set(panel.yaxis.map((y: Any) => y.max)).size).toBe(1)
  })

  it('usa el id como nombre interno: "Observado" aparece en dos paneles sin confundirse', () => {
    const names = options.flatMap((o) => o.series.map((s: Any) => s.name))
    expect(names).toContain('precipitation-observed-o')
    expect(names).toContain('discharge-observed-o')
    expect(new Set(names).size).toBe(names.length)
  })
})

describe('equivalencia entre motores', () => {
  it('los tres dibujan las mismas series de usuario en cada panel', () => {
    const echarts = (toEChartsOption(spec, 400) as Any).series.filter(
      (s: Any) => !s.id.startsWith('__') && !s.id.endsWith('__low'),
    )
    const chartjs = (toChartJsConfigs(spec) as Any[]).flatMap((c) =>
      c.data.datasets.filter((d: Any) => !d.asId.endsWith('__low')),
    )
    const apex = (toApexOptions(spec, [140, 260], 'g') as Any[]).flatMap((o) => o.series)
    expect(echarts).toHaveLength(spec.series.length)
    expect(chartjs).toHaveLength(spec.series.length)
    expect(apex).toHaveLength(spec.series.length)
  })
})

describe('utilidades de maquetación', () => {
  it('layoutPanels reparte el alto según las fracciones, con hueco entre paneles', () => {
    expect(layoutPanels([0.25, 0.75], 410, 10, 10)).toEqual([
      { top: 10, height: 100 },
      { top: 120, height: 300 },
    ])
  })

  it('niceRound redondea a la mitad del orden de magnitud', () => {
    expect(niceRound(212.7, 'up')).toBe(250)
    expect(niceRound(27, 'down')).toBe(25)
    expect(niceRound(0, 'up')).toBe(0)
  })

  it.each([
    [651.62, 'up', 0.3, 651.65],
    [651.31, 'down', 0.3, 651.3],
    [651.6, 'up', 0.3, 651.6],
    [212.7, 'up', 212.7, 250],
    [812.4, 'down', 15, 810],
    [5, 'up', 0, 5],
  ] as const)(
    'niceRound(%s, %s, rango %s) → %s: el paso sale del rango',
    (value, dir, span, expected) => {
      expect(niceRound(value, dir, span)).toBe(expected)
    },
  )

  it('ticksForHeight: una marca cada ~40 px, entre 2 y 6', () => {
    expect(ticksForHeight(60)).toBe(2)
    expect(ticksForHeight(160)).toBe(4)
    expect(ticksForHeight(900)).toBe(6)
  })

  it('niceTickCount elige un número de marcas con pasos redondos', () => {
    expect(niceTickCount(0, 250, 3)).toBe(2) // 125 no vale con 3 (83,33): 2 intervalos de 125
    expect(niceTickCount(0, 250, 5)).toBe(5) // 50
    expect(niceTickCount(0, 30, 6)).toBe(6) // 5
  })

  it('fittedAxisTitle: el título entero si cabe; si no, solo la unidad; si tampoco, ninguno', () => {
    const axis = { title: 'Precipitación (mm/h)', unit: 'mm/h' }
    expect(fittedAxisTitle(axis, 200)).toBe('Precipitación (mm/h)')
    expect(fittedAxisTitle(axis, 80)).toBe('mm/h')
    expect(fittedAxisTitle(axis, 20)).toBeUndefined()
    expect(fittedAxisTitle({ title: 'Precipitación' }, 80)).toBeUndefined()
  })

  it('axisTitleFits oculta los títulos que no caben enteros en el panel', () => {
    expect(axisTitleFits('Precipitación (mm)', 80)).toBe(false)
    expect(axisTitleFits('Precipitación (mm)', 200)).toBe(true)
    expect(axisTitleFits(undefined, 200)).toBe(false)
  })

  it('alignedTimeTicks pone las marcas a medianoche en rangos de varios días', () => {
    const ticks = alignedTimeTicks(at(-50).getTime(), at(70).getTime())
    expect(ticks.every((t) => new Date(t).getHours() === 0)).toBe(true)
    expect(ticks).toContain(T0.getTime())
  })
})

describe('trazos de línea en los tres motores', () => {
  /** Una serie por trazo, para comparar la traducción de cada motor. */
  const styles = ['solid', 'dashed', 'dotted', 'dashdot'] as const
  const lines = resolveSpec(
    {
      series: styles.map((lineStyle) => ({
        id: lineStyle,
        name: lineStyle,
        type: 'line' as const,
        data: points(1, 2),
        lineStyle,
        lineWidth: 3,
      })),
    },
    fakeTokens(),
    fakeLocale,
  )

  it('ECharts: tipos con nombre y el punto y raya como patrón; el grosor, tal cual', () => {
    const series = (toEChartsOption(lines, 400) as Any).series
    expect(series.map((s: Any) => s.lineStyle.type)).toEqual([
      'solid',
      'dashed',
      'dotted',
      [8, 3, 2, 3],
    ])
    expect(series.every((s: Any) => s.lineStyle.width === 3)).toBe(true)
  })

  it('Chart.js: borderDash distinto para cada trazo', () => {
    const datasets = (toChartJsConfigs(lines)[0] as Any).data.datasets
    const dashes = datasets.map((d: Any) => JSON.stringify(d.borderDash))
    expect(dashes).toEqual(['[]', '[6,4]', '[2,3]', '[8,3,2,3]'])
    expect(new Set(dashes).size).toBe(4)
  })

  it('ApexCharts: un dashArray por serie, el punto y raya como patrón en texto', () => {
    const options = toApexOptions(lines, [400], 'g')[0] as Any
    expect(options.stroke.dashArray).toEqual([0, 6, 2, '8 3 2 3'])
  })
})

describe('legendSample', () => {
  const series = [
    { name: 'EPS', type: 'bar', legend: true },
    { name: 'Observado', type: 'line', legend: true },
    { name: 'EPS', type: 'line', legend: true },
  ]

  it('la muestra de un nombre con línea es la línea (para ver su trazo)', () => {
    expect(legendSample(series, series[0]!)).toBe(series[2])
  })

  it('sin línea con ese nombre, la propia serie', () => {
    const bars = [{ name: 'Lluvia', type: 'bar', legend: true }]
    expect(legendSample(bars, bars[0]!)).toBe(bars[0])
  })
})

describe('legendGroups', () => {
  it('una entrada por nombre: sin grupo primero y después cada grupo por orden de aparición', () => {
    const series = [
      { name: 'Lluvia A', type: 'bar', legend: true, legendGroup: 'Precipitación' },
      { name: 'EPS p10–p90', type: 'range', legend: true },
      { name: 'Caudal', type: 'line', legend: true },
      { name: 'Caudal', type: 'line', legend: true },
      { name: 'Oculta', type: 'line', legend: false },
      { name: 'Lluvia B', type: 'bar', legend: true, legendGroup: 'Precipitación' },
    ]
    expect(
      legendGroups(series).map(({ group, entries }) => [group, entries.map((e) => e.name)]),
    ).toEqual([
      // Las bandas, al final de su línea aunque se dibujen antes.
      [undefined, ['Caudal', 'EPS p10–p90']],
      ['Precipitación', ['Lluvia A', 'Lluvia B']],
    ])
  })
})

describe('degradado de un área en los tres motores', () => {
  const gradientSpec = resolveSpec(
    {
      series: [
        {
          id: 'p',
          name: 'Previsión',
          type: 'area',
          data: points(1, 3),
          color: '#ff0000',
          gradient: { from: 0.6, to: 0.1 },
        },
      ],
    },
    fakeTokens(),
    fakeLocale,
  )

  it('ECharts: LinearGradient vertical de la opacidad from a to', () => {
    const area = (toEChartsOption(gradientSpec, 400) as Any).series[0].areaStyle
    expect(area.color).toMatchObject({ type: 'linear', x: 0, y: 0, x2: 0, y2: 1 })
    expect(area.color.colorStops).toEqual([
      { offset: 0, color: 'rgba(255, 0, 0, 0.6)' },
      { offset: 1, color: 'rgba(255, 0, 0, 0.1)' },
    ])
  })

  it('Chart.js: degradado de canvas sobre el área del gráfico (color liso antes de conocerla)', () => {
    const background = (toChartJsConfigs(gradientSpec)[0] as Any).data.datasets[0].backgroundColor
    expect(typeof background).toBe('function')
    expect(background({ chart: { ctx: {} } })).toBe('rgba(255, 0, 0, 0.6)')
    const stops: [number, string][] = []
    const ctx = {
      createLinearGradient: () => ({
        addColorStop: (offset: number, color: string) => stops.push([offset, color]),
      }),
    }
    background({ chart: { ctx, chartArea: { top: 10, bottom: 200 } } })
    expect(stops).toEqual([
      [0, 'rgba(255, 0, 0, 0.6)'],
      [1, 'rgba(255, 0, 0, 0.1)'],
    ])
  })

  it("ApexCharts: fill.type 'gradient' con sus opacidades por serie", () => {
    const fill = (toApexOptions(gradientSpec, [400], 'g')[0] as Any).fill
    expect(fill.type).toEqual(['gradient'])
    expect(fill.gradient).toMatchObject({ type: 'vertical', opacityFrom: [0.6], opacityTo: [0.1] })
  })
})
