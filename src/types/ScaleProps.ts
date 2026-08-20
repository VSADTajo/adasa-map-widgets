import type { TimeControlsTheme } from './TimelineProps'

/** Esquina del contenedor (normalmente un mapa) donde se ancla la escala. */
export type ScalePosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

/** Qué mostrar: una barra gráfica (con su distancia real) o una razón numérica (`1 : 50 000`). */
export type ScaleMode = 'bar' | 'numeric'

/** Sistema de unidades de la barra gráfica. No aplica a `mode: 'numeric'` (esa razón es adimensional). */
export type ScaleUnits = 'metric' | 'imperial'

/**
 * Props de `ASMapScale`.
 *
 * Componente **controlado** y agnóstico del motor de mapas: no lee el mapa
 * directamente (no hay Leaflet/MapLibre de por medio en su cálculo, ambos
 * usan la misma proyección Web Mercator con teselas de 256px), recibe
 * `center`/`zoom` como props — los mismos valores que ya tienes en
 * `v-model:center`/`v-model:zoom` de `ASMap`.
 */
export interface ScaleProps {
  /** Centro del mapa, en `[lat, lng]` (solo se usa la latitud: la escala de Web Mercator varía con ella). */
  center: [number, number]
  /** Zoom del mapa. */
  zoom: number
  /** @default 'bar' */
  mode?: ScaleMode
  /** Solo aplica con `mode: 'bar'`. @default 'metric' */
  units?: ScaleUnits
  /**
   * Ancho deseado de la regla graduada, en píxeles. Solo aplica con
   * `mode: 'bar'`. El ancho real puede ser algo menor, para que la
   * distancia total mostrada sea un número redondo (1/2/3/5 × una potencia
   * de 10). @default 100
   */
  width?: number
  /** Esquina donde se ancla. @default 'bottom-left' */
  position?: ScalePosition
  /**
   * Distancia entre el widget y los bordes del contenedor. Un `number` se
   * interpreta en píxeles; un `string` se usa tal cual. @default 20
   */
  offset?: string | number
  /** Tema visual. @default 'dark' */
  theme?: TimeControlsTheme
}
