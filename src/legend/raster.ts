import type { LegendAdapter, LegendCapabilities } from '@/types/legend'

/**
 * Tiles/WMTS son imágenes ya compuestas por el servidor sin ningún metadato
 * de qué representa cada píxel (a diferencia de WMS, no hay un equivalente a
 * `GetLegendGraphic`): no hay nada fiable que generar automáticamente, así
 * que se declara explícitamente sin leyenda en vez de rellenar con un
 * símbolo inventado.
 */
const NO_LEGEND_CAPABILITIES: LegendCapabilities = {
  canGenerateLegend: false,
  source: 'auto',
  isEditable: false,
  supportsGroups: false,
}

export const tilesLegendAdapter: LegendAdapter = {
  name: 'Tiles',
  supports: 'tiles',
  canHandle: (layer) => layer.type === 'tiles',
  generateLegend: () => Promise.resolve([]),
  getCapabilities: () => NO_LEGEND_CAPABILITIES,
}

export const wmtsLegendAdapter: LegendAdapter = {
  name: 'WMTS',
  supports: 'wmts',
  canHandle: (layer) => layer.type === 'wmts',
  generateLegend: () => Promise.resolve([]),
  getCapabilities: () => NO_LEGEND_CAPABILITIES,
}
