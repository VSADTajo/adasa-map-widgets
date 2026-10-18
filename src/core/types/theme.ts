/** Modo de color del tema. `'auto'` sigue la preferencia del sistema operativo. */
export type ThemeMode = 'light' | 'dark' | 'auto'

/** Escalones de la escala tipográfica (`--as-font-size-*`). */
export type FontSizeToken = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'

/** Escalones de espaciado (`--as-space-*`), múltiplos de `--as-spacing-unit`. */
export type SpaceToken = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16

/** Capas de apilamiento (`--as-z-*`), de menor a mayor. */
export type ZIndexLayer =
  'base' | 'mapControl' | 'dropdown' | 'sticky' | 'drawer' | 'modal' | 'toast' | 'tooltip'

/**
 * Niveles de aviso con color reservado (`--as-alert-*`), coherentes con los
 * `levels` por defecto de `ASMapDayIntervalControls` más el nivel `normal`.
 */
export type AlertLevel = 'normal' | 'amarillo' | 'naranja' | 'rojo'

/** Colores de un nivel de aviso. */
export interface AlertTokens {
  /** Relleno reconocible del nivel (pastillas, celdas, bandas). */
  fill: string
  /** Texto sobre `fill` (contraste ≥ 4.5:1). */
  text: string
  /** Líneas, iconos y bordes sobre la superficie (contraste ≥ 3:1). */
  strong: string
}

/** Paletas para visualización de datos (`--as-data-*`). */
export interface DataTokens {
  /**
   * 8 colores de identidad de series, a asignar **en este orden y sin
   * ciclar** (una 9.ª serie va a "Otros"). En dispersión y mapas, donde
   * cualquier par puede quedar contiguo, usa como mucho los 3 primeros.
   */
  categorical: string[]
  /** 13 pasos de magnitud, de 100 (≈ cero) a 700 (máximo), de 50 en 50. */
  sequential: string[]
  /** 7 pasos de polaridad: frío extremo → neutro (índice 3) → cálido extremo. */
  diverging: string[]
  /** Líneas de rejilla. */
  grid: string
  /** Ejes y marcas de eje. */
  axis: string
}

/**
 * Tokens de diseño expuestos como variables CSS (`--as-*`) por
 * `src/core/styles/tokens.css`, tal como los devuelve `readTokens()`: valores
 * ya resueltos para el tema del elemento leído, listos para pasar a
 * librerías que no entienden `var(--x)` (p. ej. motores de gráficas).
 * El override se hace siempre vía CSS, no vía JS.
 *
 * Si `tokens.css` no está cargado, los tokens ausentes son cadenas vacías
 * (y `NaN` en `zIndex`).
 */
export interface ThemeTokens {
  colorPrimary: string
  colorPrimaryContrast: string
  colorSurface: string
  colorSurfaceMuted: string
  colorText: string
  colorTextMuted: string
  colorBorder: string
  colorDanger: string
  /** Radio por defecto (`--as-radius`, = `radii.md`). */
  radius: string
  spacingUnit: string
  fontFamily: string
  /** Sombra por defecto (`--as-shadow`, = `shadows.md`). */
  shadow: string

  fontFamilyMono: string
  fontSize: Record<FontSizeToken, string>
  fontWeight: Record<'regular' | 'medium' | 'semibold' | 'bold', string>
  lineHeight: Record<'tight' | 'normal', string>
  /** Espaciados resueltos en píxeles (p. ej. `'8px'`). */
  space: Record<SpaceToken, string>
  radii: Record<'sm' | 'md' | 'lg' | 'full', string>
  shadows: Record<'sm' | 'md' | 'lg', string>
  zIndex: Record<ZIndexLayer, number>
  data: DataTokens
  alert: Record<AlertLevel, AlertTokens>
}
