import type { LayerCapabilities, LayerConfig, WFSOptions, WMSOptions } from '@/types/layers'

/**
 * Detección de capacidades por tipo de capa. No dependen del motor de mapas
 * (solo inspeccionan `layer.options`/`layer.type`), así que Leaflet y
 * MapLibre comparten exactamente estas mismas funciones.
 */

export function detectGeoJSONCapabilities(_layer: LayerConfig): LayerCapabilities {
  return { isTemporal: false, isEditable: false, hasFilters: false, hasSearch: false }
}

export function detectWMSCapabilities(layer: LayerConfig): LayerCapabilities {
  const options = layer.options as WMSOptions
  const isTemporal = Boolean(options.time) || options.layers.toLowerCase().includes('time')
  return {
    isTemporal,
    isEditable: false,
    hasFilters: false,
    hasSearch: false,
    timeRange: options.time
      ? { start: new Date(options.time), end: new Date(), step: 24 }
      : undefined,
  }
}

export function detectWFSCapabilities(layer: LayerConfig): LayerCapabilities {
  const options = layer.options as WFSOptions
  return {
    isTemporal: false,
    isEditable: options.editable ?? false,
    hasFilters: Boolean(options.cql_filter),
    hasSearch: true,
  }
}

export function detectTilesCapabilities(_layer: LayerConfig): LayerCapabilities {
  return { isTemporal: false, isEditable: false, hasFilters: false, hasSearch: false }
}

/** Despacha a la función de detección correspondiente según `layer.type`. */
export function detectCapabilities(layer: LayerConfig): LayerCapabilities {
  switch (layer.type) {
    // TopoJSON/KML se convierten a GeoJSON antes de renderizarse: son datos
    // vectoriales estáticos igual que GeoJSON, sin capacidades de servidor
    // (edición, filtros, búsqueda), así que comparten la misma detección.
    case 'geojson':
    case 'topojson':
    case 'kml':
      return detectGeoJSONCapabilities(layer)
    case 'wms':
      return detectWMSCapabilities(layer)
    case 'wfs':
      return detectWFSCapabilities(layer)
    // WMTS/COG son, para efectos de capacidades, indistinguibles de Tiles:
    // teselas/imagen ráster estáticas, sin edición/filtros/búsqueda.
    case 'tiles':
    case 'wmts':
    case 'cog':
      return detectTilesCapabilities(layer)
  }
}
