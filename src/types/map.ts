/**
 * Tipos agnósticos para describir el estado y la API de un mapa.
 *
 * La librería nunca importa Leaflet, Mapbox GL, OpenLayers, etc. En su lugar,
 * los widgets que necesitan interactuar con un mapa reciben (o inyectan) un
 * {@link MapAdapter}: un objeto pequeño que el proyecto consumidor implementa
 * para "traducir" estas operaciones genéricas a la librería de mapas real.
 */

/** Coordenada geográfica genérica. */
export interface LatLng {
  lat: number
  lng: number
}

/** Límites rectangulares de un mapa, en coordenadas geográficas. */
export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

/** Snapshot serializable del estado de la vista de un mapa. */
export interface MapViewState {
  center: LatLng
  zoom: number
  bounds?: MapBounds
}

/** Nombres de eventos de mapa soportados por {@link MapAdapter}. */
export type MapAdapterEvent = 'move' | 'zoom' | 'zoomstart' | 'zoomend' | 'click'

export type MapAdapterEventHandler = (state: MapViewState) => void

/**
 * Contrato mínimo que debe cumplir un adaptador de mapa para que los widgets
 * de esta librería puedan leer/controlar su estado sin conocer la librería
 * de mapas concreta (Leaflet, Mapbox GL, OpenLayers, ArcGIS...).
 *
 * @example
 * ```ts
 * // Ejemplo de adaptador para Leaflet, implementado en el proyecto consumidor:
 * const adapter: MapAdapter = {
 *   getZoom: () => leafletMap.getZoom(),
 *   setZoom: (z) => leafletMap.setZoom(z),
 *   getCenter: () => leafletMap.getCenter(),
 *   getMinZoom: () => leafletMap.getMinZoom(),
 *   getMaxZoom: () => leafletMap.getMaxZoom(),
 *   on: (evt, handler) => leafletMap.on(evt, () => handler(currentState())),
 *   off: (evt, handler) => leafletMap.off(evt, handler),
 * }
 * ```
 */
export interface MapAdapter {
  getZoom(): number
  setZoom(zoom: number): void
  getCenter(): LatLng
  setCenter?(center: LatLng): void
  getBounds?(): MapBounds
  getMinZoom?(): number
  getMaxZoom?(): number
  on(event: MapAdapterEvent, handler: MapAdapterEventHandler): void
  off(event: MapAdapterEvent, handler: MapAdapterEventHandler): void
}
