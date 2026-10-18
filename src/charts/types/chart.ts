import type { AlertLevel } from '@/core/types/theme'
import type { DateFormat, MeasureUnit } from '@/core/utils/format'

/**
 * Motor que dibuja la gráfica. Los props son los mismos para los tres: se
 * cambia de motor sin tocar nada más (como `mapLibrary` en `ASMap`).
 *
 * - `'echarts'` (Apache-2.0, por defecto).
 * - `'chartjs'` (MIT).
 * - `'apexcharts'`: **requiere licencia comercial** para organizaciones de más
 *   de 2 M$ de facturación, y su licencia comercial estándar no permite
 *   redistribuirlo dentro de un SDK. El proyecto que lo elija debe tener la
 *   licencia adecuada (ver docs/adr/0001-motores-graficas.md).
 *
 * Todos son `peerDependencies` opcionales: instala solo el que uses.
 */
export type ChartLibrary = 'echarts' | 'chartjs' | 'apexcharts'

/** Valor del eje X: fecha (eje temporal), número o categoría. */
export type ChartX = Date | number | string

/** Punto `[x, y]`. `y: null` deja un hueco en la línea. */
export type ChartPoint = [x: ChartX, y: number | null]

/** Punto de una banda (`type: 'range'`): `[x, inferior, superior]`. */
export type ChartRangePoint = [x: ChartX, low: number | null, high: number | null]

export type ChartLineStyle = 'solid' | 'dashed' | 'dotted'

/** Eje Y. Una gráfica admite de 1 a 4. */
export interface ChartYAxis {
  id: string
  /** Título del eje. */
  label?: string
  /** Unidad: formatea los valores del eje y del tooltip con `formatUnit` (p. ej. `'m³/s'`). */
  unit?: MeasureUnit | (string & {})
  /**
   * Lado del panel. Por defecto se alternan: 1.º izquierda, 2.º derecha, 3.º
   * izquierda (desplazado hacia fuera) y 4.º derecha (desplazado).
   */
  position?: 'left' | 'right'
  /** Id del panel donde se dibuja. Por defecto, el primero. */
  panel?: string
  min?: number
  max?: number
  /** Eje invertido: el 0 arriba y los valores crecen hacia abajo (p. ej. precipitación). */
  inverse?: boolean
  /** @default 'linear' */
  scale?: 'linear' | 'log'
  /** Incluir siempre el 0 en el rango. @default true */
  beginAtZero?: boolean
  /** Decimales de las etiquetas del eje. Por defecto, los de la unidad. */
  decimals?: number
  /** Líneas de rejilla de este eje. @default solo el primer eje de cada panel */
  grid?: boolean
}

/** Panel de una gráfica. Varios paneles se apilan en vertical con el eje X compartido. */
export interface ChartPanel {
  id: string
  /** Alto relativo respecto al resto de paneles. @default 1 */
  weight?: number
}

export type ChartSeriesType = 'line' | 'bar' | 'area' | 'range' | 'scatter'

/** Serie de datos. */
export interface ChartSeries {
  id: string
  name: string
  /** `'range'` dibuja una banda entre `low` y `high` (p. ej. percentiles de una previsión). */
  type: ChartSeriesType
  /** `ChartPoint[]`, o `ChartRangePoint[]` si `type: 'range'`. */
  data: ChartPoint[] | ChartRangePoint[]
  /** Id del eje Y. Por defecto, el primero. */
  yAxis?: string
  /**
   * Color CSS, o `'var(--as-data-cat-N)'` para fijar un color de la paleta
   * del tema (se resuelve al color real en claro u oscuro). Por defecto, la
   * paleta categórica en orden.
   */
  color?: string
  /** @default 'solid' */
  lineStyle?: ChartLineStyle
  /** Grosor de línea en px. @default 2 */
  lineWidth?: number
  /** Línea escalonada. @default false */
  step?: false | 'start' | 'middle' | 'end'
  /** Marcar cada punto. @default false (true en scatter) */
  showPoints?: boolean
  /** Opacidad del relleno de `area`, `range` y `bar`. */
  opacity?: number
  /** Apilar las barras/áreas con el mismo `stack`. */
  stack?: string
  /** Mostrar en la leyenda. @default true */
  legend?: boolean
  /** Mostrar en el tooltip. @default true */
  tooltip?: boolean
}

interface AnnotationStyle {
  label?: string
  /** Color CSS. En las anotaciones Y, por defecto el del `level` (o el color de texto atenuado). */
  color?: string
  /** @default 'dashed' */
  lineStyle?: ChartLineStyle
}

/** Anotación vertical: una línea en un instante (p. ej. t0) o un intervalo sombreado. */
export type ChartXAnnotation =
  | (AnnotationStyle & { type?: 'line'; value: ChartX })
  | (AnnotationStyle & { type: 'range'; from: ChartX; to: ChartX })

