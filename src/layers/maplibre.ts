import type { MapLayerMouseEvent, MapLibreMap } from 'maplibre-gl'
import type {
  GeoJSONOptions,
  GeoJsonFeature,
  LayerConfig,
  LayerType,
  TilesOptions,
  WFSOptions,
  WMSOptions,
} from '@/types/layers'
import {
  detectGeoJSONCapabilities,
  detectGeoServerCapabilities,
  detectTilesCapabilities,
  detectWFSCapabilities,
  detectWMSCapabilities,
} from './capabilities'
import { fetchWfsFeatures } from './wfs'
import { toWfsConfig, toWmsConfig } from './geoserver'
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

async function renderGeoJSON(
  map: MapLibreMap,
  layer: LayerConfig,
  hooks: LayerRenderHooks,
): Promise<RenderedLayer> {
  const options = layer.options as GeoJSONOptions
  try {
    await waitForStyleLoaded(map)
    const sourceId = layer.id
    const data =
      typeof options.data === 'string' ? options.data : (options.data as unknown as GeoJSON.GeoJSON)
    const layerIds = addGeoJsonLayers(map, sourceId, data, layer.opacity ?? 1)
    const unbind = hooks.onFeatureSelected
      ? layerIds.map((id) => bindLayerClick(map, id, layer.id, hooks))
      : []

    return {
      event: {
        layerId: layer.id,
        type: 'geojson',
        capabilities: detectGeoJSONCapabilities(layer),
        instance: { sourceId, layerIds },
      },
      remove: () => {
        unbind.forEach((off) => off())
        removeGeoJsonLayers(map, sourceId, layerIds)
      },
      setVisible: (visible) => setLayersVisible(map, layerIds, visible),
    }
  } catch (error) {
    return {
      event: {
        layerId: layer.id,
        type: 'geojson',
        capabilities: detectGeoJSONCapabilities(layer),
        error: toErrorInstance(error),
      },
      remove: () => {},
      setVisible: () => {},
    }
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
    return {
      event: {
        layerId: layer.id,
        type: 'wms',
        capabilities: detectWMSCapabilities(layer),
        error: toErrorInstance(error),
      },
      remove: () => {},
      setVisible: () => {},
    }
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
    return {
      event: {
        layerId: layer.id,
        type: 'wfs',
        capabilities: detectWFSCapabilities(layer),
        error: toErrorInstance(error),
      },
      remove: () => {},
      setVisible: () => {},
    }
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
    return {
      event: {
        layerId: layer.id,
        type: 'tiles',
        capabilities: detectTilesCapabilities(layer),
        error: toErrorInstance(error),
      },
      remove: () => {},
      setVisible: () => {},
    }
  }
}

async function renderGeoServer(
  map: MapLibreMap,
  layer: LayerConfig,
  hooks: LayerRenderHooks,
): Promise<RenderedLayer> {
  const options = layer.options as import('@/types/layers').GeoServerOptions
  return options.mode === 'wms'
    ? renderWMS(map, toWmsConfig(layer), hooks)
    : renderWFS(map, toWfsConfig(layer), hooks)
}

export const maplibreLayerRegistry: Record<LayerType, LayerRenderer<MapLibreMap>> = {
  geojson: { render: renderGeoJSON, detectCapabilities: detectGeoJSONCapabilities },
  wms: { render: renderWMS, detectCapabilities: detectWMSCapabilities },
  wfs: { render: renderWFS, detectCapabilities: detectWFSCapabilities },
  tiles: { render: renderTiles, detectCapabilities: detectTilesCapabilities },
  geoserver: { render: renderGeoServer, detectCapabilities: detectGeoServerCapabilities },
}
