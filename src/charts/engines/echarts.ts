import {
  drawIndexToPoint,
  type ResolvedChartSpec,
  type ResolvedSeries,
} from '@/charts/core/resolveSpec'
import { extent as valueExtent } from '@/charts/core/extent'
import { withAlpha } from '@/charts/core/color'
import { patternTile } from '@/charts/core/patterns'
import { tooltipHtml } from '@/charts/core/tooltip'
import type { ChartX } from '@/charts/types/chart'
import {
  fittedAxisTitle,
  layoutPanels,
  niceRound,
  niceTickCount,
  ticksForHeight,
  Y_AXIS_WIDTH,
  type ChartEngine,
} from './types'
import { createFrame, renderLegend } from './panels'
import { composeImage } from './exportImage'

type Option = Record<string, unknown>

/**
 * Rango de un eje con umbrales (`include`): los datos de sus series, los
 * umbrales y el 0 si lo pide, redondeados a valores "bonitos" según el rango.
 */
function fixedScale(
  spec: ResolvedChartSpec,
  axis: ResolvedChartSpec['yAxes'][number],
): { min: number; max: number } | undefined {
  const range = valueExtent(
    (function* () {
      for (const s of spec.series.filter((s) => s.yAxis === axis.id)) {
        if (s.type === 'range') for (const [, low, high] of s.ranges) yield* [low, high]
        else for (const [, y] of s.points) yield y
      }
      yield* axis.include
      if (axis.beginAtZero) yield 0
    })(),
  )
  if (!range) return undefined
  const span = range[1] - range[0]
  return { min: niceRound(range[0], 'down', span), max: niceRound(range[1], 'up', span) }
}
type EChartsInstance = import('echarts/core').ECharts

const X_LABELS_SPACE = 26
const SLIDER_SPACE = 34
const PANEL_GAP = 18
const EDGE = 12

