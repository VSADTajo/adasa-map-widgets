<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import type * as L from 'leaflet'
import type {
  MapLibreMap,
  MapMouseEvent as MapLibreMouseEvent,
  MapOptions as MapLibreMapOptions,
  NavigationControl as MapLibreNavigationControl,
} from 'maplibre-gl'
import { resolveNamespace } from '@/utils/resolveNamespace'
import { useLayerManager } from '@/composables/useLayerManager'
import { ensureCogProtocol } from '@/layers'
import type { FeatureSelectedEvent, LayerConfig, LayerLoadedEvent } from '@/types/layers'

/**
 * Contenedor de mapa agnóstico de la librería de mapas subyacente.
 *
 * Instancia Leaflet o MapLibre GL JS según `mapLibrary`, cargados de forma
 * perezosa vía `import()` dinámico — así ninguno de los dos es una
 * dependencia obligatoria del paquete (son `peerDependencies` opcionales):
 * solo se resuelven en tiempo de ejecución si el proyecto consumidor los
 * tiene instalados y usa `ASMap`. Por defecto muestra un mapa base de
 * OpenStreetMap (teselas ráster) para cualquiera de los dos motores.
 *
 * El resto de widgets de la librería nunca dependen de este componente ni
 * importan Leaflet/MapLibre directamente: se comunican con el mapa a través
 * de un `MapAdapter` (ver `src/types/map.ts`).
 *
 * El slot por defecto se renderiza en una capa superpuesta al mapa (mismo
 * tamaño, posicionada en absoluto), pensada para alojar los widgets de esta
 * librería posicionados sobre el mapa.
 *
 * @example Widgets superpuestos, en modo controlado
 * ```vue
 * <ASMap ref="mapRef" map-library="leaflet" :center="[40.4168, -3.7038]" :zoom="6">
 *   <ASMapTimeControls :timeline="timeline" v-model:current-time-index="index" v-model:is-playing="playing" />
 * </ASMap>
 * ```
 *
 * @example Capas dinámicas declarativas
 * ```vue
 * <ASMap
 *   :center="[40.4168, -3.7038]"
 *   :zoom="6"
 *   :layers="myLayers"
 *   @capability-detected="({ capability }) => (showTimeControls = capability === 'temporal')"
 * />
 * ```
 */
