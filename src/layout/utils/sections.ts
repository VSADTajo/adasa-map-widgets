import type { LocaleContext } from '@/core/composables/useLocale'
import type { AppSection } from '@/layout/types/AppShellProps'

/** Si el contador de una sección se muestra (`0`, `''` y sin valor, no). */
export function hasBadge(section: AppSection): boolean {
  return section.badge !== undefined && section.badge !== '' && section.badge !== 0
}

/**
 * Nombre accesible de una sección: su nombre, con el contador ("Avisos (3)")
 * y, si está deshabilitada, el motivo.
 */
export function sectionLabel(section: AppSection, t: LocaleContext['t']): string {
  const label = hasBadge(section)
    ? t('layout.sectionBadge', { label: section.label, badge: section.badge! })
    : section.label
  return section.disabled && section.disabledReason
    ? t('layout.sectionDisabled', { label, reason: section.disabledReason })
    : label
}

/** Tooltip de una sección: el propio o su nombre, y el motivo si está deshabilitada. */
export function sectionTooltip(section: AppSection): string {
  const tooltip = section.tooltip ?? section.label
  return section.disabled && section.disabledReason
    ? `${tooltip} (${section.disabledReason})`
    : tooltip
}

/** Secciones visibles, con las de abajo al final (orden del menú móvil). */
export function orderedSections(sections: AppSection[]): AppSection[] {
  const visible = sections.filter((section) => !section.hidden)
  return [
    ...visible.filter((section) => section.position !== 'bottom'),
    ...visible.filter((section) => section.position === 'bottom'),
  ]
}
