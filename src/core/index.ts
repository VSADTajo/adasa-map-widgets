/**
 * Dominio `core`: tema, tokens de diseño y utilidades comunes a todos los
 * dominios. No depende de ningún otro dominio (ver docs/adr/0000-estructura-paquete.md).
 */

import './styles/tokens.css'

export { provideTheme, useTheme, useResolvedTheme, type ThemeContext } from './composables/useTheme'
export { useClickOutside } from './composables/useClickOutside'

export type { ThemeMode, ThemeTokens } from './types/theme'
export type { WidgetPosition } from './types/common'
