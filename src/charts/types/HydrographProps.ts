import type { AlertLevel } from '@/core/types/theme'
import type {
  ChartAnnotations,
  ChartEmits,
  ChartProps,
  ChartSeries,
  ChartToolbarConfig,
  ChartXAxisConfig,
  ChartYAxis,
} from './chart'

/** Punto de una serie hidrológica: `[instante, valor]`. `null` deja un hueco. */
export type HydroPoint = [Date, number | null]

/** Una fuente de previsión (p. ej. Harmonie, EPS), con su mediana y sus percentiles. */
export interface HydroForecast {
  /** Id estable: la misma fuente en lluvia y en caudal comparte color. */
  id: string
  /** Nombre visible (p. ej. `'Harmonie'`). */
  name: string
  /** Color CSS. Por defecto, la paleta categórica a partir del 2.º color (el 1.º es el observado). */
  color?: string
  /** Serie determinista o mediana (p50): línea discontinua. */
  values?: HydroPoint[]
  /** Percentiles para las bandas de incertidumbre. Los pares (p10/p90, p25/p75) deben tener los mismos instantes. */
  percentiles?: { p10?: HydroPoint[]; p25?: HydroPoint[]; p75?: HydroPoint[]; p90?: HydroPoint[] }
}

/**
 * Una variable del hidrograma (caudal, caudal de entrada o de salida,
 * volumen, nivel o precipitación): observado y previsiones.
 *
 * @example
 * ```ts
 * const nivel: HydroVariable = { observed: cotas, unit: 'msnm', forecasts: [{ id: 'eps', name: 'EPS', values: cotasEps }] }
 * ```
 */
export interface HydroVariable {
  /** Serie observada: línea sólida (caudal, volumen, nivel) o barras sólidas (precipitación). */
  observed?: HydroPoint[]
  /**
   * Nombre de la serie observada en la leyenda y el tooltip. Por defecto,
   * "Observado" en caudal y precipitación, y el nombre de la variable en el
   * resto ("Caudal de entrada", "Volumen", "Nivel"...), para distinguirlas.
   */
  observedName?: string
  /**
   * Color de la serie observada. Por defecto, el 1.º de la paleta en caudal y
   * precipitación, y uno fijo por variable en el resto (entrada, salida,
   * volumen y nivel: `--as-data-cat-4` a `-7`).
   */
  observedColor?: string
  /**
   * Previsiones. En caudal y precipitación, cada fuente lleva su color (el
   * mismo en las dos). En entrada, salida, volumen y nivel, por defecto el
   * color de la variable, en discontinua, y el nombre "Variable · Fuente".
   */
  forecasts?: HydroForecast[]
  /**
   * Unidad. Por defecto: `m³/s` (caudal, entrada y salida), `hm³` (volumen),
   * `m` (nivel; p. ej. `'msnm'` para cotas sobre el nivel del mar) y `mm`
   * (precipitación). La entrada y la salida comparten el eje de caudal, así
   * que usan su unidad.
   */
  unit?: string
  /**
   * Título del eje (y nombre de la variable). Por defecto, el traducido
   * ("Caudal", "Caudal de entrada", "Volumen", "Nivel", "Precipitación").
   */
  label?: string
}

/** Variable sobre cuyo eje se dibuja un umbral. */
export type HydroThresholdVariable = 'discharge' | 'volume' | 'level'

/** Umbral de aviso del punto de control. */
export interface HydroThreshold {
  value: number
  /** Nivel de aviso: da el color (tokens `--as-alert-<nivel>`). */
  level: AlertLevel | (string & {})
  /** Etiqueta. Por defecto, "Umbral <nivel>". */
  label?: string
  /**
   * Eje del umbral: caudal (también el de entrada y salida), volumen o
   * nivel. Si esa variable no está en la gráfica, va al eje principal.
   * @default 'discharge'
   */
  variable?: HydroThresholdVariable
}

