import type { IconValue } from '@/core/types/icon'

/**
 * Una sección de la aplicación: un icono en la barra lateral (y una línea
 * del menú en móvil) que abre su panel. Las define cada proyecto: cuántas,
 * cuáles y en qué orden.
 *
 * @example
 * ```ts
 * const secciones: AppSection[] = [
 *   { id: 'capas', label: 'Capas', icon: mdiLayers },
 *   { id: 'avisos', label: 'Avisos', icon: 'mdi:alert', badge: avisosActivos },
 *   { id: 'simulaciones', label: 'Simulaciones', icon: Sliders, disabled: !esAdmin,
 *     disabledReason: 'Solo para administradores' },
 *   { id: 'ajustes', label: 'Ajustes', icon: mdiCog, position: 'bottom' },
 * ]
 * ```
 */
export interface AppSection {
  /** Id estable (p. ej. `'capas'`). Es el valor de `v-model:active-section`. */
  id: string
  /** Nombre visible: nombre accesible del icono, tooltip y texto del menú en móvil. */
  label: string
  /**
   * Icono: un trazado SVG (`@mdi/js`), un componente de cualquier librería
   * o un nombre (`'mdi:layers'`) que traduce `provideIcons` (ver `IconValue`).
   */
  icon: IconValue
  /**
   * Grupo de la barra de iconos: arriba del todo o abajo del todo (p. ej.
   * mapas base y ajustes). En el menú móvil, las de abajo van al final.
   * @default 'top'
   */
  position?: 'top' | 'bottom'
  /** Oculta la sección (p. ej. según el rol del usuario). @default false */
  hidden?: boolean
  /** Contador sobre el icono (p. ej. avisos activos). `0` o vacío no se muestra. */
  badge?: number | string
  /** Se ve pero no se puede abrir (p. ej. sin permisos). @default false */
  disabled?: boolean
  /** Por qué está deshabilitada: se añade al tooltip y al nombre accesible. */
  disabledReason?: string
  /** Tooltip propio. Por defecto, `label`. */
  tooltip?: string
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
