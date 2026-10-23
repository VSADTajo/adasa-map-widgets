import type { FieldProps } from './common'
import type { IconValue } from '@/core/types/icon'

/** Etiqueta de una sugerencia (tipo de estación, origen...). */
export interface SearchSuggestionTag {
  label: string
  /**
   * Color de fondo (hex o rgb). El texto se pone blanco u oscuro, el que más
   * contraste. Sin él, el gris de la superficie.
   */
  color?: string
}

/** Acción de una sugerencia (p. ej. "Centrar en el mapa"), con su botón de icono. */
export interface SearchSuggestionAction {
  id: string
  /** Icono: trazado SVG (`@mdi/js`), componente o nombre (ver `IconValue`). */
  icon: IconValue
  /** Nombre accesible y tooltip. */
  label: string
  disabled?: boolean
}

/** Sugerencia de `ASSearchInput` (una estación, un municipio, una dirección...). */
export interface SearchSuggestion<T = unknown> {
  /** Identificador único entre las sugerencias. */
  id: string | number
  /** Texto principal: el que queda en el campo al elegirla. */
  label: string
  /** Texto secundario (tipo, código, provincia...). */
  description?: string
  /** Icono: trazado SVG (`@mdi/js`), componente o nombre (ver `IconValue`). */
  icon?: IconValue
  /** Grupo con título ("Estaciones", "Municipios"...). Se respeta el orden de llegada. */
  group?: string
  /** Datos del proyecto (coordenadas, la entidad completa...), que vuelven en `select`. */
  data?: T
  /** Etiquetas junto al nombre (p. ej. "Aforo", "Punto SAIH"). */
  tags?: SearchSuggestionTag[]
  /**
   * Botones de acción a la derecha (emiten `suggestion-action`). Con el
   * teclado, Mayús + Intro ejecuta la primera de la sugerencia activa.
   */
  actions?: SearchSuggestionAction[]
  /** Se puede elegir, pero se ve atenuada con un aviso (p. ej. "no visible en el mapa"). */
  unavailable?: boolean
  /** Por qué no está disponible: tooltip del aviso y texto para lectores de pantalla. */
  unavailableReason?: string
}

/** Props del slot `suggestion` de `ASSearchInput`, para pintar una sugerencia a medida. */
export interface SearchSuggestionSlotProps {
  suggestion: SearchSuggestion
  /** Es la activa del teclado. */
  active: boolean
  /** La etiqueta en trozos, con lo buscado marcado (`match: true`). */
  parts: { text: string; match: boolean }[]
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
  /** Oculta la etiqueta a la vista (sigue siendo el nombre accesible), p. ej. en una barra. */
  hideLabel?: boolean
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
  /** Se pulsó una acción de una sugerencia (o Mayús + Intro sobre la activa). */
  'suggestion-action': [event: { actionId: string; suggestion: SearchSuggestion }]
}
