import type { AlertLevel } from '@/core/types/theme'
import type { PrecipitationUnit } from '@/charts/core/precipitation'
import type {
  ChartAnnotations,
  ChartEmits,
  ChartGradient,
  ChartProps,
  ChartSeries,
  ChartToolbarConfig,
  ChartXAxisConfig,
  ChartYAxis,
} from './chart'
import type { HydroLineStyle, HydroPoint } from './HydrographProps'

export type { PrecipitationUnit }

/**
 * Acumulado de una serie de precipitación: una línea en el eje derecho (mm).
 *
 * @example
 * ```ts
 * { name: 'Acumulat', style: { color: '#14b554', width: 3 } }
 * ```
 */
export interface PrecipitationCumulative {
  /** Nombre en el tooltip, la tabla y el CSV. Por defecto, "<serie> (acumulado)". */
  name?: string
  /**
   * Color, grosor y trazo. Por defecto: el color de su serie, 3 px, y
   * continuo en el observado o discontinuo en la previsión.
   */
  style?: HydroLineStyle
  /** Empieza a sumar en este instante (los puntos anteriores no cuentan). Por defecto, el primero. */
  from?: Date
  /**
   * Id de la serie cuyo total continúa (la previsión arranca donde acaba
   * el acumulado observado: el total del episodio en una sola curva).
   * `false`, desde 0. Por defecto, en una previsión, el primer observado con
   * acumulado; en un observado, ninguno.
   */
  continueFrom?: string | false
}

/**
 * Una serie de precipitación: observada (telemetría, P. areal...) o
 * prevista (WRF, ECMWF...).
 *
 * @example
 * ```ts
 * { id: 'tr', name: 'P. TR', values: telemetria, input: 'intensity' }
 * { id: 'wrf', name: 'WRF', kind: 'forecast', values: wrf, cumulative: { name: 'Acumulat' } }
 * ```
 */
export interface PrecipitationSeries {
  /** Id estable: sus series son `'precipitation-<id>'` y `'cumulative-<id>'` (para `seriesOverrides`). */
  id: string
  /** Nombre en la leyenda, el tooltip, la tabla y el CSV (p. ej. `'P. TR'`, `'WRF'`). */
  name: string
  /** Puntos `[instante, valor]`; `null` deja un hueco. Se ordenan por fecha. */
  values: HydroPoint[]
  /**
   * Cómo llegan los valores: `'depth'`, mm caídos en el intervalo que
   * termina en cada instante; `'intensity'`, intensidad en mm/h. La
   * gráfica los convierte a lo que muestre (`rate`).
   * @default 'depth'
   */
  input?: PrecipitationUnit
  /**
   * Duración fija de cada intervalo en minutos (p. ej. 60 en datos
   * horarios), para convertir entre mm y mm/h. Sin ella, se mide entre
   * puntos consecutivos (y el primero usa el intervalo típico de la serie).
   */
  intervalMinutes?: number
  /**
   * Observada o prevista: cambia su dibujo por defecto (barras sólidas o
   * semitransparentes) y de qué serie continúa su acumulado. Puede haber
   * varias de cada tipo (p. ej. pluviómetro y precipitación areal; WRF y ECMWF).
   * @default 'observed'
   */
  kind?: 'observed' | 'forecast'
  /**
   * Cómo se dibuja: en columnas (`'bar'`), en línea o en área. Cada columna
   * ocupa el intervalo que termina en su instante, así que series con
   * intervalos distintos (10 min, 1 h, 3 h) mantienen cada una su ancho.
   * @default 'bar'
   */
  display?: 'line' | 'area' | 'bar'
  /**
   * Color, grosor y trazo (grosor y trazo, en línea o área). Por defecto:
   * la paleta en orden, 2 px, continua en una observada y discontinua en una prevista.
   */
  style?: HydroLineStyle
  /**
   * Opacidad del relleno de las barras o el área (0–1). Lo previsto se ve
   * más claro que lo observado.
   * @default 0.85 en una observada y 0.5 en una prevista (en columnas)
   */
  opacity?: number
  /**
   * Relleno en degradado (solo con `display: 'area'`).
   * @default true en una prevista, false en una observada
   */
  gradient?: boolean | ChartGradient
  /**
   * Acumulado de la serie, en el eje derecho (mm): `true` con los valores
   * por defecto, o su configuración. Sin él, la serie no tiene acumulado.
   */
  cumulative?: boolean | PrecipitationCumulative
}

