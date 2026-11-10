import type { ButtonVariant, ControlSize } from './common'
import type { IconValue } from '@/core/types/icon'

/** Datos comunes de una opción de `ASMenu`. */
interface MenuItemBase {
  /** Identificador único en el menú: es lo que se emite en `select`. */
  id: string
  /** Texto visible. */
  label: string
  /** Icono: trazado SVG (`@mdi/js`), componente o nombre (ver `IconValue`). */
  icon?: IconValue
  /** Texto secundario bajo la etiqueta. */
  description?: string
  /** No se puede elegir; el teclado la salta. */
  disabled?: boolean
}

/** Opción que hace algo al elegirla (cierra el menú). */
export interface MenuActionItem extends MenuItemBase {
  type?: 'action'
}

/** Opción que se marca y se desmarca (el menú sigue abierto). */
export interface MenuCheckboxItem extends MenuItemBase {
  type: 'checkbox'
  checked: boolean
}

/** Opción de un grupo de selección única (cierra el menú). */
export interface MenuRadioItem extends MenuItemBase {
  type: 'radio'
  checked: boolean
}

/** Línea que separa grupos de opciones. */
export interface MenuSeparator {
  type: 'separator'
  id: string
}

/** Entrada de `ASMenu`. */
export type MenuEntry = MenuActionItem | MenuCheckboxItem | MenuRadioItem | MenuSeparator

/** Opción elegible de `ASMenu` (todas menos los separadores). */
export type MenuItem = MenuActionItem | MenuCheckboxItem | MenuRadioItem

/**
 * Props de `ASMenu`: botón que despliega un menú de acciones, casillas o
 * radios.
 *
 * @example
 * ```vue
 * <ASMenu
 *   label="Descargar"
 *   :icon="mdiDownload"
 *   icon-only
 *   :items="[
 *     { id: 'png', label: 'Imagen PNG' },
 *     { id: 'csv', label: 'Datos CSV' },
 *   ]"
 *   @select="descargar($event.id)"
 * />
 * ```
 */
export interface MenuProps {
  /** Opciones. El estado de casillas y radios (`checked`) lo controla el padre. */
  items: MenuEntry[]
  /** Texto del botón y nombre accesible del menú. */
  label: string
  /** Icono del botón: trazado SVG de 24 × 24 (formato `@mdi/js`). */
  icon?: IconValue
  /** Botón solo con icono: `label` pasa a ser su nombre accesible y su tooltip. */
  iconOnly?: boolean
  /** Contador o texto corto junto al botón (p. ej. cuántas opciones hay marcadas). */
  badge?: string | number
  /**
   * Variante del botón.
   * @default 'ghost'
   */
  variant?: ButtonVariant
  /**
   * Tamaño del botón.
   * @default 'md'
   */
  size?: ControlSize
  /** Botón deshabilitado: no abre el menú. */
  disabled?: boolean
  /** Por qué está deshabilitado: se muestra como tooltip del botón. */
  disabledReason?: string
  /** Marca el botón como activo (`aria-pressed`), p. ej. si alguna opción del menú está en uso. */
  active?: boolean
  /**
   * Lado por el que se alinea el menú con el botón.
   * @default 'start'
   */
  align?: 'start' | 'end'
  /** Tema. Sin prop, el de `provideTheme`; si tampoco hay, el del contenedor. */
  theme?: 'light' | 'dark'
}

/** Eventos de `ASMenu`. */
export interface MenuEmits {
  /**
   * Se eligió una opción. Para casillas y radios, el padre actualiza su
   * `checked` (el menú no guarda estado).
   */
  select: [item: MenuItem]
  /** Se abrió el menú. */
  open: []
  /** Se cerró el menú. */
  close: []
}
