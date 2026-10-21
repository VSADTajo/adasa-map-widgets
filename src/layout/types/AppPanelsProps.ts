import type { AppSection } from './AppShellProps'

/**
 * Props de `ASAppDrawer`: panel de sección de escritorio, que empuja el
 * contenido al abrirse (va en una fila flex, junto a la barra de iconos).
 *
 * @example
 * ```vue
 * <ASAppDrawer :open="seccion !== null" label="Capas"><PanelCapas /></ASAppDrawer>
 * ```
 */
export interface AppDrawerProps {
  /** Abierto: ocupa `width` y empuja el contenido; cerrado, ancho 0 e inerte. */
  open: boolean
  /**
   * Ancho abierto, en px.
   * @default 320
   */
  width?: number
  /** Nombre accesible del panel (p. ej. el de la sección abierta). */
  label?: string
  /** Id del panel, para el `aria-controls` de quien lo abre. */
  id?: string
}

/**
 * Props de `ASAppDetailPanel`: panel de detalle que entra por la derecha y
 * tapa el contenido desde `offset` (va en un contenedor con `position: relative`).
 *
 * @example
 * ```vue
 * <ASAppDetailPanel :open="detalle" :offset="376" @close="detalle = false"><Ficha /></ASAppDetailPanel>
 * ```
 */
export interface AppDetailPanelProps {
  open: boolean
  /**
   * Distancia desde la izquierda del contenedor, en px: tapa desde ahí
   * (p. ej. tras la barra de iconos y el panel de sección). Cambia con transición.
   * @default 0
   */
  offset?: number
  /** Nombre accesible del panel. Por defecto, "Detalle". */
  label?: string
  /**
   * Botón de cerrar arriba a la derecha.
   * @default true
   */
  closeButton?: boolean
  /** Nombre accesible del botón de cerrar. Por defecto, "Cerrar detalle". */
  closeLabel?: string
}

/** Eventos de `ASAppDetailPanel`. */
export interface AppDetailPanelEmits {
  /** Se pulsó el botón de cerrar. */
  close: []
}

/**
 * Props de `ASAppBottomSheet`: panel móvil que sube desde abajo, con un asa
 * para ampliarlo a toda la altura.
 *
 * @example
 * ```vue
 * <ASAppBottomSheet :open="seccion !== null" v-model:expanded="ampliado" label="Capas">
 *   <PanelCapas />
 * </ASAppBottomSheet>
 * ```
 */
export interface AppBottomSheetProps {
  open: boolean
  /** Ampliado a toda la altura (`v-model:expanded`). Al cerrarse, vuelve a su altura. */
  expanded?: boolean
  /**
   * Altura sin ampliar (CSS).
   * @default '60%'
   */
  height?: string
  label?: string
  id?: string
}

/** Eventos de `ASAppBottomSheet`. */
export interface AppBottomSheetEmits {
  /** Se pulsó el asa (para `v-model:expanded`). */
  'update:expanded': [expanded: boolean]
}

/**
 * Props de `ASAppMobileMenu`: lista de secciones que se despliega encima de
 * la barra móvil, con un fondo que la cierra al tocar fuera.
 *
 * @example
 * ```vue
 * <ASAppMobileMenu v-model:open="menu" :sections="secciones" :active-section="seccion" @select="abrir" />
 * ```
 */
export interface AppMobileMenuProps {
  /** Desplegado (`v-model:open`). */
  open: boolean
  /** Secciones; las `hidden` no se muestran. */
  sections: AppSection[]
  /** Sección abierta: se marca con `aria-pressed`. */
  activeSection?: string | null
  /** Id del menú, para el `aria-controls` del botón que lo abre. */
  id?: string
}

/** Eventos de `ASAppMobileMenu`. */
export interface AppMobileMenuEmits {
  /** Se cerró tocando fuera (para `v-model:open`). */
  'update:open': [open: boolean]
  /** Se eligió una sección (el menú no se cierra solo: lo decide quien lo usa). */
  select: [sectionId: string]
}
