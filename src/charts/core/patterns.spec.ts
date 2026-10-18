// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { contrastRatio } from '@/core/utils/contrast'
import { composite, MODES, surface, token } from '@/core/styles/tokens.fixtures'
import { PATTERN_KINDS, patternColors } from './patterns'
import { resolveSpec } from './resolveSpec'
import { at, fakeLocale, fakeTokens, T0 } from './chart.fixtures'
import type { ChartSeries } from '@/charts/types/chart'

const CATEGORICAL = Array.from({ length: 8 }, (_, i) => `data-cat-${i + 1}`)

/** Contraste entre la trama y el fondo de la tesela, ya pintada sobre la superficie. */
function patternContrast(color: string, opacity: number, backdrop: string): number {
  const { background, stroke } = patternColors(color, opacity, backdrop)
  const fill = composite(background, backdrop)
  return contrastRatio(composite(stroke, fill), fill)
}

describe('patterns: contraste de la trama con su relleno (tokens reales)', () => {
  describe.each(MODES)('modo %s', (mode) => {
    it.each(CATEGORICAL)('en barras (opacas), la trama sobre --as-%s llega a 3:1', (name) => {
      expect(patternContrast(token(name, mode), 1, surface(mode))).toBeGreaterThanOrEqual(3)
    })

    // Áreas y bandas: la trama es del color de la serie sobre un relleno
    // translúcido. Con la opacidad por defecto de las bandas (la más baja,
    // reforzada en oscuro como hace resolveSpec), sigue llegando a 2:1: la
    // trama se ve, aunque no es la única pista (la leyenda nombra la serie).
    it.each(CATEGORICAL)('en bandas (translúcidas), la trama sobre --as-%s llega a 2:1', (name) => {
      const opacity = mode === 'dark' ? 0.2 * 1.6 : 0.2
      expect(patternContrast(token(name, mode), opacity, surface(mode))).toBeGreaterThanOrEqual(2)
    })
  })
})

describe('patterns en resolveSpec', () => {
  const series = (type: ChartSeries['type'], id: string): ChartSeries => ({
    id,
    name: id,
    type,
    data: type === 'range' ? [[at(0), 1, 2]] : [[at(0), 1]],
  })
  const all = [
    series('line', 'l'),
    series('bar', 'b1'),
    series('area', 'a'),
    series('range', 'r'),
    series('bar', 'b2'),
  ]
  const resolve = (patterns?: boolean) =>
    resolveSpec({ series: all, patterns }, fakeTokens(), fakeLocale, () => T0).series

  it('sin `patterns`, ninguna serie lleva trama', () => {
    expect(resolve().every((s) => s.pattern === undefined)).toBe(true)
  })

  it('con `patterns`, cada serie rellena lleva una trama distinta, en orden; las líneas, ninguna', () => {
    const resolved = resolve(true)
    expect(resolved.map((s) => s.pattern?.kind)).toEqual([undefined, ...PATTERN_KINDS.slice(0, 4)])
  })

  it('barras: trama del color de la superficie; bandas: del color de la serie', () => {
    const [, bar, , band] = resolve(true)
    expect(bar!.pattern).toMatchObject({ stroke: '#ffffff' })
    expect(band!.pattern).toMatchObject({ stroke: band!.color })
  })
})
