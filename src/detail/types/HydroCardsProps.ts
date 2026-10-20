import type {
  AggregateKind,
  AlertThresholds,
  ExceededLevel,
  MeasureSeries,
} from '@/detail/types/hydro'

/** Props comunes de las tarjetas hidrológicas. */
interface HydroCardBase {
  /** Título de la tarjeta. Cada componente tiene uno por defecto. */
  title?: string
  /** Cargando: muestra un esqueleto. */
  loading?: boolean
  /** Tema. Sin prop, el de `provideTheme`; si tampoco hay, el del contenedor. */
  theme?: 'light' | 'dark'
}

/**
 * Props de `ASAlertStatus`: nivel de aviso de una estación.
 *
 * @example
 * ```vue
 * <ASAlertStatus :series="[observado]" :thresholds="umbrales" />
 * <ASAlertStatus :series="[harmonie, eps]" :thresholds="umbrales" mode="max" />
 * ```
 */
export interface AlertStatusProps extends HydroCardBase {
  /** Series a evaluar. El nivel es el más grave de todas. */
  series: MeasureSeries[]
  /** Umbrales de las series que no traen los suyos. */
  thresholds?: AlertThresholds
  /**
   * Qué valor de cada serie se compara con los umbrales: `'latest'`, el
   * último (estado actual de lo observado); `'max'`, el máximo (lo peor
   * que anuncian las previsiones). Cambia también el título por defecto.
   * @default 'latest'
   */
  mode?: 'latest' | 'max'
  /**
   * Muestra bajo el nivel el valor de referencia y su fecha.
   * @default true
   */
  showValue?: boolean
}

/**
 * Props de `ASObservedSummary`: último valor y máximo de una serie.
 *
 * @example
 * ```vue
 * <ASObservedSummary :series="[entrada, salida, volumen]" v-model:active="vista" :thresholds="umbrales" />
 * ```
 */
export interface ObservedSummaryProps extends HydroCardBase {
  /** Series a resumir. Con más de una, un selector elige cuál se ve. */
  series: MeasureSeries[]
  /** Id de la serie que se ve (`v-model:active`). Por defecto, la primera con datos. */
  active?: string
  /** Umbrales para colorear los valores (de las series que no traen los suyos). */
  thresholds?: AlertThresholds
}

/** Eventos de `ASObservedSummary`. */
export interface ObservedSummaryEmits {
  /** Se eligió otra serie en el selector (para `v-model:active`). */
  'update:active': [id: string]
}

/**
 * Props de `ASThresholdSummary`: superaciones de umbral por serie y nivel.
 *
 * @example
 * ```vue
 * <ASThresholdSummary :series="[harmonie, eps]" :thresholds="umbrales" mode="forecast" />
 * ```
 */
export interface ThresholdSummaryProps extends HydroCardBase {
  series: MeasureSeries[]
  thresholds?: AlertThresholds
  /**
   * Si las series son lo observado o previsiones: cambia los textos sin datos
   * o sin superaciones.
   * @default 'observed'
   */
  mode?: 'observed' | 'forecast'
}

/**
 * Props de `ASValueMatrix`: tabla de valores por intervalo y serie.
 *
 * @example
 * ```vue
 * <ASValueMatrix :series="[observado, harmonie, eps]" :thresholds="umbrales" v-model:aggregate="agregado" />
 * ```
 */
export interface ValueMatrixProps extends HydroCardBase {
  /** Una fila por serie (observado, cada modelo, cada percentil...). */
  series: MeasureSeries[]
  /** Umbrales para colorear las celdas (de las series que no traen los suyos). */
  thresholds?: AlertThresholds
  /**
   * Duración de cada columna, en ms. Si divide el día, las columnas empiezan
   * a las 00:00 locales.
   * @default 21600000 (6 h)
   */
  interval?: number
  /**
   * Días que cubre la tabla desde el primer intervalo con datos.
   * @default 7
   */
  days?: number
  /**
   * Valor de cada celda (`v-model:aggregate`): mínimo, media o máximo del intervalo.
   * @default 'mean'
   */
  aggregate?: AggregateKind
}

/** Eventos de `ASValueMatrix`. */
export interface ValueMatrixEmits {
  /** Se eligió otro agregado en el selector (para `v-model:aggregate`). */
  'update:aggregate': [kind: AggregateKind]
}

/**
 * Props de `ASThresholdLegend`: umbrales de aviso de una magnitud.
 *
 * @example
 * ```vue
 * <ASThresholdLegend :thresholds="umbrales" unit="m³/s" v-model:selected="umbralResaltado" />
 * ```
 */
export interface ThresholdLegendProps extends HydroCardBase {
  thresholds?: AlertThresholds
  /** Unidad de los valores (`'m³/s'`, `'m'`...). */
  unit?: string
  /**
   * Umbral resaltado (`v-model:selected`), p. ej. para destacarlo en el
   * hidrograma. `null` si ninguno.
   */
  selected?: ExceededLevel | null
}

/** Eventos de `ASThresholdLegend`. */
export interface ThresholdLegendEmits {
  /** Se pulsó un umbral: su nivel, o `null` si ya estaba resaltado (para `v-model:selected`). */
  'update:selected': [level: ExceededLevel | null]
}
