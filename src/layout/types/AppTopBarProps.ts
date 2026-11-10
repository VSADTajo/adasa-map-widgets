/** Props de `ASAppTopBar`. */
export interface AppTopBarProps {
  /**
   * Dónde está la barra: arriba (escritorio) o abajo (móvil, al alcance del
   * pulgar). Solo cambia el borde y la sombra. @default 'top'
   */
  position?: 'top' | 'bottom'
  /** Alto (px). @default 64 */
  height?: number
}
