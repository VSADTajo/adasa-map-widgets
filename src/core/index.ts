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
export {
  provideLocale,
  useLocale,
  type LocaleCode,
  type LocaleContext,
  type LocaleDefinition,
} from './composables/useLocale'
export type { MessageKey, Messages } from './i18n/messages'
export {
  formatNumber,
  formatDate,
  formatDuration,
  formatUnit,
  MISSING_VALUE,
  type DateFormat,
  type DatePreset,
  type MeasureUnit,
  type FormatNumberOptions,
  type FormatDateOptions,
  type FormatDurationOptions,
  type FormatUnitOptions,
} from './utils/format'
export { readTokens } from './utils/readTokens'

export type {
  ThemeMode,
  ThemeTokens,
  DataTokens,
  OverlayTokens,
  AlertLevel,
  AlertTokens,
  FontSizeToken,
  SpaceToken,
  ZIndexLayer,
} from './types/theme'
export type { WidgetPosition } from './types/common'
