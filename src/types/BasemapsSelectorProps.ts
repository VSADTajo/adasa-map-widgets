import type { TimeControlsTheme } from './TimelineProps'
import type { BasemapOption } from '@/components/mapping/ASMap.vue'

/** Esquina del contenedor (normalmente un mapa) donde se ancla el selector. */
export type BasemapsSelectorPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

/**
 * Props de `ASMapBasemapsSelector`.
 *
 * Muestra la miniatura del basemap activo en un recuadro; al hacer click se
 * despliega un menú con un recuadro por cada uno de los demás `basemaps`.
 * Al elegir uno se cierra el menú y cambia el basemap. Es un componente
 * **controlado**: `basemap` se usa con `v-model` — el proyecto consumidor
 * decide qué hacer con la selección (normalmente, pasarla tal cual a la
 * prop `basemap` de `ASMap`, que comparte el mismo formato de `basemaps`).
 */
export interface BasemapsSelectorProps {
  /** Basemaps disponibles (mismo formato que la prop `basemaps` de `ASMap`). */
  basemaps: BasemapOption[]
  /** Id del basemap activo (de `basemaps`). @default El primer elemento de `basemaps`. */
  basemap?: string
  /** Esquina del contenedor donde se ancla el selector. @default 'bottom-right' */
  position?: BasemapsSelectorPosition
  /**
   * Distancia desde los lados anclados (`position`). Un `number` se
   * interpreta en píxeles. @default 20 (píxeles)
   */
  offset?: string | number
  /** Tema visual. @default 'dark' */
  theme?: TimeControlsTheme
}

/**
 * Contrato de eventos de `ASMapBasemapsSelector`, útil para tipar listeners
 * externos sin duplicar las firmas declaradas en el propio componente.
 */
export interface BasemapsSelectorEmits {
  /** Nuevo basemap elegido (su `id`, de `basemaps`). */
  'update:basemap': [id: string]
}
