import type { LatLng } from './map'

/**
 * Tipos de capa soportados por el sistema de capas dinámicas de `ASMap`.
 *
 * GeoServer no es un protocolo distinto (siempre sirve WMS o WFS), así que
 * no tiene su propio `LayerType`: usa el helper `geoServerLayer()` (ver
 * `src/layers/geoserver.ts`) para construir un `LayerConfig` de tipo
 * `'wms'`/`'wfs'` a partir de `url`/`workspace`/`layer`/`mode`, en vez de
 * concatenar la URL y el nombre `workspace:layer` a mano.
 */
export type LayerType = 'geojson' | 'topojson' | 'kml' | 'wms' | 'wfs' | 'tiles' | 'wmts' | 'cog'

/**
 * Naturaleza de una capa: si el cliente recibe/edita datos vectoriales en
 * bruto (features individuales, clicables), o solo una imagen ya renderizada
 * por el servidor (sin features, no clicable por feature).
 */
export type LayerKind = 'vector' | 'raster'

/** A qué {@link LayerKind} pertenece cada {@link LayerType}. */
export const LAYER_KIND: Record<LayerType, LayerKind> = {
  geojson: 'vector',
  topojson: 'vector',
  kml: 'vector',
  wfs: 'vector',
  wms: 'raster',
  tiles: 'raster',
  wmts: 'raster',
  cog: 'raster',
}

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

/**
 * Topología TopoJSON mínima. Se define localmente (mismo motivo que
 * {@link GeoJsonGeometry}): para que el tipado de capas siga siendo
 * autocontenido, sin exigir el paquete `@types/topojson-specification`.
 */
export interface TopoJSONTopology {
  type: 'Topology'
  /** Cada clave es un objeto (feature o colección) convertible a GeoJSON con `topojson-client`. */
  objects: Record<string, unknown>
  arcs: number[][][]
  transform?: { scale: [number, number]; translate: [number, number] }
  bbox?: number[]
}

/**
 * Opciones de una capa TopoJSON: como GeoJSON, pero con la topología
 * (arcos compartidos entre features) codificada de forma más compacta.
 * Requiere la dependencia opcional `topojson-client` para decodificarla.
 */
export interface TopoJSONOptions {
  /** Topología ya resuelta, o una URL desde la que cargarla. */
  data: TopoJSONTopology | string
  /**
   * Qué objeto(s) de `topology.objects` convertir a features (p. ej.
   * `'countries'`). Si se omite, se convierten todos los objetos de la
   * topología.
   */
  object?: string | string[]
  /** Estilo por feature. El tipo de retorno depende del motor de mapas subyacente. */
  style?: (feature: GeoJsonFeature) => Record<string, unknown>
  /** Fábrica de la capa a usar para features de tipo punto. */
  pointToLayer?: (feature: GeoJsonFeature, latlng: LatLng) => unknown
  /** Hook por feature (p. ej. para enlazar popups o listeners). */
  onEachFeature?: (feature: GeoJsonFeature, layer: unknown) => void
}

/**
 * Opciones de una capa KML/KMZ (Keyhole Markup Language). Se convierte a
 * GeoJSON internamente con la dependencia opcional `@tmcw/togeojson` (y
 * `fflate` si `data` apunta a un `.kmz`, que es un `.kml` comprimido en zip).
 */
export interface KMLOptions {
  /** URL de un `.kml`/`.kmz`, o contenido KML/XML ya cargado como texto. */
  data: string
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
 * Opciones de una capa WMTS (Web Map Tile Service). A diferencia de WMS
 * (una imagen por petición, cualquier bbox/tamaño), WMTS sirve teselas
 * pre-renderizadas fijas, como `'tiles'` pero describiéndolas con el
 * vocabulario del estándar OGC (`layer`/`style`/`tileMatrixSet`) en vez de
 * una URL ya armada.
 *
 * Admite los dos estilos de despliegue habituales, detectados automáticamente
 * a partir de `url` (ver `buildWmtsTileUrl` en `src/layers/wmts.ts`):
 * - **RESTful**: `url` ya es una plantilla de teselas (contiene `{z}`/`{x}`/`{y}`
 *   o los tokens WMTS equivalentes `{TileMatrix}`/`{TileRow}`/`{TileCol}`) — en
 *   este caso el resto de campos no se usan.
 * - **KVP**: `url` es el endpoint base del servicio, y se construye una
 *   petición `GetTile` con `layer`/`style`/`tileMatrixSet`/`format`.
 */
export interface WMTSOptions {
  /** URL base del servicio WMTS, o una plantilla de teselas ya resuelta. */
  url: string
  /** Nombre de la capa en el servidor. No se usa si `url` ya es una plantilla RESTful. */
  layer?: string
  /** @default 'default' */
  style?: string
  /** Identificador del TileMatrixSet, p. ej. `'EPSG:3857'` o `'GoogleMapsCompatible'`. @default 'EPSG:3857' */
  tileMatrixSet?: string
  /** @default 'image/png' */
  format?: string
  /** @default '1.0.0' */
  version?: string
  attribution?: string
  maxZoom?: number
  minZoom?: number
}

/**
 * Rampa de color lineal para GeoTIFFs de una sola banda (elevación,
 * interpolaciones, índices...): interpola entre `colors` según dónde caiga
 * el valor del píxel entre `min` y `max`. Compartida entre motores (ver
 * `interpolateColorScale` en `src/layers/cog.ts`) para que Leaflet y
 * MapLibre pinten el mismo GeoTIFF con los mismos colores.
 */
export interface COGColorScale {
  min: number
  max: number
  /** Colores del degradado (mínimo 2), en formato hexadecimal `#rrggbb`. @default ['#000000', '#ffffff'] */
  colors?: string[]
}

/**
 * Opciones de una capa COG (Cloud Optimized GeoTIFF): un GeoTIFF con sus
 * datos organizados en teselas internas + overviews, para que el cliente
 * solo pida por HTTP Range los bytes que necesita en cada zoom, sin un
 * servidor de teselas intermedio.
 *
 * Bajo el capó usa las dependencias opcionales `georaster` +
 * `georaster-layer-for-leaflet` en Leaflet, y `@geomatico/maplibre-cog-protocol`
 * en MapLibre — esta última **exige que el COG esté en EPSG:3857** (no
 * reproyecta; lanza si detecta otra proyección).
 */
export interface COGOptions {
  /** URL del GeoTIFF (idealmente Cloud Optimized, en EPSG:3857). */
  url: string
  /** Para GeoTIFFs de una sola banda: rampa de color a aplicar en vez de la escala de grises por defecto. */
  colorScale?: COGColorScale
}

/**
 * Parámetros del helper `geoServerLayer()` (ver `src/layers/geoserver.ts`):
 * no es la forma de `options` de ningún `LayerConfig` real (por eso no forma
 * parte de {@link LayerTypeOptions}) — es la entrada con la que se *construye*
 * uno, de tipo `'wms'`/`'wfs'` según `mode`, con la URL y el nombre
 * `workspace:layer` ya resueltos.
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
  /** Si es `true` y `mode: 'wfs'`, la capa admite añadir/editar features (WFS-T). Se ignora con `mode: 'wms'`. */
  editable?: boolean
}

/** Unión de las opciones específicas de cada {@link LayerType}. */
export type LayerTypeOptions =
  | GeoJSONOptions
  | TopoJSONOptions
  | KMLOptions
  | WMSOptions
  | WFSOptions
  | TilesOptions
  | WMTSOptions
  | COGOptions

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