/** Punto y raya no tiene nombre en ECharts: se pasa el patrón (raya, hueco, punto, hueco). */
const LINE_TYPE = {
  solid: 'solid',
  dashed: 'dashed',
  dotted: 'dotted',
  dashdot: [8, 3, 2, 3],
} as const

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
    // No ensanchar el eje para que quepan las barras de los extremos: el rango X
    // tiene que ser el de los datos, igual en todos los paneles, gráficas de un
    // syncGroup y motores (en Chart.js las barras de los extremos también se cortan).
    containShape: false,
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
    // Con umbrales, el eje se amplía hasta incluirlos, redondeando a valores
    // "bonitos" (si no, acabaría en el dato exacto, p. ej. 212,7), con un
    // intervalo que divide el rango justo: así el máximo cae en una marca (como en ApexCharts).
    const scale = axis.include.length ? fixedScale(spec, axis) : undefined
    const splitNumber = ticksForHeight(layouts[axis.panelIndex]!.height)
    const interval =
      scale && axis.min === undefined && axis.max === undefined && axis.scale !== 'log'
        ? (scale.max - scale.min) / niceTickCount(scale.min, scale.max, splitNumber)
        : undefined
    return {
      type: axis.scale === 'log' ? 'log' : 'value',
      gridIndex: axis.panelIndex,
      position: axis.position,
      offset: axis.slot * Y_AXIS_WIDTH,
      inverse: axis.inverse,
      min: axis.min ?? scale?.min,
      max: axis.max ?? scale?.max,
      interval,
      scale: !axis.beginAtZero,
      // En paneles bajos: menos marcas y sin título si no cabe entero.
      name: fittedAxisTitle(axis, layouts[axis.panelIndex]!.height),
      splitNumber,
      nameLocation: 'middle',
      nameGap: Y_AXIS_WIDTH - 18,
      nameRotate: axis.position === 'left' ? 90 : -90,
      nameTextStyle: axisTextStyle,
      axisLabel: {
        ...axisTextStyle,
        formatter: (value: number) => axis.formatTick(value),
        // Si dos marcas quedan demasiado juntas (paneles bajos), no se montan sus etiquetas.
        hideOverlap: true,
      },
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
        areaStyle: fill(s),
        itemStyle: { color: s.color },
      })
      continue
    }
    const line = {
      lineStyle: { color: s.color, width: s.lineWidth, type: LINE_TYPE[s.lineStyle] },
      itemStyle: { color: s.color },
      showSymbol: s.showPoints,
      symbolSize: s.type === 'scatter' ? 8 : 6,
      // En columnas, los escalones ya están en `drawPoints`.
      step: s.drawPoints ? undefined : s.step || undefined,
      connectNulls: false,
      // Con más puntos que píxeles, dibuja una muestra LTTB (conserva picos y forma):
      // con series de 100 000 puntos aligera cada redibujado (ver docs/rendimiento-graficas.md).
      // En columnas no: la muestra se comería los laterales de las columnas.
      sampling: s.drawPoints ? undefined : 'lttb',
    }
    if (s.type === 'bar') {
      series.push({
        ...common,
        type: 'bar',
        stack: s.stack,
        data: s.points,
        barMaxWidth: 14,
        itemStyle: { ...fill(s), borderRadius: 0 },
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
        data: s.drawPoints ?? s.points,
        areaStyle: s.type === 'area' ? fill(s) : undefined,
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
    // Sin toolbox nativo: la barra de herramientas es común a los tres motores (ASChart).
    toolbox: { show: false },
  }
  return option
}

/**
 * Relleno de una serie: su color con su opacidad, o la tesela del patrón
 * (que ya lleva la opacidad) si hay `patterns`. La tesela se dibuja al doble
 * de resolución y se reduce a la mitad, para que sea nítida.
 */
function fill(s: ResolvedSeries): { color: unknown; opacity: number } {
  const tile = s.pattern ? patternTile(s.pattern.kind, s.pattern, 2) : null
  if (tile)
    return { color: { image: tile, repeat: 'repeat', scaleX: 0.5, scaleY: 0.5 }, opacity: 1 }
  if (s.gradient) {
    return {
      color: {
        type: 'linear',
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [
          { offset: 0, color: withAlpha(s.color, s.gradient.from) },
          { offset: 1, color: withAlpha(s.color, s.gradient.to) },
        ],
      },
      opacity: 1,
    }
  }
  return { color: s.color, opacity: s.opacity }
}

/**
 * Copia de la opción con las teselas de los patrones como data URL y su
 * tamaño: el renderizador SVG no sabe medir un canvas y dejaría el
 * `<pattern>` sin ancho ni alto (SVG inválido).
 */
function withPatternUrls<T>(value: T): T {
  if (Array.isArray(value)) return value.map(withPatternUrls) as T
  if (!value || typeof value !== 'object' || value instanceof HTMLElement) return value
  const object = value as Record<string, unknown>
  if (object.image instanceof HTMLCanvasElement) {
    const { image } = object
    return {
      ...object,
      image: image.toDataURL('image/png'),
      imageWidth: image.width,
      imageHeight: image.height,
    } as T
  }
  return Object.fromEntries(
    Object.entries(object).map(([key, entry]) => [key, withPatternUrls(entry)]),
  ) as T
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
      // Solo para exportar a SVG (con una instancia aparte, en modo SSR).
      renderers.SVGRenderer,
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

    /** Primer panel (px), para colocar el tooltip de `showCursor` sin leer la opción del gráfico. */
    let firstGrid = { top: 0, height: 0 }
    const render = () => {
      drawLegend()
      chart.resize()
      const option = toEChartsOption(spec, chart.getHeight())
      firstGrid = (option.grid as { top: number; height: number }[])[0] ?? firstGrid
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
      handlers.onHover(info ? toChartX(info.value, spec) : null)
    })
    chart.getZr().on('globalout', () => {
      setLegendValues(null)
      handlers.onHover(null)
    })

    chart.on('click', (params) => {
      const id = String(params.seriesId ?? '')
      if (!id || id.startsWith(ANNOTATION_PREFIX)) return
      const seriesId = originalSeriesId(id)
      const source = spec.series.find((s) => s.id === seriesId)
      // En columnas, el clic cae en la geometría de dibujo: se devuelve el punto real.
      const value = (
        source?.drawPoints
          ? source.points[drawIndexToPoint(source, params.dataIndex)]
          : params.value
      ) as [number | string, number | null]
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
      // Con `xAxisIndex`, convertFromPixel recibe y devuelve un solo valor (no un par).
      const x = chart.convertFromPixel({ xAxisIndex: panel.index }, pixel[0]!) as number
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
      resetZoom() {
        chart.dispatchAction({ type: 'dataZoom', start: 0, end: 100 })
      },
      showCursor(x) {
        setLegendValues(x)
        if (x === null) {
          chart.dispatchAction({ type: 'hideTip' })
          chart.dispatchAction({ type: 'updateAxisPointer', currTrigger: 'leave' })
          return
        }
        // Como si el cursor estuviera en ese instante, a media altura del primer panel.
        // Con `xAxisIndex`, convertToPixel recibe y devuelve un solo valor (no un par).
        const px = chart.convertToPixel({ xAxisIndex: 0 }, x) as number
        // No `chart.getOption()`: copia la opción entera, con todos los datos (~60 ms
        // con 500 000 puntos en cada movimiento del cursor).
        chart.dispatchAction({ type: 'showTip', x: px, y: firstGrid.top + firstGrid.height / 2 })
      },
      zoomTo(range) {
        if (!range) chart.dispatchAction({ type: 'dataZoom', start: 0, end: 100 })
        else
          chart.dispatchAction({ type: 'dataZoom', startValue: range.start, endValue: range.end })
      },
      dispose() {
        chart.dispose()
        element.replaceChildren()
      },
      async exportImage(format) {
        const width = chart.getWidth()
        const height = chart.getHeight()
        if (format === 'svg') {
          // El lienzo es canvas: para un SVG vectorial se redibuja la misma opción
          // (con el zoom y las series ocultas actuales) con el renderizador SVG.
          const svg = core.init(null, null, { renderer: 'svg', ssr: true, width, height })
          svg.setOption({ ...withPatternUrls(chart.getOption()), animation: false })
          const markup = svg.renderToSVGString()
          svg.dispose()
          return composeImage([{ kind: 'svg', src: markup, width, height }], 'svg', spec, hidden)
        }
        const src = chart.getDataURL({ type: 'png', pixelRatio: 2 })
        return composeImage([{ kind: 'png', src, width, height }], 'png', spec, hidden)
      },
    }
  },
}
