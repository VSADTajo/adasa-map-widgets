import type { ResolvedChartSpec, ResolvedSeries } from '@/charts/core/resolveSpec'
import { withAlpha } from '@/charts/core/resolveSpec'
import { tooltipHtml } from '@/charts/core/tooltip'
import type { ChartX } from '@/charts/types/chart'
import { alignedTimeTicks, timeTickUnit, Y_AXIS_WIDTH, type ChartEngine } from './types'
import {
  createFrame,
  createResetZoomButton,
  createTooltipElement,
  panelContainers,
  panelHeights,
  placeTooltip,
  renderLegend,
  styleTooltip,
} from './panels'

type Config = Record<string, unknown> & {
  data: { datasets: Dataset[] }
  options: Record<string, unknown>
}
type Dataset = Record<string, unknown> & { asId: string; label: string }

const X_LABELS_SPACE = 28
const BAND_LOW = '__low'
const DASH = { solid: [], dashed: [6, 4], dotted: [2, 3] } as const
const STEP = { start: 'before', middle: 'middle', end: 'after' } as const

function datasetsFor(series: ResolvedSeries): Dataset[] {
  const common = { asId: series.id, label: series.name, yAxisID: series.yAxis }
  const toXY = (points: [number | string, number | null][]) => points.map(([x, y]) => ({ x, y }))
  if (series.type === 'range') {
    const valid = (low: number | null, high: number | null) => low !== null && high !== null
    return [
      {
        ...common,
        asId: `${series.id}${BAND_LOW}`,
        label: `${series.name}${BAND_LOW}`,
        type: 'line',
        data: series.ranges.map(([x, low, high]) => ({ x, y: valid(low, high) ? low : null })),
        borderWidth: 0,
        pointRadius: 0,
        fill: false,
        spanGaps: false,
      },
      {
        ...common,
        type: 'line',
        data: series.ranges.map(([x, low, high]) => ({ x, y: valid(low, high) ? high : null })),
        borderWidth: 0,
        pointRadius: 0,
        borderColor: series.color,
        backgroundColor: withAlpha(series.color, series.opacity),
        // Rellena hasta el dataset anterior: la curva inferior de la banda.
        fill: '-1',
        spanGaps: false,
      },
    ]
  }
  if (series.type === 'bar') {
    return [
      {
        ...common,
        type: 'bar',
        data: toXY(series.points),
        backgroundColor: withAlpha(series.color, series.opacity),
        borderColor: series.color,
        borderWidth: 0,
        stack: series.stack,
        maxBarThickness: 14,
        barPercentage: 0.9,
        categoryPercentage: 0.9,
      },
    ]
  }
  return [
    {
      ...common,
      type: series.type === 'scatter' ? 'scatter' : 'line',
      data: toXY(series.points),
      borderColor: series.color,
      backgroundColor:
        series.type === 'area' ? withAlpha(series.color, series.opacity) : series.color,
      borderWidth: series.type === 'scatter' ? 0 : series.lineWidth,
      borderDash: [...DASH[series.lineStyle]],
      pointRadius: series.showPoints ? (series.type === 'scatter' ? 4 : 3) : 0,
      pointHoverRadius: series.showPoints ? 5 : 3,
      stepped: series.step ? STEP[series.step] : false,
      fill: series.type === 'area' ? (series.stack ? 'stack' : 'origin') : false,
      stack: series.stack,
      spanGaps: false,
    },
  ]
}

/**
 * Traduce la especificación a la configuración de Chart.js: **una por
 * panel** (Chart.js no reparte varios paneles con ejes a ambos lados en un
 * mismo lienzo). Para que los paneles queden alineados, cada eje Y ocupa
 * siempre `Y_AXIS_WIDTH` y se reserva el hueco de los ejes que un panel no
 * tiene. Pura (sin DOM): el tooltip HTML y la sincronización se enganchan en `mount`.
 */
