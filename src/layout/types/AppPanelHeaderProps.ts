/** Props de `ASAppPanelHeader`. */
export interface AppPanelHeaderProps {
  /** Título del panel. */
  title: string
  /**
   * Hacia dónde apunta la flecha del botón de cerrar: a la izquierda en el
   * panel lateral de escritorio y hacia abajo en el panel que sube en móvil.
   * @default 'left'
   */
  direction?: 'left' | 'down'
  /** Nombre accesible del botón. Por defecto, "Cerrar panel" (traducido). */
  closeLabel?: string
}

/** Eventos de `ASAppPanelHeader`. */
export interface AppPanelHeaderEmits {
  /** Se pulsó el botón de cerrar. */
  close: []
}
