import type { FieldProps } from './common'
import type { IconValue } from '@/core/types/icon'

/** Tipo de `ASInput`. */
export type InputType = 'text' | 'number' | 'email' | 'password' | 'tel' | 'url' | 'search'

/**
 * Props de `ASInput`.
 *
 * @example
 * ```vue
 * <ASInput v-model="umbral" type="number" label="Umbral" unit="m³/s" :min="0" clearable />
 * ```
 */
export interface InputProps extends FieldProps {
  /**
   * Valor (`v-model`). Con `type="number"` es un `number`, o `null` si el
   * campo está vacío o no es un número.
   */
  modelValue?: string | number | null
  /**
   * Tipo. `number` admite la coma decimal de es-ES al escribir (es un campo
   * de texto con teclado numérico, no el `<input type="number">` nativo, que
   * depende del idioma del navegador) y muestra el valor con el separador del
   * idioma activo.
   * @default 'text'
   */
  type?: InputType
  /** Texto de ejemplo cuando está vacío. No sustituye a `label`. */
  placeholder?: string
  /** Solo lectura: se enfoca y se copia, pero no se edita. */
  readonly?: boolean
  /** Icono a la izquierda: trazado SVG de 24 × 24 (formato `@mdi/js`). El slot `prefix` tiene prioridad. */
  prefixIcon?: IconValue
  /** Icono a la derecha. El slot `suffix` tiene prioridad. */
  suffixIcon?: IconValue
  /** Unidad a la derecha del valor (`'m³/s'`, `'mm'`...). Se anuncia junto al campo. */
  unit?: string
  /** Botón para vaciar el campo cuando tiene valor. */
  clearable?: boolean
  /** Mínimo (solo `type="number"`): las flechas ↑/↓ no bajan de él. */
  min?: number
  /** Máximo (solo `type="number"`). */
  max?: number
  /**
   * Paso de las flechas ↑/↓ (solo `type="number"`).
   * @default 1
   */
  step?: number
  /** Atributo `autocomplete` nativo (`'email'`, `'off'`...). */
  autocomplete?: string
}

/** Eventos de `ASInput`. */
export interface InputEmits {
  /** Nuevo valor al escribir (para `v-model`): `string`, o `number | null` con `type="number"`. */
  'update:modelValue': [value: string | number | null]
  /** El campo recibe el foco. */
  focus: [event: FocusEvent]
  /** El campo pierde el foco. */
  blur: [event: FocusEvent]
  /** Se vació con el botón de borrar. */
  clear: []
}
