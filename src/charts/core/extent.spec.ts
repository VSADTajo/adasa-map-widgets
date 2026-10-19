import { describe, expect, it } from 'vitest'
import { extent } from './extent'

describe('extent', () => {
  it('mínimo y máximo, saltándose huecos y valores no finitos', () => {
    expect(extent([3, null, -1, undefined, NaN, Infinity, 7])).toEqual([-1, 7])
  })

  it('undefined si no hay ningún número', () => {
    expect(extent([])).toBeUndefined()
    expect(extent([null, NaN])).toBeUndefined()
  })

  it('acepta iterables (generadores) sin crear un array', () => {
    function* values() {
      yield 2
      yield 5
    }
    expect(extent(values())).toEqual([2, 5])
  })

  it('aguanta un millón de valores (Math.min(...valores) desborda la pila)', () => {
    const values = Array.from({ length: 1_000_000 }, (_, i) => i)
    expect(() => Math.min(...values)).toThrow(RangeError)
    expect(extent(values)).toEqual([0, 999_999])
  })
})
