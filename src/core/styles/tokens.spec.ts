// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { contrastRatio, parseColor } from '@/core/utils/contrast'

// Con fs y no con `?raw`: Vitest vacía los .css importados aunque sea en crudo.
const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf-8')

type Mode = 'light' | 'dark'

/** `--as-x: valor;` de tokens.css, sin comentarios. */
const declarations = new Map(
  [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/--as-([\w-]+):\s*([^;]+);/g)].map((m) => [
    m[1]!,
    m[2]!.trim(),
  ]),
)

/** Valor de un token de color en un modo, resolviendo `light-dark(a, b)`. */
function token(name: string, mode: Mode): string {
  const value = declarations.get(name)
  if (!value) throw new Error(`No existe --as-${name}`)
  if (!value.startsWith('light-dark(')) return value
  // Separa por la coma de primer nivel: los valores pueden ser `rgba(a, b, c, d)`.
  const args = value.slice('light-dark('.length, -1)
  let depth = 0
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '(') depth++
    else if (args[i] === ')') depth--
    else if (args[i] === ',' && depth === 0) {
      return (mode === 'light' ? args.slice(0, i) : args.slice(i + 1)).trim()
    }
  }
  throw new Error(`light-dark() mal formado en --as-${name}`)
}

/** Color resultante de pintar `color` (hex o rgba con alfa) encima de `backdrop` (opaco). */
function composite(color: string, backdrop: string): string {
  const alpha = Number(/rgba\([^)]*,\s*([\d.]+)\s*\)/.exec(color)?.[1] ?? 1)
  const [fg, bg] = [parseColor(color), parseColor(backdrop)]
  return `rgb(${fg.map((c, i) => Math.round(alpha * c + (1 - alpha) * bg[i]!)).join(', ')})`
}

const MODES: Mode[] = ['light', 'dark']
const surface = (mode: Mode) => token('color-surface', mode)
const ALERTS = ['normal', 'amarillo', 'naranja', 'rojo']

describe('tokens.css: contraste WCAG 2.1 AA contra --as-color-surface', () => {
  describe.each(MODES)('modo %s', (mode) => {
    it.each(['color-text', 'color-text-muted', 'color-primary', 'color-danger'])(
      'el texto --as-%s llega a 4.5:1',
      (name) => {
        expect(contrastRatio(token(name, mode), surface(mode))).toBeGreaterThanOrEqual(4.5)
      },
    )

    it.each(Array.from({ length: 8 }, (_, i) => `data-cat-${i + 1}`))(
      'la marca categórica --as-%s llega a 3:1',
      (name) => {
        expect(contrastRatio(token(name, mode), surface(mode))).toBeGreaterThanOrEqual(3)
      },
    )

    it.each(['data-seq-700', 'data-div-cool-3', 'data-div-warm-3'])(
      'el extremo --as-%s llega a 3:1',
      (name) => {
        expect(contrastRatio(token(name, mode), surface(mode))).toBeGreaterThanOrEqual(3)
      },
    )

    it.each(ALERTS)('la variante strong del aviso %s llega a 3:1', (level) => {
      expect(
        contrastRatio(token(`alert-${level}-strong`, mode), surface(mode)),
      ).toBeGreaterThanOrEqual(3)
    })

    it.each(ALERTS)('el texto sobre el relleno del aviso %s llega a 4.5:1', (level) => {
      expect(
        contrastRatio(token(`alert-${level}-text`, mode), token(`alert-${level}`, mode)),
      ).toBeGreaterThanOrEqual(4.5)
    })

    it.each(['overlay-text', 'overlay-text-muted'])(
      'el texto --as-%s llega a 4.5:1 sobre el overlay, con el mapa más oscuro o más claro debajo',
      (name) => {
        for (const backdrop of ['#000000', '#ffffff']) {
          const background = composite(token('overlay-bg', mode), backdrop)
          const text = composite(token(name, mode), background)
          expect(contrastRatio(text, background)).toBeGreaterThanOrEqual(4.5)
        }
      },
    )

    it('la rampa secuencial se aleja de la superficie de forma monótona (100 → 700)', () => {
      const steps = Array.from({ length: 13 }, (_, i) => `data-seq-${100 + i * 50}`)
      const ratios = steps.map((name) => contrastRatio(token(name, mode), surface(mode)))
      ratios.slice(1).forEach((ratio, i) => expect(ratio).toBeGreaterThan(ratios[i]!))
    })

    it('cada brazo divergente se aleja del neutro de forma monótona', () => {
      for (const arm of ['cool', 'warm']) {
        const ratios = [1, 2, 3].map((step) =>
          contrastRatio(token(`data-div-${arm}-${step}`, mode), token('data-div-mid', mode)),
        )
        expect(ratios[1]).toBeGreaterThan(ratios[0]!)
        expect(ratios[2]).toBeGreaterThan(ratios[1]!)
      }
    })
  })
})
