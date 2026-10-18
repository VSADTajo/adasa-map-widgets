import type { ThemeTokens } from '@/core/types/theme'
import type { LocaleContext } from '@/core/composables/useLocale'
import { parseColor } from '@/core/utils/contrast'
import type {
  ChartLibrary,
  ChartLineStyle,
  ChartProps,
  ChartRangePoint,
  ChartSeriesType,
  ChartX,
} from '@/charts/types/chart'

/**
 * Especificación de una gráfica ya resuelta: colores, ejes, formatos y
 * anotaciones decididos a partir de los props, los tokens del tema y el
 * idioma. Es lo único que reciben los motores (echarts/chartjs/apexcharts),
 * así que los tres dibujan exactamente la misma gráfica.
 */
export interface ResolvedChartSpec {
  library: ChartLibrary
  xAxis: {
    type: 'time' | 'category' | 'value'
    label?: string
    min?: number | string
    max?: number | string
    /** Etiqueta del eje X. */
    formatTick: (x: number | string) => string
    /** Cabecera del tooltip (más detallada). */
    formatTooltip: (x: number | string) => string
  }
  panels: ResolvedPanel[]
  yAxes: ResolvedYAxis[]
  series: ResolvedSeries[]
  annotations: { x: ResolvedXAnnotation[]; y: ResolvedYAnnotation[] }
  tooltip: false | { mode: 'shared' | 'item' }
  legend: false | { position: 'top' | 'bottom' | 'left' | 'right'; values: boolean }
  zoom: false | { slider: boolean }
  animation: boolean
  /** Ejes por lado del panel que más tiene: los motores con un lienzo por panel reservan ese hueco en todos para alinear el eje X. */
  maxAxesPerSide: { left: number; right: number }
  theme: {
    text: string
    textMuted: string
    grid: string
    axis: string
    surface: string
    border: string
    fontFamily: string
    fontSize: number
  }
  /** Textos de interfaz que dibujan los propios motores. */
  texts: { resetZoom: string }
  /** Etiqueta BCP 47 del idioma activo (p. ej. `'es-ES'`), para los nombres de meses y días de los motores. */
  intlLocale: string
}

export interface ResolvedPanel {
  id: string
  index: number
  /** Fracción del alto total (los pesos normalizados suman 1). */
  fraction: number
}

export interface ResolvedYAxis {
  id: string
  index: number
  panel: string
  panelIndex: number
  position: 'left' | 'right'
  /** 0 = pegado al área de dibujo; 1 = desplazado hacia fuera (3.º y 4.º eje). */
  slot: number
  label?: string
  /** Título a dibujar: la etiqueta con la unidad, p. ej. "Caudal (m³/s)". */
  title?: string
  unit?: string
  min?: number
  max?: number
  inverse: boolean
  scale: 'linear' | 'log'
  beginAtZero: boolean
  grid: boolean
  /**
   * Valores que el eje debe mostrar aunque ninguna serie llegue a ellos
   * (umbrales y franjas anotadas): sin esto, un umbral por encima de los
   * datos quedaría fuera de la gráfica.
   */
  include: number[]
  formatTick: (value: number) => string
  formatValue: (value: number | null) => string
}

export interface ResolvedSeries {
  id: string
  name: string
  type: ChartSeriesType
  color: string
  lineStyle: ChartLineStyle
  lineWidth: number
  step: false | 'start' | 'middle' | 'end'
  showPoints: boolean
  opacity: number
  stack?: string
  legend: boolean
  tooltip: boolean
  yAxis: string
  yAxisIndex: number
  panelIndex: number
  /** `[x, y]` (o `[x, low, high]` en `range`), con X normalizado: ms en ejes temporales. */
  points: [number | string, number | null][]
  ranges: [number | string, number | null, number | null][]
}

export interface ResolvedXAnnotation {
  kind: 'line' | 'range'
  value?: number | string
  from?: number | string
  to?: number | string
  label?: string
  color: string
  fill: string
  lineStyle: ChartLineStyle
}

export interface ResolvedYAnnotation {
  kind: 'line' | 'range'
  yAxis: string
  yAxisIndex: number
  panelIndex: number
  value?: number
  from?: number
  to?: number
  label?: string
  color: string
  fill: string
  lineStyle: ChartLineStyle
}

