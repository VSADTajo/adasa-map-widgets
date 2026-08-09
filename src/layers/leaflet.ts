import type * as L from 'leaflet'
import { resolveNamespace } from '@/utils/resolveNamespace'
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
 * Registro de renderers de capas dinámicas para Leaflet. Cada `render` carga
 * Leaflet de forma perezosa (vía `import()` dinámico, igual que `ASMap`) y
 * necesita la instancia real de `L.Map` — no la interfaz mínima que usa
 * `ASMap` internamente para su propio ciclo de vida — porque aquí sí hace
 * falta la API completa (paneles, `GeoJSON`, `TileLayer.WMS`...).
 */

async function loadLeaflet(): Promise<typeof L> {
  const mod = await import('leaflet')
  return resolveNamespace<typeof L>(mod)
}

/**
 * Envuelve un `style` por feature (nuestro tipo agnóstico) añadiéndole la
 * opacidad de la capa. `L.GeoJSON` no tiene `setOpacity` (solo `L.TileLayer`
 * la tiene): hay que colar la opacidad dentro del propio `style`.
 */
function withOpacity(
  style: ((feature: GeoJsonFeature) => Record<string, unknown>) | undefined,
  opacity: number | undefined,
): L.StyleFunction | undefined {
  if (!style && opacity === undefined) return undefined
  return (feature) => ({
    ...(style?.(feature as unknown as GeoJsonFeature) ?? {}),
    ...(opacity === undefined ? {} : { opacity, fillOpacity: opacity }),
  })
}

/** Reenvía el click sobre un feature de una capa GeoJSON/WFS vía `hooks.onFeatureSelected`. */
function bindFeatureClick(geoJsonLayer: L.GeoJSON, layerId: string, hooks: LayerRenderHooks): void {
  if (!hooks.onFeatureSelected) return
  geoJsonLayer.on('click', (event: L.LeafletMouseEvent) => {
    const source = event.propagatedFrom as (L.Layer & { feature?: GeoJsonFeature }) | undefined
    const feature = source?.feature
    if (!feature) return
    hooks.onFeatureSelected?.({
      layerId,
      feature,
      properties: (feature.properties ?? {}) as Record<string, unknown>,
      coordinates: [event.latlng.lng, event.latlng.lat],
    })
  })
}

async function renderGeoJSON(
  map: L.Map,
  layer: LayerConfig,
  hooks: LayerRenderHooks,
): Promise<RenderedLayer> {
  const options = layer.options as GeoJSONOptions
  try {
    const Leaflet = await loadLeaflet()
    const data =
      typeof options.data === 'string' ? await (await fetch(options.data)).json() : options.data

    const geoJsonLayer = Leaflet.geoJSON(data as GeoJSON.GeoJsonObject, {
      style: withOpacity(options.style, layer.opacity),
      pointToLayer: options.pointToLayer as L.GeoJSONOptions['pointToLayer'],
      onEachFeature: options.onEachFeature as L.GeoJSONOptions['onEachFeature'],
      pane: layer.id,
    })
    geoJsonLayer.addTo(map)
    bindFeatureClick(geoJsonLayer, layer.id, hooks)

    return {
      event: {
        layerId: layer.id,
        type: 'geojson',
        capabilities: detectGeoJSONCapabilities(layer),
        instance: geoJsonLayer,
      },
      remove: () => geoJsonLayer.remove(),
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
    }
  }
}

async function renderWMS(
  map: L.Map,
  layer: LayerConfig,
  _hooks: LayerRenderHooks,
): Promise<RenderedLayer> {
  const options = layer.options as WMSOptions
  try {
    const Leaflet = await loadLeaflet()
    const wmsLayer = Leaflet.tileLayer.wms(options.url, {
      layers: options.layers,
      format: options.format ?? 'image/png',
      transparent: options.transparent ?? true,
      version: options.version ?? '1.3.0',
      styles: options.style ?? '',
      opacity: layer.opacity ?? 1,
      pane: layer.id,
      ...(options.time ? { time: options.time } : {}),
    } as L.WMSOptions)
    wmsLayer.addTo(map)

    return {
      event: {
        layerId: layer.id,
        type: 'wms',
        capabilities: detectWMSCapabilities(layer),
        instance: wmsLayer,
      },
      remove: () => wmsLayer.remove(),
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
    }
  }
}

async function renderWFS(
  map: L.Map,
  layer: LayerConfig,
  hooks: LayerRenderHooks,
): Promise<RenderedLayer> {
  const options = layer.options as WFSOptions
  try {
    const Leaflet = await loadLeaflet()
    const data = await fetchWfsFeatures(options)
    const geoJsonLayer = Leaflet.geoJSON(data as unknown as GeoJSON.GeoJsonObject, {
      style: withOpacity(undefined, layer.opacity),
      pane: layer.id,
    })
    geoJsonLayer.addTo(map)

    if (options.editable) {
      bindFeatureClick(geoJsonLayer, layer.id, hooks)
    }

    return {
      event: {
        layerId: layer.id,
        type: 'wfs',
        capabilities: detectWFSCapabilities(layer),
        instance: geoJsonLayer,
      },
      remove: () => geoJsonLayer.remove(),
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
    }
  }
}

async function renderTiles(
  map: L.Map,
  layer: LayerConfig,
  _hooks: LayerRenderHooks,
): Promise<RenderedLayer> {
  const options = layer.options as TilesOptions
  try {
    const Leaflet = await loadLeaflet()
    const tiles = Leaflet.tileLayer(options.url, {
      attribution: options.attribution,
      maxZoom: options.maxZoom ?? 19,
      minZoom: options.minZoom ?? 0,
      opacity: layer.opacity ?? 1,
    })
    tiles.addTo(map)

    return {
      event: {
        layerId: layer.id,
        type: 'tiles',
        capabilities: detectTilesCapabilities(layer),
        instance: tiles,
      },
      remove: () => tiles.remove(),
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
    }
  }
}

async function renderGeoServer(
  map: L.Map,
  layer: LayerConfig,
  hooks: LayerRenderHooks,
): Promise<RenderedLayer> {
  const options = layer.options as import('@/types/layers').GeoServerOptions
  return options.mode === 'wms'
    ? renderWMS(map, toWmsConfig(layer), hooks)
    : renderWFS(map, toWfsConfig(layer), hooks)
}

export const leafletLayerRegistry: Record<LayerType, LayerRenderer<L.Map>> = {
  geojson: { render: renderGeoJSON, detectCapabilities: detectGeoJSONCapabilities },
  wms: { render: renderWMS, detectCapabilities: detectWMSCapabilities },
  wfs: { render: renderWFS, detectCapabilities: detectWFSCapabilities },
  tiles: { render: renderTiles, detectCapabilities: detectTilesCapabilities },
  geoserver: { render: renderGeoServer, detectCapabilities: detectGeoServerCapabilities },
}
