import type {
  GetResourceResponse,
  MapLayerMouseEvent,
  MapLibreMap,
  RequestParameters,
} from 'maplibre-gl'
import { resolveNamespace } from '@/utils/resolveNamespace'
import type {
  COGOptions,
  GeoJSONOptions,
  GeoJsonFeature,
  KMLOptions,
  LayerCapabilities,
  LayerConfig,
  LayerType,
  MVTOptions,
  TilesOptions,
  TopoJSONOptions,
  WFSOptions,
  WMSOptions,
  WMTSOptions,
} from '@/types/layers'
import {
  detectGeoJSONCapabilities,
  detectTilesCapabilities,
  detectWFSCapabilities,
  detectWMSCapabilities,
} from './capabilities'
import { fetchWfsFeatures } from './wfs'
import { resolveTopoJsonData } from './topojson'
import { resolveKmlData } from './kml'
import { buildWmtsTileUrl } from './wmts'
import { interpolateColorScale } from './cog'
import {
  toErrorInstance,
  type LayerRenderer,
  type LayerRenderHooks,
  type RenderedLayer,
} from './types'

/**
 * Registro de renderers de capas dinámicas para MapLibre GL JS.
 *
 * MapLibre no tiene clases de capa equivalentes a `L.GeoJSON`/`L.TileLayer.WMS`:
 * todo se modela como `source` + `layer` declarativos dentro de su style.
 * Por eso el `style`/`pointToLayer`/`onEachFeature` por feature de
 * {@link GeoJSONOptions} (funciones JS que Leaflet invoca al vuelo) son una
 * capacidad **exclusiva de Leaflet** aquí: MapLibre estiliza con expresiones
 * declarativas (`paint`), no con un callback por feature. Este registro
 * aplica un estilo por defecto razonable (mismo color/opacidad para toda la
 * capa); para estilos data-driven, usa expresiones de MapLibre basadas en
 * `properties` sobre el `instance.layerIds` devuelto.
 */

/** Solo lo que se necesita de `maplibre-gl` aquí: registrar el protocolo `cog://` (ver `MaplibreNamespace` en `ASMap.vue` para el mismo patrón). */
interface MaplibreGlNamespace {
  addProtocol: (
    name: string,
    handler: (params: RequestParameters) => Promise<GetResourceResponse<unknown>>,
  ) => void
}

async function loadMaplibreGl(): Promise<MaplibreGlNamespace> {
  const mod = await import('maplibre-gl')
  return resolveNamespace<MaplibreGlNamespace>(mod)
}

type MaplibreCogProtocolModule = typeof import('@geomatico/maplibre-cog-protocol')

async function loadMaplibreCogProtocol(): Promise<MaplibreCogProtocolModule> {
  const mod = await import('@geomatico/maplibre-cog-protocol')
  return resolveNamespace<MaplibreCogProtocolModule>(mod)
}

/**
 * Registra el protocolo `cog://` en MapLibre la primera vez que se necesita
 * (registrarlo de nuevo es una operación segura, pero no hace falta
 * repetirla). Exportada porque no solo la usa `renderCOG` aquí: `ASMap.vue`
 * también la necesita para su prop `terrain` cuando el DEM es un GeoTIFF en
 * vez de una plantilla de teselas terrain-RGB corriente.
 */
let cogProtocolRegistration: Promise<MaplibreCogProtocolModule> | undefined

export async function ensureCogProtocol(): Promise<MaplibreCogProtocolModule> {
  if (!cogProtocolRegistration) {
    cogProtocolRegistration = Promise.all([loadMaplibreGl(), loadMaplibreCogProtocol()]).then(
      ([maplibregl, cogProtocolModule]) => {
        maplibregl.addProtocol('cog', cogProtocolModule.cogProtocol)
        return cogProtocolModule
      },
    )
  }
  return cogProtocolRegistration
}

function waitForStyleLoaded(map: MapLibreMap): Promise<void> {
  if (map.isStyleLoaded()) return Promise.resolve()
  return new Promise((resolve) => {
    map.once('load', () => resolve())
  })
}

/**
 * Añade una fuente `geojson` y capas `fill`/`line`/`circle` (filtradas por
 * tipo de geometría) para poder representar cualquier mezcla de
 * puntos/líneas/polígonos con una única fuente.
 */
