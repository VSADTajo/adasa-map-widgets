import type { ChartImageFormat, ChartLibrary, ChartX } from '@/charts/types/chart'
import type { ResolvedChartSpec } from '@/charts/core/resolveSpec'

/** Eventos que cada motor traduce a los de `ASChart`. */
export interface ChartEngineHandlers {
  onPointClick: (event: { seriesId: string; x: ChartX; y: number | null }) => void
  onXClick: (x: ChartX) => void
  onRangeChange: (event: { start: ChartX; end: ChartX }) => void
  /** El cursor está sobre el instante `x` (o salió de la gráfica: `null`). */
  onHover: (x: ChartX | null) => void
}

/** Gráfica ya creada por un motor. */
export interface ChartEngineInstance {
  /** Redibuja con una especificación nueva (datos, tema, idioma...). */
  update: (spec: ResolvedChartSpec) => void
  /** Ajusta al tamaño actual del contenedor. */
  resize: () => void
  dispose: () => void
  /** La gráfica con su leyenda, como data URL PNG o SVG (ver `composeImage`). */
  exportImage: (format: ChartImageFormat) => Promise<string>
  /** Vuelve al rango X completo tras un zoom. */
  resetZoom: () => void
  /**
   * Muestra el cursor (cruceta, tooltip si lo hay y valores en la leyenda)
   * en el instante `x` normalizado (ms en ejes temporales), como si el
   * usuario estuviera encima; `null` lo quita. Para los grupos de sincronización.
   */
  showCursor: (x: number | string | null) => void
  /** Aplica un zoom al rango `[start, end]` (normalizado); `null` lo quita. */
  zoomTo: (range: { start: number | string; end: number | string } | null) => void
  /** Objeto(s) nativo(s) del motor, para `ready` y `getInstance()`. */
  native: unknown
}

/** Un motor de gráficas: traduce `ResolvedChartSpec` a su librería y la dibuja. */
export interface ChartEngine {
  library: ChartLibrary
  /** Paquetes npm que necesita (para el mensaje de error si no están instalados). */
  packages: string[]
  mount: (
    element: HTMLElement,
    spec: ResolvedChartSpec,
    handlers: ChartEngineHandlers,
    nativeOptions?: (options: unknown, library: ChartLibrary) => unknown,
  ) => Promise<ChartEngineInstance>
}

/** Posición vertical de un panel, en px. */
export interface PanelLayout {
  top: number
  height: number
}

/** Reparte `available` px entre los paneles según su fracción, con `gap` px entre ellos. */
export function layoutPanels(
  fractions: number[],
  available: number,
  offsetTop: number,
  gap: number,
): PanelLayout[] {
  const usable = Math.max(available - gap * (fractions.length - 1), 0)
  let top = offsetTop
  return fractions.map((fraction) => {
    const height = Math.round(usable * fraction)
    const layout = { top, height }
    top += height + gap
    return layout
  })
}

/** Ancho reservado por cada eje Y (etiquetas + título), igual en todos los motores para alinear paneles. */
export const Y_AXIS_WIDTH = 64

/**
 * Redondea hacia arriba/abajo a un valor "bonito": un múltiplo de la mitad
 * del orden de magnitud de `span` (el rango de los datos del eje) o, sin
 * él, del propio valor (212,7 → 250).
 *
 * Con `span`, un eje de valores altos y poca variación (una cota de 651,3 a
 * 651,6 msnm) se redondea a 651,3–651,6 y no a 650–700.
 */
export function niceRound(value: number, direction: 'up' | 'down', span?: number): number {
  if (!Number.isFinite(value)) return value
  const base = span !== undefined && span > 0 ? span : Math.abs(value)
  if (base === 0) return value
  const step = 10 ** Math.floor(Math.log10(base)) / 2
  // Un cociente que es entero salvo por el error de coma flotante (651,6 / 0,05) no se mueve.
  const ratio = value / step
  const whole = Math.abs(ratio - Math.round(ratio)) < 1e-9 ? Math.round(ratio) : ratio
  const rounded = (direction === 'up' ? Math.ceil(whole) : Math.floor(whole)) * step
  return Number(rounded.toPrecision(12))
}

/**
 * Unidad y paso de las marcas de un eje temporal, para que caigan en
 * instantes "redondos" (medianoche, cada 6 h...) en todos los motores.
 */
export function timeTickUnit(
  min: number,
  max: number,
): { unit: 'day' | 'hour' | 'minute'; step: number } {
  const hours = (max - min) / 3_600_000
  if (hours > 72) return { unit: 'day', step: Math.max(1, Math.round(hours / 24 / 7)) }
  if (hours > 24) return { unit: 'hour', step: 12 }
  if (hours > 8) return { unit: 'hour', step: 3 }
  if (hours > 2) return { unit: 'hour', step: 1 }
  return { unit: 'minute', step: 15 }
}

