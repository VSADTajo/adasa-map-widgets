import { format as formatWithPattern, type Locale as DateFnsLocale } from 'date-fns'

/**
 * Formateadores de números, fechas, duraciones y magnitudes con unidad,
 * compartidos por todos los componentes. Son funciones puras con el locale
 * explícito; dentro de un componente, usa las versiones ya ligadas al
 * idioma activo de `useLocale()`.
 */

/** Texto para un valor ausente (`null`, `undefined` o `NaN`). */
export const MISSING_VALUE = '—'

/** Espacio duro: une número y unidad para que nunca se separen en dos líneas. */
const NBSP = ' '

function isMissing(value: number | null | undefined): value is null | undefined {
  return value === null || value === undefined || Number.isNaN(value)
}

/**
 * Formateadores de Intl reutilizados por idioma y opciones. Crear un
 * `Intl.NumberFormat` cuesta mucho más que usarlo: sin caché, exportar el
 * CSV de 500 000 valores o dibujar miles de etiquetas se nota (ver
 * docs/rendimiento-graficas.md).
 */
const formatters = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat>()

function cached<T extends Intl.NumberFormat | Intl.DateTimeFormat>(
  kind: 'number' | 'date',
  locale: string,
  options: object,
  create: () => T,
): T {
  const key = `${kind}|${locale}|${JSON.stringify(options)}`
  let formatter = formatters.get(key) as T | undefined
  if (!formatter) {
    formatter = create()
    formatters.set(key, formatter)
  }
  return formatter
}

const numberFormat = (locale: string, options: Intl.NumberFormatOptions) =>
  cached('number', locale, options, () => new Intl.NumberFormat(locale, options))

export interface FormatNumberOptions extends Intl.NumberFormatOptions {
  /** Etiqueta BCP 47 (p. ej. `'es-ES'`). @default 'es-ES' */
  locale?: string
}

/**
 * Número con los separadores del locale. `null`/`NaN` → `'—'`.
 *
 * Ojo: en español (CLDR) los números de 4 cifras no llevan separador de
 * miles (`1234`), y a partir de 5 sí (`12.345`). Es la norma, no un fallo.
 */
export function formatNumber(
  value: number | null | undefined,
  { locale = 'es-ES', ...options }: FormatNumberOptions = {},
): string {
  if (isMissing(value)) return MISSING_VALUE
  return numberFormat(locale, { maximumFractionDigits: 2, ...options }).format(value)
}

/** Formatos de fecha predefinidos (Intl). */
export type DatePreset =
  /** 18/10/2026 */
  | 'date'
  /** 18 oct 2026 */
  | 'dateMedium'
  /** 06:00 */
  | 'time'
  /** 18/10/2026, 06:00 */
  | 'datetime'
  /** 18 oct, 06:00 */
  | 'datetimeShort'
  /** 18/10 */
  | 'dayMonth'
  /** domingo */
  | 'weekday'
  /** octubre de 2026 */
  | 'monthYear'

