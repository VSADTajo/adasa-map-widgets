import { describe, expect, it } from 'vitest'
import { enGB, es } from 'date-fns/locale'
import {
  BUILT_IN_PRESETS,
  calendarWeeks,
  clampRange,
  hydrologicalYearStart,
  isDayDisabled,
  parseDateText,
} from './dates'

const d = (year: number, month: number, day: number, h = 0, m = 0) =>
  new Date(year, month - 1, day, h, m)

describe('hydrologicalYearStart', () => {
  it.each([
    [d(2026, 10, 1), d(2026, 10, 1)],
    [d(2026, 10, 18, 12), d(2026, 10, 1)],
    [d(2026, 12, 31), d(2026, 10, 1)],
    [d(2027, 1, 1), d(2026, 10, 1)],
    [d(2027, 9, 30, 23, 59), d(2026, 10, 1)],
  ])('%s → %s (el año hidrológico empieza el 1 de octubre)', (date, start) => {
    expect(hydrologicalYearStart(date)).toEqual(start)
  })
})

describe('BUILT_IN_PRESETS', () => {
  const now = d(2026, 10, 18, 10, 30)

  it.each([
    ['today', d(2026, 10, 18)],
    ['last24h', d(2026, 10, 17, 10, 30)],
    ['last7d', d(2026, 10, 11, 10, 30)],
    ['last30d', d(2026, 9, 18, 10, 30)],
    ['hydroYear', d(2026, 10, 1)],
  ] as const)('%s empieza en %s y acaba ahora', (id, start) => {
    expect(BUILT_IN_PRESETS[id](now)).toEqual({ start, end: now })
  })
})

describe('clampRange', () => {
  const range = { start: d(2026, 1, 1), end: d(2026, 12, 31) }

  it('recorta a min y max', () => {
    expect(clampRange(range, d(2026, 3, 1), d(2026, 6, 1))).toEqual({
      start: d(2026, 3, 1),
      end: d(2026, 6, 1),
    })
  })

  it('sin límites, el periodo queda igual', () => {
    expect(clampRange(range)).toEqual(range)
  })

  it('un periodo entero fuera queda reducido al límite', () => {
    expect(clampRange(range, d(2027, 1, 1))).toEqual({ start: d(2027, 1, 1), end: d(2027, 1, 1) })
  })
})

describe('isDayDisabled', () => {
  it('un día cuenta entero: el de min vale aunque min tenga hora', () => {
    const min = d(2026, 10, 5, 18)
    expect(isDayDisabled(d(2026, 10, 5), min)).toBe(false)
    expect(isDayDisabled(d(2026, 10, 4), min)).toBe(true)
    const max = d(2026, 10, 5, 6)
    expect(isDayDisabled(d(2026, 10, 5), undefined, max)).toBe(false)
    expect(isDayDisabled(d(2026, 10, 6), undefined, max)).toBe(true)
  })
})

describe('calendarWeeks', () => {
  it('6 semanas de 7 días, empezando en lunes', () => {
    const weeks = calendarWeeks(d(2026, 10, 18), 1)
    expect(weeks).toHaveLength(6)
    expect(weeks.every((week) => week.length === 7)).toBe(true)
    // El 1 de octubre de 2026 es jueves: la rejilla empieza el lunes 28 de septiembre.
    expect(weeks[0]![0]).toEqual(d(2026, 9, 28))
    expect(weeks[0]![3]).toEqual(d(2026, 10, 1))
  })

  it('con la semana en domingo, empieza en domingo', () => {
    expect(calendarWeeks(d(2026, 10, 18), 0)[0]![0]).toEqual(d(2026, 9, 27))
  })
})

describe('parseDateText', () => {
  it.each([
    ['05/10/2026', d(2026, 10, 5)],
    ['5/10/2026', d(2026, 10, 5)],
    [' 05/10/2026 ', d(2026, 10, 5)],
  ])('es: %j → %s', (text, date) => {
    expect(parseDateText(text, false, es)).toEqual(date)
  })

  it.each(['', 'ayer', '32/10/2026', '05/13/2026', '05/10/26'])('%j no es una fecha', (text) => {
    expect(parseDateText(text, false, es)).toBeNull()
  })

  it('con hora: dd/mm/aaaa hh:mm, o solo el día (a las 00:00)', () => {
    expect(parseDateText('05/10/2026 7:05', true, es)).toEqual(d(2026, 10, 5, 7, 5))
    expect(parseDateText('05/10/2026', true, es)).toEqual(d(2026, 10, 5))
    expect(parseDateText('05/10/2026 25:00', true, es)).toBeNull()
  })

  it('en-GB también es día/mes/año', () => {
    expect(parseDateText('05/10/2026', false, enGB)).toEqual(d(2026, 10, 5))
  })
})
