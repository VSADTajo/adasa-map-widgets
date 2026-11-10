// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { contrastRatio } from '@/core/utils/contrast'
import { composite, MODES, surface, token } from './tokens.fixtures'

const ALERTS = ['normal', 'amarillo', 'naranja', 'rojo']

describe('tokens.css: contraste WCAG 2.1 AA contra --as-color-surface', () => {
  describe.each(MODES)('modo %s', (mode) => {
    it.each(['color-text', 'color-text-muted', 'color-primary', 'color-danger'])(
      'el texto --as-%s llega a 4.5:1',
      (name) => {
        expect(contrastRatio(token(name, mode), surface(mode))).toBeGreaterThanOrEqual(4.5)
      },
    )

    it('el texto llega a 4.5:1 sobre --as-color-surface-muted (botones al pasar el ratón)', () => {
      expect(
        contrastRatio(token('color-text', mode), token('color-surface-muted', mode)),
      ).toBeGreaterThanOrEqual(4.5)
    })

    it.each([
      ['color-primary-contrast', 'color-primary'],
      ['color-danger-contrast', 'color-danger'],
    ])('el texto --as-%s llega a 4.5:1 sobre --as-%s (botones primary y danger)', (text, fill) => {
      expect(contrastRatio(token(text, mode), token(fill, mode))).toBeGreaterThanOrEqual(4.5)
    })

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

    it('layout: el texto de la barra corporativa llega a 4.5:1, también sobre el elemento activo', () => {
      const chrome = token('app-chrome', mode)
      const active = composite(token('app-chrome-active', mode), chrome)
      for (const background of [chrome, active]) {
        expect(contrastRatio(token('app-chrome-text', mode), background)).toBeGreaterThanOrEqual(
          4.5,
        )
      }
    })

    it('layout: los iconos no activos de la barra llegan a 3:1', () => {
      const chrome = token('app-chrome', mode)
      const icon = composite(token('app-chrome-text-muted', mode), chrome)
      expect(contrastRatio(icon, chrome)).toBeGreaterThanOrEqual(3)
    })

    it.each(['app-panel-bg', 'app-panel-surface'])(
      'layout: el texto de los paneles llega a 4.5:1 sobre --as-%s',
      (background) => {
        expect(
          contrastRatio(token('app-panel-text', mode), token(background, mode)),
        ).toBeGreaterThanOrEqual(4.5)
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