const DATE_PRESETS: Record<DatePreset, Intl.DateTimeFormatOptions> = {
  date: { day: '2-digit', month: '2-digit', year: 'numeric' },
  dateMedium: { day: 'numeric', month: 'short', year: 'numeric' },
  time: { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' },
  datetime: {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  },
  datetimeShort: {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  },
  dayMonth: { day: '2-digit', month: '2-digit' },
  weekday: { weekday: 'long' },
  monthYear: { month: 'long', year: 'numeric' },
}

/**
 * Cómo formatear una fecha: un preset, opciones de `Intl.DateTimeFormat`, o
 * un patrón de date-fns (`{ pattern: 'd MMM yyyy' }`).
 */
export type DateFormat = DatePreset | Intl.DateTimeFormatOptions | { pattern: string }

export interface FormatDateOptions {
  /** Etiqueta BCP 47 para Intl. @default 'es-ES' */
  locale?: string
  /** Locale de date-fns, solo para `{ pattern }` (nombres de mes y día). */
  dateFnsLocale?: DateFnsLocale
  /** Zona horaria IANA (p. ej. `'UTC'`), solo para presets y opciones de Intl. */
  timeZone?: string
}

/** Fecha según un preset, opciones de Intl o un patrón de date-fns. Fecha inválida/ausente → `'—'`. */
export function formatDate(
  date: Date | number | null | undefined,
  dateFormat: DateFormat = 'datetime',
  { locale = 'es-ES', dateFnsLocale, timeZone }: FormatDateOptions = {},
): string {
  if (date === null || date === undefined) return MISSING_VALUE
  const value = typeof date === 'number' ? new Date(date) : date
  if (Number.isNaN(value.getTime())) return MISSING_VALUE

  if (typeof dateFormat === 'object' && 'pattern' in dateFormat) {
    return formatWithPattern(value, dateFormat.pattern, { locale: dateFnsLocale })
  }
  const options = typeof dateFormat === 'string' ? DATE_PRESETS[dateFormat] : dateFormat
  const dateOptions = { ...options, timeZone }
  return cached(
    'date',
    locale,
    dateOptions,
    () => new Intl.DateTimeFormat(locale, dateOptions),
  ).format(value)
}

type DurationUnit = 'day' | 'hour' | 'minute' | 'second'

const DURATION_UNITS: [DurationUnit, number][] = [
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
  ['second', 1000],
]

export interface FormatDurationOptions {
  /** Etiqueta BCP 47. @default 'es-ES' */
  locale?: string
  /** `'short'`: "2 h 30 min"; `'long'`: "2 horas y 30 minutos". @default 'short' */
  style?: 'short' | 'long'
  /** Cuántas unidades mostrar como máximo, empezando por la mayor no nula. @default 2 */
  maxUnits?: number
  /** Unidad más pequeña a mostrar; lo que quede por debajo se redondea. @default 'minute' */
  smallestUnit?: DurationUnit
}

/**
 * Duración legible a partir de milisegundos: `5_400_000` → "1 h 30 min".
 * Se queda con las `maxUnits` unidades mayores no nulas y redondea la última.
 */
export function formatDuration(
  milliseconds: number | null | undefined,
  {
    locale = 'es-ES',
    style = 'short',
    maxUnits = 2,
    smallestUnit = 'minute',
  }: FormatDurationOptions = {},
): string {
  if (isMissing(milliseconds)) return MISSING_VALUE
  const sign = milliseconds < 0 ? '-' : ''
  const units = DURATION_UNITS.slice(
    0,
    DURATION_UNITS.findIndex(([unit]) => unit === smallestUnit) + 1,
  )
  const smallestMs = units.at(-1)![1]
  let remaining = Math.round(Math.abs(milliseconds) / smallestMs) * smallestMs

  const parts: [DurationUnit, number][] = []
  for (const [unit, unitMs] of units) {
    const amount = Math.floor(remaining / unitMs)
    if (amount > 0 || parts.length > 0) parts.push([unit, amount])
    remaining -= amount * unitMs
  }
  // Quedarse con las `maxUnits` mayores (desde la primera no nula), redondeando la última.
  let shown = parts.slice(0, maxUnits)
  if (parts.length > maxUnits) {
    const [lastUnit, lastAmount] = shown.at(-1)!
    const lastMs = units.find(([unit]) => unit === lastUnit)![1]
    const rest = parts
      .slice(maxUnits)
      .reduce((sum, [unit, amount]) => sum + amount * units.find(([u]) => u === unit)![1], 0)
    shown[shown.length - 1] = [lastUnit, lastAmount + Math.round(rest / lastMs)]
  }
  shown = shown.filter(([, amount]) => amount > 0)
  if (shown.length === 0) shown = [[smallestUnit, 0]]

  const texts = shown.map(([unit, amount]) =>
    new Intl.NumberFormat(locale, {
      style: 'unit',
      unit,
      unitDisplay: style === 'long' ? 'long' : 'short',
    }).format(amount),
  )
  const joined =
    style === 'long'
      ? new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(texts)
      : texts.join(' ')
  return sign + joined
}

/** Unidades de magnitud con formato conocido. Cualquier otro texto se pinta tal cual tras el número. */
export type MeasureUnit = 'm³/s' | 'mm' | 'mm/h' | 'hm³' | 'm' | '%' | '°C'

/** Decimales por defecto de cada unidad: los habituales en hidrología y meteorología. */
const UNIT_DECIMALS: Record<MeasureUnit, number> = {
  'm³/s': 2,
  mm: 1,
  'mm/h': 1,
  'hm³': 2,
  m: 2,
  '%': 0,
  '°C': 1,
}

export type FormatUnitOptions = FormatNumberOptions

/**
 * Magnitud con su unidad, con espacio duro entre ambos: `12.4, 'm³/s'` →
 * "12,4 m³/s". `'%'` recibe el valor en puntos porcentuales (45 → "45 %") y
 * respeta el espaciado del locale (en inglés, "45%"); `'°C'` también.
 */
export function formatUnit(
  value: number | null | undefined,
  unit: MeasureUnit | (string & {}),
  { locale = 'es-ES', ...options }: FormatUnitOptions = {},
): string {
  if (isMissing(value)) return MISSING_VALUE
  const decimals = UNIT_DECIMALS[unit as MeasureUnit] ?? 2
  const numberOptions = { maximumFractionDigits: decimals, ...options }

  if (unit === '%') {
    return numberFormat(locale, { ...numberOptions, style: 'percent' }).format(value / 100)
  }
  if (unit === '°C') {
    // Intl separa con un espacio normal en algunos locales: se cambia por uno
    // duro para que número y unidad no se partan en dos líneas.
    return numberFormat(locale, { ...numberOptions, style: 'unit', unit: 'celsius' })
      .format(value)
      .replace(/ /g, NBSP)
  }
  return `${formatNumber(value, { locale, ...numberOptions })}${NBSP}${unit}`
}