export interface ASMapProps {
  /** Motor de mapas a instanciar. @default 'leaflet' */
  mapLibrary?: 'leaflet' | 'maplibre'
  /** Centro del mapa, en `[lat, lng]`. */
  center: [number, number]
  /** Nivel de zoom. */
  zoom: number
  /**
   * Capas dinámicas a cargar sobre el mapa (GeoJSON, TopoJSON, KML, WMS, WFS,
   * Tiles, WMTS, COG; para GeoServer usa el helper `geoServerLayer()`, que no es un tipo
   * aparte), gestionadas internamente con `useLayerManager`. Se cargan al
   * montar (y al recrear el mapa, si cambia `mapLibrary`) y se sincronizan
   * reactivamente con este array: añadir, quitar o cambiar un elemento
   * añade, quita o recarga esa capa concreta.
   * @default []
   */
  layers?: LayerConfig[]
  /**
   * Límites máximos de navegación (el usuario no puede hacer pan fuera de
   * ellos): `[[latSur, lngOeste], [latNorte, lngEste]]`.
   */
  maxBounds?: [[number, number], [number, number]]
  /** Nivel de zoom mínimo permitido. */
  minZoom?: number
  /** Nivel de zoom máximo permitido. */
  maxZoom?: number
  /**
   * Si se indica (o cambia), encuadra el mapa a este bbox con `fitBounds`:
   * `[[latSur, lngOeste], [latNorte, lngEste]]`. Útil tras cargar una capa de
   * extensión desconocida. Para encuadrar de forma imperativa sin depender
   * de esta prop, usa el método `fitBounds` expuesto por el componente.
   */
  bounds?: [[number, number], [number, number]]
  /**
   * Si es `false`, desactiva el pan/zoom/click del usuario (mapa de solo
   * lectura, p. ej. para miniaturas o informes). @default true
   */
  interactive?: boolean
  /** Muestra los controles nativos de zoom (+/-). @default true */
  zoomControl?: boolean
  /** Muestra el control nativo de atribución. @default true */
  attributionControl?: boolean
  /**
   * Inclinación 3D del mapa, en grados (0 = vista cenital). Solo tiene
   * efecto con `mapLibrary="maplibre"`; Leaflet es estrictamente 2D y la
   * ignora. Úsalo con `v-model:pitch`. @default 0
   */
  pitch?: number
  /**
   * Rotación del mapa, en grados. Solo tiene efecto con
   * `mapLibrary="maplibre"`. Úsalo con `v-model:bearing`. @default 0
   */
  bearing?: number
  /**
   * Terreno 3D (relieve real, vía `map.setTerrain`) a partir de un DEM. Solo
   * tiene efecto con `mapLibrary="maplibre"`; Leaflet es estrictamente 2D y
   * la ignora. Combínalo con `pitch` para verlo en perspectiva: sin
   * inclinación, el relieve 3D no se aprecia (es solo una vista cenital del
   * mismo terreno). @default undefined (sin terreno)
   */
  terrain?: TerrainConfig
  /**
   * Basemaps disponibles. El caso simple (un único basemap fijo) es una
   * lista de un elemento; el caso con varios intercambiables es una lista
   * de 2+. ASMap no incluye ningún selector: es un componente controlado,
   * pensado para pilotarse desde un widget aparte (o tu propia UI) que lea
   * `basemaps` y escriba en `v-model:basemap`. Cambiar de basemap recrea el
   * mapa (igual que cambiar `mapLibrary`), recargando también `layers`.
   * @default Un único basemap de OpenStreetMap.
   */
  basemaps?: BasemapOption[]
  /**
   * Id del basemap activo (de `basemaps`). Componente controlado: usa
   * `v-model:basemap`. @default El primer elemento de `basemaps`.
   */
  basemap?: string
}

/** Un basemap seleccionable vía la prop `basemaps` de {@link ASMapProps}. */
export interface BasemapOption {
  id: string
  /** Etiqueta identificativa (útil para tu propia UI de selección). */
  name: string
  /**
   * URL de teselas (plantilla `{z}/{x}/{y}`), usada como capa base en
   * Leaflet y como fuente ráster del estilo por defecto en MapLibre.
   */
  tileLayer?: string
  /** Estilo de MapLibre GL JS. Si se indica, tiene prioridad sobre `tileLayer` en ese motor. */
  style?: string | Record<string, unknown>
  /** Atribución de este basemap. @default Atribución de OpenStreetMap. */
  attribution?: string
  /**
   * URL de una imagen de miniatura para mostrar en selectores de basemap (p.
   * ej. `ASMapBasemapsSelector`). Si se omite, esos widgets muestran un
   * marcador de posición con la inicial de `name`.
   */
  thumbnail?: string
}

/**
 * Configuración de terreno 3D vía la prop `terrain` de {@link ASMapProps}.
 * Solo tiene efecto con `mapLibrary="maplibre"`.
 */
export interface TerrainConfig {
  /**
   * URL del DEM: una plantilla de teselas terrain-RGB corriente (con
   * `{z}/{x}/{y}`), o la URL de un GeoTIFF de elevación (idealmente un COG,
   * en EPSG:3857) — se resuelve vía el protocolo `cog://#dem` de
   * `@geomatico/maplibre-cog-protocol`, la misma dependencia opcional que ya
   * usan las capas de tipo `'cog'` (ver `src/layers/maplibre.ts`).
   */
  url: string
  /** Multiplicador de la exageración vertical del relieve. @default 1 */
  exaggeration?: number
  /**
   * Codificación de las teselas terrain-RGB (`'mapbox'` o `'terrarium'`). No
   * aplica si `url` es un GeoTIFF: el protocolo `cog://#dem` ya lo codifica
   * él mismo. @default 'mapbox'
   */
  encoding?: 'mapbox' | 'terrarium'
  /** Tamaño de tesela esperado por la fuente `raster-dem`. @default 256 */
  tileSize?: number
}

