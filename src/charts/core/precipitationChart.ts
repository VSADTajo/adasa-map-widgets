import type { LocaleContext } from '@/core/composables/useLocale'
import {
  convertPrecipitation,
  cumulativeAt,
  toCumulative,
  type PrecipitationUnit,
} from './precipitation'
import type { ChartProps, ChartSeries, ChartYAnnotation, ChartYAxis } from '@/charts/types/chart'
import type { HydroPoint } from '@/charts/types/HydrographProps'
import type {
  PrecipitationCumulative,
  PrecipitationProps,
  PrecipitationSeries,
} from '@/charts/types/PrecipitationProps'

const RATE_AXIS = 'rate'
const CUMULATIVE_AXIS = 'cumulative'

/** Color por defecto de la serie número `index`: la paleta categórica en orden (sin ciclar más de 8). */
const paletteColor = (index: number) => `var(--as-data-cat-${(index % 8) + 1})`

/** Último punto de una serie anterior a `until` (sin incluirlo). */
function lastPointBefore(points: readonly HydroPoint[], until: Date): HydroPoint | undefined {
  let last: HydroPoint | undefined
  for (const point of points) {
    if (point[0].getTime() >= until.getTime()) break
    last = point
  }
  return last
}

const cumulativeConfig = (series: PrecipitationSeries): PrecipitationCumulative | null =>
  series.cumulative ? (series.cumulative === true ? {} : series.cumulative) : null

/**
 * Construye los props de `ASChart` para una gráfica de precipitación.
 * Función pura: se dibuja igual con cualquier motor.
 *
 * - Eje izquierdo (`rate`): cada serie, convertida de su `input` a lo que se
 *   muestra (mm/h o mm por intervalo). Observadas en línea continua y
 *   previstas en área con degradado, por defecto.
 * - Eje derecho (`cumulative`): el acumulado (mm) de las series que lo
 *   piden, del color de su serie y en su propia línea de la leyenda. Una
 *   previsión continúa por defecto el acumulado del primer observado que
 *   lo tenga (el total del episodio en una sola curva).
 */
