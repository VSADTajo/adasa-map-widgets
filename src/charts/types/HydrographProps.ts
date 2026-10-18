import type { AlertLevel } from '@/core/types/theme'
import type { ChartLibrary, ChartProps, ChartSeries, ChartYAxis } from './chart'

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

/** Una variable del hidrograma (caudal/nivel o precipitación): observado y previsiones. */
export interface HydroVariable {
  /** Serie observada: línea sólida (caudal) o barras sólidas (precipitación). */
  observed?: HydroPoint[]
  /** Nombre de la serie observada en la leyenda y el tooltip. Por defecto, "Observado". */
  observedName?: string
  /** Color de la serie observada. Por defecto, el 1.º de la paleta. */
  observedColor?: string
  forecasts?: HydroForecast[]
  /** Unidad. Por defecto, `m³/s` o `m` (caudal/nivel) y `mm` (precipitación). */
  unit?: string
  /** Título del eje. Por defecto, el traducido ("Caudal", "Nivel", "Precipitación"). */
  label?: string
}

/** Umbral de aviso del punto de control. */
export interface HydroThreshold {
  value: number
  /** Nivel de aviso: da el color (tokens `--as-alert-<nivel>`). */
  level: AlertLevel | (string & {})
  /** Etiqueta. Por defecto, "Umbral <nivel>". */
  label?: string
}

export type HydroBand = 'p10-p90' | 'p25-p75'

/** Props de `ASHydrographChart`. */
export interface HydrographProps extends Pick<
  ChartProps,
  | 'tooltip'
  | 'legend'
  | 'legendValues'
  | 'zoom'
  | 'toolbar'
  | 'currentTime'
  | 'syncGroup'
  | 'height'
  | 'animation'
  | 'loading'
  | 'emptyText'
  | 'error'
  | 'theme'
  | 'ariaLabel'
  | 'nativeOptions'
> {
  /** Motor de gráficas (ver `ASChart`). @default 'echarts' */
  chartLibrary?: ChartLibrary
  /** Caudal o nivel: panel inferior, en línea. */
  discharge: HydroVariable
  /** Qué representa `discharge`: unidad y título por defecto. @default 'flow' */
  magnitude?: 'flow' | 'level'
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
  /** Umbrales de aviso del punto de control, sobre el eje de caudal/nivel. */
  thresholds?: HydroThreshold[]
  /**
   * Instante "ahora": línea vertical que separa observado de previsto.
   * `false` la oculta. @default la hora actual
   */
  now?: Date | false
  /** Bandas de incertidumbre a dibujar. @default ['p10-p90', 'p25-p75'] */
  bands?: HydroBand[]
  /** Series adicionales (por defecto sobre el eje de caudal/nivel), p. ej. otra magnitud en un eje extra. */
  extraSeries?: ChartSeries[]
  /** Ejes Y adicionales (hasta 4 en total). */
  extraYAxes?: ChartYAxis[]
  /**
   * Cambios sobre las series que genera el hidrograma (nombre, color, eje,
   * estilo, leyenda...), por id de serie:
   * - `'discharge-observed'`, `'precipitation-observed'`;
   * - `'discharge-<fuente>'`, `'precipitation-<fuente>'` (p. ej. `'discharge-eps'`);
   * - `'discharge-<fuente>-p10-p90'`, `'discharge-<fuente>-p25-p75'` (bandas).
   *
   * @example { 'discharge-eps': { name: 'EPS (mediana)', color: '#7c3aed', yAxis: 'nivel' } }
   */
  seriesOverrides?: Record<string, Partial<Omit<ChartSeries, 'id' | 'data'>>>
  /**
   * Cambios sobre los ejes que genera el hidrograma, por id: `'precipitation'`
   * y `'discharge'` (p. ej. su título, lado, mínimo y máximo).
   */
  yAxisOverrides?: Record<string, Partial<Omit<ChartYAxis, 'id'>>>
}