/** Lo que `resolveSpec` necesita del idioma activo. */
export type SpecLocale = Pick<
  LocaleContext,
  't' | 'formatDate' | 'formatNumber' | 'formatUnit' | 'intlLocale'
>

const MAX_Y_AXES = 4

/** `color` con opacidad `alpha`, como `rgba()`. Acepta hex o `rgb()`. */
export function withAlpha(color: string, alpha: number): string {
  try {
    const [r, g, b] = parseColor(color)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  } catch {
    return color
  }
}

/**
 * Sustituye las referencias a la paleta de los tokens por su color real en
 * el tema actual: `var(--as-data-cat-N)` (N de 1 a 8). Los motores dibujan
 * en canvas y necesitan colores concretos, no variables CSS.
 */
export function resolveColor(color: string, tokens: ThemeTokens): string {
  const match = /^var\(--as-data-cat-(\d)\)$/.exec(color.trim())
  return match ? (tokens.data.categorical[Number(match[1]) - 1] ?? color) : color
}

/** ¿Es oscuro el color? (luminancia percibida por debajo de la mitad). */
function isDarkColor(color: string): boolean {
  try {
    const [r, g, b] = parseColor(color)
    return (r * 299 + g * 587 + b * 114) / 1000 < 128
  } catch {
    return false
  }
}

function normalizeX(x: ChartX, type: 'time' | 'category' | 'value'): number | string {
  if (type === 'category') return String(x)
  if (x instanceof Date) return x.getTime()
  if (typeof x === 'string' && type === 'time') return Date.parse(x)
  return x
}

const DEFAULT_OPACITY: Record<ChartSeriesType, number> = {
  line: 1,
  scatter: 1,
  bar: 1,
  area: 0.25,
  range: 0.2,
}

/**
 * Resuelve los props de `ASChart` en la especificación que dibujan los
 * motores. Pura: mismos props, tokens e idioma → misma especificación.
 */
