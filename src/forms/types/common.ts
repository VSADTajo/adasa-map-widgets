import type { IconValue } from '@/core/types/icon'

/** Tamaño de un control de formulario: alto `--as-control-height-<tamaño>` (28, 36 o 44 px). */
export type ControlSize = 'sm' | 'md' | 'lg'

/** Variante visual de un botón. */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

/** Valor de una opción de `ASSelect`, `ASRadioGroup` o un grupo de `ASCheckbox`. */
export type SelectValue = string | number

/** Opción de `ASSelect` o `ASRadioGroup`. */
export interface SelectOption {
  /** Valor que se emite al elegirla. Único en la lista. */
  value: SelectValue
  /** Texto visible (y por el que se busca). */
  label: string
  /** No se puede elegir; el teclado la salta. */
  disabled?: boolean
  /** Trazado SVG de 24 × 24 (formato `@mdi/js`). */
  icon?: IconValue
  /** Texto secundario bajo la etiqueta. */
  description?: string
}

/** Grupo de opciones con título (en `ASSelect`). */
export interface SelectGroup {
  /** Título del grupo: no se puede elegir. */
  label: string
  options: SelectOption[]
}

/**
 * Props comunes de los campos de formulario (`ASInput`, `ASSelect`,
 * `ASCheckbox`, `ASRadioGroup`...). La etiqueta, la ayuda y el error se
 * enlazan al control con `for` y `aria-describedby`.
 */
export interface FieldProps {
  /** Etiqueta visible, asociada al control. */
  label?: string
  /** Texto de ayuda bajo el control. */
  hint?: string
  /**
   * Error de validación. Un texto se muestra bajo el control; `true` marca
   * el campo como inválido sin mensaje. En los dos casos, `aria-invalid`.
   */
  error?: string | boolean
  /** Campo obligatorio: asterisco en la etiqueta y `aria-required`. */
  required?: boolean
  /** Deshabilitado: ni se enfoca ni emite. */
  disabled?: boolean
  /**
   * Tamaño del control.
   * @default 'md'
   */
  size?: ControlSize
  /** Id del control. Si no se pasa, se genera uno. */
  id?: string
  /**
   * Tema. Sin prop, el de `provideTheme`; si tampoco hay, el del contenedor
   * (no fuerza ninguno: dentro de un panel oscuro se ve oscuro).
   */
  theme?: 'light' | 'dark'
}
