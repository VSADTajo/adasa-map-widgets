/**
 * Props de `ASCard`: tarjeta de un panel de detalle.
 *
 * @example
 * ```vue
 * <ASCard title="Resumen de datos observados" :loading="cargando" :empty="!datos.length">
 *   <MiResumen :datos="datos" />
 * </ASCard>
 * ```
 */
export interface CardProps {
  /** Título de la cabecera. Si no cabe, se recorta y se ve entero al pasar el ratón. */
  title?: string
  /**
   * Nivel del título (`h2`...`h6`), según dónde va la tarjeta en la página.
   * @default 3
   */
  headingLevel?: 2 | 3 | 4 | 5 | 6
  /** Cargando: el cuerpo muestra un esqueleto en lugar del contenido. */
  loading?: boolean
  /**
   * Líneas del esqueleto de carga.
   * @default 3
   */
  skeletonLines?: number
  /** Sin datos: el cuerpo muestra `emptyText` (o el slot `empty`). */
  empty?: boolean
  /** Texto sin datos. Por defecto, "Sin datos". */
  emptyText?: string
  /** Tema. Sin prop, el de `provideTheme`; si tampoco hay, el del contenedor. */
  theme?: 'light' | 'dark'
}
