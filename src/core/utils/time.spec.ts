import { describe, expect, it } from 'vitest'
import { nearestTimeIndex } from './time'

const timeline = [0, 1, 2].map((hour) => new Date(2026, 9, 18, hour))

describe('nearestTimeIndex', () => {
  it('devuelve el índice del instante más cercano', () => {
    expect(nearestTimeIndex(timeline, new Date(2026, 9, 18, 1, 20))).toBe(1)
    expect(nearestTimeIndex(timeline, new Date(2026, 9, 18, 1, 40))).toBe(2)
  })

  it('fuera del rango, el extremo más cercano', () => {
    expect(nearestTimeIndex(timeline, new Date(2026, 9, 17))).toBe(0)
    expect(nearestTimeIndex(timeline, new Date(2026, 9, 19))).toBe(2)
  })

  it('acepta milisegundos y devuelve -1 si no hay instantes', () => {
    const millis = timeline.map((date) => date.getTime())
    expect(nearestTimeIndex(millis, millis[2]!)).toBe(2)
    expect(nearestTimeIndex([], new Date())).toBe(-1)
  })
})
