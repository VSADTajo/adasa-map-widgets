import { describe, expect, it } from 'vitest'
import { enGB, es } from 'date-fns/locale'
import { formatDate, formatDuration, formatNumber, formatUnit, MISSING_VALUE } from './format'

/** Espacio duro (U+00A0) que separa número y unidad. */
const NBSP = ' '
const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

// Fechas en hora local: los formateadores también trabajan en hora local.
const OCT_18_0605 = new Date(2026, 9, 18, 6, 5)

describe('formatNumber', () => {
  it('usa coma decimal y punto de miles en español', () => {
    expect(formatNumber(12345.678)).toBe('12.345,68')
  })

  it('en español no agrupa los números de 4 cifras (norma CLDR)', () => {
    expect(formatNumber(1234.5)).toBe('1234,5')
  })

  it('usa el locale indicado', () => {
    expect(formatNumber(12345.678, { locale: 'en-GB' })).toBe('12,345.68')
  })

  it('acepta opciones de Intl.NumberFormat', () => {
    expect(formatNumber(3, { minimumFractionDigits: 2 })).toBe('3,00')
  })

  it.each([null, undefined, Number.NaN])('pinta %s como valor ausente', (value) => {
    expect(formatNumber(value)).toBe(MISSING_VALUE)
  })
})

describe('formatDate', () => {
  it.each([
    ['date', '18/10/2026'],
    ['dateMedium', '18 oct 2026'],
    ['time', '06:05'],
    ['datetime', '18/10/2026, 06:05'],
    ['dayMonth', '18/10'],
    ['weekday', 'domingo'],
    ['monthYear', 'octubre de 2026'],
  ] as const)('el preset %s en español da "%s"', (preset, expected) => {
    expect(formatDate(OCT_18_0605, preset)).toBe(expected)
  })

  it('por defecto usa el preset datetime', () => {
    expect(formatDate(OCT_18_0605)).toBe('18/10/2026, 06:05')
  })

  it('traduce los presets con el locale indicado', () => {
    expect(formatDate(OCT_18_0605, 'weekday', { locale: 'en-GB' })).toBe('Sunday')
  })

  it('acepta opciones de Intl.DateTimeFormat', () => {
    expect(formatDate(OCT_18_0605, { hour: '2-digit', hourCycle: 'h23' })).toBe('06')
  })

  it('aplica la zona horaria indicada', () => {
    const utcMidnight = Date.UTC(2026, 9, 18, 0, 0)
    expect(formatDate(utcMidnight, 'time', { timeZone: 'UTC' })).toBe('00:00')
    expect(formatDate(utcMidnight, 'time', { timeZone: 'Europe/Madrid' })).toBe('02:00')
  })

  it('formatea patrones de date-fns con su locale', () => {
    expect(formatDate(OCT_18_0605, { pattern: 'd MMM yyyy' }, { dateFnsLocale: es })).toBe(
      '18 oct 2026',
    )
    expect(formatDate(OCT_18_0605, { pattern: 'd MMM yyyy' }, { dateFnsLocale: enGB })).toBe(
      '18 Oct 2026',
    )
  })

  it('acepta un timestamp numérico', () => {
    expect(formatDate(OCT_18_0605.getTime(), 'date')).toBe('18/10/2026')
  })

  it.each([null, undefined, new Date('no es una fecha')])(
    'pinta %s como valor ausente',
    (value) => {
      expect(formatDate(value)).toBe(MISSING_VALUE)
    },
  )
})

describe('formatDuration', () => {
  it.each([
    [90 * MINUTE, '1 h 30 min'],
    [2 * HOUR, '2 h'],
    [45 * MINUTE, '45 min'],
    [3 * DAY + 4 * HOUR, '3 d 4 h'],
    [0, '0 min'],
  ])('%i ms → "%s"', (milliseconds, expected) => {
    expect(formatDuration(milliseconds)).toBe(expected)
  })

  it('muestra como mucho las 2 unidades mayores y redondea la última', () => {
    // 1 d 5 h 40 min → 1 d 6 h
    expect(formatDuration(DAY + 5 * HOUR + 40 * MINUTE)).toBe('1 d 6 h')
  })

  it('permite más unidades con maxUnits', () => {
    expect(formatDuration(DAY + 5 * HOUR + 40 * MINUTE, { maxUnits: 3 })).toBe('1 d 5 h 40 min')
  })

  it('redondea por debajo de la unidad más pequeña', () => {
    expect(formatDuration(89_000)).toBe('1 min')
    expect(formatDuration(89_000, { smallestUnit: 'second' })).toBe('1 min 29 s')
  })

  it('en estilo largo escribe las unidades y une con "y"', () => {
    expect(formatDuration(90 * MINUTE, { style: 'long' })).toBe('1 hora y 30 minutos')
  })

  it('traduce con el locale indicado', () => {
    expect(formatDuration(90 * MINUTE, { style: 'long', locale: 'en-GB' })).toBe(
      '1 hour and 30 minutes',
    )
  })

  it('conserva el signo de las duraciones negativas', () => {
    expect(formatDuration(-2 * HOUR)).toBe('-2 h')
  })

  it.each([null, undefined, Number.NaN])('pinta %s como valor ausente', (value) => {
    expect(formatDuration(value)).toBe(MISSING_VALUE)
  })
})

describe('formatUnit', () => {
  it.each([
    [12.345, 'm³/s', `12,35${NBSP}m³/s`],
    [3.25, 'mm', `3,3${NBSP}mm`],
    [1234.567, 'hm³', `1234,57${NBSP}hm³`],
    [2.5, 'm', `2,5${NBSP}m`],
  ])('%f %s → "%s" (decimales propios de cada unidad)', (value, unit, expected) => {
    expect(formatUnit(value, unit)).toBe(expected)
  })

  it('recibe % en puntos porcentuales y respeta el espaciado del locale', () => {
    expect(formatUnit(45.4, '%')).toBe(`45${NBSP}%`)
    expect(formatUnit(45.4, '%', { locale: 'en-GB' })).toBe('45%')
  })

  it('formatea °C con el espaciado del locale', () => {
    expect(formatUnit(12.34, '°C')).toBe(`12,3${NBSP}°C`)
    expect(formatUnit(12.34, '°C', { locale: 'en-GB' })).toBe('12.3°C')
  })

  it('pinta una unidad desconocida tal cual tras el número', () => {
    expect(formatUnit(7, 'l/s')).toBe(`7${NBSP}l/s`)
  })

  it('permite cambiar los decimales', () => {
    expect(formatUnit(12.3, 'm³/s', { minimumFractionDigits: 2 })).toBe(`12,30${NBSP}m³/s`)
  })

  it('usa el separador decimal del locale', () => {
    expect(formatUnit(12.345, 'm³/s', { locale: 'en-GB' })).toBe(`12.35${NBSP}m³/s`)
  })

  it.each([null, undefined, Number.NaN])('pinta %s como valor ausente', (value) => {
    expect(formatUnit(value, 'mm')).toBe(MISSING_VALUE)
  })
})