export type HydroBand = 'p10-p90' | 'p25-p75'

/**
 * Barra de herramientas del hidrograma: la de `ASChart` más tres acciones
 * propias, activas por defecto (cada una solo si tiene sentido con los datos).
 */
export interface HydrographToolbarConfig extends ChartToolbarConfig {
  /**
   * "Enfocar umbral": cada pulsación deja solo un umbral (de menor a mayor)
   * y ajusta el eje a los datos y a ese umbral; tras el último vuelve a
   * todos. Solo con `thresholds`.
   * @default true
   */
  focusThreshold?: boolean
  /**
   * Selector de las previsiones que se ven (casillas con "Todas" y
   * contador). Cambia `visibleForecasts`. Solo con previsiones.
   * @default true
   */
  forecastSelector?: boolean
  /**
   * Botón que muestra u oculta los percentiles. Cambia `bands`. Solo si
   * alguna previsión trae percentiles.
   * @default true
   */
  bandsToggle?: boolean
}

/**
 * Props de `ASHydrographChart`.
 *
 * @example
 * ```vue
 * <!-- Punto de control de un río -->
 * <ASHydrographChart :discharge="{ observed: caudal, forecasts }" :precipitation="{ observed: lluvia }"
 *   :thresholds="[{ value: 120, level: 'naranja' }]" />
 * <!-- Embalse: entrada y salida (m³/s), volumen (hm³) y nivel (msnm), cada uno con su eje -->
 * <ASHydrographChart :inflow="{ observed: entrada }" :outflow="{ observed: salida }"
 *   :volume="{ observed: volumen }" :level="{ observed: cota, unit: 'msnm' }"
 *   :thresholds="[{ value: 652.5, level: 'rojo', variable: 'level', label: 'Cota máxima' }]" />
 * ```
 */