/** Capacidad de una capa relevante para decidir qué widget mostrar (ver evento `capability-detected`). */
export type LayerCapabilityName = 'temporal' | 'editable' | 'filterable' | 'searchable'

/** Atribución obligatoria de OpenStreetMap. */
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

/** Basemap usado cuando no se indica `basemaps` (o se indica vacío). */
function createDefaultBasemap(): BasemapOption {
  return {
    id: 'default',
    name: 'OpenStreetMap',
    tileLayer: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: OSM_ATTRIBUTION,
  }
}

/** Construye un estilo mínimo de MapLibre que pinta teselas ráster (p. ej. de OpenStreetMap). */
function buildRasterStyle(tileUrl: string, attribution: string): Record<string, unknown> {
  return {
    version: 8,
    sources: {
      'raster-tiles': {
        type: 'raster',
        tiles: [tileUrl],
        tileSize: 256,
        attribution,
      },
    },
    layers: [{ id: 'raster-tiles', type: 'raster', source: 'raster-tiles' }],
  }
}

/** Convierte nuestro formato de bbox `[[latSur, lngOeste], [latNorte, lngEste]]` al de MapLibre (`[[lng, lat], [lng, lat]]`). */
function toMaplibreBounds(
  bounds: [[number, number], [number, number]],
): [[number, number], [number, number]] {
  const [[southLat, westLng], [northLat, eastLng]] = bounds
  return [
    [westLng, southLat],
    [eastLng, northLat],
  ]
}

/** Compara dos centros con una tolerancia pequeña, para no reaccionar a redondeos de la propia librería de mapas. */
function isSameCenter(a: [number, number], b: [number, number]): boolean {
  const epsilon = 1e-6
  return Math.abs(a[0] - b[0]) < epsilon && Math.abs(a[1] - b[1]) < epsilon
}

/** Desactiva todas las interacciones del usuario en un mapa Leaflet (no existe una única opción como en MapLibre). */
function disableLeafletInteractions(map: L.Map): void {
  map.dragging.disable()
  map.touchZoom.disable()
  map.doubleClickZoom.disable()
  map.scrollWheelZoom.disable()
  map.boxZoom.disable()
  map.keyboard.disable()
  // `tap` (soporte táctil) no está tipado en @types/leaflet pero existe en runtime.
  ;(map as unknown as { tap?: { disable: () => void } }).tap?.disable()
}

/** Id fijo de la fuente `raster-dem` que respalda la prop `terrain`. */
const TERRAIN_SOURCE_ID = 'as-map-terrain-dem'

function waitForMaplibreStyleLoaded(map: MapLibreMap): Promise<void> {
  if (map.isStyleLoaded()) return Promise.resolve()
  return new Promise((resolve) => {
    map.once('load', () => resolve())
  })
}

/**
 * Activa (o reemplaza) el terreno 3D sobre una fuente `raster-dem` propia.
 * Si `terrain.url` no es una plantilla de teselas (no contiene `{z}`), se
 * trata como un GeoTIFF de elevación y se resuelve vía `cog://...#dem`
 * (registrando antes el protocolo `cog://` si hiciera falta — ver
 * `ensureCogProtocol` en `src/layers/maplibre.ts`).
 */
async function applyTerrain(map: MapLibreMap, terrain: TerrainConfig): Promise<void> {
  const isTileTemplate = terrain.url.includes('{z}')
  if (!isTileTemplate) await ensureCogProtocol()
  await waitForMaplibreStyleLoaded(map)

  if (map.getSource(TERRAIN_SOURCE_ID)) {
    map.setTerrain(null)
    map.removeSource(TERRAIN_SOURCE_ID)
  }

  const source: Record<string, unknown> = {
    type: 'raster-dem',
    tileSize: terrain.tileSize ?? 256,
    ...(isTileTemplate
      ? { tiles: [terrain.url], encoding: terrain.encoding ?? 'mapbox' }
      : { url: `cog://${terrain.url}#dem` }),
  }
  map.addSource(TERRAIN_SOURCE_ID, source as Parameters<MapLibreMap['addSource']>[1])
  map.setTerrain({ source: TERRAIN_SOURCE_ID, exaggeration: terrain.exaggeration ?? 1 })
}

