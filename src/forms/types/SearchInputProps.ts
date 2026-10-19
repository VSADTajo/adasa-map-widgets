import type { FieldProps } from './common'

/** Sugerencia de `ASSearchInput` (una estación, un municipio, una dirección...). */
export interface SearchSuggestion<T = unknown> {
  /** Identificador único entre las sugerencias. */
  id: string | number
  /** Texto principal: el que queda en el campo al elegirla. */
  label: string
  /** Texto secundario (tipo, código, provincia...). */
  description?: string
  /** Icono: trazado SVG de 24 × 24 (formato `@mdi/js`). */
  icon?: string
  /** Grupo con título ("Estaciones", "Municipios"...). Se respeta el orden de llegada. */
  group?: string
  /** Datos del proyecto (coordenadas, la entidad completa...), que vuelven en `select`. */
  data?: T
}

/**
 * Busca sugerencias para un texto. Recibe una señal que se aborta si el
 * usuario sigue escribiendo, para cancelar la petición en curso
 * (`fetch(url, { signal })`).
 */
export type FetchSuggestions<T = unknown> = (
  query: string,
  signal: AbortSignal,
) => Promise<SearchSuggestion<T>[]> | SearchSuggestion<T>[]

/**
 * Props de `ASSearchInput`.
 *
 * @example
 * ```vue
 * <ASSearchInput
 *   v-model="texto"
 *   label="Buscar"
 *   :fetch-suggestions="(q, signal) => api.buscar(q, { signal })"
 *   @select="centrarEn($event.data)"
 * />
 * ```
 */
export interface SearchInputProps extends FieldProps {
  /** Texto del campo (`v-model`). */
  modelValue?: string
  /** Función que aporta el proyecto para pedir las sugerencias (servidor, índice local...). */
  fetchSuggestions: FetchSuggestions
  /**
   * Espera tras la última tecla antes de buscar, en ms.
   * @default 300
   */
  debounce?: number
  /**
   * Caracteres mínimos para buscar.
   * @default 2
   */
  minChars?: number
  /** Texto de ejemplo. Por defecto, ninguno. */
  placeholder?: string
  /**
   * Botón para vaciar el campo.
   * @default true
   */
  clearable?: boolean
  /** Texto cuando no hay sugerencias. Por defecto, "Sin resultados para «…»". */
  noResultsText?: string
}

/** Eventos de `ASSearchInput`. */
export interface SearchInputEmits {
  /** Texto nuevo (para `v-model`): al escribir, al elegir una sugerencia o al vaciar. */
  'update:modelValue': [value: string]
  /** Se eligió una sugerencia (clic o Intro). */
  select: [suggestion: SearchSuggestion]
  /** Intro sin sugerencia activa: búsqueda libre con el texto escrito. */
  submit: [query: string]
  /** `fetchSuggestions` falló (no se emite al cancelar una petición). */
  error: [error: unknown]
}