export interface HydrographProps extends Pick<
  ChartProps,
  | 'chartLibrary'
  | 'currentTime'
  | 'tooltip'
  | 'legend'
  | 'legendValues'
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
  /** Alto total (px, o CSS si es string). Mayor que en `ASChart` porque tiene dos paneles. @default 420 */
  height?: number | string
  /**
   * Barra de herramientas: la de `ASChart` (`true` o su configuración) más
   * las acciones propias del hidrograma (ver `HydrographToolbarConfig`).
   * @default solo "Restablecer zoom", y solo si hay `zoom`
   */
  toolbar?: boolean | HydrographToolbarConfig
  /**
   * Ids de las previsiones que se dibujan (`v-model:visible-forecasts`), en
   * los dos paneles. Sin él, todas. Los colores no cambian al ocultar una.
   */
  visibleForecasts?: string[]
  /**
   * Caudal (o nivel, con `magnitude: 'level'`): panel inferior, en línea, eje
   * a la izquierda. Opcional: una gráfica de embalse puede tener solo
   * `inflow`/`outflow`, `volume` y `level`.
   */
  discharge?: HydroVariable
  /** Qué representa `discharge`: unidad y título por defecto. @default 'flow' */
  magnitude?: 'flow' | 'level'
  /** Caudal de entrada (p. ej. a un embalse), en el mismo eje que `discharge` (m³/s). */
  inflow?: HydroVariable
  /** Caudal de salida (desembalse), en el mismo eje que `discharge` (m³/s). */
  outflow?: HydroVariable
  /**
   * Volumen (embalsado), en su propio eje (`hm³` por defecto), en el mismo
   * panel que el caudal. Su eje va al lado con menos ejes (a igualdad, a la derecha).
   */
  volume?: HydroVariable
  /**
   * Nivel (cota), en su propio eje (`m` por defecto; `unit: 'msnm'` para
   * cotas sobre el nivel del mar), en el mismo panel que el caudal.
   */
  level?: HydroVariable
  /** Precipitación: panel superior, en barras con el eje invertido. Sin ella, un solo panel. */
  precipitation?: HydroVariable
  /**
   * Dónde va la precipitación:
   * - `'panel'`: en su propio panel, encima del caudal, con el eje de tiempo compartido (alineados).
   * - `'overlay'`: en el mismo gráfico que el caudal, con su eje a la derecha
   *   (el hietograma clásico colgando desde arriba).
   * @default 'panel'
   */
  precipitationLayout?: 'panel' | 'overlay'
  /** Barras de precipitación colgando desde arriba (eje invertido). `false`: creciendo desde abajo. @default true */
  precipitationInverted?: boolean
  /** Alto relativo del panel de precipitación (0–1), con `precipitationLayout: 'panel'`. @default 0.35 */
  precipitationWeight?: number
  /**
   * Umbrales de aviso del punto de control. Cada uno va al eje de su
   * `variable` (caudal por defecto, volumen o nivel).
   */
  thresholds?: HydroThreshold[]
  /**
   * Instante "ahora": línea vertical que separa observado de previsto. Los
   * mismos valores que en `ASChart` (`true` = la hora actual, `false` la
   * oculta), pero aquí se muestra por defecto: sin ella no se distingue el
   * observado del previsto. @default true
   */
  now?: Date | boolean
  /** Eje de tiempo: título, formato de las fechas y límites (siempre es temporal). */
  xAxis?: Omit<ChartXAxisConfig, 'type'>
  /**
   * Anotaciones adicionales, como en `ASChart` (p. ej. un episodio en X). Las
   * de Y van por defecto sobre el eje de caudal/nivel; los umbrales, mejor en `thresholds`.
   */
  annotations?: ChartAnnotations
  /**
   * Bandas de incertidumbre a dibujar (`v-model:bands` con el botón de
   * percentiles de la barra). `[]` las oculta. @default ['p10-p90', 'p25-p75']
   */
  bands?: HydroBand[]
  /** Series adicionales (por defecto sobre el eje de caudal/nivel), p. ej. otra magnitud en un eje extra. */
  extraSeries?: ChartSeries[]
  /**
   * Ejes Y adicionales. Hasta 4 en total, contando los del hidrograma
   * (precipitación, caudal, volumen y nivel, los que haya).
   */
  extraYAxes?: ChartYAxis[]
  /**
   * Cambios sobre las series que genera el hidrograma (nombre, color, eje,
   * estilo, leyenda...), por id de serie, donde `<variable>` es `discharge`,
   * `inflow`, `outflow`, `volume`, `level` o `precipitation`:
   * - `'<variable>-observed'` (p. ej. `'level-observed'`);
   * - `'<variable>-<fuente>'` (p. ej. `'discharge-eps'`);
   * - `'<variable>-<fuente>-p10-p90'`, `'<variable>-<fuente>-p25-p75'` (bandas).
   *
   * @example { 'discharge-eps': { name: 'EPS (mediana)', color: '#7c3aed', yAxis: 'nivel' } }
   */
  seriesOverrides?: Record<string, Partial<Omit<ChartSeries, 'id' | 'data'>>>
  /**
   * Cambios sobre los ejes que genera el hidrograma, por id: `'precipitation'`,
   * `'discharge'`, `'volume'` y `'level'` (p. ej. su título, lado, mínimo y máximo).
   */
  yAxisOverrides?: Record<string, Partial<Omit<ChartYAxis, 'id'>>>
}

/** Eventos de `ASHydrographChart`: los de `ASChart` y los de sus acciones propias. */
export interface HydrographEmits extends ChartEmits {
  /** El selector de previsiones cambió las visibles (para `v-model:visible-forecasts`). */
  'update:visibleForecasts': [ids: string[]]
  /** El botón de percentiles los mostró u ocultó (para `v-model:bands`). */
  'update:bands': [bands: HydroBand[]]
  /** "Enfocar umbral": el umbral enfocado, o `null` al volver a todos. */
  'threshold-focus': [threshold: HydroThreshold | null]
}
