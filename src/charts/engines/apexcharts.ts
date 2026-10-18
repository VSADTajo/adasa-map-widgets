import type { ResolvedChartSpec } from '@/charts/core/resolveSpec'
import { tooltipHtml } from '@/charts/core/tooltip'
import { parseColor } from '@/core/utils/contrast'
import type { ChartX } from '@/charts/types/chart'
import { niceRound, Y_AXIS_WIDTH, type ChartEngine } from './types'
import { createCrosshair, createFrame, panelContainers, panelHeights, renderLegend } from './panels'

type Options = Record<string, unknown>

const X_LABELS_SPACE = 28
const DASH = { solid: 0, dashed: 6, dotted: 2 } as const

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
      const values = panelSeries
        .filter((s) => s.yAxis === axisId)
        .flatMap((s) =>
          s.type === 'range' ? s.ranges.flatMap(([, l, h]) => [l, h]) : s.points.map(([, y]) => y),
        )
        .filter((v): v is number => v !== null)
        .concat(axis.include)
      if (axis.beginAtZero) values.push(0)
      if (!values.length) return {}
      return {
        min: axis.min ?? niceRound(Math.min(...values), 'down'),
        max: axis.max ?? niceRound(Math.max(...values), 'up'),
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
      return {
        seriesName: s.id,
        show: visible,
        opposite: axis.position === 'right',
        reversed: axis.inverse,
        logarithmic: axis.scale === 'log',
        ...extent(axis.id),
        forceNiceScale: false,
        // Una marca cada ~45 px como mucho: en paneles bajos, 5 marcas se amontonan.
        tickAmount: Math.max(2, Math.min(5, Math.floor((heights[panel.index] ?? 200) / 45))),
        title: {
          text: visible ? axis.title : undefined,
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
        toolbar: {
          show: Boolean(spec.zoom) && panel.index === 0,
          tools: {
            download: false,
            selection: false,
            zoom: true,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: true,
          },
        },
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
        curve: panelSeries.map((s) => (s.step ? 'stepline' : 'straight')),
      },
      fill: { type: 'solid', opacity: panelSeries.map((s) => s.opacity) },
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
      // Sin tooltip, Apex no dibuja cruceta: se pone una HTML sobre todos los paneles.
      frame.host.querySelectorAll('[data-as-crosshair]').forEach((node) => node.remove())
      setCrosshair = () => {}
      if (!spec.tooltip && spec.legend && spec.legend.values) {
        setCrosshair = createCrosshair(frame.host, spec)
      }
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
            if (!(spec.legend && spec.legend.values) || spec.xAxis.type === 'category') return
            const { minX, maxX, translateX, gridWidth } = ctx.w.globals
            const offset = event.clientX - host.getBoundingClientRect().left - translateX
            if (offset < 0 || offset > gridWidth) {
              setLegendValues(null)
              setCrosshair(null)
              return
            }
            setLegendValues(minX + (offset / gridWidth) * (maxX - minX))
            setCrosshair(event.clientX - frame.host.getBoundingClientRect().left)
          },
          mouseLeave: () => {
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
      dispose() {
        charts.forEach((chart) => chart.destroy())
        charts = []
        element.replaceChildren()
      },
      async exportImage() {
        const uris = await Promise.all(
          charts.map((chart) => chart.dataURI() as Promise<{ imgURI: string }>),
        )
        if (uris.length === 1) return uris[0]!.imgURI
        // Varios paneles: se componen en un único PNG, uno debajo de otro.
        const images = await Promise.all(
          uris.map(
            ({ imgURI }) =>
              new Promise<HTMLImageElement>((resolve) => {
                const image = new Image()
                image.onload = () => resolve(image)
                image.src = imgURI
              }),
          ),
        )
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(...images.map((image) => image.width))
        canvas.height = images.reduce((sum, image) => sum + image.height, 0)
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = spec.theme.surface
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        let top = 0
        for (const image of images) {
          ctx.drawImage(image, 0, top)
          top += image.height
        }
        return canvas.toDataURL('image/png')
      },
    }
  },
}
