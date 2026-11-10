import type { AppSection } from './AppShellProps'

/** Props de `ASAppRail`. */
export interface AppRailProps {
  /** Secciones: las de `position: 'bottom'` van abajo del todo. Las `hidden` no se muestran. */
  sections: AppSection[]
  /** Sección activa (resaltada), o `null`. @default null */
  activeSection?: string | null
  /** Ancho (px). @default 56 */
  width?: number
  /** Id del panel que abren las secciones (para `aria-controls`). */
  controls?: string
}

/** Eventos de `ASAppRail`. */
export interface AppRailEmits {
  /** Se pulsó una sección (abrirla, o cerrarla si ya era la activa: lo decide quien escucha). */
  toggle: [section: string]
}
