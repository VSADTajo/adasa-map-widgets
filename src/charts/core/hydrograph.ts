import { extent } from './extent'
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
  HydroObserved,
  HydroPoint,
  HydrographProps,
  HydroThresholdVariable,
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

/**
 * Las series observadas de una variable como lista. La forma anterior (un
 * solo array de puntos, con `observedName`/`observedColor`) pasa a una
 * entrada sin id, cuya serie conserva su id de siempre (`<variable>-observed`).
 */
function observedList(variable: HydroVariable | undefined): HydroObserved[] {
  const observed = variable?.observed ?? []
  if (observed.length === 0) return []
  if (Array.isArray(observed[0])) {
    return [
      {
        id: '',
        name: variable!.observedName!,
        values: observed as HydroPoint[],
        style: variable!.observedColor ? { color: variable!.observedColor } : undefined,
      },
    ]
  }
  return (observed as HydroObserved[]).filter((entry) => entry.values?.length)
}

/** Id de la serie de un observado: `<variable>-observed` (forma anterior) o `<variable>-observed-<id>`. */
const observedSeriesId = (key: string, entry: HydroObserved) =>
  entry.id ? `${key}-observed-${entry.id}` : `${key}-observed`

/**
 * Color por defecto del observado número `index` de una variable: el 1.º
 * lleva el de la variable; los siguientes, colores del final de la paleta
 * (lejos de las fuentes de previsión, que empiezan por el 2.º).
 */
const observedColorAt = (index: number, base: string) =>
  index === 0 ? base : `var(--as-data-cat-${8 - ((index - 1) % 4)})`

/** Máximo del eje de precipitación superpuesta: las barras ocupan ~el 40 % del alto. */
function overlayMax(precipitation: HydroVariable): number | undefined {
  const range = extent(
    [
      ...observedList(precipitation).flatMap((entry) => entry.values),
      ...(precipitation.forecasts ?? []).flatMap((f) => f.values ?? []),
    ].map(([, value]) => value),
  )
  if (!range) return undefined
  const max = range[1] * 2.5
  const step = 10 ** Math.floor(Math.log10(max)) / 2
  return Math.ceil(max / step) * step
}

/** Une el percentil inferior y el superior por instante en una banda. */
function bandPoints(low: HydroPoint[], high: HydroPoint[]): ChartRangePoint[] {
  const highByTime = new Map(high.map(([date, value]) => [date.getTime(), value]))
  return low.map(([date, value]) => [date, value, highByTime.get(date.getTime()) ?? null])
}

/** Variables que se dibujan en línea, en el panel principal. */
type LineVariableKey = 'discharge' | 'inflow' | 'outflow' | 'volume' | 'level'

/** Una variable en línea ya resuelta: su eje, color y nombre. */
interface LineVariable {
  key: LineVariableKey
  variable: HydroVariable
  axis: string
  /** Color del observado (y de sus previsiones sin color, salvo en caudal). */
  color: string
  /** Nombre de la variable (título del eje en volumen y nivel). */
  label: string
}

const VOLUME_AXIS = 'volume'
const LEVEL_AXIS = 'level'

/**
 * Color fijo de cada variable secundaria (no depende de cuántas fuentes de
 * previsión haya: ocultar una no repinta nada). Las fuentes de caudal usan
 * la paleta desde el 2.º color, así que estas van desde el 4.º.
 */
const VARIABLE_COLORS: Record<Exclude<LineVariableKey, 'discharge'>, string> = {
  inflow: 'var(--as-data-cat-4)',
  outflow: 'var(--as-data-cat-5)',
  volume: 'var(--as-data-cat-6)',
  level: 'var(--as-data-cat-7)',
}

/** Si la variable trae algo que dibujar (observado, previsión o percentiles). */
function hasData(variable: HydroVariable | undefined): variable is HydroVariable {
  return Boolean(
    observedList(variable).length ||
    variable?.forecasts?.some(
      (f) => f.values?.length || Object.values(f.percentiles ?? {}).some((p) => p?.length),
    ),
  )
}

/**
 * Construye los props de `ASChart` para un hidrograma. Función pura: todo el
 * hidrograma es configuración de la gráfica genérica, así que se dibuja
 * igual con cualquier motor.
 *
 * - Panel superior (si hay precipitación): barras con el eje invertido.
 * - Panel principal: caudal (o nivel con `magnitude: 'level'`), y en el mismo
 *   eje los caudales de entrada y salida; volumen y nivel, cada uno en su
 *   propio eje. Observado en línea sólida, cada fuente de previsión en
 *   discontinua con sus bandas de percentiles debajo.
 * - Observado y cada fuente de caudal comparten color en ambos paneles.
 */
