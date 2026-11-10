import type { IconValue } from '@/core/types/icon'

/** Etiqueta de `ASDetailHeader` (zona, municipio, tipo de estación, área...). */
export interface DetailTag {
  /** Texto ("Zona Alta", "Aranjuez", "Área: 1.234,5 km²"). */
  label: string
  /** Icono: trazado SVG (`@mdi/js`), componente o nombre (ver `IconValue`). */
  icon?: IconValue
}

/**
 * Props de `ASDetailHeader`.
 *
 * @example
 * ```vue
 * <ASDetailHeader
 *   title="3E01"
 *   subtitle="Tajo en Aranjuez"
 *   :tags="[{ label: 'Aforo', icon: mdiWater }, { label: 'Madrid', icon: mdiCity }]"
 *   @close="cerrarFicha"
 * />
 * ```
 */
export interface DetailHeaderProps {
  /** Título principal (el código de la estación, el nombre del embalse...). */
  title?: string
  /** Texto bajo el título (el nombre completo, el río...). */
  subtitle?: string
  /** Etiquetas a la derecha. */
  tags?: DetailTag[]
  /** Cargando: muestra "Cargando…" en lugar del título y oculta las etiquetas. */
  loading?: boolean
  /**
   * Se queda fija arriba al desplazar el panel.
   * @default true
   */
  sticky?: boolean
  /**
   * Botón de cerrar.
   * @default true
   */
  closable?: boolean
  /** Nombre accesible del botón de cerrar. Por defecto, "Cerrar". */
  closeLabel?: string
}

/** Eventos de `ASDetailHeader`. */
export interface DetailHeaderEmits {
  /** Se pulsó el botón de cerrar. */
  close: []
}
