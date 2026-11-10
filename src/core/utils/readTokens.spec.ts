import { afterEach, describe, expect, it, vi } from 'vitest'
import { readTokens } from './readTokens'

/**
 * jsdom no resuelve `var()` ni `light-dark()`, así que se simula
 * `getComputedStyle`: las variables definidas devuelven un valor ficticio y
 * la sonda devuelve `resuelto(<lo que se le asignó>)`, para comprobar qué
 * token se lee y por qué vía.
 */
function mockComputedStyle(missing: string[] = []) {
  vi.spyOn(window, 'getComputedStyle').mockImplementation((element) => {
    const style = (element as HTMLElement).style
    return {
      getPropertyValue: (name: string) =>
        missing.includes(name) ? '' : name.startsWith('--as-z-') ? '1000' : 'definido',
      get color() {
        return `resuelto(${style.color})`
      },
      get boxShadow() {
        return `resuelto(${style.boxShadow})`
      },
      get paddingLeft() {
        return `resuelto(${style.paddingLeft})`
      },
    } as unknown as CSSStyleDeclaration
  })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('readTokens', () => {
  it('resuelve los colores a través de una sonda dentro del elemento', () => {
    mockComputedStyle()
    const tokens = readTokens()
    expect(tokens.colorPrimary).toBe('resuelto(var(--as-color-primary))')
    expect(tokens.data.categorical[0]).toBe('resuelto(var(--as-data-cat-1))')
    expect(tokens.alert.rojo).toEqual({
      fill: 'resuelto(var(--as-alert-rojo))',
      text: 'resuelto(var(--as-alert-rojo-text))',
      strong: 'resuelto(var(--as-alert-rojo-strong))',
    })
  })

  it('resuelve espaciados como longitud y sombras como box-shadow', () => {
    mockComputedStyle()
    const tokens = readTokens()
    expect(tokens.space[4]).toBe('resuelto(var(--as-space-4))')
    expect(tokens.shadows.lg).toBe('resuelto(var(--as-shadow-lg))')
  })

  it('devuelve las paletas completas y en orden', () => {
    mockComputedStyle()
    const { data } = readTokens()
    expect(data.categorical).toHaveLength(8)
    expect(data.sequential).toHaveLength(13)
    expect(data.sequential[0]).toContain('--as-data-seq-100')
    expect(data.sequential[12]).toContain('--as-data-seq-700')
    expect(data.diverging.map((c) => /data-div-([\w-]+)/.exec(c)?.[1])).toEqual([
      'cool-3',
      'cool-2',
      'cool-1',
      'mid',
      'warm-1',
      'warm-2',
      'warm-3',
    ])
  })

  it('lee los z-index como números', () => {
    mockComputedStyle()
    expect(readTokens().zIndex.modal).toBe(1000)
  })

  it('devuelve cadena vacía (y NaN en z-index) si el token no está definido', () => {
    mockComputedStyle(['--as-data-cat-1', '--as-z-modal'])
    const tokens = readTokens()
    expect(tokens.data.categorical[0]).toBe('')
    expect(tokens.zIndex.modal).toBeNaN()
  })

  it('lee dentro del elemento indicado y no deja la sonda en el DOM', () => {
    mockComputedStyle()
    const container = document.createElement('div')
    document.body.appendChild(container)
    readTokens(container)
    expect(container.children).toHaveLength(0)
  })
})
