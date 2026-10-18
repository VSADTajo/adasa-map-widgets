import type { ResolvedChartSpec } from '@/charts/core/resolveSpec'
import { tooltipHtml } from '@/charts/core/tooltip'
import type { ChartX } from '@/charts/types/chart'
import { layoutPanels, niceRound, Y_AXIS_WIDTH, type ChartEngine } from './types'
import { createFrame, renderLegend } from './panels'

type Option = Record<string, unknown>
type EChartsInstance = import('echarts/core').ECharts

const X_LABELS_SPACE = 26
const SLIDER_SPACE = 34
const PANEL_GAP = 18
const EDGE = 12

const LINE_TYPE = { solid: 'solid', dashed: 'dashed', dotted: 'dotted' } as const

/** Sufijos de las series auxiliares que no son series del usuario. */
const BAND_LOW = '__low'
const ANNOTATION_PREFIX = '__annotations'

/**
 * Traduce la especificación a la opción de ECharts. Pura (sin DOM), para
 * poder testearla. `height` es el alto real del contenedor en px.
 *
 * - Paneles: un `grid` por panel, cada uno con su eje X; los ejes X se
 *   enlazan (cursor y zoom compartidos) y solo el último muestra etiquetas.
 * - Bandas (`range`): dos series apiladas, la inferior invisible y la
 *   superior con relleno (el truco habitual de ECharts para áreas entre curvas).
 * - Anotaciones: `markLine`/`markArea` en series auxiliares vacías.
 */
