import type { FieldProps } from './common'

/** Periodo entre dos instantes, ambos incluidos. */
export interface DateRange {
  start: Date
  end: Date
}

/**
 * Periodos predefinidos que trae la librería, todos hasta el instante actual:
 * `today` (desde las 00:00), `last24h`, `last7d`, `last30d` y `hydroYear`
 * (desde el 1 de octubre, inicio del año hidrológico).
 */
export type DateRangePresetId = 'today' | 'last24h' | 'last7d' | 'last30d' | 'hydroYear'

/** Periodo predefinido propio del proyecto. */
export interface DateRangePreset {
  /** Identificador, el que se emite en `preset-selected`. */
  id: string
  /** Texto del botón. */
  label: string
  /** Periodo a partir del instante actual (`now`). */
  range: (now: Date) => DateRange
}

/**
 * Props de `ASDateRangePicker`.
 *
 * @example
 * ```vue
 * <ASDateRangePicker
 *   v-model="periodo"
 *   label="Periodo"
 *   :presets="['last24h', 'last7d', 'hydroYear', { id: 'avenida', label: 'Avenida de 2025', range: () => avenida }]"
 *   :max="new Date()"
 * />
 * ```
 */
export interface DateRangePickerProps extends FieldProps {
  /** Periodo elegido (`v-model`), o `null`. */
  modelValue?: DateRange | null
  /** Elegir también la hora de inicio y de fin. Sin ella, el periodo va de las 00:00 del primer día al final del último. */
  withTime?: boolean
  /** Primer instante que se puede elegir. */
  min?: Date
  /** Último instante que se puede elegir. */
  max?: Date
  /**
   * Periodos predefinidos: ids de los que trae la librería o periodos
   * propios. `[]` los oculta. Se recortan a `min`/`max`.
   * @default ['last24h', 'last7d', 'last30d', 'hydroYear']
   */
  presets?: (DateRangePresetId | DateRangePreset)[]
  /**
   * Paso de los minutos (con `withTime`).
   * @default 1
   */
  minuteStep?: number
  /** Texto cuando no hay periodo. Por defecto, "Elige un periodo". */
  placeholder?: string
  /** Botón para vaciar el periodo. */
  clearable?: boolean
  /**
   * Instante con el que se calculan los periodos predefinidos. Sin él, el
   * momento de pulsarlos. Útil para trabajar en un instante de referencia
   * (una simulación, un informe pasado).
   */
  now?: Date
}

/** Eventos de `ASDateRangePicker`. */
export interface DateRangePickerEmits {
  /** Nuevo periodo (para `v-model`), o `null` al vaciarlo. */
  'update:modelValue': [value: DateRange | null]
  /** Se aplicó un periodo predefinido (además de `update:modelValue`). */
  'preset-selected': [id: string]
}
