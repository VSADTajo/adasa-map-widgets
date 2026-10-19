import type { FieldProps, SelectGroup, SelectOption, SelectValue } from './common'

/**
 * Props de `ASSelect`.
 *
 * @example
 * ```vue
 * <ASSelect
 *   v-model="estaciones"
 *   label="Estaciones"
 *   multiple
 *   searchable
 *   :options="[
 *     { label: 'Tajo', options: [{ value: 'E01', label: 'Aranjuez' }, { value: 'E02', label: 'Toledo' }] },
 *     { label: 'Jarama', options: [{ value: 'E10', label: 'Mejorada' }] },
 *   ]"
 * />
 * ```
 */
export interface SelectProps extends FieldProps {
  /**
   * Valor elegido (`v-model`): un valor, o un array con `multiple`. `null`
   * (o `[]`) si no hay ninguno.
   */
  modelValue?: SelectValue | SelectValue[] | null
  /** Opciones, sueltas o en grupos con título (se pueden mezclar). */
  options: (SelectOption | SelectGroup)[]
  /** Selección múltiple: `v-model` es un array y lo elegido se muestra como chips. */
  multiple?: boolean
  /**
   * Campo de búsqueda que filtra las opciones al escribir (sin distinguir
   * mayúsculas ni tildes). Sin ella, escribir salta a la opción que empieza
   * por esas letras, como en un `<select>` nativo.
   */
  searchable?: boolean
  /**
   * Filtro propio de la búsqueda (p. ej. buscar también por código). Por
   * defecto, la etiqueta contiene el texto, sin mayúsculas ni tildes.
   */
  filter?: (option: SelectOption, query: string) => boolean
  /** Botón para vaciar la selección. */
  clearable?: boolean
  /** Texto cuando no hay nada elegido. Por defecto, "Selecciona una opción". */
  placeholder?: string
  /** Con `multiple`, chips visibles como mucho; el resto se resume en "+N". */
  maxChips?: number
  /** Texto de la lista cuando la búsqueda no encuentra nada. Por defecto, "Sin resultados". */
  noOptionsText?: string
}

/** Eventos de `ASSelect`. */
export interface SelectEmits {
  /** Nueva selección (para `v-model`): el valor, el array con `multiple`, o `null` al vaciar. */
  'update:modelValue': [value: SelectValue | SelectValue[] | null]
  /** Texto de búsqueda al escribir (con `searchable`), p. ej. para pedir opciones al servidor. */
  search: [query: string]
  /** Se abrió la lista. */
  open: []
  /** Se cerró la lista. */
  close: []
}

/** Props del slot `option` de `ASSelect`. */
export interface SelectOptionSlotProps {
  option: SelectOption
  /** Está elegida. */
  selected: boolean
  /** Es la opción activa del teclado. */
  active: boolean
}

/** Props del slot `chip` de `ASSelect`. */
export interface SelectChipSlotProps {
  option: SelectOption
  /** Quita la opción de la selección. */
  remove: () => void
}