export function toChartJsConfigs(spec: ResolvedChartSpec): Config[] {
  const { theme } = spec
  const font = { family: theme.fontFamily, size: theme.fontSize, weight: 'normal' }
  const tickUnit =
    spec.xAxis.type === 'time' &&
    typeof spec.xAxis.min === 'number' &&
    typeof spec.xAxis.max === 'number'
      ? timeTickUnit(spec.xAxis.min, spec.xAxis.max)
      : undefined
  const lastPanel = spec.panels.length - 1

  return spec.panels.map((panel) => {
    const axes = spec.yAxes.filter((axis) => axis.panelIndex === panel.index)
    const sideCount = (side: 'left' | 'right') =>
      axes.filter((axis) => axis.position === side).length
    const scales: Record<string, unknown> = {
      x: {
        type:
          spec.xAxis.type === 'time' ? 'time' : spec.xAxis.type === 'value' ? 'linear' : 'category',
        min: spec.xAxis.min,
        max: spec.xAxis.max,
        offset: false,
        title: {
          display: panel.index === lastPanel && Boolean(spec.xAxis.label),
          text: spec.xAxis.label,
          color: theme.textMuted,
          font,
        },
        // Marcas en instantes "redondos" (medianoche, cada 12 h...), como en los demás motores.
        time: tickUnit ? { unit: tickUnit.unit } : undefined,
        // Chart.js empieza las marcas en el primer dato (p. ej. 13:00): se
        // sustituyen por marcas alineadas a medianoche / horas en punto.
        afterBuildTicks: tickUnit
          ? (scale: { ticks: { value: number }[] }) => {
              scale.ticks = alignedTimeTicks(
                spec.xAxis.min as number,
                spec.xAxis.max as number,
              ).map((value) => ({ value }))
            }
          : undefined,
        ticks: {
          display: panel.index === lastPanel,
          color: theme.textMuted,
          font,
          maxRotation: 0,
          autoSkip: true,
          autoSkipPadding: 16,
          callback: (value: number | string) => spec.xAxis.formatTick(value),
        },
        grid: { display: false },
        border: { color: theme.axis },
      },
    }
    for (const axis of axes) {
      scales[axis.id] = {
        type: axis.scale === 'log' ? 'logarithmic' : 'linear',
        position: axis.position,
        reverse: axis.inverse,
        min: axis.min,
        max: axis.max,
        suggestedMin: axis.include.length ? Math.min(...axis.include) : undefined,
        suggestedMax: axis.include.length ? Math.max(...axis.include) : undefined,
        beginAtZero: axis.beginAtZero,
        title: { display: Boolean(axis.title), text: axis.title, color: theme.textMuted, font },
        ticks: {
          color: theme.textMuted,
          font,
          callback: (value: number) => axis.formatTick(value),
        },
        grid: { display: axis.grid, drawOnChartArea: axis.grid, color: theme.grid },
        border: { display: true, color: theme.axis },
        afterFit: (scale: { width: number }) => {
          scale.width = Y_AXIS_WIDTH
        },
      }
    }

    const annotations: Record<string, unknown> = {}
    spec.annotations.x.forEach((a, i) => {
      const label = {
        display: panel.index === 0 && Boolean(a.label),
        content: a.label,
        position: 'start',
        color: a.color,
        backgroundColor: 'transparent',
        font,
      }
      annotations[`x${i}`] =
        a.kind === 'range'
          ? {
              type: 'box',
              xMin: a.from,
              xMax: a.to,
              backgroundColor: a.fill,
              borderWidth: 0,
              label,
            }
          : {
              type: 'line',
              scaleID: 'x',
              value: a.value,
              borderColor: a.color,
              borderWidth: 1.5,
              borderDash: [...DASH[a.lineStyle]],
              label: { ...label, position: 'start' },
            }
    })
    spec.annotations.y
      .filter((a) => a.panelIndex === panel.index)
      .forEach((a, i) => {
        const label = {
          display: Boolean(a.label),
          content: a.label,
          position: 'start',
          color: a.color,
          backgroundColor: 'transparent',
          font,
          yAdjust: -8,
        }
        annotations[`y${i}`] =
          a.kind === 'range'
            ? {
                type: 'box',
                yScaleID: a.yAxis,
                yMin: a.from,
                yMax: a.to,
                backgroundColor: a.fill,
                borderWidth: 0,
                label,
              }
            : {
                type: 'line',
                scaleID: a.yAxis,
                value: a.value,
                borderColor: a.color,
                borderWidth: 1.5,
                borderDash: [...DASH[a.lineStyle]],
                label,
              }
      })

    const datasets = spec.series
      .filter((series) => series.panelIndex === panel.index)
      .flatMap(datasetsFor)

    return {
      type: 'line',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: spec.animation ? undefined : false,
        parsing: true,
        normalized: true,
        interaction:
          spec.tooltip && spec.tooltip.mode === 'item'
            ? { mode: 'nearest', intersect: true }
            : { mode: 'index', intersect: false, axis: 'x' },
        layout: {
          padding: {
            left: (spec.maxAxesPerSide.left - sideCount('left')) * Y_AXIS_WIDTH + 4,
            right:
              (spec.maxAxesPerSide.right - sideCount('right')) * Y_AXIS_WIDTH +
              (spec.maxAxesPerSide.right ? 4 : 12),
            top: 4,
          },
        },
        scales,
        plugins: {
          // Leyenda HTML común a todos los paneles (ver renderLegend en mount).
          legend: { display: false },
          tooltip: { enabled: false },
          annotation: { annotations },
          zoom: spec.zoom
            ? {
                zoom: {
                  wheel: { enabled: true },
                  pinch: { enabled: true },
                  drag: { enabled: false },
                  mode: 'x',
                },
                pan: { enabled: true, mode: 'x', modifierKey: 'shift' },
              }
            : { zoom: { wheel: { enabled: false } }, pan: { enabled: false } },
        },
      },
    } as Config
  })
}

