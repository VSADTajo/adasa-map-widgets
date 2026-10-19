import {
  addDays,
  endOfDay,
  isValid,
  parse,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subHours,
  type Locale,
} from 'date-fns'
import type { DateRange, DateRangePresetId } from '@/forms/types/DateRangePickerProps'

/**
 * Inicio del año hidrológico que contiene `date`: el 1 de octubre a las
 * 00:00 (el año hidrológico en España va del 1 de octubre al 30 de septiembre).
 */
export function hydrologicalYearStart(date: Date): Date {
  const year = date.getMonth() >= 9 ? date.getFullYear() : date.getFullYear() - 1
  return new Date(year, 9, 1)
}

/** Periodos predefinidos de `ASDateRangePicker`, a partir del instante actual. */
export const BUILT_IN_PRESETS: Record<DateRangePresetId, (now: Date) => DateRange> = {
  today: (now) => ({ start: startOfDay(now), end: now }),
  last24h: (now) => ({ start: subHours(now, 24), end: now }),
  last7d: (now) => ({ start: subDays(now, 7), end: now }),
  last30d: (now) => ({ start: subDays(now, 30), end: now }),
  hydroYear: (now) => ({ start: hydrologicalYearStart(now), end: now }),
}

/** Recorta un periodo a `[min, max]`. */
export function clampRange(range: DateRange, min?: Date, max?: Date): DateRange {
  let { start, end } = range
  if (min && start < min) start = min
  if (max && end > max) end = max
  if (min && end < min) end = min
  if (max && start > max) start = max
  return { start, end }
}

/** Si un día queda entero fuera de `[min, max]`. */
export function isDayDisabled(day: Date, min?: Date, max?: Date): boolean {
  return Boolean((min && endOfDay(day) < min) || (max && startOfDay(day) > max))
}

/**
 * Las 6 semanas que muestra el calendario para el mes de `month`, empezando
 * en el día de la semana del idioma (lunes en es y en-GB). Siempre 6 filas,
 * para que el calendario no cambie de alto entre meses.
 */
export function calendarWeeks(month: Date, weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6): Date[][] {
  const first = startOfWeek(startOfMonth(month), { weekStartsOn })
  return Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(first, week * 7 + day)),
  )
}

/** Patrón de date-fns con que se escribe y se lee una fecha (localizado: `P` y `p`). */
export function datePattern(withTime: boolean): string {
  return withTime ? 'P p' : 'P'
}

/**
 * Fecha escrita por el usuario, con el formato corto del idioma (en es,
 * `dd/mm/aaaa` y `dd/mm/aaaa hh:mm`; admite un dígito en día, mes y hora).
 * Con `withTime`, también vale sin hora (las 00:00). `null` si no es una fecha.
 */
export function parseDateText(
  text: string,
  withTime: boolean,
  locale: Locale | undefined,
  reference = new Date(),
): Date | null {
  const clean = text.trim().replace(/\s+/g, ' ')
  if (!clean) return null
  const patterns = withTime ? [datePattern(true), datePattern(false)] : [datePattern(false)]
  for (const pattern of patterns) {
    const date = parse(clean, pattern, reference, { locale })
    if (isValid(date) && date.getFullYear() >= 1000) return date
  }
  return null
}
