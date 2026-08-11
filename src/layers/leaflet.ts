import type * as L from 'leaflet'
import type { GeoRaster, GeoRasterLayerOptions } from 'georaster-layer-for-leaflet'
import { resolveNamespace } from '@/utils/resolveNamespace'
import type {
  COGOptions,
  GeoJSONOptions,
  GeoJsonFeature,
  GeoJsonFeatureCollection,
  KMLOptions,
  LayerCapabilities,
  LayerConfig,
  LayerType,
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

/** `georaster` no distribuye tipos propios: se apoya en `GeoRaster` de `georaster-layer-for-leaflet`, la forma que igualmente espera su constructor. */
type ParseGeoraster = (input: string | ArrayBuffer) => Promise<GeoRaster>

async function loadGeoraster(): Promise<ParseGeoraster> {
  const mod = await import('georaster')
  return resolveNamespace<ParseGeoraster>(mod)
}

async function loadGeoRasterLayer(): Promise<new (options: GeoRasterLayerOptions) => L.Layer> {
  const mod = await import('georaster-layer-for-leaflet')
  return resolveNamespace<new (options: GeoRasterLayerOptions) => L.Layer>(mod)
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

/**
 * Muestra u oculta una capa de teselas (WMS/Tiles) alternando la visibilidad
 * de su pane dedicado (`pane: layer.id`). Solo se usa para esos dos tipos:
 * las capas vectoriales (GeoJSON/WFS) usan {@link setLayerAttached} en su
 * lugar (ver ahí el porqué).
 */
function setPaneVisible(map: L.Map, paneId: string, visible: boolean): void {
  const pane = map.getPane(paneId)
  if (pane) pane.style.display = visible ? '' : 'none'
}

/**
 * Crea el pane dedicado de una capa de teselas (WMS/Tiles/WMTS) si todavía no
 * existe. Sin esto, pasar `pane: layer.id` a `L.TileLayer`/`L.TileLayer.WMS`
 * apunta a un pane que Leaflet nunca creó (`map.getPane()` devuelve
 * `undefined`), y el propio `onAdd` del `GridLayer` explota al intentar
 * usarlo (y deja el layer en un estado a medio inicializar que también rompe
 * animaciones de zoom posteriores).
 */
function ensurePane(map: L.Map, paneId: string): void {
  if (!map.getPane(paneId)) map.createPane(paneId)
}

/**
 * Muestra u oculta una capa vectorial (GeoJSON/WFS) añadiéndola o quitándola
 * del mapa. A diferencia de las capas de teselas, estas NO usan un pane
 * dedicado: cuando una capa `Path` (Polygon/CircleMarker/...) apunta a un
 * pane que no es el por defecto, Leaflet crea ahí un renderer SVG/Canvas
 * propio que queda registrado como otra capa más del mapa — y al destruir
 * el mapa (`map.remove()`), el orden de limpieza en cascada de Leaflet choca
 * con ese renderer y lanza `Cannot read properties of undefined (reading
 * '_removePath')`. Usar el pane por defecto (`overlayPane`, compartido y
 * probado por el propio Leaflet) evita el problema por completo.
 */
function setLayerAttached(map: L.Map, layer: L.Layer, attached: boolean): void {
  const isAttached = map.hasLayer(layer)
  if (attached && !isAttached) layer.addTo(map)
  else if (!attached && isAttached) map.removeLayer(layer)
}

/**
 * Reenvía el click sobre un feature de una capa GeoJSON/WFS vía
 * `hooks.onFeatureSelected`. Corta la propagación del click hacia el mapa
 * (`Leaflet.DomEvent.stopPropagation`) para que ASMap no emita también
 * `map-click` con las mismas coordenadas: ese evento es solo para clicks que
 * NO han encontrado ningún feature.
 */
function bindFeatureClick(
  Leaflet: typeof L,
  geoJsonLayer: L.GeoJSON,
  layerId: string,
  hooks: LayerRenderHooks,
): void {
  if (!hooks.onFeatureSelected) return
  geoJsonLayer.on('click', (event: L.LeafletMouseEvent) => {
    const source = event.propagatedFrom as (L.Layer & { feature?: GeoJsonFeature }) | undefined
    const feature = source?.feature
    if (!feature) return
    Leaflet.DomEvent.stopPropagation(event)
    hooks.onFeatureSelected?.({
      layerId,
      feature,
      properties: (feature.properties ?? {}) as Record<string, unknown>,
      coordinates: [event.latlng.lng, event.latlng.lat],
    })
  })
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

/** Opciones compartidas por GeoJSON/TopoJSON/KML una vez resueltas a `FeatureCollection`. */
interface GeoJsonLikeOptions {
  style?: (feature: GeoJsonFeature) => Record<string, unknown>
  pointToLayer?: GeoJSONOptions['pointToLayer']
  onEachFeature?: GeoJSONOptions['onEachFeature']
}

/**
 * Vuelca un `FeatureCollection` GeoJSON ya resuelto (venga directamente de una
 * capa `'geojson'`, o convertido desde TopoJSON/KML) como capa Leaflet. El
 * click en features siempre está activo (a diferencia de WFS, que lo activa
 * solo si `options.editable`): estos tres tipos son datos estáticos ya
 * resueltos en el cliente, sin un equivalente a "solo lectura" del servidor.
 */
function renderGeoJsonFeatureCollection(
  Leaflet: typeof L,
  map: L.Map,
  layer: LayerConfig,
  hooks: LayerRenderHooks,
  data: GeoJsonFeatureCollection,
  options: GeoJsonLikeOptions,
  capabilities: LayerCapabilities,
): RenderedLayer {
  const geoJsonLayer = Leaflet.geoJSON(data as unknown as GeoJSON.GeoJsonObject, {
    style: withOpacity(options.style, layer.opacity),
    pointToLayer: options.pointToLayer as L.GeoJSONOptions['pointToLayer'],
    onEachFeature: options.onEachFeature as L.GeoJSONOptions['onEachFeature'],
  })
  geoJsonLayer.addTo(map)
  bindFeatureClick(Leaflet, geoJsonLayer, layer.id, hooks)

  return {
    event: { layerId: layer.id, type: layer.type, capabilities, instance: geoJsonLayer },
    remove: () => geoJsonLayer.remove(),
    setVisible: (visible) => setLayerAttached(map, geoJsonLayer, visible),
  }
}

async function renderGeoJSON(
  map: L.Map,
  layer: LayerConfig,
  hooks: LayerRenderHooks,
): Promise<RenderedLayer> {
  const options = layer.options as GeoJSONOptions
  const capabilities = detectGeoJSONCapabilities(layer)
  try {
    const Leaflet = await loadLeaflet()
    const data =
      typeof options.data === 'string' ? await (await fetch(options.data)).json() : options.data
    return renderGeoJsonFeatureCollection(Leaflet, map, layer, hooks, data, options, capabilities)
  } catch (error) {
    return toErrorResult(layer, capabilities, error)
  }
}

async function renderTopoJSON(
  map: L.Map,
  layer: LayerConfig,
  hooks: LayerRenderHooks,
): Promise<RenderedLayer> {
  const options = layer.options as TopoJSONOptions
  const capabilities = detectGeoJSONCapabilities(layer)
  try {
    const Leaflet = await loadLeaflet()
    const data = await resolveTopoJsonData(options)
    return renderGeoJsonFeatureCollection(Leaflet, map, layer, hooks, data, options, capabilities)
  } catch (error) {
    return toErrorResult(layer, capabilities, error)
  }
}

async function renderKML(
  map: L.Map,
  layer: LayerConfig,
  hooks: LayerRenderHooks,
): Promise<RenderedLayer> {
  const options = layer.options as KMLOptions
  const capabilities = detectGeoJSONCapabilities(layer)
  try {
    const Leaflet = await loadLeaflet()
    const data = await resolveKmlData(options)
    return renderGeoJsonFeatureCollection(Leaflet, map, layer, hooks, data, options, capabilities)
  } catch (error) {
    return toErrorResult(layer, capabilities, error)
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
    ensurePane(map, layer.id)
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
      setVisible: (visible) => setPaneVisible(map, layer.id, visible),
    }
  } catch (error) {
    return toErrorResult(layer, detectWMSCapabilities(layer), error)
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
    })
    geoJsonLayer.addTo(map)

    if (options.editable) {
      bindFeatureClick(Leaflet, geoJsonLayer, layer.id, hooks)
    }

    return {
      event: {
        layerId: layer.id,
        type: 'wfs',
        capabilities: detectWFSCapabilities(layer),
        instance: geoJsonLayer,
      },
      remove: () => geoJsonLayer.remove(),
      setVisible: (visible) => setLayerAttached(map, geoJsonLayer, visible),
    }
  } catch (error) {
    return toErrorResult(layer, detectWFSCapabilities(layer), error)
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
    ensurePane(map, layer.id)
    const tiles = Leaflet.tileLayer(options.url, {
      attribution: options.attribution,
      maxZoom: options.maxZoom ?? 19,
      minZoom: options.minZoom ?? 0,
      opacity: layer.opacity ?? 1,
      pane: layer.id,
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
      setVisible: (visible) => setPaneVisible(map, layer.id, visible),
    }
  } catch (error) {
    return toErrorResult(layer, detectTilesCapabilities(layer), error)
  }
}

async function renderWMTS(
  map: L.Map,
  layer: LayerConfig,
  _hooks: LayerRenderHooks,
): Promise<RenderedLayer> {
  const options = layer.options as WMTSOptions
  try {
    const Leaflet = await loadLeaflet()
    ensurePane(map, layer.id)
    const tiles = Leaflet.tileLayer(buildWmtsTileUrl(options), {
      attribution: options.attribution,
      maxZoom: options.maxZoom ?? 19,
      minZoom: options.minZoom ?? 0,
      opacity: layer.opacity ?? 1,
      pane: layer.id,
    })
    tiles.addTo(map)

    return {
      event: {
        layerId: layer.id,
        type: 'wmts',
        capabilities: detectTilesCapabilities(layer),
        instance: tiles,
      },
      remove: () => tiles.remove(),
      setVisible: (visible) => setPaneVisible(map, layer.id, visible),
    }
  } catch (error) {
    return toErrorResult(layer, detectTilesCapabilities(layer), error)
  }
}

async function renderCOG(
  map: L.Map,
  layer: LayerConfig,
  _hooks: LayerRenderHooks,
): Promise<RenderedLayer> {
  const options = layer.options as COGOptions
  try {
    const [parseGeoraster, GeoRasterLayer] = await Promise.all([
      loadGeoraster(),
      loadGeoRasterLayer(),
    ])
    const georaster = await parseGeoraster(options.url)
    ensurePane(map, layer.id)

    const cogLayer = new GeoRasterLayer({
      georaster,
      opacity: layer.opacity ?? 1,
      pane: layer.id,
      resolution: 256,
      ...(options.colorScale
        ? {
            pixelValuesToColorFn: (values: number[]) => {
              const value = values[0]
              if (
                value === undefined ||
                !Number.isFinite(value) ||
                value === georaster.noDataValue
              ) {
                return null
              }
              const [r, g, b, a] = interpolateColorScale(value, options.colorScale!)
              return `rgba(${r}, ${g}, ${b}, ${a})`
            },
          }
        : {}),
    })
    cogLayer.addTo(map)

    return {
      event: {
        layerId: layer.id,
        type: 'cog',
        capabilities: detectTilesCapabilities(layer),
        instance: cogLayer,
      },
      remove: () => cogLayer.remove(),
      setVisible: (visible) => setPaneVisible(map, layer.id, visible),
    }
  } catch (error) {
    return toErrorResult(layer, detectTilesCapabilities(layer), error)
  }
}

export const leafletLayerRegistry: Record<LayerType, LayerRenderer<L.Map>> = {
  geojson: { render: renderGeoJSON, detectCapabilities: detectGeoJSONCapabilities },
  topojson: { render: renderTopoJSON, detectCapabilities: detectGeoJSONCapabilities },
  kml: { render: renderKML, detectCapabilities: detectGeoJSONCapabilities },
  wms: { render: renderWMS, detectCapabilities: detectWMSCapabilities },
  wfs: { render: renderWFS, detectCapabilities: detectWFSCapabilities },
  tiles: { render: renderTiles, detectCapabilities: detectTilesCapabilities },
  wmts: { render: renderWMTS, detectCapabilities: detectTilesCapabilities },
  cog: { render: renderCOG, detectCapabilities: detectTilesCapabilities },
}