function addGeoJsonLayers(
  map: MapLibreMap,
  sourceId: string,
  data: GeoJSON.GeoJSON | string,
  opacity: number,
): string[] {
  map.addSource(sourceId, { type: 'geojson', data })

  const fillId = `${sourceId}-fill`
  const lineId = `${sourceId}-line`
  const circleId = `${sourceId}-circle`

  map.addLayer({
    id: fillId,
    type: 'fill',
    source: sourceId,
    filter: ['==', ['geometry-type'], 'Polygon'],
    paint: { 'fill-color': '#2563eb', 'fill-opacity': 0.35 * opacity },
  })
  map.addLayer({
    id: lineId,
    type: 'line',
    source: sourceId,
    filter: ['in', ['geometry-type'], ['literal', ['LineString', 'Polygon']]],
    paint: { 'line-color': '#2563eb', 'line-width': 2, 'line-opacity': opacity },
  })
  map.addLayer({
    id: circleId,
    type: 'circle',
    source: sourceId,
    filter: ['==', ['geometry-type'], 'Point'],
    paint: { 'circle-color': '#2563eb', 'circle-radius': 5, 'circle-opacity': opacity },
  })

  return [fillId, lineId, circleId]
}

/**
 * Como {@link addGeoJsonLayers}, pero para una fuente `vector` (MVT): cada
 * capa de estilo necesita además `source-layer` (la sub-capa dentro de la
 * tesela a dibujar) — a diferencia de GeoJSON, una fuente vectorial no tiene
 * un único conjunto de features, sino varios por nombre. No añade la fuente
 * (a diferencia de `addGeoJsonLayers`): su forma difiere según sea `tiles` o
 * `url`, así que la añade quien llama.
 */
function addVectorTileLayers(
  map: MapLibreMap,
  sourceId: string,
  sourceLayer: string,
  opacity: number,
): string[] {
  const fillId = `${sourceId}-fill`
  const lineId = `${sourceId}-line`
  const circleId = `${sourceId}-circle`

  map.addLayer({
    id: fillId,
    type: 'fill',
    source: sourceId,
    'source-layer': sourceLayer,
    filter: ['==', ['geometry-type'], 'Polygon'],
    paint: { 'fill-color': '#2563eb', 'fill-opacity': 0.35 * opacity },
  })
  map.addLayer({
    id: lineId,
    type: 'line',
    source: sourceId,
    'source-layer': sourceLayer,
    filter: ['in', ['geometry-type'], ['literal', ['LineString', 'Polygon']]],
    paint: { 'line-color': '#2563eb', 'line-width': 2, 'line-opacity': opacity },
  })
  map.addLayer({
    id: circleId,
    type: 'circle',
    source: sourceId,
    'source-layer': sourceLayer,
    filter: ['==', ['geometry-type'], 'Point'],
    paint: { 'circle-color': '#2563eb', 'circle-radius': 5, 'circle-opacity': opacity },
  })

  return [fillId, lineId, circleId]
}

/** Muestra u oculta una o más capas de estilo ya añadidas al mapa. */
function setLayersVisible(map: MapLibreMap, layerIds: string[], visible: boolean): void {
  for (const id of layerIds) {
    if (map.getLayer(id)) {
      map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none')
    }
  }
}

function removeGeoJsonLayers(map: MapLibreMap, sourceId: string, layerIds: string[]): void {
  for (const id of layerIds) {
    if (map.getLayer(id)) map.removeLayer(id)
  }
  if (map.getSource(sourceId)) map.removeSource(sourceId)
}

/** Reenvía el click sobre features de una capa (vía `hooks.onFeatureSelected`) y devuelve cómo desligarlo. */
function bindLayerClick(
  map: MapLibreMap,
  renderedLayerId: string,
  layerId: string,
  hooks: LayerRenderHooks,
): () => void {
  const handler = (event: MapLayerMouseEvent): void => {
    const feature = event.features?.[0]
    if (!feature) return
    hooks.onFeatureSelected?.({
      layerId,
      feature: feature as unknown as GeoJsonFeature,
      properties: (feature.properties ?? {}) as Record<string, unknown>,
      coordinates: [event.lngLat.lng, event.lngLat.lat],
    })
  }
  map.on('click', renderedLayerId, handler)
  return () => map.off('click', renderedLayerId, handler)
}

/** Payload de error común a todos los `render*`: sin instancia, sin efecto al quitar/mostrar. */
function toErrorResult(
  layer: LayerConfig,
  capabilities: LayerCapabilities,
  error: unknown,
): RenderedLayer {
  return {
    event: { layerId: layer.id, type: layer.type, capabilities, error: toErrorInstance(error) },
    remove: () => {},
    setVisible: () => {},
  }
}