export const chartjsEngine: ChartEngine = {
  library: 'chartjs',
  packages: [
    'chart.js',
    'chartjs-plugin-annotation',
    'chartjs-plugin-zoom',
    'chartjs-adapter-date-fns',
  ],
  async mount(element, initialSpec, handlers, nativeOptions) {
    const [{ Chart, registerables }, annotationPlugin, zoomPlugin] = await Promise.all([
      import('chart.js'),
      import('chartjs-plugin-annotation'),
      import('chartjs-plugin-zoom'),
      // Adaptador de fechas para el eje temporal (se registra al importarse).
      import('chartjs-adapter-date-fns'),
    ])
    Chart.register(...registerables, annotationPlugin.default, zoomPlugin.default)

    type ChartInstance = InstanceType<typeof Chart>
    let spec = initialSpec
    let charts: ChartInstance[] = []
    const hover = { x: null as number | string | null }
    /** Nombres de serie ocultos desde la leyenda (se conservan al redibujar). */
    const hidden = new Set<string>()
    const frame = createFrame(element)
    const tooltip = createTooltipElement(element, spec)
    const resetButton = createResetZoomButton(element, spec, () => {
      charts.forEach((chart) =>
        (chart as unknown as { resetZoom: (mode?: string) => void }).resetZoom('none'),
      )
      resetButton.style.display = 'none'
    })

    /** Cruceta vertical en todos los paneles a la vez, en el X bajo el cursor. */
    const crosshair = {
      id: 'asCrosshair',
      afterDatasetsDraw(chart: ChartInstance) {
        if (hover.x === null || !spec.tooltip) return
        const scale = chart.scales.x!
        const px = scale.getPixelForValue(hover.x as number)
        const area = chart.chartArea
        if (px < area.left || px > area.right) return
        const ctx = chart.ctx
        ctx.save()
        ctx.strokeStyle = spec.theme.axis
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(px, area.top)
        ctx.lineTo(px, area.bottom)
        ctx.stroke()
        ctx.restore()
      },
    }

    const xValueAt = (chart: ChartInstance, pixelX: number) => {
      const value = chart.scales.x!.getValueForPixel(pixelX)
      if (spec.xAxis.type === 'category') {
        const labels = (chart.data.labels ?? []) as string[]
        return labels[Math.round(value ?? 0)] ?? null
      }
      return value ?? null
    }
    const toChartX = (value: number | string): ChartX =>
      spec.xAxis.type === 'time' && typeof value === 'number' ? new Date(value) : value

    function applyVisibility(): void {
      for (const chart of charts) {
        chart.data.datasets.forEach((dataset, index) => {
          const name = String(dataset.label ?? '').replace(BAND_LOW, '')
          chart.setDatasetVisibility(index, !hidden.has(name))
        })
        chart.update('none')
      }
    }

    function drawLegend(): void {
      renderLegend(element, frame.legend, spec, hidden, (name) => {
        if (hidden.has(name)) hidden.delete(name)
        else hidden.add(name)
        drawLegend()
        applyVisibility()
      })
    }

    function build(): void {
      charts.forEach((chart) => chart.destroy())
      drawLegend()
      const heights = panelHeights(spec, frame.host.clientHeight || 320, X_LABELS_SPACE)
      const containers = panelContainers(frame.host, heights)
      const configs = toChartJsConfigs(spec)
      charts = configs.map((config, index) => {
        const container = containers[index]!
        container.replaceChildren()
        const canvas = document.createElement('canvas')
        container.appendChild(canvas)
        const options = config.options as Record<string, unknown> & {
          plugins: Record<string, unknown>
        }
        options.onHover = (
          event: { x: number | null; y: number | null },
          _elements: unknown,
          chart: ChartInstance,
        ) => {
          if (!spec.tooltip || event.x === null || event.y === null) return
          const area = chart.chartArea
          const inside =
            event.x >= area.left &&
            event.x <= area.right &&
            event.y >= area.top &&
            event.y <= area.bottom
          hover.x = inside ? xValueAt(chart, event.x) : null
          charts.forEach((c) => c.draw())
          if (hover.x === null) {
            tooltip.style.display = 'none'
            return
          }
          const nearest = chart.getElementsAtEventForMode(
            event as unknown as Event,
            'nearest',
            { intersect: true },
            false,
          )[0]
          const datasetId = nearest
            ? (chart.data.datasets[nearest.datasetIndex] as unknown as Dataset).asId
            : undefined
          tooltip.innerHTML = tooltipHtml(
            spec,
            hover.x,
            spec.tooltip.mode === 'item' ? datasetId?.replace(BAND_LOW, '') : undefined,
          )
          if (!tooltip.innerHTML || (spec.tooltip.mode === 'item' && !datasetId)) {
            tooltip.style.display = 'none'
            return
          }
          tooltip.style.display = 'block'
          placeTooltip(
            tooltip,
            element,
            frame.host.offsetLeft + event.x,
            frame.host.offsetTop + container.offsetTop + event.y,
          )
        }
        options.onClick = (
          event: { x: number | null; y: number | null },
          elements: { datasetIndex: number; index: number }[],
          chart: ChartInstance,
        ) => {
          const hit = elements[0]
          if (hit) {
            const dataset = chart.data.datasets[hit.datasetIndex] as unknown as Dataset
            const seriesId = dataset.asId.replace(BAND_LOW, '')
            const point = (dataset.data as unknown as { x: number | string; y: number | null }[])[
              hit.index
            ]!
            handlers.onPointClick({ seriesId, x: toChartX(point.x), y: point.y })
            return
          }
          if (event.x === null) return
          const x = xValueAt(chart, event.x)
          if (x !== null) handlers.onXClick(toChartX(x))
        }
        const zoom = options.plugins.zoom as Record<string, Record<string, unknown>>
        if (spec.zoom) {
          const sync = ({ chart }: { chart: ChartInstance }) => {
            const { min, max } = chart.scales.x!
            charts
              .filter((other) => other !== chart)
              .forEach((other) =>
                (
                  other as unknown as { zoomScale: (id: string, r: object, m: string) => void }
                ).zoomScale('x', { min, max }, 'none'),
              )
            resetButton.style.display = 'block'
            handlers.onRangeChange({ start: toChartX(min), end: toChartX(max) })
          }
          zoom.zoom!.onZoomComplete = sync
          zoom.pan!.onPanComplete = sync
        }
        canvas.addEventListener('mouseleave', () => {
          hover.x = null
          tooltip.style.display = 'none'
          charts.forEach((c) => c.draw())
        })
        const finalConfig = (
          nativeOptions ? nativeOptions(config, 'chartjs') : config
        ) as ConstructorParameters<typeof Chart>[1]
        return new Chart(canvas, { ...finalConfig, plugins: [crosshair] })
      })
      if (hidden.size) applyVisibility()
    }
    build()

    return {
      get native() {
        return charts.length === 1 ? charts[0] : charts
      },
      update(next) {
        spec = next
        styleTooltip(tooltip, spec)
        resetButton.textContent = spec.texts.resetZoom
        resetButton.style.display = 'none'
        build()
      },
      resize() {
        const heights = panelHeights(spec, frame.host.clientHeight || 320, X_LABELS_SPACE)
        panelContainers(frame.host, heights)
        charts.forEach((chart) => chart.resize())
      },
      dispose() {
        charts.forEach((chart) => chart.destroy())
        charts = []
        element.replaceChildren()
      },
      async exportImage() {
        // Varios paneles: se componen en un único PNG, uno debajo de otro.
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(...charts.map((chart) => chart.canvas.width))
        canvas.height = charts.reduce((sum, chart) => sum + chart.canvas.height, 0)
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = spec.theme.surface
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        let top = 0
        for (const chart of charts) {
          ctx.drawImage(chart.canvas, 0, top, chart.canvas.width, chart.canvas.height)
          top += chart.canvas.height
        }
        return canvas.toDataURL('image/png')
      },
    }
  },
}
