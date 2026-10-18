import type { ChartLibrary, ChartX } from '@/charts/types/chart'
import type { ResolvedChartSpec } from '@/charts/core/resolveSpec'

/** Eventos que cada motor traduce a los de `ASChart`. */
export interface ChartEngineHandlers {
  onPointClick: (event: { seriesId: string; x: ChartX; y: number | null }) => void
  onXClick: (x: ChartX) => void
  onRangeChange: (event: { start: ChartX; end: ChartX }) => void
}

/** Gráfica ya creada por un motor. */
export interface ChartEngineInstance {
  /** Redibuja con una especificación nueva (datos, tema, idioma...). */
  update: (spec: ResolvedChartSpec) => void
  /** Ajusta al tamaño actual del contenedor. */
  resize: () => void
  dispose: () => void
  /** PNG de la gráfica, como data URL. */
  exportImage: () => Promise<string>
  /** Vuelve al rango X completo tras un zoom. */
  resetZoom: () => void
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

/** Redondea hacia arriba/abajo a un múltiplo de la mitad de su orden de magnitud (212,7 → 250). */
export function niceRound(value: number, direction: 'up' | 'down'): number {
  if (value === 0 || !Number.isFinite(value)) return value
  const step = 10 ** Math.floor(Math.log10(Math.abs(value))) / 2
  return (direction === 'up' ? Math.ceil(value / step) : Math.floor(value / step)) * step
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
