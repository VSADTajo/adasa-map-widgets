import type { LatLng } from './map'

/**
 * Tipos de capa soportados por el sistema de capas dinámicas de `ASMap`.
 *
 * `'geoserver'` es un atajo sobre `'wms'`/`'wfs'` pensado para servidores
 * GeoServer (añade `workspace` y elige el modo de acceso), no un protocolo
 * distinto.
 */
export type LayerType = 'geojson' | 'wms' | 'wfs' | 'tiles' | 'geoserver'

/**
 * Geometría GeoJSON mínima. Se define localmente (en vez de depender del
 * paquete `@types/geojson`) para que el tipado de capas siga siendo
 * autocontenido: no se exige a los proyectos consumidores instalar ningún
 * paquete de tipos adicional.
 */
export interface GeoJsonGeometry {
  type: string
  coordinates: unknown
}

/** Feature GeoJSON mínimo, estructuralmente compatible con `@types/geojson`. */
export interface GeoJsonFeature<Properties = Record<string, unknown>> {
  type: 'Feature'
  geometry: GeoJsonGeometry | null
  properties: Properties
  id?: string | number
}

/** Colección de features GeoJSON mínima, estructuralmente compatible con `@types/geojson`. */
export interface GeoJsonFeatureCollection<Properties = Record<string, unknown>> {
  type: 'FeatureCollection'
  features: GeoJsonFeature<Properties>[]
}

/**
 * Capacidades de una capa, normalmente detectadas automáticamente a partir
 * de su configuración/metadatos (p. ej. GetCapabilities de WMS/WFS) más que
 * escritas a mano. Determinan qué widgets adicionales tiene sentido mostrar
 * para esa capa (control temporal, edición, filtros, buscador...).
 */
export interface LayerCapabilities {
  /** La capa tiene una dimensión temporal (WMS-T, o un `timeRange` explícito). */
  isTemporal: boolean
  /** La capa admite edición de features (típicamente WFS-T). */
  isEditable: boolean
  /** La capa admite filtrado (p. ej. CQL en WMS/WFS). */
  hasFilters: boolean
  /** La capa admite búsqueda de features. */
  hasSearch: boolean
  /** Rango temporal disponible, si `isTemporal` es `true`. */
  timeRange?: {
    start: Date
    end: Date
    /** Paso entre instantes, en horas. */
    step: number
  }
}

/** Opciones de una capa GeoJSON: datos ya resueltos o una URL de la que cargarlos. */
export interface GeoJSONOptions {
  /** Colección de features ya resuelta, o una URL desde la que cargarla. */
  data: GeoJsonFeatureCollection | string
  /** Estilo por feature. El tipo de retorno depende del motor de mapas subyacente. */
  style?: (feature: GeoJsonFeature) => Record<string, unknown>
  /** Fábrica de la capa a usar para features de tipo punto. */
  pointToLayer?: (feature: GeoJsonFeature, latlng: LatLng) => unknown
  /** Hook por feature (p. ej. para enlazar popups o listeners). */
  onEachFeature?: (feature: GeoJsonFeature, layer: unknown) => void
}

/** Opciones de una capa WMS (Web Map Service). */
export interface WMSOptions {
  /** URL del servidor WMS. */
  url: string
  /** Nombre(s) de capa del servidor, separados por coma. */
  layers: string
  /** @default 'image/png' */
  format?: string
  transparent?: boolean
  /** @default '1.3.0' */
  version?: string
  /** Instante para WMS temporales (p. ej. `'2024-01-01'` o un rango ISO). */
  time?: string
  /** Nombre del estilo SLD a aplicar. */
  style?: string
}

/** Opciones de una capa WFS (Web Feature Service). */
export interface WFSOptions {
  /** URL del servidor WFS. */
  url: string
  /** `workspace:featuretype`. */
  typeName: string
  /** @default 'application/json' */
  outputFormat?: string
  maxFeatures?: number
  /** Si es `true`, la capa admite añadir/editar features (WFS-T). */
  editable?: boolean
  /** Filtro CQL opcional. */
  cql_filter?: string
}

/** Opciones de una capa de teselas (cartografía base). */
export interface TilesOptions {
  /** Plantilla de URL, p. ej. `'https://tile.openstreetmap.org/{z}/{x}/{y}.png'`. */
  url: string
  attribution?: string
  maxZoom?: number
  minZoom?: number
}

/**
 * Opciones de una capa GeoServer: un atajo sobre WMS/WFS que añade el
 * `workspace` y deja elegir el modo de acceso (`mode`), en vez de repetir
 * `WMSOptions`/`WFSOptions` a mano para servidores GeoServer.
 */
export interface GeoServerOptions {
  /** URL base de GeoServer (sin `/wms` ni `/wfs`). */
  url: string
  workspace: string
  layer: string
  /** Protocolo a usar contra ese workspace/layer. */
  mode: 'wms' | 'wfs'
  /** Nombre del estilo SLD a aplicar (solo `mode: 'wms'`). */
  style?: string
  /** Filtro CQL opcional. */
  filter?: string
}

/** Unión de las opciones específicas de cada {@link LayerType}. */
export type LayerTypeOptions =
  GeoJSONOptions | WMSOptions | WFSOptions | TilesOptions | GeoServerOptions

/**
 * Configuración de una capa dinámica de `ASMap`. `options` no está acoplado
 * a `type` a nivel de tipos (es la unión completa `LayerTypeOptions`); quien
 * consuma `LayerConfig` debe usar `type` para discriminar qué forma de
 * `options` corresponde.
 */
export interface LayerConfig {
  /** Identificador único y estable de la capa. */
  id: string
  /** Nombre visible (p. ej. en un `ASMapDayIntervalControls`-like selector de capas). */
  name: string
  type: LayerType
  /** @default true */
  visible: boolean
  /** Opacidad, de 0 a 1. */
  opacity?: number
  /** Orden de renderizado (mayor = más arriba). */
  zIndex?: number
  options: LayerTypeOptions
  /** Detectadas automáticamente; no se espera que se escriban a mano. */
  capabilities?: LayerCapabilities
}

/** Se emite cuando una capa termina de cargar (con éxito o con error). */
export interface LayerLoadedEvent {
  layerId: string
  type: LayerType
  capabilities: LayerCapabilities
  /** Instancia real de la capa en el motor de mapas subyacente (opaca: su forma depende de Leaflet/MapLibre). */
  instance?: unknown
  error?: Error
}

/** Se emite cuando el usuario selecciona (p. ej. con click) un feature de una capa. */
export interface FeatureSelectedEvent {
  layerId: string
  feature: GeoJsonFeature
  properties: Record<string, unknown>
  coordinates: [number, number]
}