export function toEChartsOption(spec: ResolvedChartSpec, height: number): Option {
  const { theme } = spec
  // La leyenda es HTML y va fuera del lienzo (ver renderLegend): aquí solo
  // se reserva el sitio de las etiquetas de los ejes, la barra de zoom y "Ahora".
  const top = EDGE + 18
  const bottom = EDGE + X_LABELS_SPACE + (spec.zoom && spec.zoom.slider ? SLIDER_SPACE : 0)
  const left = EDGE + spec.maxAxesPerSide.left * Y_AXIS_WIDTH
  const right =
    EDGE + spec.maxAxesPerSide.right * Y_AXIS_WIDTH + (spec.maxAxesPerSide.right ? 0 : 8)
  const layouts = layoutPanels(
    spec.panels.map((panel) => panel.fraction),
    height - top - bottom,
    top,
    PANEL_GAP,
  )
  const lastPanel = spec.panels.length - 1
  const axisTextStyle = {
    color: theme.textMuted,
    fontFamily: theme.fontFamily,
    fontSize: theme.fontSize,
  }

  const grid = layouts.map((layout) => ({ left, right, top: layout.top, height: layout.height }))

  const xAxis = spec.panels.map((panel) => ({
    type: spec.xAxis.type,
    gridIndex: panel.index,
    min: spec.xAxis.min,
    max: spec.xAxis.max,
    name: panel.index === lastPanel ? spec.xAxis.label : undefined,
    nameLocation: 'middle',
    nameGap: 28,
    nameTextStyle: axisTextStyle,
    axisLabel: {
      show: panel.index === lastPanel,
      ...axisTextStyle,
      hideOverlap: true,
      formatter: (value: number | string) => spec.xAxis.formatTick(value),
    },
    axisLine: { lineStyle: { color: theme.axis } },
    axisTick: { show: panel.index === lastPanel, lineStyle: { color: theme.axis } },
    splitLine: { show: false },
    // Cruceta vertical también sin tooltip (para los valores en la leyenda).
    axisPointer: {
      show: Boolean(spec.tooltip || (spec.legend && spec.legend.values)),
      type: 'line',
      triggerTooltip: Boolean(spec.tooltip),
      label: { show: false },
      lineStyle: { color: theme.axis },
    },
  }))

  const yAxis = spec.yAxes.map((axis) => {
    // Con umbrales, el eje se amplía hasta incluirlos, redondeando a un valor
    // "bonito" (si no, acabaría en el dato exacto, p. ej. 212,7).
    const extent = (value: { min: number; max: number }, edge: 'min' | 'max') => {
      const values = [value[edge], ...axis.include, ...(axis.beginAtZero ? [0] : [])]
      return edge === 'max'
        ? niceRound(Math.max(...values), 'up')
        : niceRound(Math.min(...values), 'down')
    }
    return {
      type: axis.scale === 'log' ? 'log' : 'value',
      gridIndex: axis.panelIndex,
      position: axis.position,
      offset: axis.slot * Y_AXIS_WIDTH,
      inverse: axis.inverse,
      min:
        axis.min ??
        (axis.include.length ? (v: { min: number; max: number }) => extent(v, 'min') : undefined),
      max:
        axis.max ??
        (axis.include.length ? (v: { min: number; max: number }) => extent(v, 'max') : undefined),
      scale: !axis.beginAtZero,
      name: axis.title,
      nameLocation: 'middle',
      nameGap: Y_AXIS_WIDTH - 18,
      nameRotate: axis.position === 'left' ? 90 : -90,
      nameTextStyle: axisTextStyle,
      axisLabel: { ...axisTextStyle, formatter: (value: number) => axis.formatTick(value) },
      axisLine: { show: true, lineStyle: { color: theme.axis } },
      splitLine: { show: axis.grid, lineStyle: { color: theme.grid } },
    }
  })

  const series: Option[] = []
  for (const s of spec.series) {
    const common = {
      id: s.id,
      name: s.name,
      xAxisIndex: s.panelIndex,
      yAxisIndex: s.yAxisIndex,
      animation: spec.animation,
    }
    if (s.type === 'range') {
      const stack = `${s.id}__band`
      const hidden = { lineStyle: { opacity: 0 }, symbol: 'none', showSymbol: false }
      series.push({
        ...common,
        ...hidden,
        id: `${s.id}${BAND_LOW}`,
        type: 'line',
        stack,
        data: s.ranges.map(([x, low, high]) => [x, low === null || high === null ? null : low]),
        silent: true,
        tooltip: { show: false },
      })
      series.push({
        ...common,
        ...hidden,
        type: 'line',
        stack,
        data: s.ranges.map(([x, low, high]) => [
          x,
          low === null || high === null ? null : high - low,
        ]),
        areaStyle: { color: s.color, opacity: s.opacity },
        itemStyle: { color: s.color },
      })
      continue
    }
    const line = {
      lineStyle: { color: s.color, width: s.lineWidth, type: LINE_TYPE[s.lineStyle] },
      itemStyle: { color: s.color },
      showSymbol: s.showPoints,
      symbolSize: s.type === 'scatter' ? 8 : 6,
      step: s.step || undefined,
      connectNulls: false,
    }
    if (s.type === 'bar') {
      series.push({
        ...common,
        type: 'bar',
        stack: s.stack,
        data: s.points,
        barMaxWidth: 14,
        itemStyle: { color: s.color, opacity: s.opacity, borderRadius: 0 },
      })
    } else if (s.type === 'scatter') {
      series.push({
        ...common,
        type: 'scatter',
        data: s.points,
        symbolSize: 8,
        itemStyle: { color: s.color },
      })
    } else {
      series.push({
        ...common,
        ...line,
        type: 'line',
        stack: s.stack,
        data: s.points,
        areaStyle: s.type === 'area' ? { color: s.color, opacity: s.opacity } : undefined,
      })
    }
  }

  // ── Anotaciones X: una serie auxiliar por panel (etiqueta solo en el primero) ──
  if (spec.annotations.x.length) {
    for (const panel of spec.panels) {
      const firstAxis = spec.yAxes.find((axis) => axis.panelIndex === panel.index) ?? spec.yAxes[0]!
      // La etiqueta va arriba del todo: en un eje invertido, el "principio" de la línea es el de arriba.
      const labelAtTop = firstAxis.inverse ? 'start' : 'end'
      series.push(
        annotationSeries(`${ANNOTATION_PREFIX}-x-${panel.index}`, panel.index, firstAxis.index, {
          markLine: {
            symbol: ['none', 'none'],
            silent: true,
            data: spec.annotations.x
              .filter((a) => a.kind === 'line')
              .map((a) => ({
                xAxis: a.value,
                lineStyle: { color: a.color, type: LINE_TYPE[a.lineStyle], width: 1.5 },
                label: {
                  show: panel.index === 0 && Boolean(a.label),
                  formatter: a.label ?? '',
                  // Horizontal, encima del extremo superior de la línea.
                  position: labelAtTop,
                  color: a.color,
                  fontFamily: theme.fontFamily,
                },
              })),
          },
          markArea: {
            silent: true,
            data: spec.annotations.x
              .filter((a) => a.kind === 'range')
              .map((a) => [
                {
                  xAxis: a.from,
                  itemStyle: { color: a.fill },
                  label: { show: panel.index === 0, formatter: a.label ?? '', color: a.color },
                },
                { xAxis: a.to },
              ]),
          },
        }),
      )
    }
  }

  // ── Anotaciones Y: una serie auxiliar por eje con umbrales ──
  for (const axis of spec.yAxes) {
    const own = spec.annotations.y.filter((a) => a.yAxisIndex === axis.index)
    if (!own.length) continue
    series.push(
      annotationSeries(`${ANNOTATION_PREFIX}-y-${axis.index}`, axis.panelIndex, axis.index, {
        markLine: {
          symbol: ['none', 'none'],
          silent: true,
          data: own
            .filter((a) => a.kind === 'line')
            .map((a) => ({
              yAxis: a.value,
              lineStyle: { color: a.color, type: LINE_TYPE[a.lineStyle], width: 1.5 },
              label: {
                show: Boolean(a.label),
                formatter: a.label ?? '',
                position: 'insideStartTop',
                color: a.color,
                fontFamily: theme.fontFamily,
              },
            })),
        },
        markArea: {
          silent: true,
          data: own
            .filter((a) => a.kind === 'range')
            .map((a) => [
              {
                yAxis: a.from,
                itemStyle: { color: a.fill },
                label: { formatter: a.label ?? '', color: a.color },
              },
              { yAxis: a.to },
            ]),
        },
      }),
    )
  }

  const allXAxes = spec.panels.map((panel) => panel.index)
  const option: Option = {
    backgroundColor: 'transparent',
    animation: spec.animation,
    textStyle: { fontFamily: theme.fontFamily, color: theme.text },
    grid,
    xAxis,
    yAxis,
    series,
    axisPointer: { link: [{ xAxisIndex: 'all' }], lineStyle: { color: theme.axis } },
    // Leyenda invisible: la que se ve es la HTML común a los tres motores; esta
    // solo existe para poder ocultar/mostrar series por nombre (legendSelect).
    legend: {
      show: false,
      // Un nombre puede repetirse en varios paneles (p. ej. "Observado"): una sola entrada.
      data: [...new Set(spec.series.filter((s) => s.legend).map((s) => s.name))],
    },
    tooltip: spec.tooltip
      ? {
          show: true,
          trigger: spec.tooltip.mode === 'shared' ? 'axis' : 'item',
          axisPointer: { type: 'line', lineStyle: { color: theme.axis } },
          backgroundColor: theme.surface,
          borderColor: theme.border,
          textStyle: { color: theme.text, fontFamily: theme.fontFamily, fontSize: theme.fontSize },
          confine: true,
          formatter: (params: unknown) => {
            const list = Array.isArray(params) ? params : [params]
            const first = list[0] as
              { axisValue?: number | string; value?: unknown[]; seriesId?: string } | undefined
            if (!first) return ''
            if (spec.tooltip && spec.tooltip.mode === 'item') {
              const x = (first.value as [number | string])[0]
              return tooltipHtml(spec, x, originalSeriesId(first.seriesId ?? ''))
            }
            return tooltipHtml(spec, first.axisValue as number | string)
          },
        }
      : { show: false },
    dataZoom: spec.zoom
      ? [
          { type: 'inside', xAxisIndex: allXAxes, filterMode: 'none' },
          ...(spec.zoom.slider
            ? [
                {
                  type: 'slider',
                  xAxisIndex: allXAxes,
                  filterMode: 'none',
                  bottom: EDGE,
                  height: 18,
                  left,
                  right,
                  borderColor: theme.border,
                  textStyle: { color: theme.textMuted },
                  labelFormatter: (value: number | string) => spec.xAxis.formatTick(value),
                },
              ]
            : []),
        ]
      : [],
    toolbox: spec.zoom
      ? {
          right: EDGE,
          top: EDGE - 4,
          itemSize: 14,
          iconStyle: { borderColor: theme.textMuted },
          feature: { restore: { title: spec.texts.resetZoom } },
        }
      : { show: false },
  }
  return option
}

