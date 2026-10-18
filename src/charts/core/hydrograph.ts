import type { LocaleContext } from '@/core/composables/useLocale'
import type {
  ChartPanel,
  ChartProps,
  ChartRangePoint,
  ChartSeries,
  ChartYAxis,
  ChartYAnnotation,
} from '@/charts/types/chart'
import type {
  HydroBand,
  HydroForecast,
  HydroPoint,
  HydrographProps,
  HydroVariable,
} from '@/charts/types/HydrographProps'

/** Opacidad del relleno de cada banda: la más ancha (más incierta), más tenue. */
const BAND_OPACITY: Record<HydroBand, number> = { 'p10-p90': 0.15, 'p25-p75': 0.3 }
const BAND_PERCENTILES: Record<HydroBand, ['p10' | 'p25', 'p75' | 'p90']> = {
  'p10-p90': ['p10', 'p90'],
  'p25-p75': ['p25', 'p75'],
}

const PRECIPITATION_AXIS = 'precipitation'
const DISCHARGE_AXIS = 'discharge'

/** Máximo del eje de precipitación superpuesta: las barras ocupan ~el 40 % del alto. */
function overlayMax(precipitation: HydroVariable): number | undefined {
  const values = [
    ...(precipitation.observed ?? []),
    ...(precipitation.forecasts ?? []).flatMap((f) => f.values ?? []),
  ]
    .map(([, value]) => value)
    .filter((value): value is number => value !== null)
  if (!values.length) return undefined
  const max = Math.max(...values) * 2.5
  const step = 10 ** Math.floor(Math.log10(max)) / 2
  return Math.ceil(max / step) * step
}

/** Une el percentil inferior y el superior por instante en una banda. */
function bandPoints(low: HydroPoint[], high: HydroPoint[]): ChartRangePoint[] {
  const highByTime = new Map(high.map(([date, value]) => [date.getTime(), value]))
  return low.map(([date, value]) => [date, value, highByTime.get(date.getTime()) ?? null])
}

/**
 * Construye los props de `ASChart` para un hidrograma. Función pura: todo el
 * hidrograma es configuración de la gráfica genérica, así que se dibuja
 * igual con cualquier motor.
 *
 * - Panel superior (si hay precipitación): barras con el eje invertido.
 * - Panel inferior: caudal o nivel; observado en línea sólida, cada fuente
 *   de previsión en discontinua con sus bandas de percentiles debajo.
 * - Observado y cada fuente comparten color en ambos paneles.
 */
