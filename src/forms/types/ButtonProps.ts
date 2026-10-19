import type { ButtonVariant, ControlSize } from './common'

/**
 * Props de `ASButton`.
 *
 * @example
 * ```vue
 * <ASButton variant="primary" :icon="mdiContentSave" :loading="guardando" @click="guardar">
 *   Guardar
 * </ASButton>
 * ```
 */
export interface ButtonProps {
  /**
   * Variante: `primary` para la acción principal (una por vista),
   * `secondary` para el resto, `ghost` para acciones discretas (barras de
   * herramientas) y `danger` para acciones destructivas.
   * @default 'secondary'
   */
  variant?: ButtonVariant
  /**
   * Tamaño.
   * @default 'md'
   */
  size?: ControlSize
  /**
   * Tipo nativo. Por defecto `button`, para no enviar un formulario por accidente.
   * @default 'button'
   */
  type?: 'button' | 'submit' | 'reset'
  /** Icono: trazado SVG de 24 × 24 (formato `@mdi/js`). El slot `icon` tiene prioridad. */
  icon?: string
  /**
   * Lado del icono respecto al texto.
   * @default 'start'
   */
  iconPosition?: 'start' | 'end'
  /**
   * Operación en curso: muestra un indicador de carga, anuncia `aria-busy`
   * y no emite `click`. Mantiene el ancho del botón.
   */
  loading?: boolean
  /** Deshabilitado. */
  disabled?: boolean
  /** Ocupa todo el ancho disponible. */
  block?: boolean
  /** Tema. Sin prop, el de `provideTheme`; si tampoco hay, el del contenedor. */
  theme?: 'light' | 'dark'
}

/** Eventos de `ASButton`. */
export interface ButtonEmits {
  /** Pulsado (ratón, Intro o Espacio). No se emite si está deshabilitado o cargando. */
  click: [event: MouseEvent]
}
