import type { WMSOptions } from '@/types/layers'
import type { LegendAdapter, LegendItem } from '@/types/legend'

/**
 * WMS es el único tipo con un mecanismo de leyenda estándar del propio
 * protocolo: `GetLegendGraphic` (extensión SLD, soportada por
 * GeoServer/MapServer/QGIS Server y demás servidores habituales), que
 * devuelve una imagen ya renderizada por el servidor — no hace falta
 * adivinar nada en el cliente, a diferencia de GeoJSON/WFS/MVT.
 */
function buildGetLegendGraphicUrl(options: WMSOptions): string {
  const params = new URLSearchParams({
    service: 'WMS',
    request: 'GetLegendGraphic',
    version: options.version ?? '1.3.0',
    format: 'image/png',
    layer: options.layers,
    ...(options.style ? { style: options.style } : {}),
  })
  return `${options.url}?${params.toString()}`
}

export const wmsLegendAdapter: LegendAdapter = {
  name: 'WMS',
  supports: 'wms',
  canHandle: (layer) => layer.type === 'wms',
  generateLegend: (layer) => {
    const options = layer.options as WMSOptions
    const item: LegendItem = {
      id: 'legend-graphic',
      label: options.layers,
      type: 'image',
      image: buildGetLegendGraphicUrl(options),
    }
    return Promise.resolve([item])
  },
  getCapabilities: () => ({
    canGenerateLegend: true,
    source: 'server',
    isEditable: false,
    supportsGroups: false,
  }),
}