export function buildHydrograph(props: HydrographProps, t: LocaleContext['t']): ChartProps {
  const isLevel = props.magnitude === 'level'
  const discharge = props.discharge
  const precipitation = props.precipitation
  const hasPrecipitation = Boolean(
    observedList(precipitation).length || precipitation?.forecasts?.length,
  )
  const bands = props.bands ?? ['p10-p90', 'p25-p75']

  // Color por fuente: observado = 1.º de la paleta; cada fuente, el siguiente (misma fuente → mismo color en ambos paneles).
  const sourceIds = [
    ...new Set(
      [...(discharge?.forecasts ?? []), ...(precipitation?.forecasts ?? [])].map((f) => f.id),
    ),
  ]
  const colorOf = (forecast: HydroForecast) =>
    forecast.style?.color ??
    forecast.color ??
    `var(--as-data-cat-${(sourceIds.indexOf(forecast.id) % 7) + 2})`
  const observedColor = 'var(--as-data-cat-1)'
  const observedName = t('hydrograph.observed')

  // ── Variables en línea y sus ejes ──
  // El eje de caudal existe si hay caudal, entrada o salida (o si no hay nada más: siempre hay uno).
  const flowKeys = (['discharge', 'inflow', 'outflow'] as const).filter((key) =>
    hasData(props[key]),
  )
  const hasVolume = hasData(props.volume)
  const hasLevel = hasData(props.level)
  const hasDischargeAxis = flowKeys.length > 0 || (!hasVolume && !hasLevel)
  const mainAxis = hasDischargeAxis ? DISCHARGE_AXIS : hasLevel ? LEVEL_AXIS : VOLUME_AXIS

  const lineVariables: LineVariable[] = flowKeys.map((key) => {
    const variable = props[key]!
    return {
      key,
      variable,
      axis: DISCHARGE_AXIS,
      color:
        observedList(variable)[0]?.style?.color ??
        (key === 'discharge' ? observedColor : VARIABLE_COLORS[key]),
      label: variable.label ?? t(`hydrograph.${key}`),
    }
  })
  for (const [key, axis, has] of [
    ['volume', VOLUME_AXIS, hasVolume],
    ['level', LEVEL_AXIS, hasLevel],
  ] as const) {
    if (!has) continue
    const variable = props[key]!
    lineVariables.push({
      key,
      variable,
      axis,
      color: observedList(variable)[0]?.style?.color ?? VARIABLE_COLORS[key],
      label: variable.label ?? t(`hydrograph.${key}`),
    })
  }

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

  // Ejes del panel principal: el primero a la izquierda; volumen y nivel, al
  // lado que tenga menos (a igualdad, a la derecha). La lluvia superpuesta ocupa la derecha.
  const sides = { left: 0, right: hasPrecipitation && overlay ? 1 : 0 }
  const place = (first: boolean): 'left' | 'right' => {
    const side = first ? 'left' : sides.left < sides.right ? 'left' : 'right'
    sides[side] += 1
    return side
  }
  const mainAxes: ChartYAxis[] = []
  if (hasDischargeAxis) {
    mainAxes.push({
      id: DISCHARGE_AXIS,
      panel: DISCHARGE_AXIS,
      position: place(true),
      label: discharge?.label ?? t(isLevel ? 'hydrograph.level' : 'hydrograph.discharge'),
      unit: discharge?.unit ?? (isLevel ? 'm' : 'm³/s'),
      // El nivel rara vez parte de 0: ajustar el eje a los datos.
      beginAtZero: !isLevel,
    })
  }
  for (const line of lineVariables.filter((l) => l.axis !== DISCHARGE_AXIS)) {
    const first = mainAxes.length === 0
    mainAxes.push({
      id: line.axis,
      panel: DISCHARGE_AXIS,
      position: place(first),
      label: line.label,
      unit: line.variable.unit ?? (line.key === 'volume' ? 'hm³' : 'm'),
      // Volumen y nivel varían poco respecto a su valor: el eje se ajusta a los datos.
      beginAtZero: false,
      // Un eje secundario no dibuja rejilla: la rejilla es la del principal.
      grid: first ? undefined : false,
    })
  }

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
    ...mainAxes,
  ]
  // Retoques del proyecto sobre los ejes generados, y después los ejes extra.
  const yAxes: ChartYAxis[] = [
    ...defaultYAxes.map((axis) => ({ ...axis, ...props.yAxisOverrides?.[axis.id], id: axis.id })),
    ...(props.extraYAxes ?? []),
  ]

  const series: ChartSeries[] = []

  if (hasPrecipitation) {
    observedList(precipitation).forEach((entry, index) => {
      series.push({
        id: observedSeriesId('precipitation', entry),
        name: entry.name ?? observedName,
        type: 'bar',
        data: entry.values,
        yAxis: PRECIPITATION_AXIS,
        color: entry.style?.color ?? observedColorAt(index, observedColor),
      })
    })
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

  /**
   * Nombre y color de una previsión: en caudal, los de su fuente; en el
   * resto, "Variable · Fuente" y el color de la variable (si no trae uno).
   */
  const forecastStyle = (line: LineVariable, forecast: HydroForecast) =>
    line.key === 'discharge'
      ? { name: forecast.name, color: colorOf(forecast) }
      : {
          name: t('hydrograph.variableForecast', { variable: line.label, source: forecast.name }),
          color: forecast.style?.color ?? forecast.color ?? line.color,
        }

  // Bandas antes que las líneas, para que queden por debajo.
  for (const line of lineVariables) {
    for (const forecast of line.variable.forecasts ?? []) {
      const { name, color } = forecastStyle(line, forecast)
      for (const band of bands) {
        const [lowKey, highKey] = BAND_PERCENTILES[band]
        const low = forecast.percentiles?.[lowKey]
        const high = forecast.percentiles?.[highKey]
        if (!low?.length || !high?.length) continue
        const bandStyle = forecast.bandStyle?.[band]
        series.push({
          id: `${line.key}-${forecast.id}-${band}`,
          name:
            bandStyle?.name ??
            t('hydrograph.band', { source: name, range: band.replace('-', '–') }),
          type: 'range',
          data: bandPoints(low, high),
          yAxis: line.axis,
          color: bandStyle?.color ?? color,
          opacity: bandStyle?.opacity ?? BAND_OPACITY[band],
          // En la leyenda, para saber qué es cada sombra (y poder ocultarla).
          legend: bandStyle?.legend ?? true,
        })
      }
    }
  }
  for (const line of lineVariables) {
    observedList(line.variable).forEach((entry, index) => {
      series.push({
        id: observedSeriesId(line.key, entry),
        // Sin nombre (forma anterior): en caudal, "Observado"; en el resto, el de la variable.
        name: entry.name ?? (line.key === 'discharge' ? observedName : line.label),
        type: 'line',
        data: entry.values,
        yAxis: line.axis,
        color: entry.style?.color ?? observedColorAt(index, line.color),
        lineWidth: entry.style?.width ?? 2,
        lineStyle: entry.style?.type ?? 'solid',
      })
    })
    for (const forecast of line.variable.forecasts ?? []) {
      if (!forecast.values?.length) continue
      series.push({
        id: `${line.key}-${forecast.id}`,
        ...forecastStyle(line, forecast),
        type: 'line',
        data: forecast.values,
        yAxis: line.axis,
        lineStyle: forecast.style?.type ?? 'dashed',
        lineWidth: forecast.style?.width ?? 2,
      })
    }
  }
  // Retoques del proyecto (nombre, color, eje, estilo...) sobre las series generadas.
  const customized = series.map((generated) => ({
    ...generated,
    ...props.seriesOverrides?.[generated.id],
    id: generated.id,
    data: generated.data,
  }))
  for (const extra of props.extraSeries ?? []) {
    customized.push({ yAxis: mainAxis, ...extra })
  }

  // Cada umbral, al eje de su variable (o al principal si esa variable no está).
  const axisOf: Record<HydroThresholdVariable, string | undefined> = {
    discharge: hasDischargeAxis ? DISCHARGE_AXIS : undefined,
    volume: hasVolume ? VOLUME_AXIS : undefined,
    level: hasLevel ? LEVEL_AXIS : undefined,
  }
  const thresholds: ChartYAnnotation[] = (props.thresholds ?? []).map((threshold) => ({
    yAxis: axisOf[threshold.variable ?? 'discharge'] ?? mainAxis,
    value: threshold.value,
    level: threshold.level,
    label: threshold.label ?? t('hydrograph.threshold', { level: threshold.level }),
  }))

  return {
    chartLibrary: props.chartLibrary,
    series: customized,
    xAxis: { ...props.xAxis, type: 'time' },
    yAxes,
    panels,
    annotations: {
      x: props.annotations?.x,
      y: [
        ...thresholds,
        ...(props.annotations?.y ?? []).map((annotation) => ({
          yAxis: mainAxis,
          ...annotation,
        })),
      ],
    },
    now: props.now ?? true,
    tooltip: props.tooltip,
    legend: props.legend,
    legendValues: props.legendValues,
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
