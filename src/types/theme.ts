/** Modo de color del tema. `'auto'` sigue la preferencia del sistema operativo. */
export type ThemeMode = 'light' | 'dark' | 'auto'

/**
 * Tokens de diseño expuestos como variables CSS (`--amw-*`) por
 * `src/styles/tokens.css`. Sirven como referencia de qué se puede
 * personalizar; el override real se hace vía CSS, no vía JS.
 */
export interface ThemeTokens {
  colorPrimary: string
  colorPrimaryContrast: string
  colorSurface: string
  colorSurfaceMuted: string
  colorText: string
  colorTextMuted: string
  colorBorder: string
  radius: string
  spacingUnit: string
  fontFamily: string
  shadow: string
}
