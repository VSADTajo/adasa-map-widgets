import type { FieldProps, SelectValue } from './common'

/**
 * Props de `ASCheckbox`.
 *
 * @example
 * ```vue
 * <!-- Booleano -->
 * <ASCheckbox v-model="soloConAviso" label="Solo estaciones con aviso" />
 * <!-- Grupo: varios checkboxes con el mismo array -->
 * <ASCheckbox v-model="tipos" value="aforo" label="Aforos" />
 * <ASCheckbox v-model="tipos" value="embalse" label="Embalses" />
 * ```
 */
export interface CheckboxProps extends FieldProps {
  /**
   * Marcado (`v-model`). Un booleano, o un array si el checkbox forma parte
   * de un grupo: entonces se marca si contiene `value`, y al pulsarlo se
   * emite el array con `value` añadido o quitado.
   */
  modelValue?: boolean | SelectValue[]
  /** Valor que representa este checkbox dentro de un grupo (`modelValue` como array). */
  value?: SelectValue
  /**
   * Estado intermedio (p. ej. "seleccionar todo" con algunos marcados): se
   * dibuja con un guion y se anuncia como "mixto". Lo controla el padre.
   */
  indeterminate?: boolean
}

/** Eventos de `ASCheckbox`. */
export interface CheckboxEmits {
  /** Nuevo estado (para `v-model`): el booleano o el array del grupo. */
  'update:modelValue': [value: boolean | SelectValue[]]
}
