import { describe, expect, it } from 'vitest'
import { es, type MessageKey } from '@/core/i18n/messages'
import type { AppSection } from '@/layout/types/AppShellProps'
import { hasBadge, orderedSections, sectionLabel, sectionTooltip } from './sections'

const base: AppSection = { id: 'avisos', label: 'Avisos', icon: 'M0 0' }

describe('hasBadge', () => {
  it.each([
    [undefined, false],
    [0, false],
    ['', false],
    [3, true],
    ['99+', true],
    ['0', true],
  ])('badge %j → %s', (badge, expected) => {
    expect(hasBadge({ ...base, badge })).toBe(expected)
  })
})

describe('sectionLabel', () => {
  /** Traductor mínimo sobre los textos de referencia (es), como el de useLocale. */
  const t = (key: MessageKey, params: Record<string, string | number> = {}) =>
    es[key].replace(/\{(\w+)\}/g, (_, name: string) => String(params[name]))

  it('sin contador ni deshabilitar, el nombre tal cual', () => {
    expect(sectionLabel(base, t)).toBe('Avisos')
  })

  it('con contador y deshabilitada con motivo', () => {
    expect(sectionLabel({ ...base, badge: 3 }, t)).toBe('Avisos (3)')
    expect(
      sectionLabel({ ...base, badge: 3, disabled: true, disabledReason: 'Sin permisos' }, t),
    ).toBe('Avisos (3). No disponible: Sin permisos')
  })

  it('deshabilitada sin motivo: solo el nombre (aria-disabled ya lo anuncia)', () => {
    expect(sectionLabel({ ...base, disabled: true }, t)).toBe('Avisos')
  })
})

describe('sectionTooltip', () => {
  it('el tooltip propio, o el nombre, y el motivo si está deshabilitada', () => {
    expect(sectionTooltip(base)).toBe('Avisos')
    expect(sectionTooltip({ ...base, tooltip: 'Avisos activos' })).toBe('Avisos activos')
    expect(sectionTooltip({ ...base, disabled: true, disabledReason: 'Sin permisos' })).toBe(
      'Avisos (Sin permisos)',
    )
  })
})

describe('orderedSections', () => {
  it('quita las ocultas y deja las de abajo al final, sin cambiar el orden de cada grupo', () => {
    const sections: AppSection[] = [
      { id: 'a', label: 'A', icon: 'M0 0', position: 'bottom' },
      { id: 'b', label: 'B', icon: 'M0 0' },
      { id: 'c', label: 'C', icon: 'M0 0', hidden: true },
      { id: 'd', label: 'D', icon: 'M0 0', position: 'bottom' },
      { id: 'e', label: 'E', icon: 'M0 0', position: 'top' },
    ]
    expect(orderedSections(sections).map((s) => s.id)).toEqual(['b', 'e', 'a', 'd'])
  })
})
