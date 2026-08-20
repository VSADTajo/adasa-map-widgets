import type { LayerConfig } from '@/types/layers'
import type { LegendAdapter, LegendCapabilities, LegendItem } from '@/types/legend'
import { buildGenericSymbolLegend } from './genericSymbol'

/**
 * GeoJSON/TopoJSON/KML son datos vectoriales estáticos con estilo arbitrario
 * (una función JS por feature, no una paleta declarativa): sin inspeccionar
 * cada feature no hay forma fiable de derivar categorías, así que se
 * muestra un único símbolo genérico. Comparten exactamente la misma lógica,
 * igual que comparten `detectGeoJSONCapabilities` en `src/layers/capabilities.ts`.
 */
function generateGeoJsonLikeLegend(layer: LayerConfig): Promise<LegendItem[]> {
  return Promise.resolve(buildGenericSymbolLegend(layer.name))
}

function getGeoJsonLikeCapabilities(): LegendCapabilities {
  return { canGenerateLegend: true, source: 'auto', isEditable: true, supportsGroups: false }
}

export const geoJsonLegendAdapter: LegendAdapter = {
  name: 'GeoJSON',
  supports: 'geojson',
  canHandle: (layer) => layer.type === 'geojson',
  generateLegend: generateGeoJsonLikeLegend,
  getCapabilities: getGeoJsonLikeCapabilities,
}

export const topoJsonLegendAdapter: LegendAdapter = {
  name: 'TopoJSON',
  supports: 'topojson',
  canHandle: (layer) => layer.type === 'topojson',
  generateLegend: generateGeoJsonLikeLegend,
  getCapabilities: getGeoJsonLikeCapabilities,
}

export const kmlLegendAdapter: LegendAdapter = {
  name: 'KML',
  supports: 'kml',
  canHandle: (layer) => layer.type === 'kml',
  generateLegend: generateGeoJsonLikeLegend,
  getCapabilities: getGeoJsonLikeCapabilities,
}