function annotationSeries(
  id: string,
  xAxisIndex: number,
  yAxisIndex: number,
  marks: Option,
): Option {
  return {
    id,
    name: id,
    type: 'line',
    xAxisIndex,
    yAxisIndex,
    data: [],
    silent: true,
    tooltip: { show: false },
    ...marks,
  }
}

/** Id de la serie del usuario a la que pertenece una serie interna (bandas). */
function originalSeriesId(id: string): string {
  return id.endsWith(BAND_LOW) ? id.slice(0, -BAND_LOW.length) : id
}

function toChartX(value: number | string, spec: ResolvedChartSpec): ChartX {
  return spec.xAxis.type === 'time' && typeof value === 'number' ? new Date(value) : value
}

export const echartsEngine: ChartEngine = {
  library: 'echarts',
  packages: ['echarts'],
  async mount(element, initialSpec, handlers, nativeOptions) {
    const [core, charts, components, renderers] = await Promise.all([
      import('echarts/core'),
      import('echarts/charts'),
      import('echarts/components'),
      import('echarts/renderers'),
    ])
    core.use([
      charts.LineChart,
      charts.BarChart,
      charts.ScatterChart,
      components.GridComponent,
      components.TooltipComponent,
      components.LegendComponent,
      components.DataZoomComponent,
      components.MarkLineComponent,
      components.MarkAreaComponent,
      components.AxisPointerComponent,
      components.ToolboxComponent,
      renderers.CanvasRenderer,
    ])

    let spec = initialSpec
    /** Nombres de serie ocultos desde la leyenda (se conservan al redibujar). */
    const hidden = new Set<string>()
    const frame = createFrame(element)
    let setLegendValues: (x: number | string | null) => void = () => {}
    const chart: EChartsInstance = core.init(frame.host, null, { renderer: 'canvas' })

    function drawLegend(): void {
      setLegendValues = renderLegend(element, frame.legend, spec, hidden, (name) => {
        const nowHidden = !hidden.has(name)
        if (nowHidden) hidden.add(name)
        else hidden.delete(name)
        chart.dispatchAction({ type: nowHidden ? 'legendUnSelect' : 'legendSelect', name })
        drawLegend()
      })
    }

    const render = () => {
      drawLegend()
      chart.resize()
      const option = toEChartsOption(spec, chart.getHeight())
      chart.setOption(
        (nativeOptions ? nativeOptions(option, 'echarts') : option) as Parameters<
          EChartsInstance['setOption']
        >[0],
        { notMerge: true },
      )
      hidden.forEach((name) => chart.dispatchAction({ type: 'legendUnSelect', name }))
    }
    render()

    chart.on('updateAxisPointer', (event) => {
      const info = (event as { axesInfo?: { value: number | string }[] }).axesInfo?.[0]
      setLegendValues(info ? info.value : null)
    })
    chart.getZr().on('globalout', () => setLegendValues(null))

    chart.on('click', (params) => {
      const id = String(params.seriesId ?? '')
      if (!id || id.startsWith(ANNOTATION_PREFIX)) return
      const seriesId = originalSeriesId(id)
      const source = spec.series.find((s) => s.id === seriesId)
      const value = params.value as [number | string, number | null]
      const point = source?.type === 'range' ? source.ranges[params.dataIndex] : undefined
      handlers.onPointClick({
        seriesId,
        x: toChartX(value[0], spec),
        y: point ? point[2] : (value[1] ?? null),
      })
    })
    chart.getZr().on('click', (event) => {
      const pixel = [event.offsetX, event.offsetY]
      const panel = spec.panels.find((p) => chart.containPixel({ gridIndex: p.index }, pixel))
      if (!panel) return
      const [x] = chart.convertFromPixel({ xAxisIndex: panel.index }, pixel) as [number]
      handlers.onXClick(toChartX(spec.xAxis.type === 'category' ? x : Math.round(x), spec))
    })
    chart.on('datazoom', () => {
      const model = (
        chart as unknown as {
          getModel: () => {
            getComponent: (
              t: string,
              i: number,
            ) => { axis: { scale: { getExtent: () => [number, number] } } }
          }
        }
      ).getModel()
      const [start, end] = model.getComponent('xAxis', 0).axis.scale.getExtent()
      handlers.onRangeChange({ start: toChartX(start, spec), end: toChartX(end, spec) })
    })

    return {
      native: chart,
      update(next) {
        spec = next
        render()
      },
      resize() {
        chart.resize()
        render()
      },
      dispose() {
        chart.dispose()
        element.replaceChildren()
      },
      exportImage: async () =>
        chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: spec.theme.surface }),
    }
  },
}
