import { afterEach, describe, expect, it, vi } from 'vitest'
import { drawPattern, PATTERN_KINDS, patternDataUrl, patternTile } from './patterns'
import { fakeContext, mockCanvas, noCanvas } from '@/charts/engines/engines.fixtures'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const colors = { background: 'rgba(0, 0, 255, 1)', stroke: '#ffffff' }

describe('drawPattern', () => {
  it.each(PATTERN_KINDS)('"%s" pinta el fondo y luego la trama', (kind) => {
    const ctx = fakeContext()
    drawPattern(ctx, kind, colors)
    expect(ctx.calls.slice(0, 2)).toEqual(['clearRect(4)', 'fillRect(4)'])
    expect(ctx.calls.length).toBeGreaterThan(2)
    expect(ctx.strokeStyle).toBe('#ffffff')
  })

  it('las diagonales se dibujan con sus trozos de esquina, para que la tesela case', () => {
    const ctx = fakeContext()
    drawPattern(ctx, 'diagonal', colors)
    expect(ctx.calls.filter((call) => call === 'stroke(0)')).toHaveLength(3)
  })

  it('los puntos son un círculo relleno', () => {
    const ctx = fakeContext()
    drawPattern(ctx, 'dots', colors)
    expect(ctx.calls).toContain('arc(5)')
    expect(ctx.calls).toContain('fill(0)')
  })
})

describe('patternTile', () => {
  it('dibuja la tesela escalada y la reutiliza', () => {
    mockCanvas()
    const tile = patternTile('grid', { ...colors, stroke: '#010101' }, 2)
    expect(tile).toBeInstanceOf(HTMLCanvasElement)
    expect(tile!.width).toBe(20)
    expect(patternTile('grid', { ...colors, stroke: '#010101' }, 2)).toBe(tile)
  })

  it('sin canvas devuelve null (y el motor rellena con el color liso)', () => {
    noCanvas()
    expect(patternTile('vertical', { ...colors, stroke: '#020202' })).toBeNull()
    expect(patternDataUrl('vertical', { ...colors, stroke: '#020202' })).toBeNull()
  })

  it('si crear el canvas falla, también null', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => {
      throw new Error('sin canvas')
    })
    expect(patternTile('horizontal', { ...colors, stroke: '#030303' })).toBeNull()
  })

  it('patternDataUrl devuelve la tesela como PNG', () => {
    mockCanvas()
    expect(patternDataUrl('dots', { ...colors, stroke: '#040404' })).toBe(
      'data:image/png;base64,AAA',
    )
  })
})