/**
 * Vuelca datos GeoJSON ya resueltos (venga directamente de una capa
 * `'geojson'`, o convertidos desde TopoJSON/KML) como fuente+capas de
 * MapLibre. Admite tanto una URL (MapLibre la resuelve él mismo) como un
 * objeto ya parseado — TopoJSON/KML siempre pasan el objeto, porque MapLibre
 * no entiende esos formatos de origen, solo GeoJSON.
 */
async function renderGeoJsonFeatureCollection(
  map: MapLibreMap,
  layer: LayerConfig,
  hooks: LayerRenderHooks,
  data: GeoJSON.GeoJSON | string,
  capabilities: LayerCapabilities,
): Promise<RenderedLayer> {
  await waitForStyleLoaded(map)
  const sourceId = layer.id
  const layerIds = addGeoJsonLayers(map, sourceId, data, layer.opacity ?? 1)
  const unbind = hooks.onFeatureSelected
    ? layerIds.map((id) => bindLayerClick(map, id, layer.id, hooks))
    : []

  return {
    event: {
      layerId: layer.id,
      type: layer.type,
      capabilities,
      instance: { sourceId, layerIds },
    },
    remove: () => {
      unbind.forEach((off) => off())
      removeGeoJsonLayers(map, sourceId, layerIds)
    },
    setVisible: (visible) => setLayersVisible(map, layerIds, visible),
  }
}

async function renderGeoJSON(
  map: MapLibreMap,
  layer: LayerConfig,
  hooks: LayerRenderHooks,
): Promise<RenderedLayer> {
  const options = layer.options as GeoJSONOptions
  const capabilities = detectGeoJSONCapabilities(layer)
  try {
    const data =
      typeof options.data === 'string' ? options.data : (options.data as unknown as GeoJSON.GeoJSON)
    return await renderGeoJsonFeatureCollection(map, layer, hooks, data, capabilities)
  } catch (error) {
    return toErrorResult(layer, capabilities, error)
  }
}

async function renderTopoJSON(
  map: MapLibreMap,
  layer: LayerConfig,
  hooks: LayerRenderHooks,
): Promise<RenderedLayer> {
  const options = layer.options as TopoJSONOptions
  const capabilities = detectGeoJSONCapabilities(layer)
  try {
    const data = await resolveTopoJsonData(options)
    return await renderGeoJsonFeatureCollection(
      map,
      layer,
      hooks,
      data as unknown as GeoJSON.GeoJSON,
      capabilities,
    )
  } catch (error) {
    return toErrorResult(layer, capabilities, error)
  }
}

async function renderKML(
  map: MapLibreMap,
  layer: LayerConfig,
  hooks: LayerRenderHooks,
): Promise<RenderedLayer> {
  const options = layer.options as KMLOptions
  const capabilities = detectGeoJSONCapabilities(layer)
  try {
    const data = await resolveKmlData(options)
    return await renderGeoJsonFeatureCollection(
      map,
      layer,
      hooks,
      data as unknown as GeoJSON.GeoJSON,
      capabilities,
    )
  } catch (error) {
    return toErrorResult(layer, capabilities, error)
  }
}

/** Construye la URL de teselas WMS GetMap que espera una fuente `raster` de MapLibre. */
function buildWmsTileUrl(options: WMSOptions): string {
  const version = options.version ?? '1.3.0'
  const params: Record<string, string> = {
    service: 'WMS',
    request: 'GetMap',
    version,
    layers: options.layers,
    styles: options.style ?? '',
    format: options.format ?? 'image/png',
    transparent: String(options.transparent ?? true),
    width: '256',
    height: '256',
  }
  // La 1.3.0 usa el parámetro CRS; las versiones anteriores, SRS.
  params[version === '1.3.0' ? 'crs' : 'srs'] = 'EPSG:3857'
  if (options.time) params.time = options.time

  return `${options.url}?${new URLSearchParams(params).toString()}&bbox={bbox-epsg-3857}`
}