/** Desactiva el terreno 3D y libera su fuente. No hace nada si no había ninguno activo. */
function clearTerrain(map: MapLibreMap): void {
  map.setTerrain(null)
  if (map.getSource(TERRAIN_SOURCE_ID)) map.removeSource(TERRAIN_SOURCE_ID)
}

const props = withDefaults(defineProps<ASMapProps>(), {
  mapLibrary: 'leaflet',
  layers: () => [],
  maxBounds: undefined,
  minZoom: undefined,
  maxZoom: undefined,
  bounds: undefined,
  interactive: true,
  zoomControl: true,
  attributionControl: true,
  pitch: 0,
  bearing: 0,
  terrain: undefined,
  basemaps: () => [],
  basemap: undefined,
})

const emit = defineEmits<{
  /** El mapa terminó de inicializarse (o se reinicializó, p. ej. tras cambiar `mapLibrary`). */
  'map-ready': [map: L.Map | MapLibreMap]
  /** El usuario cambió el centro del mapa (pan). Úsalo con `v-model:center`. */
  'update:center': [center: [number, number]]
  /** El usuario cambió el zoom del mapa. Úsalo con `v-model:zoom`. */
  'update:zoom': [zoom: number]
  /** El usuario cambió la inclinación 3D (solo MapLibre). Úsalo con `v-model:pitch`. */
  'update:pitch': [pitch: number]
  /** El usuario rotó el mapa (solo MapLibre). Úsalo con `v-model:bearing`. */
  'update:bearing': [bearing: number]
  /** El basemap activo cambió. Úsalo con `v-model:basemap`. */
  'update:basemap': [id: string]
  /** Click en el mapa que no ha encontrado ningún feature (para eso está `feature-selected`). */
  'map-click': [event: { coordinates: [number, number] }]
  'layer-loaded': [event: LayerLoadedEvent]
  'layer-error': [event: { layerId: string; error: Error }]
  'layer-unloaded': [event: { layerId: string }]
  'layer-visibility-changed': [event: { layerId: string; visible: boolean }]
  'feature-selected': [event: FeatureSelectedEvent]
  'capability-detected': [event: { layerId: string; capability: LayerCapabilityName }]
}>()

const containerEl = ref<HTMLDivElement | null>(null)
const mapInstance = shallowRef<L.Map | MapLibreMap | null>(null)
/** Mensaje de error legible cuando la librería de mapas elegida no está instalada. */
const loadError = ref<string | null>(null)

const layerManager = useLayerManager(
  mapInstance,
  computed(() => props.mapLibrary),
)
layerManager.on('layer-loaded', (event) => emit('layer-loaded', event))
layerManager.on('layer-error', (event) => emit('layer-error', event))
layerManager.on('layer-unloaded', (event) => emit('layer-unloaded', event))
layerManager.on('layer-visibility-changed', (event) => emit('layer-visibility-changed', event))
layerManager.on('feature-selected', (event) => emit('feature-selected', event))
layerManager.on('capability-detected', (event) => emit('capability-detected', event))

/** El basemap activo entre `basemaps`: el que coincide con `basemap`, o el primero si no se indica. */
function resolveBasemap(): BasemapOption {
  if (!props.basemaps.length) return createDefaultBasemap()
  const id = props.basemap ?? props.basemaps[0]!.id
  return props.basemaps.find((option) => option.id === id) ?? props.basemaps[0]!
}

/** Resuelve la capa base final a partir del basemap activo. */
function resolveBaseLayer(): {
  tileLayer: string
  style?: string | Record<string, unknown>
  attribution: string
} {
  const active = resolveBasemap()
  return {
    tileLayer: active.tileLayer ?? createDefaultBasemap().tileLayer!,
    style: active.style,
    attribution: active.attribution ?? OSM_ATTRIBUTION,
  }
}

