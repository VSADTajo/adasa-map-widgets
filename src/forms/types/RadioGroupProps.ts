import type { FieldProps, SelectOption, SelectValue } from './common'

/**
 * Props de `ASRadioGroup`.
 *
 * @example
 * ```vue
 * <ASRadioGroup
 *   v-model="fuente"
 *   label="Fuente de datos"
 *   :options="[
 *     { value: 'observado', label: 'Observado' },
 *     { value: 'harmonie', label: 'Harmonie' },
 *   ]"
 * />
 * ```
 */
export interface RadioGroupProps extends FieldProps {
  /** Valor elegido (`v-model`), o `null` si no hay ninguno. */
  modelValue?: SelectValue | null
  /** Opciones. `icon` no se usa en los radios; `description` se muestra bajo la etiqueta. */
  options: SelectOption[]
  /**
   * Disposición de las opciones.
   * @default 'vertical'
   */
  orientation?: 'vertical' | 'horizontal'
  /** Atributo `name` de los radios. Si no se pasa, se genera uno. */
  name?: string
}

/** Eventos de `ASRadioGroup`. */
export interface RadioGroupEmits {
  /** Opción elegida (para `v-model`). */
  'update:modelValue': [value: SelectValue]
}