async function renderWMS(
  map: MapLibreMap,
  layer: LayerConfig,
  _hooks: LayerRenderHooks,
): Promise<RenderedLayer> {
  const options = layer.options as WMSOptions
  try {
    await waitForStyleLoaded(map)
    const sourceId = layer.id
    const rasterLayerId = `${sourceId}-raster`

    map.addSource(sourceId, { type: 'raster', tiles: [buildWmsTileUrl(options)], tileSize: 256 })
    map.addLayer({
      id: rasterLayerId,
      type: 'raster',
      source: sourceId,
      paint: { 'raster-opacity': layer.opacity ?? 1 },
    })

    return {
      event: {
        layerId: layer.id,
        type: 'wms',
        capabilities: detectWMSCapabilities(layer),
        instance: { sourceId, layerId: rasterLayerId },
      },
      remove: () => {
        if (map.getLayer(rasterLayerId)) map.removeLayer(rasterLayerId)
        if (map.getSource(sourceId)) map.removeSource(sourceId)
      },
      setVisible: (visible) => setLayersVisible(map, [rasterLayerId], visible),
    }
  } catch (error) {
    return toErrorResult(layer, detectWMSCapabilities(layer), error)
  }
}

async function renderWFS(
  map: MapLibreMap,
  layer: LayerConfig,
  hooks: LayerRenderHooks,
): Promise<RenderedLayer> {
  const options = layer.options as WFSOptions
  try {
    await waitForStyleLoaded(map)
    const data = await fetchWfsFeatures(options)
    const sourceId = layer.id
    const layerIds = addGeoJsonLayers(
      map,
      sourceId,
      data as unknown as GeoJSON.GeoJSON,
      layer.opacity ?? 1,
    )
    const unbind =
      options.editable && hooks.onFeatureSelected
        ? layerIds.map((id) => bindLayerClick(map, id, layer.id, hooks))
        : []

    return {
      event: {
        layerId: layer.id,
        type: 'wfs',
        capabilities: detectWFSCapabilities(layer),
        instance: { sourceId, layerIds },
      },
      remove: () => {
        unbind.forEach((off) => off())
        removeGeoJsonLayers(map, sourceId, layerIds)
      },
      setVisible: (visible) => setLayersVisible(map, layerIds, visible),
    }
  } catch (error) {
    return toErrorResult(layer, detectWFSCapabilities(layer), error)
  }
}

async function renderTiles(
  map: MapLibreMap,
  layer: LayerConfig,
  _hooks: LayerRenderHooks,
): Promise<RenderedLayer> {
  const options = layer.options as TilesOptions
  try {
    await waitForStyleLoaded(map)
    const sourceId = layer.id
    const rasterLayerId = `${sourceId}-raster`

    map.addSource(sourceId, {
      type: 'raster',
      tiles: [options.url],
      tileSize: 256,
      ...(options.attribution ? { attribution: options.attribution } : {}),
      ...(options.maxZoom !== undefined ? { maxzoom: options.maxZoom } : {}),
      ...(options.minZoom !== undefined ? { minzoom: options.minZoom } : {}),
    })
    map.addLayer({
      id: rasterLayerId,
      type: 'raster',
      source: sourceId,
      paint: { 'raster-opacity': layer.opacity ?? 1 },
    })

    return {
      event: {
        layerId: layer.id,
        type: 'tiles',
        capabilities: detectTilesCapabilities(layer),
        instance: { sourceId, layerId: rasterLayerId },
      },
      remove: () => {
        if (map.getLayer(rasterLayerId)) map.removeLayer(rasterLayerId)
        if (map.getSource(sourceId)) map.removeSource(sourceId)
      },
      setVisible: (visible) => setLayersVisible(map, [rasterLayerId], visible),
    }
  } catch (error) {
    return toErrorResult(layer, detectTilesCapabilities(layer), error)
  }
}

async function renderWMTS(
  map: MapLibreMap,
  layer: LayerConfig,
  _hooks: LayerRenderHooks,
): Promise<RenderedLayer> {
  const options = layer.options as WMTSOptions
  try {
    await waitForStyleLoaded(map)
    const sourceId = layer.id
    const rasterLayerId = `${sourceId}-raster`

    map.addSource(sourceId, {
      type: 'raster',
      tiles: [buildWmtsTileUrl(options)],
      tileSize: 256,
      ...(options.attribution ? { attribution: options.attribution } : {}),
      ...(options.maxZoom !== undefined ? { maxzoom: options.maxZoom } : {}),
      ...(options.minZoom !== undefined ? { minzoom: options.minZoom } : {}),
    })
    map.addLayer({
      id: rasterLayerId,
      type: 'raster',
      source: sourceId,
      paint: { 'raster-opacity': layer.opacity ?? 1 },
    })

    return {
      event: {
        layerId: layer.id,
        type: 'wmts',
        capabilities: detectTilesCapabilities(layer),
        instance: { sourceId, layerId: rasterLayerId },
      },
      remove: () => {
        if (map.getLayer(rasterLayerId)) map.removeLayer(rasterLayerId)
        if (map.getSource(sourceId)) map.removeSource(sourceId)
      },
      setVisible: (visible) => setLayersVisible(map, [rasterLayerId], visible),
    }
  } catch (error) {
    return toErrorResult(layer, detectTilesCapabilities(layer), error)
  }
}