async function createLeafletMap(el: HTMLDivElement): Promise<L.Map> {
  const [leafletModule] = await Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')])
  const Leaflet = resolveNamespace<typeof L>(leafletModule)
  const base = resolveBaseLayer()
  const map = Leaflet.map(el, {
    center: props.center,
    zoom: props.zoom,
    minZoom: props.minZoom,
    maxZoom: props.maxZoom,
    maxBounds: props.maxBounds,
    zoomControl: props.zoomControl,
    attributionControl: props.attributionControl,
  })
  Leaflet.tileLayer(base.tileLayer, {
    attribution: base.attribution,
    maxZoom: 19,
  }).addTo(map)

  if (!props.interactive) disableLeafletInteractions(map)

  map.on('moveend', () => {
    const center = map.getCenter()
    const next: [number, number] = [center.lat, center.lng]
    if (!isSameCenter(next, props.center)) emit('update:center', next)
  })
  map.on('zoomend', () => {
    const zoom = map.getZoom()
    if (zoom !== props.zoom) emit('update:zoom', zoom)
  })
  map.on('click', (event: L.LeafletMouseEvent) => {
    // Los clicks sobre un feature cortan su propagación en `bindFeatureClick`
    // (src/layers/leaflet.ts): si este handler se dispara, no encontró ninguno.
    emit('map-click', { coordinates: [event.latlng.lng, event.latlng.lat] })
  })

  return map
}

interface MaplibreNamespace {
  Map: new (options: MapLibreMapOptions) => MapLibreMap
  NavigationControl: new () => MapLibreNavigationControl
  setWorkerUrl: (url: string) => void
}

async function createMaplibreMap(el: HTMLDivElement): Promise<MapLibreMap> {
  const [maplibreModule, , workerUrlModule] = await Promise.all([
    import('maplibre-gl'),
    import('maplibre-gl/dist/maplibre-gl.css'),
    // MapLibre procesa GeoJSON/vectores en un Web Worker; con Vite hay que
    // resolver su URL vía `?worker&url` y pasársela a `setWorkerUrl` antes de
    // crear el mapa (ver leaflet-maplibre-css.d.ts para el porqué).
    import('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'),
  ])
  const maplibregl = resolveNamespace<MaplibreNamespace>(maplibreModule)
  maplibregl.setWorkerUrl(workerUrlModule.default)
  const base = resolveBaseLayer()
  const map = new maplibregl.Map({
    container: el,
    center: [props.center[1], props.center[0]], // maplibre usa [lng, lat]
    zoom: props.zoom,
    style: base.style ?? buildRasterStyle(base.tileLayer, base.attribution),
    minZoom: props.minZoom,
    maxZoom: props.maxZoom,
    maxBounds: props.maxBounds ? toMaplibreBounds(props.maxBounds) : undefined,
    interactive: props.interactive,
    attributionControl: props.attributionControl ? undefined : false,
    pitch: props.pitch,
    bearing: props.bearing,
  } as MapLibreMapOptions)

  if (props.zoomControl) {
    map.addControl(new maplibregl.NavigationControl())
  }

  map.on('moveend', () => {
    const center = map.getCenter()
    const next: [number, number] = [center.lat, center.lng]
    if (!isSameCenter(next, props.center)) emit('update:center', next)
  })
  map.on('zoomend', () => {
    const zoom = map.getZoom()
    if (zoom !== props.zoom) emit('update:zoom', zoom)
  })
  map.on('pitchend', () => {
    const pitch = map.getPitch()
    if (pitch !== props.pitch) emit('update:pitch', pitch)
  })
  map.on('rotateend', () => {
    const bearing = map.getBearing()
    if (bearing !== props.bearing) emit('update:bearing', bearing)
  })
  map.on('click', (event: MapLibreMouseEvent) => {
    // A diferencia de Leaflet, un click sobre un feature de nuestras capas
    // (fill/line/circle) SÍ llega también a este handler genérico (MapLibre
    // no propaga entre listeners como el DOM): hay que comprobar a mano si
    // el punto tiene algún feature renderizado antes de emitir `map-click`.
    const features = map.queryRenderedFeatures(event.point)
    if (features.length === 0) {
      emit('map-click', { coordinates: [event.lngLat.lng, event.lngLat.lat] })
    }
  })

  // No se espera (fire-and-forget): igual que `syncLayers`, no debe bloquear
  // `map-ready` a que termine de resolverse un DEM remoto.
  if (props.terrain) void applyTerrain(map, props.terrain)

  return map
}