export function buildPrecipitation(props: PrecipitationProps, t: LocaleContext['t']): ChartProps {
  const rate: PrecipitationUnit = props.rate ?? 'intensity'
  const showCumulative = props.showCumulative ?? true
  const cumulativeGroup = t('precipitation.cumulative')

  const series: ChartSeries[] = []
  const cumulatives = new Map<string, HydroPoint[]>()

  // Acumulados: primero los observados, para que las previsiones puedan continuarlos.
  const ordered = [
    ...props.series.filter((s) => s.kind !== 'forecast'),
    ...props.series.filter((s) => s.kind === 'forecast'),
  ]
  const firstObservedWithCumulative = props.series.find(
    (s) => s.kind !== 'forecast' && cumulativeConfig(s),
  )
  for (const entry of ordered) {
    const config = cumulativeConfig(entry)
    if (!config) continue
    const depths = convertPrecipitation(entry.values, entry.input ?? 'depth', 'depth', {
      intervalMinutes: entry.intervalMinutes,
    })
    const continueFrom =
      config.continueFrom ??
      (entry.kind === 'forecast' ? firstObservedWithCumulative?.id : undefined)
    const previous = continueFrom ? cumulatives.get(continueFrom) : undefined
    const startAt = config.from ?? depths[0]?.[0]
    const start = previous && startAt ? cumulativeAt(previous, startAt) : 0
    const data = toCumulative(depths, { from: config.from, start })
    // Enlaza con el final del acumulado que continúa: sin este punto, entre
    // el último observado y la primera previsión la curva quedaría cortada.
    const joint = previous && startAt ? lastPointBefore(previous, startAt) : undefined
    cumulatives.set(entry.id, joint ? [joint, ...data] : data)
  }

  props.series.forEach((entry, index) => {
    const forecast = entry.kind === 'forecast'
    const color = entry.style?.color ?? paletteColor(index)
    const display = entry.display ?? (forecast ? 'area' : 'line')
    series.push({
      id: `precipitation-${entry.id}`,
      name: entry.name,
      type: display,
      data: convertPrecipitation(entry.values, entry.input ?? 'depth', rate, {
        intervalMinutes: entry.intervalMinutes,
      }),
      yAxis: RATE_AXIS,
      color,
      lineWidth: entry.style?.width ?? 2,
      lineStyle: entry.style?.type ?? (forecast ? 'dashed' : 'solid'),
      gradient: display === 'area' ? (entry.gradient ?? forecast) : undefined,
    })
  })

  if (showCumulative) {
    props.series.forEach((entry, index) => {
      const config = cumulativeConfig(entry)
      const data = cumulatives.get(entry.id)
      if (!config || !data?.length) return
      const name = config.name ?? t('precipitation.cumulativeName', { name: entry.name })
      series.push({
        id: `cumulative-${entry.id}`,
        name,
        // En su línea de la leyenda, bajo el título "Acumulado", basta el nombre de la serie.
        legendLabel: config.name ?? entry.name,
        legendGroup: cumulativeGroup,
        type: 'line',
        data,
        yAxis: CUMULATIVE_AXIS,
        color: config.style?.color ?? entry.style?.color ?? paletteColor(index),
        lineWidth: config.style?.width ?? 3,
        lineStyle: config.style?.type ?? (entry.kind === 'forecast' ? 'dashed' : 'solid'),
      })
    })
  }

  const hasCumulativeSeries = series.some((s) => s.yAxis === CUMULATIVE_AXIS)
  const defaultAxes: ChartYAxis[] = [
    {
      id: RATE_AXIS,
      position: 'left',
      label: t(rate === 'intensity' ? 'precipitation.intensity' : 'precipitation.depth'),
      unit: rate === 'intensity' ? 'mm/h' : 'mm',
      beginAtZero: true,
    },
    ...(hasCumulativeSeries
      ? [
          {
            id: CUMULATIVE_AXIS,
            position: 'right' as const,
            label: cumulativeGroup,
            unit: 'mm',
            beginAtZero: true,
            // La rejilla es la del eje de intensidad.
            grid: false,
          },
        ]
      : []),
  ]
  const yAxes = defaultAxes.map((axis) => ({
    ...axis,
    ...props.yAxisOverrides?.[axis.id],
    id: axis.id,
  }))

  const customized = series.map((generated) => ({
    ...generated,
    ...props.seriesOverrides?.[generated.id],
    id: generated.id,
    data: generated.data,
  }))

  const thresholds: ChartYAnnotation[] = (props.thresholds ?? [])
    .filter((threshold) => threshold.axis !== 'cumulative' || hasCumulativeSeries)
    .map((threshold) => ({
      yAxis: threshold.axis === 'cumulative' ? CUMULATIVE_AXIS : RATE_AXIS,
      value: threshold.value,
      level: threshold.level,
      label: threshold.label ?? t('hydrograph.threshold', { level: threshold.level }),
    }))

  return {
    chartLibrary: props.chartLibrary,
    series: customized,
    xAxis: { ...props.xAxis, type: 'time' },
    yAxes,
    annotations: {
      x: props.annotations?.x,
      y: [
        ...thresholds,
        ...(props.annotations?.y ?? []).map((annotation) => ({ yAxis: RATE_AXIS, ...annotation })),
      ],
    },
    now: props.now ?? true,
    tooltip: props.tooltip ?? 'time',
    legend: props.legend ?? 'bottom',
    legendValues: props.legendValues ?? true,
    zoom: props.zoom,
    toolbar: props.toolbar,
    fileName: props.fileName,
    patterns: props.patterns,
    description: props.description,
    dataTable: props.dataTable,
    currentTime: props.currentTime,
    syncGroup: props.syncGroup,
    height: props.height,
    animation: props.animation,
    loading: props.loading,
    emptyText: props.emptyText,
    error: props.error,
    theme: props.theme,
    ariaLabel: props.ariaLabel,
    nativeOptions: props.nativeOptions,
  }
}