async function renderCOG(
  map: MapLibreMap,
  layer: LayerConfig,
  _hooks: LayerRenderHooks,
): Promise<RenderedLayer> {
  const options = layer.options as COGOptions
  try {
    const cogProtocolModule = await ensureCogProtocol()
    await waitForStyleLoaded(map)
    const sourceId = layer.id
    const rasterLayerId = `${sourceId}-raster`

    if (options.colorScale) {
      cogProtocolModule.setColorFunction(options.url, (pixel, color, metadata) => {
        const value = pixel[0] ?? NaN
        if (value === metadata.noData || !Number.isFinite(value)) {
          color.set([0, 0, 0, 0])
          return
        }
        color.set(interpolateColorScale(value, options.colorScale!))
      })
    }

    map.addSource(sourceId, { type: 'raster', url: `cog://${options.url}`, tileSize: 256 })
    map.addLayer({
      id: rasterLayerId,
      type: 'raster',
      source: sourceId,
      paint: { 'raster-opacity': layer.opacity ?? 1 },
    })

    return {
      event: {
        layerId: layer.id,
        type: 'cog',
        capabilities: detectTilesCapabilities(layer),
        instance: { sourceId, layerId: rasterLayerId },
      },
      remove: () => {
        if (map.getLayer(rasterLayerId)) map.removeLayer(rasterLayerId)
        if (map.getSource(sourceId)) map.removeSource(sourceId)
      },
      setVisible: (visible) => setLayersVisible(map, [rasterLayerId], visible),
    }
  } catch (error) {
    return toErrorResult(layer, detectTilesCapabilities(layer), error)
  }
}

async function renderMVT(
  map: MapLibreMap,
  layer: LayerConfig,
  hooks: LayerRenderHooks,
): Promise<RenderedLayer> {
  const options = layer.options as MVTOptions
  const capabilities = detectGeoJSONCapabilities(layer)
  try {
    await waitForStyleLoaded(map)
    const sourceId = layer.id

    map.addSource(sourceId, {
      type: 'vector',
      tiles: [options.url],
      minzoom: options.minZoom ?? 0,
      maxzoom: options.maxZoom ?? 14,
      ...(options.attribution ? { attribution: options.attribution } : {}),
    })
    const layerIds = addVectorTileLayers(map, sourceId, options.sourceLayer, layer.opacity ?? 1)
    const unbind = hooks.onFeatureSelected
      ? layerIds.map((id) => bindLayerClick(map, id, layer.id, hooks))
      : []

    return {
      event: {
        layerId: layer.id,
        type: 'mvt',
        capabilities,
        instance: { sourceId, layerIds },
      },
      remove: () => {
        unbind.forEach((off) => off())
        removeGeoJsonLayers(map, sourceId, layerIds)
      },
      setVisible: (visible) => setLayersVisible(map, layerIds, visible),
    }
  } catch (error) {
    return toErrorResult(layer, capabilities, error)
  }
}

export const maplibreLayerRegistry: Record<LayerType, LayerRenderer<MapLibreMap>> = {
  geojson: { render: renderGeoJSON, detectCapabilities: detectGeoJSONCapabilities },
  topojson: { render: renderTopoJSON, detectCapabilities: detectGeoJSONCapabilities },
  kml: { render: renderKML, detectCapabilities: detectGeoJSONCapabilities },
  wms: { render: renderWMS, detectCapabilities: detectWMSCapabilities },
  wfs: { render: renderWFS, detectCapabilities: detectWFSCapabilities },
  tiles: { render: renderTiles, detectCapabilities: detectTilesCapabilities },
  wmts: { render: renderWMTS, detectCapabilities: detectTilesCapabilities },
  cog: { render: renderCOG, detectCapabilities: detectTilesCapabilities },
  mvt: { render: renderMVT, detectCapabilities: detectGeoJSONCapabilities },
}
