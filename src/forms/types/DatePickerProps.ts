import type { FieldProps } from './common'

/**
 * Props de `ASDatePicker`.
 *
 * @example
 * ```vue
 * <ASDatePicker v-model="fecha" label="Fecha del informe" :max="new Date()" />
 * <ASDatePicker v-model="instante" label="Instante" with-time :minute-step="10" />
 * ```
 */
export interface DatePickerProps extends FieldProps {
  /** Fecha elegida (`v-model`), o `null`. */
  modelValue?: Date | null
  /** Elegir también la hora (horas y minutos). Sin ella, se emite el día a las 00:00. */
  withTime?: boolean
  /** Primera fecha que se puede elegir. Los días anteriores se ven deshabilitados. */
  min?: Date
  /** Última fecha que se puede elegir. */
  max?: Date
  /**
   * Paso de los minutos (con `withTime`): las flechas ↑/↓ suman o restan este valor.
   * @default 1
   */
  minuteStep?: number
  /** Texto cuando está vacío. Por defecto, el formato que se espera (`dd/mm/aaaa`). */
  placeholder?: string
  /** Botón para vaciar la fecha. */
  clearable?: boolean
}

/** Eventos de `ASDatePicker`. */
export interface DatePickerEmits {
  /** Nueva fecha (para `v-model`), o `null` al vaciarla. */
  'update:modelValue': [value: Date | null]
}
