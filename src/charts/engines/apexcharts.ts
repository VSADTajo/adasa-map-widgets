import type { ResolvedChartSpec } from '@/charts/core/resolveSpec'
import { PATTERN_SIZE, patternDataUrl } from '@/charts/core/patterns'
import { extent as valueExtent } from '@/charts/core/extent'
import { tooltipHtml } from '@/charts/core/tooltip'
import { parseColor } from '@/core/utils/contrast'
import type { ChartX } from '@/charts/types/chart'
import {
  fittedAxisTitle,
  niceRound,
  niceTickCount,
  ticksForHeight,
  Y_AXIS_WIDTH,
  type ChartEngine,
} from './types'
import { createCrosshair, createFrame, panelContainers, panelHeights, renderLegend } from './panels'
import { composeImage } from './exportImage'

type Options = Record<string, unknown>

const X_LABELS_SPACE = 28
/**
 * `strokeDashArray` de ApexCharts acaba en el atributo `stroke-dasharray` del
 * SVG: el punto y raya se pasa como patrón en texto (raya, hueco, punto, hueco).
 */
const DASH = { solid: 0, dashed: 6, dotted: 2, dashdot: '8 3 2 3' } as const

let groupCounter = 0

/** ¿Es oscura la superficie? (para el tema de los elementos propios de Apex). */
function isDark(color: string): boolean {
  try {
    const [r, g, b] = parseColor(color)
    return (r * 299 + g * 587 + b * 114) / 1000 < 128
  } catch {
    return false
  }
}

/**
 * Traduce la especificación a las opciones de ApexCharts: **una por panel**,
 * sincronizadas con `chart.group` (cursor, tooltip y zoom compartidos). Para
 * alinear los paneles, cada eje Y ocupa `Y_AXIS_WIDTH` y se reserva el hueco
 * de los ejes que un panel no tiene. Pura (sin DOM).
 *
 * `group` identifica el grupo de sincronización de esta gráfica.
 */