/** Anotación horizontal: un umbral o una franja de valores, sobre un eje Y. */
export type ChartYAnnotation =
  | (AnnotationStyle & {
      type?: 'line'
      /** Eje Y. Por defecto, el primero. */
      yAxis?: string
      value: number
      /** Nivel de aviso: colorea la anotación con los tokens `--as-alert-<nivel>`. */
      level?: AlertLevel | (string & {})
    })
  | (AnnotationStyle & {
      type: 'range'
      yAxis?: string
      from: number
      to: number
      level?: AlertLevel | (string & {})
    })

export interface ChartAnnotations {
  x?: ChartXAnnotation[]
  y?: ChartYAnnotation[]
}

export interface ChartXAxisConfig {
  /** @default 'time' */
  type?: 'time' | 'category' | 'value'
  label?: string
  min?: ChartX
  max?: ChartX
  /** Formato de las fechas del eje temporal. @default 'datetimeShort' */
  format?: DateFormat
}

export interface ChartTooltipConfig {
  /** `'shared'`: todas las series en el instante bajo el cursor; `'item'`: solo el punto señalado. @default 'shared' */
  mode?: 'shared' | 'item'
}

/** Lado de la gráfica donde va la leyenda. */
export type ChartLegendPosition = 'top' | 'bottom' | 'left' | 'right'

export interface ChartLegendConfig {
  /** @default 'top' */
  position?: ChartLegendPosition
}

export interface ChartZoomConfig {
  /** Barra de zoom bajo la gráfica, además de la rueda / el arrastre. @default true */
  slider?: boolean
}

/** Props de `ASChart`. */
export interface ChartProps {
  /** Motor de gráficas. @default 'echarts' */
  chartLibrary?: ChartLibrary
  series: ChartSeries[]
  /** Eje X. @default { type: 'time' } */
  xAxis?: ChartXAxisConfig
  /** De 1 a 4 ejes Y. Sin indicar, uno automático. */
  yAxes?: ChartYAxis[]
  /** Paneles apilados con el eje X compartido. Sin indicar, uno. */
  panels?: ChartPanel[]
  /** Umbrales (Y) e instantes o intervalos (X) marcados sobre la gráfica. */
  annotations?: ChartAnnotations
  /**
   * Atajo para marcar el instante actual (t0) con una línea vertical
   * "Ahora": `true` usa la hora actual. @default false
   */
  now?: Date | boolean
  /** Tooltip al pasar el cursor. @default true (modo `'shared'`) */
  tooltip?: boolean | ChartTooltipConfig
  /**
   * Leyenda: `false` la oculta; una posición (`'top'`, `'bottom'`, `'left'`,
   * `'right'`) la coloca. @default `'top'` si hay 2 o más series en la leyenda
   */
  legend?: boolean | ChartLegendPosition | ChartLegendConfig
  /**
   * Muestra en la leyenda el valor de cada serie en el instante bajo el
   * cursor. Combínalo con `:tooltip="false"` para ver los valores en la
   * leyenda en vez de en el tooltip. @default false
   */
  legendValues?: boolean
  /** Zoom horizontal (rueda, arrastre y barra). @default false */
  zoom?: boolean | ChartZoomConfig
  /** Alto total (px, o CSS si es string). @default 320 */
  height?: number | string
  /** @default true */
  animation?: boolean
  /** Muestra un indicador de carga en lugar de la gráfica. @default false */
  loading?: boolean
  /** Texto si no hay datos. Por defecto, el traducido ("Sin datos"). */
  emptyText?: string
  /** Mensaje de error en lugar de la gráfica. */
  error?: string
  /**
   * Tema. Si se omite, hereda el de `provideTheme` y, si no hay ninguno, el
   * de la página (la gráfica no fuerza ninguno).
   */
  theme?: 'light' | 'dark'
  /** Descripción para lectores de pantalla. Por defecto se genera a partir de las series. */
  ariaLabel?: string
  /**
   * Vía de escape: recibe las opciones nativas ya generadas para el motor
   * (opción de ECharts, configuración de Chart.js u opciones de ApexCharts) y
   * devuelve las que se usarán. Úsala para lo que los props no cubren; el
   * código queda atado a ese motor.
   */
  nativeOptions?: (options: unknown, library: ChartLibrary) => unknown
}

export interface ChartPointClickEvent {
  seriesId: string
  x: ChartX
  y: number | null
}

export interface ChartRangeChangeEvent {
  start: ChartX
  end: ChartX
}

/** Contrato de eventos de `ASChart`. */
export interface ChartEmits {
  /** Click sobre un punto, barra o banda de una serie. */
  'point-click': [event: ChartPointClickEvent]
  /** Click sobre el área de la gráfica: el valor del eje X bajo el cursor (p. ej. para elegir un instante). */
  'x-click': [event: { x: ChartX }]
  /** El rango visible del eje X cambió por zoom. */
  'range-change': [event: ChartRangeChangeEvent]
  /** El motor terminó de crear la gráfica. `instance` es el objeto nativo del motor. */
  ready: [event: { library: ChartLibrary; instance: unknown }]
}
