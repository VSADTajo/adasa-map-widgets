import type { HydroPoint } from '@/charts/types/HydrographProps'

/*
 * Conversiones de precipitación, puras y comunes a los tres motores:
 *
 * - mm por intervalo (`'depth'`) ↔ intensidad en mm/h (`'intensity'`);
 * - acumulado (siempre en mm).
 *
 * Convención: el valor de un instante es la lluvia del intervalo que TERMINA
 * en él (lo habitual en los registros SAIH y en las salidas de los modelos).
 * Su duración es el tiempo desde el punto anterior o, si se indica,
 * `intervalMinutes` (útil si la serie tiene huecos). El primer punto no
 * tiene anterior: se usa el intervalo típico de la serie (la mediana).
 */

/** Cómo llegan los valores de una serie, y cómo se muestran en la gráfica. */
export type PrecipitationUnit = 'depth' | 'intensity'

/** Opciones de las conversiones. */
export interface PrecipitationIntervalOptions {
  /**
   * Duración fija de cada intervalo, en minutos (p. ej. 60 para datos
   * horarios). Sin ella, se mide entre puntos consecutivos.
   */
  intervalMinutes?: number
}

const HOUR = 3_600_000

/** Valor válido o `null` (los no numéricos y `NaN` cuentan como hueco). */
const valid = (value: number | null): number | null =>
  value === null || !Number.isFinite(value) ? null : value

/** Puntos ordenados por fecha (las APIs no siempre los devuelven en orden). */
export function sortByTime(points: readonly HydroPoint[]): HydroPoint[] {
  return [...points].sort(([a], [b]) => a.getTime() - b.getTime())
}

/**
 * Duración en horas del intervalo que termina en cada punto (de una serie
 * ya ordenada): la fija, o la distancia al anterior; para el primero, la
 * mediana de las demás (1 h si solo hay un punto).
 */
export function intervalHours(
  points: readonly HydroPoint[],
  { intervalMinutes }: PrecipitationIntervalOptions = {},
): number[] {
  if (intervalMinutes !== undefined && intervalMinutes > 0) {
    return points.map(() => intervalMinutes / 60)
  }
  const gaps = points
    .slice(1)
    .map(([date], index) => (date.getTime() - points[index]![0].getTime()) / HOUR)
  const positive = gaps.filter((gap) => gap > 0).sort((a, b) => a - b)
  const typical = positive.length ? positive[Math.floor((positive.length - 1) / 2)]! : 1
  return [typical, ...gaps.map((gap) => (gap > 0 ? gap : typical))]
}

/** Convierte cada valor con la duración de su intervalo; los negativos pasan a 0. */
function convert(
  points: readonly HydroPoint[],
  options: PrecipitationIntervalOptions,
  apply: (value: number, hours: number) => number,
): HydroPoint[] {
  const sorted = sortByTime(points)
  const hours = intervalHours(sorted, options)
  return sorted.map(([date, value], index) => {
    const v = valid(value)
    return [date, v === null ? null : Math.max(0, apply(v, hours[index]!))]
  })
}

/** mm caídos en cada intervalo → intensidad en mm/h (`mm / horas del intervalo`). */
export function toIntensity(
  points: readonly HydroPoint[],
  options: PrecipitationIntervalOptions = {},
): HydroPoint[] {
  return convert(points, options, (mm, hours) => mm / hours)
}

/** Intensidad en mm/h → mm caídos en cada intervalo (`mm/h × horas del intervalo`). */
export function toDepth(
  points: readonly HydroPoint[],
  options: PrecipitationIntervalOptions = {},
): HydroPoint[] {
  return convert(points, options, (rate, hours) => rate * hours)
}

/**
 * Pasa una serie de la unidad en que llega (`from`) a la que se muestra
 * (`to`). Siempre la ordena y pone a 0 los negativos.
 */
export function convertPrecipitation(
  points: readonly HydroPoint[],
  from: PrecipitationUnit,
  to: PrecipitationUnit,
  options: PrecipitationIntervalOptions = {},
): HydroPoint[] {
  if (from === to) return convert(points, options, (value) => value)
  return from === 'depth' ? toIntensity(points, options) : toDepth(points, options)
}

/** Opciones del acumulado. */
export interface CumulativeOptions {
  /** Empieza a sumar en este instante (los puntos anteriores no cuentan ni se dibujan). */
  from?: Date
  /** Valor inicial: p. ej. el total observado, para que la previsión lo continúe. @default 0 */
  start?: number
}

/**
 * Acumulado (mm) de una serie en mm por intervalo: suma corrida que nunca
 * baja (los negativos cuentan como 0 y los huecos no suman, pero la curva
 * sigue con el último total).
 */
export function toCumulative(
  depths: readonly HydroPoint[],
  { from, start = 0 }: CumulativeOptions = {},
): HydroPoint[] {
  let sum = start
  return sortByTime(depths)
    .filter(([date]) => !from || date.getTime() >= from.getTime())
    .map(([date, value]) => {
      sum += Math.max(0, valid(value) ?? 0)
      return [date, Math.round(sum * 1000) / 1000]
    })
}

/** Total acumulado de una serie de acumulados hasta `until` (incluido); 0 si no hay puntos antes. */
export function cumulativeAt(cumulative: readonly HydroPoint[], until: Date): number {
  let total = 0
  for (const [date, value] of cumulative) {
    if (date.getTime() > until.getTime()) break
    total = value ?? total
  }
  return total
}

/**
 * Agrupa una serie en mm por intervalo a un intervalo común de `minutes`
 * (el Δt de un hietograma clásico): suma los mm de cada intervalo, alineado
 * a la medianoche local (con 60, de hora en hora; con 180, 00:00, 03:00...).
 * Cada valor se asigna al intervalo que lo contiene (el instante marca el
 * final de su lluvia) y el resultado lleva el instante final de cada uno.
 * Los intervalos sin ningún dato no aparecen (hueco); con solo `null`, `null`.
 */
export function aggregateDepth(depths: readonly HydroPoint[], minutes: number): HydroPoint[] {
  if (!(minutes > 0)) return sortByTime(depths)
  const step = minutes * 60_000
  const buckets = new Map<number, number | null>()
  for (const [date, value] of sortByTime(depths)) {
    const midnight = new Date(date)
    midnight.setHours(0, 0, 0, 0)
    const sinceMidnight = date.getTime() - midnight.getTime()
    const end = midnight.getTime() + Math.ceil(sinceMidnight / step) * step
    const v = valid(value)
    const previous = buckets.get(end)
    buckets.set(end, v === null ? (previous ?? null) : (previous ?? 0) + Math.max(0, v))
  }
  return [...buckets].map(([end, value]): HydroPoint => [
    new Date(end),
    value === null ? null : Math.round(value * 1000) / 1000,
  ])
}

/** Intervalo típico de una serie en minutos (la mediana de las distancias entre puntos). */
export function typicalIntervalMinutes(points: readonly HydroPoint[]): number {
  const hours = intervalHours(sortByTime(points))
  return hours.length > 1 ? hours[0]! * 60 : 0
}
