/** Logo de `ASAppBrand`. */
export interface AppLogo {
  /** URL de la imagen. */
  src: string
  /** Texto alternativo. `''` si el logo es decorativo (p. ej. si ya está `title`). */
  alt: string
  /** Enlace al pulsar el logo (p. ej. la portada). */
  href?: string
  /**
   * Alto en px; el ancho se ajusta a la proporción de la imagen.
   * @default 40
   */
  height?: number
  /** Alto en móvil. @default 32 */
  mobileHeight?: number
  /** Se oculta en móvil (p. ej. el logo largo del ministerio). */
  hideOnMobile?: boolean
}

/**
 * Props de `ASAppBrand`: marca de la aplicación en la barra.
 *
 * @example
 * ```vue
 * <ASAppBrand
 *   :logos="[
 *     { src: '/logo-chtajo.svg', alt: 'Confederación Hidrográfica del Tajo', href: '/' },
 *     { src: '/logo-ministerio.svg', alt: 'Ministerio para la Transición Ecológica', hideOnMobile: true },
 *   ]"
 * />
 * ```
 */
export interface AppBrandProps {
  /** Logos, de izquierda a derecha. */
  logos?: AppLogo[]
  /** Nombre de la aplicación, junto a los logos. */
  title?: string
  /** Texto bajo el nombre (p. ej. el entorno: "Preproducción"). Se oculta en móvil. */
  subtitle?: string
  /**
   * Diseño reducido (logos más bajos, sin los `hideOnMobile` ni el
   * subtítulo). Sin prop, el del `ASAppShell` que lo contiene.
   */
  compact?: boolean
}
