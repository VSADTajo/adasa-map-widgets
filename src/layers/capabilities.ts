import type {
  GeoServerOptions,
  LayerCapabilities,
  LayerConfig,
  WFSOptions,
  WMSOptions,
} from '@/types/layers'

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

export function detectGeoServerCapabilities(layer: LayerConfig): LayerCapabilities {
  const options = layer.options as GeoServerOptions
  const haystack = `${options.layer} ${options.workspace}`.toLowerCase()
  return {
    isTemporal: haystack.includes('temporal') || haystack.includes('time'),
    isEditable: options.mode === 'wfs',
    hasFilters: Boolean(options.filter),
    hasSearch: options.mode === 'wfs',
  }
}

/** Despacha a la función de detección correspondiente según `layer.type`. */
export function detectCapabilities(layer: LayerConfig): LayerCapabilities {
  switch (layer.type) {
    case 'geojson':
      return detectGeoJSONCapabilities(layer)
    case 'wms':
      return detectWMSCapabilities(layer)
    case 'wfs':
      return detectWFSCapabilities(layer)
    case 'tiles':
      return detectTilesCapabilities(layer)
    case 'geoserver':
      return detectGeoServerCapabilities(layer)
  }
}