/** Umbral de precipitación: de intensidad (eje izquierdo) o de acumulado (derecho). */
export interface PrecipitationThreshold {
  value: number
  /** Nivel de aviso: da el color (tokens `--as-alert-<nivel>`). */
  level: AlertLevel | (string & {})
  /** Etiqueta. Por defecto, "Umbral <nivel>". */
  label?: string
  /** Eje del umbral. @default 'rate' */
  axis?: 'rate' | 'cumulative'
}

/** Barra de herramientas: la de `ASChart` más el botón de los acumulados. */
export interface PrecipitationToolbarConfig extends ChartToolbarConfig {
  /**
   * Botón que muestra u oculta todos los acumulados (`v-model:show-cumulative`).
   * Solo si alguna serie tiene acumulado.
   * @default true
   */
  cumulativeToggle?: boolean
}

/**
 * Props de `ASPrecipitationChart`.
 *
 * @example
 * ```vue
 * <ASPrecipitationChart
 *   v-model:show-cumulative="verAcumulados"
 *   :series="[
 *     { id: 'tr', name: 'P. TR', values: telemetria, input: 'intensity', cumulative: true },
 *     { id: 'wrf', name: 'WRF', kind: 'forecast', values: wrf, cumulative: true },
 *   ]"
 * />
 * ```
 */
export interface PrecipitationProps extends Pick<
  ChartProps,
  | 'chartLibrary'
  | 'currentTime'
  | 'zoom'
  | 'fileName'
  | 'patterns'
  | 'description'
  | 'dataTable'
  | 'syncGroup'
  | 'animation'
  | 'loading'
  | 'emptyText'
  | 'error'
  | 'theme'
  | 'ariaLabel'
  | 'nativeOptions'
> {
  /** Series de precipitación, observadas y previstas (ver `PrecipitationSeries`). */
  series: PrecipitationSeries[]
  /**
   * Qué muestra el eje izquierdo: intensidad en mm/h (`'intensity'`) o mm
   * por intervalo (`'depth'`). Cada serie se convierte desde su `input`.
   * @default 'intensity'
   */
  rate?: PrecipitationUnit
  /**
   * Intervalo común en minutos (el Δt de un hietograma clásico, p. ej. 60):
   * cada serie de intervalo igual o más fino suma sus mm a ese intervalo,
   * alineado a la medianoche local, y todas sus columnas tienen el mismo
   * ancho. Así, en `rate: 'depth'`, las alturas se comparan entre series.
   * Las series más gruesas se quedan como están. Sin él, cada serie
   * conserva su intervalo. El acumulado no cambia.
   */
  interval?: number
  /** Muestra los acumulados (`v-model:show-cumulative`, el botón de la barra). @default true */
  showCumulative?: boolean
  /** Umbrales de intensidad o de acumulado. */
  thresholds?: PrecipitationThreshold[]
  /**
   * Línea "ahora" entre lo observado y lo previsto (`true`, la hora
   * actual; `false`, sin ella). @default true
   */
  now?: Date | boolean
  /** Tooltip, como en `ASChart`. Aquí, por defecto solo la fecha: los valores van en la leyenda. @default 'time' */
  tooltip?: ChartProps['tooltip']
  /** Leyenda, como en `ASChart`. @default 'bottom' */
  legend?: ChartProps['legend']
  /** Valores de cada serie en la leyenda bajo el cursor. @default true */
  legendValues?: boolean
  /** Barra de herramientas: la de `ASChart` y el botón de los acumulados. */
  toolbar?: boolean | PrecipitationToolbarConfig
  /** Alto total (px, o CSS si es string). @default 420 */
  height?: number | string
  /** Eje de tiempo: título, formato de las fechas y límites. */
  xAxis?: Omit<ChartXAxisConfig, 'type'>
  /** Anotaciones adicionales, como en `ASChart` (las de Y, en el eje de intensidad). */
  annotations?: ChartAnnotations
  /**
   * Retoques de las series generadas, por id: `'precipitation-<id>'` y
   * `'cumulative-<id>'`.
   */
  seriesOverrides?: Record<string, Partial<Omit<ChartSeries, 'id' | 'data'>>>
  /** Retoques de los ejes generados: `'rate'` (izquierdo) y `'cumulative'` (derecho). */
  yAxisOverrides?: Record<string, Partial<Omit<ChartYAxis, 'id'>>>
}

/** Eventos de `ASPrecipitationChart`: los de `ASChart` y el de los acumulados. */
export interface PrecipitationEmits extends ChartEmits {
  /** El botón de la barra mostró u ocultó los acumulados (para `v-model:show-cumulative`). */
  'update:showCumulative': [show: boolean]
}
