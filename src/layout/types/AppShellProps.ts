/** Una sección de la aplicación: un icono en la barra lateral y su panel. */
export interface AppSection {
  /** Id estable (p. ej. `'capas'`). Es el valor de `v-model:active-section`. */
  id: string
  /** Nombre visible: tooltip y nombre accesible del icono, y texto del menú en móvil. */
  label: string
  /**
   * Trazado SVG del icono, en una caja de 24 × 24 (el atributo `d` de un
   * `<path>`). Encaja con `@mdi/js`: `import { mdiLayers } from '@mdi/js'`.
   */
  icon: string
  /** Grupo de la barra de iconos: arriba o abajo del todo. @default 'top' */
  position?: 'top' | 'bottom'
  /** Oculta la sección (p. ej. según el rol del usuario). @default false */
  hidden?: boolean
}

/** Props de `ASAppShell`. */
export interface AppShellProps {
  /** Secciones de la barra de iconos (escritorio) y del menú (móvil). */
  sections: AppSection[]
  /**
   * Sección abierta en el panel lateral (`v-model:active-section`), o `null`
   * con el panel cerrado. Pulsar la sección abierta la cierra; pulsar otra
   * cierra el panel y lo vuelve a abrir con la nueva (ver `switchDelay`).
   * @default null
   */
  activeSection?: string | null
  /**
   * Panel de detalle (`v-model:detail-open`): entra por la derecha y tapa
   * todo el contenido principal, desde el borde de los menús de la izquierda.
   * @default false
   */
  detailOpen?: boolean
  /**
   * Ancho (px) por debajo del cual se usa el diseño móvil: barra abajo,
   * menú desplegable y paneles que suben desde abajo. Se mide sobre el
   * propio layout, no sobre la ventana. @default 960
   */
  breakpoint?: number
  /** Ancho (px) de la barra de iconos. @default 56 */
  railWidth?: number
  /** Ancho (px) del panel lateral. @default 320 */
  drawerWidth?: number
  /**
   * Al cambiar de sección, el panel lateral se cierra y se vuelve a abrir
   * con la nueva pasados estos milisegundos. @default 280
   */
  switchDelay?: number
  /** Botón para cerrar el panel de detalle, en su esquina superior derecha. @default true */
  detailCloseButton?: boolean
  /** Nombre accesible del panel de detalle. Por defecto, "Detalle" (traducido). */
  detailLabel?: string
  /** Alto del layout (CSS). @default '100%' */
  height?: string
  /**
   * Tema. Si se omite, hereda el de `provideTheme` y, si no hay ninguno, el
   * de la página. Los colores corporativos de la barra (`--as-app-chrome*`)
   * son los mismos en los dos temas.
   */
  theme?: 'light' | 'dark'
}

/** Eventos de `ASAppShell`. */
export interface AppShellEmits {
  /** Para `v-model:active-section`: la sección pulsada, o `null` al cerrar el panel. */
  'update:activeSection': [section: string | null]
  /** Para `v-model:detail-open`: `false` al cerrar el detalle (botón o Escape). */
  'update:detailOpen': [open: boolean]
}

/** Lo que recibe el slot `section` de `ASAppShell`. */
export interface AppShellSectionSlotProps {
  /** Sección que se está mostrando. */
  section: AppSection
  /** Cierra el panel (para el botón de su cabecera). */
  close: () => void
  /** `true` en el diseño móvil: la cabecera usa la flecha hacia abajo. */
  mobile: boolean
}
