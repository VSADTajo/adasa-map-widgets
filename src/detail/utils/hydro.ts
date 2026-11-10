import { startOfDay } from 'date-fns'
import type { AlertLevel } from '@/core/types/theme'
import type {
  AlertThresholds,
  ExceedanceSegment,
  ExceededLevel,
  IntervalAggregate,
  SeriesSummary,
  TimePoint,
} from '@/detail/types/hydro'

/** Niveles de aviso de menor a mayor gravedad. */
export const ALERT_LEVELS: AlertLevel[] = ['normal', 'amarillo', 'naranja', 'rojo']

/** Niveles superables, de mayor a menor gravedad (el orden en que se comprueban y se listan). */
export const EXCEEDED_LEVELS: ExceededLevel[] = ['rojo', 'naranja', 'amarillo']

/**
 * Nivel de aviso de un valor: el más alto cuyo umbral alcanza (umbral
 * incluido). Sin valor o sin umbrales, `normal`.
 */
export function alertLevelOf(
  value: number | null | undefined,
  thresholds: AlertThresholds | undefined,
): AlertLevel {
  if (value == null || !Number.isFinite(value) || !thresholds) return 'normal'
  for (const level of EXCEEDED_LEVELS) {
    const threshold = thresholds[level]
    if (threshold != null && value >= threshold) return level
  }
  return 'normal'
}

/** El más grave de varios niveles. */
export function worstLevel(levels: AlertLevel[]): AlertLevel {
  return levels.reduce<AlertLevel>(
    (worst, level) => (ALERT_LEVELS.indexOf(level) > ALERT_LEVELS.indexOf(worst) ? level : worst),
    'normal',
  )
}

/** Puntos con dato, ordenados por fecha. */
export function validPoints(data: TimePoint[]): [Date, number][] {
  return data
    .filter((point): point is [Date, number] => point[1] != null && Number.isFinite(point[1]))
    .sort((a, b) => +a[0] - +b[0])
}

/**
 * Último valor, máximo y mínimo de una serie. Si el máximo (o el mínimo) se
 * repite, cuenta el primero.
 */
export function summarizeSeries(data: TimePoint[]): SeriesSummary {
  const points = validPoints(data)
  let max: [Date, number] | null = null
  let min: [Date, number] | null = null
  for (const point of points) {
    if (!max || point[1] > max[1]) max = point
    if (!min || point[1] < min[1]) min = point
  }
  return { last: points[points.length - 1] ?? null, max, min, count: points.length }
}

/**
 * Tramos de valores seguidos en un mismo nivel de aviso (sin contar
 * `normal`): un tramo acaba cuando el nivel cambia o la serie vuelve a
 * normal. Los huecos (`null`) no cortan un tramo.
 */
export function exceedanceSegments(
  data: TimePoint[],
  thresholds: AlertThresholds | undefined,
): ExceedanceSegment[] {
  const segments: ExceedanceSegment[] = []
  let current: ExceedanceSegment | null = null
  for (const [date, value] of validPoints(data)) {
    const level = alertLevelOf(value, thresholds)
    if (level === 'normal') {
      current = null
    } else if (current && current.level === level) {
      current.end = date
      current.peak = Math.max(current.peak, value)
    } else {
      current = { level, start: date, end: date, peak: value }
      segments.push(current)
    }
  }
  return segments
}

/**
 * Inicio del intervalo de `intervalMs` que contiene `date`. Si el intervalo
 * divide el día (1, 3, 6, 12 h...), se cuenta desde las 00:00 locales; si
 * no, desde el origen de tiempos.
 */
export function intervalStart(date: Date, intervalMs: number): Date {
  const day = 24 * 3_600_000
  if (intervalMs <= day && day % intervalMs === 0) {
    const midnight = startOfDay(date)
    return new Date(+midnight + Math.floor((+date - +midnight) / intervalMs) * intervalMs)
  }
  return new Date(Math.floor(+date / intervalMs) * intervalMs)
}

/** Mínimo, media y máximo de cada intervalo con datos, en orden. */
export function aggregateByInterval(data: TimePoint[], intervalMs: number): IntervalAggregate[] {
  const groups = new Map<number, number[]>()
  for (const [date, value] of validPoints(data)) {
    const key = +intervalStart(date, intervalMs)
    const values = groups.get(key) ?? []
    values.push(value)
    groups.set(key, values)
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([start, values]) => {
      let min = Infinity
      let max = -Infinity
      let sum = 0
      for (const value of values) {
        min = Math.min(min, value)
        max = Math.max(max, value)
        sum += value
      }
      return { start: new Date(start), min, max, mean: sum / values.length, count: values.length }
    })
}

/** Si hay algún umbral definido. */
export function hasThresholds(thresholds: AlertThresholds | undefined): boolean {
  return EXCEEDED_LEVELS.some((level) => thresholds?.[level] != null)
}
