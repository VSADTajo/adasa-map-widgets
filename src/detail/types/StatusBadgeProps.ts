import type { AlertLevel } from '@/core/types/theme'

/**
 * Props de `ASStatusBadge`: píldora de un nivel de aviso.
 *
 * @example
 * ```vue
 * <ASStatusBadge level="naranja" />
 * <ASStatusBadge :level="nivel" :label="formatUnit(caudal, 'm³/s')" size="sm" />
 * ```
 */
export interface StatusBadgeProps {
  /** Nivel de aviso: decide el color (`--as-alert-<nivel>`). */
  level: AlertLevel
  /**
   * Texto. Por defecto, el nombre del nivel ("Normal", "Amarillo"...). Si
   * es otro (p. ej. un valor), el nivel se añade para los lectores de
   * pantalla: el color nunca es la única pista.
   */
  label?: string
  /**
   * Tamaño.
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'
}