/**
 * Marcas de un eje temporal alineadas a la unidad (medianoches, horas en
 * punto múltiplos del paso...) en hora local, entre `min` y `max`.
 */
export function alignedTimeTicks(min: number, max: number): number[] {
  const { unit, step } = timeTickUnit(min, max)
  const start = new Date(min)
  if (unit === 'day') start.setHours(0, 0, 0, 0)
  else if (unit === 'hour') start.setHours(Math.floor(start.getHours() / step) * step, 0, 0, 0)
  else start.setMinutes(Math.floor(start.getMinutes() / step) * step, 0, 0)
  const ticks: number[] = []
  for (const date = start; date.getTime() <= max;) {
    if (date.getTime() >= min) ticks.push(date.getTime())
    if (unit === 'day') date.setDate(date.getDate() + step)
    else if (unit === 'hour') date.setHours(date.getHours() + step)
    else date.setMinutes(date.getMinutes() + step)
  }
  return ticks
}

/** Número de marcas que caben en un eje de `height` px (una cada ~40 px, entre 2 y 6). */
export function ticksForHeight(height: number): number {
  return Math.max(2, Math.min(6, Math.floor(height / 40)))
}

/**
 * ¿Cabe el título (vertical) de un eje en un panel de `height` px? Si no,
 * se oculta: un título cortado ("ecipitación") es peor que ninguno; la
 * unidad sigue en el tooltip y en la leyenda.
 */
export function axisTitleFits(title: string | undefined, height: number): boolean {
  return Boolean(title) && title!.length * 6.5 + 12 <= height
}

/**
 * Entradas de la leyenda por grupo (`legendGroup`): una por nombre, sin
 * grupo primero y después cada grupo en el orden en que aparece. Dentro de
 * cada grupo, las bandas (`range`) van al final: se dibujan antes que las
 * líneas (para quedar debajo), pero en la leyenda acompañan a su línea.
 */
export function legendGroups<
  S extends { name: string; type: string; legend: boolean; legendGroup?: string },
>(series: readonly S[]): { group?: string; entries: S[] }[] {
  const seen = new Set<string>()
  const groups = new Map<string | undefined, S[]>([[undefined, []]])
  for (const entry of series) {
    if (!entry.legend || seen.has(entry.name)) continue
    seen.add(entry.name)
    if (!groups.has(entry.legendGroup)) groups.set(entry.legendGroup, [])
    groups.get(entry.legendGroup)!.push(entry)
  }
  return [...groups]
    .filter(([, entries]) => entries.length)
    .map(([group, entries]) => ({
      group,
      entries: [
        ...entries.filter((entry) => entry.type !== 'range'),
        ...entries.filter((entry) => entry.type === 'range'),
      ],
    }))
}

/**
 * Serie que da la muestra de una entrada de la leyenda (las series con el
 * mismo nombre comparten entrada): la línea, si alguna lo es, para que se
 * vea su trazo (la previsión "EPS" es una línea en el caudal y barras en la
 * lluvia); si no, la primera.
 */
export function legendSample<S extends { name: string; type: string; legend: boolean }>(
  series: readonly S[],
  entry: S,
): S {
  return (
    series.find(
      (s) => s.legend && s.name === entry.name && (s.type === 'line' || s.type === 'scatter'),
    ) ?? entry
  )
}

/**
 * Título de un eje Y en un panel de `height` px: el completo ("Precipitación
 * (mm/h)") si cabe; si no, solo la unidad ("mm/h"), para no perderla en los
 * paneles bajos; y si tampoco, ninguno (un título cortado es peor que ninguno).
 */
export function fittedAxisTitle(
  axis: { title?: string; unit?: string },
  height: number,
): string | undefined {
  if (axisTitleFits(axis.title, height)) return axis.title
  if (axis.title && axis.unit && axisTitleFits(axis.unit, height)) return axis.unit
  return undefined
}

/**
 * Número de intervalos (≤ `limit`) que divide [min, max] en pasos "redondos"
 * (1, 2, 2,5 o 5 × 10^n); así las marcas son 0, 50, 100... y no 83,33.
 */
export function niceTickCount(min: number, max: number, limit: number): number {
  const range = max - min
  if (!(range > 0)) return Math.max(limit, 1)
  for (let count = limit; count >= 2; count--) {
    const step = range / count
    const magnitude = 10 ** Math.floor(Math.log10(step))
    if ([1, 2, 2.5, 5, 10].some((nice) => Math.abs(step - nice * magnitude) < 1e-9 * magnitude)) {
      return count
    }
  }
  return Math.max(Math.min(limit, 2), 1)
}