export function buildHydrograph(props: HydrographProps, t: LocaleContext['t']): ChartProps {
  const isLevel = props.magnitude === 'level'
  const discharge = props.discharge
  const precipitation = props.precipitation
  const hasPrecipitation = Boolean(
    precipitation?.observed?.length || precipitation?.forecasts?.length,
  )
  const bands = props.bands ?? ['p10-p90', 'p25-p75']

  // Color por fuente: observado = 1.º de la paleta; cada fuente, el siguiente (misma fuente → mismo color en ambos paneles).
  const sourceIds = [
    ...new Set(
      [...(discharge.forecasts ?? []), ...(precipitation?.forecasts ?? [])].map((f) => f.id),
    ),
  ]
  const colorOf = (forecast: HydroForecast) =>
    forecast.color ?? `var(--as-data-cat-${(sourceIds.indexOf(forecast.id) % 7) + 2})`
  const observedColor = 'var(--as-data-cat-1)'
  const observedName = t('hydrograph.observed')

  const overlay = props.precipitationLayout === 'overlay'
  const inverted = props.precipitationInverted ?? true
  const precipitationWeight = Math.min(Math.max(props.precipitationWeight ?? 0.35, 0.1), 0.9)
  const panels: ChartPanel[] =
    hasPrecipitation && !overlay
      ? [
          { id: PRECIPITATION_AXIS, weight: precipitationWeight },
          { id: DISCHARGE_AXIS, weight: 1 - precipitationWeight },
        ]
      : [{ id: DISCHARGE_AXIS }]

  const defaultYAxes: ChartYAxis[] = [
    ...(hasPrecipitation
      ? [
          {
            id: PRECIPITATION_AXIS,
            // Superpuesta: mismo panel que el caudal, con su eje a la derecha.
            panel: overlay ? DISCHARGE_AXIS : PRECIPITATION_AXIS,
            position: overlay ? ('right' as const) : ('left' as const),
            label: precipitation!.label ?? t('hydrograph.precipitation'),
            unit: precipitation!.unit ?? 'mm',
            inverse: inverted,
            // Superpuesta, se estira el eje para que las barras ocupen solo
            // ~el 40 % del alto y no tapen el caudal.
            max: overlay ? overlayMax(precipitation!) : undefined,
            grid: overlay ? false : undefined,
          },
        ]
      : []),
    {
      id: DISCHARGE_AXIS,
      panel: DISCHARGE_AXIS,
      position: 'left',
      label: discharge.label ?? t(isLevel ? 'hydrograph.level' : 'hydrograph.discharge'),
      unit: discharge.unit ?? (isLevel ? 'm' : 'm³/s'),
      // El nivel rara vez parte de 0: ajustar el eje a los datos.
      beginAtZero: !isLevel,
    },
  ]
  // Retoques del proyecto sobre los ejes generados, y después los ejes extra.
  const yAxes: ChartYAxis[] = [
    ...defaultYAxes.map((axis) => ({ ...axis, ...props.yAxisOverrides?.[axis.id], id: axis.id })),
    ...(props.extraYAxes ?? []),
  ]

  const series: ChartSeries[] = []

  if (hasPrecipitation) {
    if (precipitation!.observed?.length) {
      series.push({
        id: 'precipitation-observed',
        name: precipitation!.observedName ?? observedName,
        type: 'bar',
        data: precipitation!.observed,
        yAxis: PRECIPITATION_AXIS,
        color: precipitation!.observedColor ?? observedColor,
      })
    }
    for (const forecast of precipitation!.forecasts ?? []) {
      if (!forecast.values?.length) continue
      series.push({
        id: `precipitation-${forecast.id}`,
        name: forecast.name,
        type: 'bar',
        data: forecast.values,
        yAxis: PRECIPITATION_AXIS,
        color: colorOf(forecast),
        // Previsto: semitransparente frente al observado sólido.
        opacity: 0.45,
      })
    }
  }

  // Bandas antes que las líneas, para que queden por debajo.
  for (const forecast of discharge.forecasts ?? []) {
    for (const band of bands) {
      const [lowKey, highKey] = BAND_PERCENTILES[band]
      const low = forecast.percentiles?.[lowKey]
      const high = forecast.percentiles?.[highKey]
      if (!low?.length || !high?.length) continue
      series.push({
        id: `discharge-${forecast.id}-${band}`,
        name: t('hydrograph.band', { source: forecast.name, range: band.replace('-', '–') }),
        type: 'range',
        data: bandPoints(low, high),
        yAxis: DISCHARGE_AXIS,
        color: colorOf(forecast),
        opacity: BAND_OPACITY[band],
        legend: false,
      })
    }
  }
  if (discharge.observed?.length) {
    series.push({
      id: 'discharge-observed',
      name: discharge.observedName ?? observedName,
      type: 'line',
      data: discharge.observed,
      yAxis: DISCHARGE_AXIS,
      color: discharge.observedColor ?? observedColor,
      lineWidth: 2,
    })
  }
  for (const forecast of discharge.forecasts ?? []) {
    if (!forecast.values?.length) continue
    series.push({
      id: `discharge-${forecast.id}`,
      name: forecast.name,
      type: 'line',
      data: forecast.values,
      yAxis: DISCHARGE_AXIS,
      color: colorOf(forecast),
      lineStyle: 'dashed',
      lineWidth: 2,
    })
  }
  // Retoques del proyecto (nombre, color, eje, estilo...) sobre las series generadas.
  const customized = series.map((generated) => ({
    ...generated,
    ...props.seriesOverrides?.[generated.id],
    id: generated.id,
    data: generated.data,
  }))
  for (const extra of props.extraSeries ?? []) {
    customized.push({ yAxis: DISCHARGE_AXIS, ...extra })
  }

  const thresholds: ChartYAnnotation[] = (props.thresholds ?? []).map((threshold) => ({
    yAxis: DISCHARGE_AXIS,
    value: threshold.value,
    level: threshold.level,
    label: threshold.label ?? t('hydrograph.threshold', { level: threshold.level }),
  }))

  return {
    chartLibrary: props.chartLibrary,
    series: customized,
    xAxis: { type: 'time' },
    yAxes,
    panels,
    annotations: { y: thresholds },
    now: props.now === false ? false : (props.now ?? true),
    tooltip: props.tooltip,
    legend: props.legend,
    legendValues: props.legendValues,
    zoom: props.zoom,
    toolbar: props.toolbar,
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