export function toApexOptions(
  spec: ResolvedChartSpec,
  heights: number[],
  group: string,
): Options[] {
  const { theme } = spec
  const lastPanel = spec.panels.length - 1
  const labelStyle = {
    colors: theme.textMuted,
    fontFamily: theme.fontFamily,
    fontSize: `${theme.fontSize}px`,
  }

  return spec.panels.map((panel) => {
    const panelSeries = spec.series.filter((s) => s.panelIndex === panel.index)
    const patterns = panelSeries.map((s) =>
      s.pattern ? patternDataUrl(s.pattern.kind, s.pattern, 2) : null,
    )
    const axes = spec.yAxes.filter((axis) => axis.panelIndex === panel.index)
    const sideCount = (side: 'left' | 'right') =>
      axes.filter((axis) => axis.position === side).length
    const hasRange = panelSeries.some((s) => s.type === 'range')

    // Apex empareja series y ejes por nombre: se usa el id (único); los nombres
    // visibles los pintan la leyenda HTML y el tooltip propios.
    const series = panelSeries.map((s) =>
      s.type === 'range'
        ? {
            name: s.id,
            type: 'rangeArea',
            data: s.ranges.map(([x, low, high]) => ({
              x,
              y: low === null || high === null ? null : [low, high],
            })),
          }
        : {
            name: s.id,
            type:
              s.type === 'bar'
                ? 'bar'
                : s.type === 'scatter'
                  ? 'scatter'
                  : s.type === 'area'
                    ? 'area'
                    : 'line',
            data: s.points.map(([x, y]) => ({ x, y })),
          },
    )

    // Apex no tiene "suggestedMax": con umbrales, el eje se amplía a mano hasta
    // incluirlos, redondeando a un valor "bonito" (como en ECharts).
    // Escala de cada eje, explícita y "bonita": la comparten todas las series del
    // eje (ver más abajo), así que tiene que ser la misma en todas sus entradas.
    const extent = (axisId: string): { min?: number; max?: number } => {
      const axis = axes.find((a) => a.id === axisId)!
      const range = valueExtent(
        (function* () {
          for (const s of panelSeries.filter((s) => s.yAxis === axisId)) {
            if (s.type === 'range') for (const [, low, high] of s.ranges) yield* [low, high]
            else for (const [, y] of s.points) yield y
          }
          yield* axis.include
          if (axis.beginAtZero) yield 0
        })(),
      )
      if (!range) return {}
      const span = range[1] - range[0]
      return {
        min: axis.min ?? niceRound(range[0], 'down', span),
        max: axis.max ?? niceRound(range[1], 'up', span),
      }
    }

    /**
     * Apex asigna los ejes Y por posición: el eje i es el de la serie i (con
     * `seriesName` agrupando, mezcla ejes cuando hay varios en un mismo
     * gráfico). Se crea una entrada por serie; solo la primera de cada eje se
     * ve, y todas comparten escala.
     */
    const firstSeriesOfAxis = new Map<string, number>()
    panelSeries.forEach((s, index) => {
      if (!firstSeriesOfAxis.has(s.yAxis)) firstSeriesOfAxis.set(s.yAxis, index)
    })
    const yaxis = panelSeries.map((s, index) => {
      const axis = axes.find((a) => a.id === s.yAxis)!
      const visible = firstSeriesOfAxis.get(s.yAxis) === index
      const scale = extent(axis.id)
      const panelHeight = heights[panel.index] ?? 200
      return {
        seriesName: s.id,
        show: visible,
        opposite: axis.position === 'right',
        reversed: axis.inverse,
        logarithmic: axis.scale === 'log',
        ...scale,
        forceNiceScale: false,
        // Tantas marcas como quepan, en pasos redondos (0, 50, 100... y no 83,33).
        tickAmount:
          scale.min !== undefined && scale.max !== undefined
            ? niceTickCount(scale.min, scale.max, ticksForHeight(panelHeight))
            : ticksForHeight(panelHeight),
        title: {
          // Si el título no cabe entero en el panel, solo la unidad (o nada: un
          // título cortado es peor que ninguno). Sin título se deja un espacio
          // duro: Apex reserva el mismo ancho y los paneles siguen alineados.
          text: visible
            ? (fittedAxisTitle(axis, panelHeight) ?? (axis.title ? ' ' : undefined))
            : undefined,
          style: { color: theme.textMuted, fontFamily: theme.fontFamily, fontWeight: 400 },
        },
        labels: {
          show: visible,
          // Ancho mínimo común para alinear paneles (sin máximo: Apex recorta el eje izquierdo si hay uno a la derecha).
          minWidth: visible ? Y_AXIS_WIDTH - 20 : 0,
          style: labelStyle,
          formatter: (value: number) =>
            typeof value === 'number' ? axis.formatTick(value) : value,
        },
        axisBorder: { show: visible, color: theme.axis },
        axisTicks: { show: visible, color: theme.axis },
      }
    })
    /** Índice en `yaxis` del eje `axisId` (la entrada de su primera serie). */
    const axisIndexInPanel = (axisId: string) => firstSeriesOfAxis.get(axisId) ?? 0

    const xAnnotations = spec.annotations.x.map((a) => ({
      x: a.kind === 'range' ? a.from : a.value,
      x2: a.kind === 'range' ? a.to : undefined,
      // Los intervalos van sin borde (Apex dibuja uno discontinuo por defecto).
      borderColor: a.kind === 'range' ? 'transparent' : a.color,
      strokeDashArray: a.kind === 'range' ? 0 : DASH[a.lineStyle],
      fillColor: a.fill,
      opacity: 1,
      label:
        panel.index === 0 && a.label
          ? {
              text: a.label,
              orientation: 'horizontal',
              // Centrada sobre la línea, como en los demás motores (no a su derecha).
              textAnchor: 'middle',
              offsetY: -2,
              borderColor: 'transparent',
              style: { color: a.color, background: 'transparent', fontFamily: theme.fontFamily },
            }
          : { text: undefined },
    }))
    const yAnnotations = spec.annotations.y
      .filter((a) => a.panelIndex === panel.index)
      .map((a) => ({
        y: a.kind === 'range' ? a.from : a.value,
        y2: a.kind === 'range' ? a.to : undefined,
        yAxisIndex: axisIndexInPanel(a.yAxis),
        borderColor: a.color,
        strokeDashArray: DASH[a.lineStyle],
        fillColor: a.fill,
        opacity: 1,
        label: a.label
          ? {
              text: a.label,
              position: 'left',
              textAnchor: 'start',
              borderColor: 'transparent',
              style: { color: a.color, background: 'transparent', fontFamily: theme.fontFamily },
            }
          : { text: undefined },
      }))

    return {
      chart: {
        id: `${group}-${panel.index}`,
        group: spec.panels.length > 1 ? group : undefined,
        type: hasRange ? 'rangeArea' : 'line',
        height: heights[panel.index],
        background: 'transparent',
        foreColor: theme.textMuted,
        fontFamily: theme.fontFamily,
        animations: { enabled: spec.animation },
        // Sin toolbar nativo (la barra es común a los tres motores, en ASChart); el
        // zoom por arrastre sigue activo con la herramienta "zoom" preseleccionada.
        toolbar: { show: false, autoSelected: 'zoom' },
        zoom: { enabled: Boolean(spec.zoom), type: 'x' },
        parentHeightOffset: 0,
        locales: [apexLocale(spec.intlLocale)],
        defaultLocale: 'as',
      },
      theme: { mode: isDark(theme.surface) ? 'dark' : 'light' },
      series,
      colors: panelSeries.map((s) => s.color),
      stroke: {
        width: panelSeries.map((s) => (s.type === 'range' || s.type === 'bar' ? 0 : s.lineWidth)),
        dashArray: panelSeries.map((s) => DASH[s.lineStyle]),
        // 'linestep' sube en el punto anterior y sigue en horizontal (el valor ocupa el tramo que
        // termina en su punto, como `step: 'start'`); 'stepline', al revés.
        curve: panelSeries.map((s) =>
          s.step === 'start' ? 'linestep' : s.step ? 'stepline' : 'straight',
        ),
      },
      // Con `patterns`, los rellenos son la tesela del patrón (con la opacidad ya en ella).
      fill: {
        type: patterns.map((tile, i) =>
          tile ? 'image' : panelSeries[i]!.gradient ? 'gradient' : 'solid',
        ),
        opacity: panelSeries.map((s, i) => (patterns[i] ? 1 : s.opacity)),
        // Degradado vertical de cada área (de `from` junto a la línea a `to` en la base).
        gradient: {
          type: 'vertical',
          shadeIntensity: 0,
          opacityFrom: panelSeries.map((s) => s.gradient?.from ?? s.opacity),
          opacityTo: panelSeries.map((s) => s.gradient?.to ?? s.opacity),
          stops: [0, 100],
        },
        image: {
          src: patterns.map((tile) => tile ?? ''),
          width: PATTERN_SIZE,
          height: PATTERN_SIZE,
        },
      },
      markers: { size: panelSeries.map((s) => (s.showPoints ? 4 : 0)), hover: { size: 4 } },
      dataLabels: { enabled: false },
      plotOptions: { bar: { columnWidth: '80%' } },
      xaxis: {
        type:
          spec.xAxis.type === 'time'
            ? 'datetime'
            : spec.xAxis.type === 'value'
              ? 'numeric'
              : 'category',
        min: spec.xAxis.min,
        max: spec.xAxis.max,
        title: {
          text: panel.index === lastPanel ? spec.xAxis.label : undefined,
          style: { color: theme.textMuted },
        },
        labels: {
          show: panel.index === lastPanel,
          style: labelStyle,
          datetimeUTC: false,
          hideOverlappingLabels: true,
          // En el eje temporal, Apex elige marcas "redondas" (medianoche...) solo si
          // formatea él: se le dan los formatos y los nombres de meses del idioma activo.
          datetimeFormatter: {
            year: 'yyyy',
            month: "MMM 'yy",
            day: 'd MMM',
            hour: 'HH:mm',
            minute: 'HH:mm',
          },
          formatter:
            spec.xAxis.type === 'time'
              ? undefined
              : (value: string | number) =>
                  spec.xAxis.formatTick(
                    typeof value === 'string' && spec.xAxis.type !== 'category'
                      ? Number(value)
                      : value,
                  ),
        },
        axisBorder: { show: true, color: theme.axis },
        axisTicks: { show: panel.index === lastPanel, color: theme.axis },
        tooltip: { enabled: false },
        crosshairs: {
          show: Boolean(spec.tooltip),
          stroke: { color: theme.axis, width: 1, dashArray: 0 },
        },
      },
      yaxis: yaxis.length ? yaxis : [{}],
      grid: {
        borderColor: theme.grid,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: axes.some((axis) => axis.grid) } },
        padding: {
          left: (spec.maxAxesPerSide.left - sideCount('left')) * Y_AXIS_WIDTH + 4,
          right: (spec.maxAxesPerSide.right - sideCount('right')) * Y_AXIS_WIDTH + 8,
          top: 0,
          bottom: 0,
        },
      },
      // Leyenda HTML común a todos los paneles (ver renderLegend en mount).
      legend: { show: false },
      tooltip: spec.tooltip
        ? {
            enabled: true,
            shared: spec.tooltip.mode === 'shared',
            intersect: spec.tooltip.mode === 'item',
            theme: isDark(theme.surface) ? 'dark' : 'light',
            // Mismo contenido que en los demás motores, limitado a las series del panel.
            custom: ({
              seriesIndex,
              dataPointIndex,
              w,
            }: {
              seriesIndex: number
              dataPointIndex: number
              w: { globals: { seriesX: (number | string)[][] } }
            }) => {
              const x = w.globals.seriesX[seriesIndex]?.[dataPointIndex]
              if (x === undefined) return ''
              const onlySeries =
                spec.tooltip && spec.tooltip.mode === 'item'
                  ? panelSeries[seriesIndex]?.id
                  : undefined
              const html = tooltipHtml(
                { ...spec, series: onlySeries ? spec.series : panelSeries },
                x,
                onlySeries,
              )
              return `<div style="padding:8px 10px;background:${theme.surface};color:${theme.text};font-family:${theme.fontFamily};font-size:${theme.fontSize}px">${html}</div>`
            },
          }
        : { enabled: false },
      annotations: { xaxis: xAnnotations, yaxis: yAnnotations },
    }
  })
}