function destroyMap(): void {
  // `map.remove()` ya desmonta paneles/capas/renderers de forma atómica: no
  // hay que desmontar cada capa a mano antes (`unloadAll()` es para "quitar
  // todas las capas pero dejar el mapa vivo"; hacerlo aquí deja el renderer
  // SVG/Canvas de Leaflet en un estado que `map.remove()` no espera y lanza
  // al intentar limpiarlo por segunda vez). Solo hay que limpiar nuestro
  // propio estado interno.
  layerManager.reset()
  mapInstance.value?.remove()
  mapInstance.value = null
}

/** Compara dos `LayerConfig` ignorando `capabilities` (que solo existe una vez cargada la capa). */
function isSameLayerConfig(a: LayerConfig, b: LayerConfig): boolean {
  const strip = (layer: LayerConfig): string =>
    JSON.stringify({ ...layer, capabilities: undefined })
  return strip(a) === strip(b)
}

/** Sincroniza las capas cargadas con `nextLayers`: carga las nuevas, quita las que ya no están y recarga las que cambiaron. */
function syncLayers(nextLayers: LayerConfig[]): void {
  if (!mapInstance.value) return
  const nextIds = new Set(nextLayers.map((layer) => layer.id))

  for (const id of Array.from(layerManager.layers.value.keys())) {
    if (!nextIds.has(id)) layerManager.unloadLayer(id)
  }

  for (const layer of nextLayers) {
    const current = layerManager.layers.value.get(layer.id)
    if (!current) {
      void layerManager.loadLayer(layer)
    } else if (!isSameLayerConfig(current as LayerConfig, layer)) {
      layerManager.unloadLayer(layer.id)
      void layerManager.loadLayer(layer)
    }
  }
}

/** Encuadra el mapa a un bbox `[[latSur, lngOeste], [latNorte, lngEste]]`. No hace nada si el mapa aún no existe. */
function fitBounds(bounds: [[number, number], [number, number]]): void {
  const map = mapInstance.value
  if (!map) return
  if (props.mapLibrary === 'leaflet') (map as L.Map).fitBounds(bounds)
  else (map as MapLibreMap).fitBounds(toMaplibreBounds(bounds))
}

async function createMap(): Promise<void> {
  destroyMap()
  loadError.value = null
  const el = containerEl.value
  if (!el) return

  try {
    mapInstance.value =
      props.mapLibrary === 'leaflet' ? await createLeafletMap(el) : await createMaplibreMap(el)
    emit('map-ready', mapInstance.value)
    if (props.bounds) fitBounds(props.bounds)
    syncLayers(props.layers)
  } catch (error) {
    loadError.value =
      props.mapLibrary === 'leaflet'
        ? 'No se pudo cargar Leaflet. Instala la dependencia opcional: npm i leaflet'
        : 'No se pudo cargar MapLibre GL JS. Instala la dependencia opcional: npm i maplibre-gl'
    console.error('[ASMap]', error)
  }
}

onMounted(createMap)
onBeforeUnmount(destroyMap)

watch(() => props.mapLibrary, createMap)
watch(() => props.layers, syncLayers, { deep: true })
watch(
  () => props.bounds,
  (next) => {
    if (next) fitBounds(next)
  },
)

/** Refleja un `center`/`zoom` cambiado externamente (p. ej. desde `v-model`) en el mapa ya creado. */
watch([() => props.center, () => props.zoom], ([nextCenter, nextZoom]) => {
  const map = mapInstance.value
  if (!map) return
  const current = map.getCenter()
  if (isSameCenter([current.lat, current.lng], nextCenter) && map.getZoom() === nextZoom) return

  if (props.mapLibrary === 'leaflet') {
    ;(map as L.Map).setView(nextCenter, nextZoom)
  } else {
    ;(map as MapLibreMap).jumpTo({ center: [nextCenter[1], nextCenter[0]], zoom: nextZoom })
  }
})

