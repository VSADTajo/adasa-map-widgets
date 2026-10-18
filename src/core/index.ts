/**
 * Dominio `core`: tema, tokens de diseño y utilidades comunes a todos los
 * dominios. No depende de ningún otro dominio (ver docs/adr/0000-estructura-paquete.md).
 */

import './styles/tokens.css'

export {
  provideTheme,
  useTheme,
  useResolvedTheme,
  useTokens,
  type ThemeContext,
} from './composables/useTheme'
export { useClickOutside } from './composables/useClickOutside'
export { readTokens } from './utils/readTokens'

export type {
  ThemeMode,
  ThemeTokens,
  DataTokens,
  AlertLevel,
  AlertTokens,
  FontSizeToken,
  SpaceToken,
  ZIndexLayer,
} from './types/theme'
export type { WidgetPosition } from './types/common'