/** Nombres de meses y días del idioma activo, en el formato de locale de Apex. */
function apexLocale(intl: string): Options {
  const names = (count: number, date: (i: number) => Date, options: Intl.DateTimeFormatOptions) =>
    Array.from({ length: count }, (_, i) => new Intl.DateTimeFormat(intl, options).format(date(i)))
  const month = (i: number) => new Date(2026, i, 1)
  // 4/1/2026 fue domingo: Apex empieza la semana en domingo.
  const day = (i: number) => new Date(2026, 0, 4 + i)
  return {
    name: 'as',
    options: {
      months: names(12, month, { month: 'long' }),
      shortMonths: names(12, month, { month: 'short' }).map((m) => m.replace('.', '')),
      days: names(7, day, { weekday: 'long' }),
      shortDays: names(7, day, { weekday: 'short' }),
    },
  }
}

export const apexchartsEngine: ChartEngine = {
  library: 'apexcharts',
  packages: ['apexcharts'],
  async mount(element, initialSpec, handlers, nativeOptions) {
    const { default: ApexCharts } = await import('apexcharts')
    type ApexInstance = InstanceType<typeof ApexCharts>

    let spec = initialSpec
    let charts: ApexInstance[] = []
    const group = `as-chart-${++groupCounter}`
    /** Nombres de serie ocultos desde la leyenda (se conservan al redibujar). */
    const hidden = new Set<string>()
    const frame = createFrame(element)

    function resetZoom(): void {
      const { min, max } = spec.xAxis
      charts.forEach((chart) => {
        if (typeof min === 'number' && typeof max === 'number') chart.zoomX(min, max)
        else chart.resetSeries(true, true)
      })
    }

    /** Oculta o muestra todas las series con el nombre visible `name` (en Apex se llaman por su id). */
    function setVisibility(name: string, visible: boolean): void {
      const ids = spec.series.filter((s) => s.name === name).map((s) => s.id)
      for (const chart of charts) {
        const names =
          (chart as unknown as { w: { globals: { seriesNames: string[] } } }).w.globals
            .seriesNames ?? []
        for (const id of ids.filter((id) => names.includes(id))) {
          if (visible) chart.showSeries(id)
          else chart.hideSeries(id)
        }
      }
    }

    let setLegendValues: (x: number | string | null) => void = () => {}
    let setCrosshair: (left: number | null) => void = () => {}

    function drawLegend(): void {
      setLegendValues = renderLegend(element, frame.legend, spec, hidden, (name) => {
        const nowHidden = !hidden.has(name)
        if (nowHidden) hidden.add(name)
        else hidden.delete(name)
        drawLegend()
        setVisibility(name, !nowHidden)
      })
    }
    const toChartX = (value: number | string): ChartX =>
      spec.xAxis.type === 'time' && typeof value === 'number' ? new Date(value) : value

    async function build(): Promise<void> {
      charts.forEach((chart) => chart.destroy())
      drawLegend()
      const heights = panelHeights(spec, frame.host.clientHeight || 320, X_LABELS_SPACE)
      const containers = panelContainers(frame.host, heights)
      // Cruceta HTML sobre todos los paneles: Apex no la dibuja sin su tooltip
      // (valores en la leyenda) ni puede abrir su tooltip por código (cursor
      // que llega de otra gráfica del grupo de sincronización).
      frame.host.querySelectorAll('[data-as-crosshair]').forEach((node) => node.remove())
      setCrosshair = createCrosshair(frame.host, spec)
      const optionsList = toApexOptions(spec, heights, group)
      charts = optionsList.map((options, index) => {
        const container = containers[index]!
        container.replaceChildren()
        const host = document.createElement('div')
        container.appendChild(host)
        const panelSeries = spec.series.filter((s) => s.panelIndex === index)
        const chartOptions = options.chart as Options
        chartOptions.events = {
          dataPointSelection: (
            _event: unknown,
            _ctx: unknown,
            config: { seriesIndex: number; dataPointIndex: number },
          ) => {
            const series = panelSeries[config.seriesIndex]
            if (!series) return
            const point =
              series.type === 'range'
                ? series.ranges[config.dataPointIndex]
                : series.points[config.dataPointIndex]
            if (!point) return
            handlers.onPointClick({
              seriesId: series.id,
              x: toChartX(point[0]),
              y: (series.type === 'range' ? point[2] : point[1]) ?? null,
            })
          },
          click: (
            event: MouseEvent,
            ctx: {
              w: { globals: { minX: number; maxX: number; translateX: number; gridWidth: number } }
            },
          ) => {
            const { minX, maxX, translateX, gridWidth } = ctx.w.globals
            const box = host.getBoundingClientRect()
            const offset = event.clientX - box.left - translateX
            if (offset < 0 || offset > gridWidth || spec.xAxis.type === 'category') return
            handlers.onXClick(toChartX(Math.round(minX + (offset / gridWidth) * (maxX - minX))))
          },
          mouseMove: (
            event: MouseEvent,
            ctx: {
              w: { globals: { minX: number; maxX: number; translateX: number; gridWidth: number } }
            },
          ) => {
            if (spec.xAxis.type === 'category') return
            const { minX, maxX, translateX, gridWidth } = ctx.w.globals
            const offset = event.clientX - host.getBoundingClientRect().left - translateX
            const inside = offset >= 0 && offset <= gridWidth
            const x = inside ? minX + (offset / gridWidth) * (maxX - minX) : null
            handlers.onHover(x === null ? null : toChartX(x))
            if (!(spec.legend && spec.legend.values)) return
            setLegendValues(x)
            // Con tooltip, Apex ya dibuja su cruceta.
            if (!spec.tooltip) {
              setCrosshair(inside ? event.clientX - frame.host.getBoundingClientRect().left : null)
            }
          },
          mouseLeave: () => {
            handlers.onHover(null)
            setLegendValues(null)
            setCrosshair(null)
          },
          zoomed: (_ctx: unknown, range: { xaxis: { min?: number; max?: number } }) => {
            if (range.xaxis.min === undefined || range.xaxis.max === undefined) return
            handlers.onRangeChange({
              start: toChartX(range.xaxis.min),
              end: toChartX(range.xaxis.max),
            })
          },
        }
        const finalOptions = (
          nativeOptions ? nativeOptions(options, 'apexcharts') : options
        ) as Options
        return new ApexCharts(host, finalOptions)
      })
      await Promise.all(charts.map((chart) => chart.render()))
      hidden.forEach((name) => setVisibility(name, false))
    }
    await build()

    return {
      get native() {
        return charts.length === 1 ? charts[0] : charts
      },
      update(next) {
        spec = next
        void build()
      },
      resize() {
        const heights = panelHeights(spec, frame.host.clientHeight || 320, X_LABELS_SPACE)
        panelContainers(frame.host, heights)
        charts.forEach(
          (chart, index) =>
            void chart.updateOptions({ chart: { height: heights[index] } }, false, false),
        )
      },
      resetZoom,
      showCursor(x) {
        setLegendValues(x)
        const first = charts[0] as unknown as
          | {
              el: HTMLElement
              w: { globals: { minX: number; maxX: number; translateX: number; gridWidth: number } }
            }
          | undefined
        if (x === null || typeof x !== 'number' || !first) {
          setCrosshair(null)
          return
        }
        const { minX, maxX, translateX, gridWidth } = first.w.globals
        if (x < minX || x > maxX) {
          setCrosshair(null)
          return
        }
        const offset =
          first.el.getBoundingClientRect().left - frame.host.getBoundingClientRect().left
        setCrosshair(offset + translateX + ((x - minX) / (maxX - minX)) * gridWidth)
      },
      zoomTo(range) {
        if (!range) {
          resetZoom()
          return
        }
        charts.forEach((chart) => chart.zoomX(range.start as number, range.end as number))
      },
      dispose() {
        charts.forEach((chart) => chart.destroy())
        charts = []
        element.replaceChildren()
      },
      async exportImage(format) {
        // Un SVG por panel: se componen uno debajo de otro, con la leyenda encima.
        type Exportable = ApexInstance & { w: { globals: { svgWidth: number; svgHeight: number } } }
        const parts = await Promise.all(
          charts.map(async (chart) => {
            const { svgWidth: width, svgHeight: height } = (chart as Exportable).w.globals
            if (format === 'svg') {
              return { kind: 'svg' as const, src: await chart.getSvgString(), width, height }
            }
            const { imgURI } = (await chart.dataURI({ scale: 2 })) as { imgURI: string }
            return { kind: 'png' as const, src: imgURI, width, height }
          }),
        )
        return composeImage(parts, format, spec, hidden)
      },
    }
  },
}