/** Refleja `pitch`/`bearing` cambiados externamente. No tiene efecto en Leaflet (es 2D). */
watch([() => props.pitch, () => props.bearing], ([nextPitch, nextBearing]) => {
  const map = mapInstance.value
  if (!map || props.mapLibrary !== 'maplibre') return
  const maplibreMap = map as MapLibreMap
  if (maplibreMap.getPitch() === nextPitch && maplibreMap.getBearing() === nextBearing) return
  maplibreMap.jumpTo({ pitch: nextPitch, bearing: nextBearing })
})

/** Activa/reemplaza/quita el terreno 3D cuando cambia `terrain`. No tiene efecto en Leaflet (es 2D). */
watch(
  () => props.terrain,
  (next) => {
    const map = mapInstance.value
    if (!map || props.mapLibrary !== 'maplibre') return
    const maplibreMap = map as MapLibreMap
    if (next) void applyTerrain(maplibreMap, next)
    else clearTerrain(maplibreMap)
  },
  { deep: true },
)

/** Cambiar de basemap recrea el mapa entero (misma vía que cambiar `mapLibrary`). */
watch(() => props.basemap, createMap)

/**
 * Devuelve la instancia real del mapa (`L.Map` o `maplibregl.Map`), o `null`
 * si aún no se inicializó (o si la librería correspondiente no está instalada).
 * Para reaccionar cuando el mapa pasa a estar disponible (p. ej. desde
 * `useLayerManager`), usa el propio `mapInstanceRef` expuesto en vez de
 * sondear este método.
 */
function getMapInstance(): L.Map | MapLibreMap | null {
  return mapInstance.value
}

defineExpose({
  getMapInstance,
  mapInstanceRef: mapInstance,
  /** Capas dinámicas actualmente cargadas (reactivo, de solo lectura). */
  layers: layerManager.layers,
  loadingLayers: layerManager.loadingLayers,
  layerErrors: layerManager.errors,
  /** Carga/quita/alterna una capa de forma imperativa, además de por la prop `layers`. */
  loadLayer: layerManager.loadLayer,
  unloadLayer: layerManager.unloadLayer,
  toggleLayerVisibility: layerManager.toggleLayerVisibility,
  getLayersWithCapability: layerManager.getLayersWithCapability,
  /** Encuadra el mapa a un bbox `[[latSur, lngOeste], [latNorte, lngEste]]`, sin depender de la prop `bounds`. */
  fitBounds,
})
</script>

<template>
  <div class="as-map-container">
    <div ref="containerEl" class="as-map-container__surface" />
    <div v-if="loadError" class="as-map-container__error">{{ loadError }}</div>
    <div class="as-map-container__overlay">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.as-map-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--amw-color-surface-muted, #f1f5f9);
}

.as-map-container__surface {
  position: absolute;
  inset: 0;
  /*
   * Leaflet asigna z-index explícitos a sus panes internos (teselas,
   * marcadores, popups, controles nativos: 200-800). Sin un z-index propio
   * aquí, este contenedor no crea su propio contexto de apilamiento y esos
   * valores "se escapan", compitiendo directamente con `.as-map-container__overlay`
   * (nuestros widgets) y pintando por encima. Fijar z-index:0 contiene a
   * Leaflet dentro de este contexto; MapLibre (un único <canvas>, sin panes
   * con z-index) no lo necesita, pero no le afecta.
   */
  z-index: 0;
}

.as-map-container__error {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
  font-family: var(--amw-font-family, system-ui, sans-serif);
  font-size: 0.85rem;
  color: var(--amw-color-text-muted, #64748b);
  background-color: var(--amw-color-surface, #fff);
}

.as-map-container__overlay {
  position: absolute;
  inset: 0;
  /* Debe pintarse siempre por encima del contexto de apilamiento del mapa. */
  z-index: 1;
  pointer-events: none;
}

.as-map-container__overlay :deep(> *) {
  pointer-events: auto;
}
</style>