export function resolveSpec(
  props: ChartProps,
  tokens: ThemeTokens,
  locale: SpecLocale,
  now: () => Date = () => new Date(),
): ResolvedChartSpec {
  const xType = props.xAxis?.type ?? 'time'
  const dateFormat = props.xAxis?.format ?? 'datetimeShort'

  // ── Paneles ──
  const panelInputs = props.panels?.length ? props.panels : [{ id: 'main' }]
  const totalWeight = panelInputs.reduce((sum, panel) => sum + (panel.weight ?? 1), 0)
  const panels: ResolvedPanel[] = panelInputs.map((panel, index) => ({
    id: panel.id,
    index,
    fraction: (panel.weight ?? 1) / totalWeight,
  }))
  const panelIndexOf = (id: string | undefined) =>
    Math.max(
      panels.findIndex((panel) => panel.id === id),
      0,
    )

  // ── Ejes Y ──
  const axisInputs = props.yAxes?.length ? props.yAxes : [{ id: 'y' }]
  if (axisInputs.length > MAX_Y_AXES) {
    console.warn(
      `[ASChart] Se admiten hasta ${MAX_Y_AXES} ejes Y; se dibujan los ${MAX_Y_AXES} primeros.`,
    )
  }
  const slotsUsed = new Map<string, number>()
  const yAxes: ResolvedYAxis[] = axisInputs.slice(0, MAX_Y_AXES).map((axis, index) => {
    const panelIndex = panelIndexOf(axis.panel)
    const position = axis.position ?? (index % 2 === 0 ? 'left' : 'right')
    const slotKey = `${panelIndex}-${position}`
    const slot = slotsUsed.get(slotKey) ?? 0
    slotsUsed.set(slotKey, slot + 1)
    const isFirstInPanel =
      axisInputs.findIndex((a) => panelIndexOf(a.panel) === panelIndex) === index
    const decimals = axis.decimals
    return {
      id: axis.id,
      index,
      panel: panels[panelIndex]!.id,
      panelIndex,
      position,
      slot,
      label: axis.label,
      title: axis.label ? (axis.unit ? `${axis.label} (${axis.unit})` : axis.label) : undefined,
      unit: axis.unit,
      min: axis.min,
      max: axis.max,
      inverse: axis.inverse ?? false,
      scale: axis.scale ?? 'linear',
      beginAtZero: axis.beginAtZero ?? true,
      grid: axis.grid ?? isFirstInPanel,
      include: [],
      formatTick: (value) =>
        locale.formatNumber(
          value,
          decimals === undefined ? {} : { maximumFractionDigits: decimals },
        ),
      formatValue: (value) =>
        axis.unit
          ? locale.formatUnit(value, axis.unit)
          : locale.formatNumber(
              value,
              decimals === undefined ? {} : { maximumFractionDigits: decimals },
            ),
    }
  })
  const axisIndexOf = (id: string | undefined) =>
    Math.max(
      yAxes.findIndex((axis) => axis.id === id),
      0,
    )

  const maxAxesPerSide = { left: 0, right: 0 }
  for (const [key, count] of slotsUsed) {
    const side = key.endsWith('left') ? 'left' : 'right'
    maxAxesPerSide[side] = Math.max(maxAxesPerSide[side], count)
  }

  // ── Series: color de la paleta categórica, en orden, para las que no traen uno ──
  // Sobre superficies oscuras, los rellenos translúcidos se ven mucho menos:
  // se refuerza su opacidad para que bandas y barras previstas sigan leyéndose.
  const darkSurface = isDarkColor(tokens.colorSurface)
  const fillOpacity = (opacity: number) =>
    darkSurface && opacity < 1 ? Math.min(opacity * 1.6, 1) : opacity
  let paletteIndex = 0
  const series: ResolvedSeries[] = props.series.map((input) => {
    const yAxisIndex = axisIndexOf(input.yAxis)
    const axis = yAxes[yAxisIndex]!
    const color = input.color
      ? resolveColor(input.color, tokens)
      : (tokens.data.categorical[paletteIndex++ % tokens.data.categorical.length] ??
        tokens.colorPrimary)
    const isRange = input.type === 'range'
    return {
      id: input.id,
      name: input.name,
      type: input.type,
      color,
      lineStyle: input.lineStyle ?? 'solid',
      lineWidth: input.lineWidth ?? 2,
      step: input.step ?? false,
      showPoints: input.showPoints ?? input.type === 'scatter',
      opacity: fillOpacity(input.opacity ?? DEFAULT_OPACITY[input.type]),
      stack: input.stack,
      legend: input.legend ?? true,
      tooltip: input.tooltip ?? true,
      yAxis: axis.id,
      yAxisIndex,
      panelIndex: axis.panelIndex,
      points: isRange
        ? []
        : (input.data as [ChartX, number | null][]).map(([x, y]) => [normalizeX(x, xType), y]),
      ranges: isRange
        ? (input.data as ChartRangePoint[]).map(([x, low, high]) => [
            normalizeX(x, xType),
            low,
            high,
          ])
        : [],
    }
  })

  // ── Anotaciones ──
  const xAnnotations: ResolvedXAnnotation[] = (props.annotations?.x ?? []).map((annotation) => {
    const color = annotation.color ?? tokens.colorTextMuted
    const base = {
      label: annotation.label,
      color,
      fill: withAlpha(color, 0.12),
      lineStyle: annotation.lineStyle ?? ('dashed' as const),
    }
    return annotation.type === 'range'
      ? {
          ...base,
          kind: 'range' as const,
          from: normalizeX(annotation.from, xType),
          to: normalizeX(annotation.to, xType),
        }
      : { ...base, kind: 'line' as const, value: normalizeX(annotation.value, xType) }
  })
  if (props.now) {
    const instant = props.now === true ? now() : props.now
    xAnnotations.push({
      kind: 'line',
      value: normalizeX(instant, xType),
      label: locale.t('chart.now'),
      color: tokens.colorText,
      fill: withAlpha(tokens.colorText, 0.12),
      lineStyle: 'solid',
    })
  }

  const alertTokens = tokens.alert as Record<string, ThemeTokens['alert']['rojo'] | undefined>
  const yAnnotations: ResolvedYAnnotation[] = (props.annotations?.y ?? []).map((annotation) => {
    const yAxisIndex = axisIndexOf(annotation.yAxis)
    const alert = annotation.level ? alertTokens[annotation.level] : undefined
    const color = annotation.color ?? alert?.strong ?? tokens.colorTextMuted
    const base = {
      yAxis: yAxes[yAxisIndex]!.id,
      yAxisIndex,
      panelIndex: yAxes[yAxisIndex]!.panelIndex,
      label: annotation.label,
      color,
      fill: withAlpha(alert?.fill ?? color, 0.18),
      lineStyle: annotation.lineStyle ?? ('dashed' as const),
    }
    return annotation.type === 'range'
      ? { ...base, kind: 'range' as const, from: annotation.from, to: annotation.to }
      : { ...base, kind: 'line' as const, value: annotation.value }
  })

  for (const annotation of yAnnotations) {
    const values =
      annotation.kind === 'range' ? [annotation.from!, annotation.to!] : [annotation.value!]
    yAxes[annotation.yAxisIndex]!.include.push(...values)
  }

  // Rango X común a todos los paneles: si cada panel calculara el suyo, un
  // mismo instante (p. ej. "ahora") caería en sitios distintos de cada panel.
  let xMin: number | undefined
  let xMax: number | undefined
  if (xType !== 'category') {
    const xs = [
      ...series.flatMap((s) => [...s.points.map(([x]) => x), ...s.ranges.map(([x]) => x)]),
      ...xAnnotations.flatMap((a) => (a.kind === 'range' ? [a.from, a.to] : [a.value])),
    ].filter((x): x is number => typeof x === 'number' && Number.isFinite(x))
    if (xs.length) {
      xMin = Math.min(...xs)
      xMax = Math.max(...xs)
    }
  }

  const legendSeries = series.filter((s) => s.legend)
  // Con valores en la leyenda, la leyenda se muestra aunque haya una sola serie.
  const legendOption = props.legend ?? (legendSeries.length >= 2 || Boolean(props.legendValues))
  const formatX = (x: number | string, format: Parameters<SpecLocale['formatDate']>[1]) =>
    xType === 'time' && typeof x === 'number'
      ? locale.formatDate(x, format)
      : xType === 'value' && typeof x === 'number'
        ? locale.formatNumber(x)
        : String(x)

  return {
    library: props.chartLibrary ?? 'echarts',
    xAxis: {
      type: xType,
      label: props.xAxis?.label,
      min: props.xAxis?.min === undefined ? xMin : normalizeX(props.xAxis.min, xType),
      max: props.xAxis?.max === undefined ? xMax : normalizeX(props.xAxis.max, xType),
      formatTick: (x) => formatX(x, dateFormat),
      formatTooltip: (x) => formatX(x, 'datetime'),
    },
    panels,
    yAxes,
    series,
    annotations: { x: xAnnotations, y: yAnnotations },
    tooltip:
      props.tooltip === false
        ? false
        : { mode: (typeof props.tooltip === 'object' && props.tooltip.mode) || 'shared' },
    legend:
      legendOption === false
        ? false
        : {
            position:
              typeof legendOption === 'string'
                ? legendOption
                : (typeof legendOption === 'object' && legendOption.position) || 'top',
            values: props.legendValues ?? false,
          },
    zoom:
      props.zoom === undefined || props.zoom === false
        ? false
        : { slider: typeof props.zoom === 'object' ? (props.zoom.slider ?? true) : true },
    animation: props.animation ?? true,
    maxAxesPerSide,
    theme: {
      text: tokens.colorText,
      textMuted: tokens.colorTextMuted,
      grid: tokens.data.grid,
      axis: tokens.data.axis,
      surface: tokens.colorSurface,
      border: tokens.colorBorder,
      fontFamily: tokens.fontFamily,
      fontSize: 12,
    },
    texts: { resetZoom: locale.t('chart.resetZoom') },
    intlLocale: locale.intlLocale.value,
  }
}

/** Valor de una serie en un X dado (para tooltips construidos a mano). */
export function valueAt(series: ResolvedSeries, x: number | string): number | null | undefined {
  return series.points.find(([px]) => px === x)?.[1]
}
