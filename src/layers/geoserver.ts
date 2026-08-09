import type { GeoServerOptions, LayerConfig, WFSOptions, WMSOptions } from '@/types/layers'

/**
 * GeoServer es un atajo sobre WMS/WFS: estas funciones traducen su
 * configuración a una `LayerConfig` de tipo `'wms'`/`'wfs'` equivalente, para
 * que cada registro (Leaflet/MapLibre) reutilice sus propios `renderWMS`/
 * `renderWFS` en vez de duplicar la lógica de renderizado para GeoServer.
 */

export function toWmsConfig(layer: LayerConfig): LayerConfig & { options: WMSOptions } {
  const options = layer.options as GeoServerOptions
  return {
    ...layer,
    type: 'wms',
    options: {
      url: `${options.url}/wms`,
      layers: `${options.workspace}:${options.layer}`,
      style: options.style,
    },
  }
}

export function toWfsConfig(layer: LayerConfig): LayerConfig & { options: WFSOptions } {
  const options = layer.options as GeoServerOptions
  return {
    ...layer,
    type: 'wfs',
    options: {
      url: `${options.url}/wfs`,
      typeName: `${options.workspace}:${options.layer}`,
      cql_filter: options.filter,
    },
  }
}
