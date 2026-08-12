import type { WFSOptions } from '@/types/layers'
import type { LegendAdapter } from '@/types/legend'
import { buildGenericSymbolLegend } from './genericSymbol'

/**
 * Como GeoJSON, WFS es vectorial sin un desglose por categoría fiable sin
 * pedir/inspeccionar sus features: un único símbolo genérico, con el
 * `typeName` del servidor como etiqueta.
 */
export const wfsLegendAdapter: LegendAdapter = {
  name: 'WFS',
  supports: 'wfs',
  canHandle: (layer) => layer.type === 'wfs',
  generateLegend: (layer) => {
    const options = layer.options as WFSOptions
    return Promise.resolve(buildGenericSymbolLegend(options.typeName))
  },
  getCapabilities: (layer) => {
    const options = layer.options as WFSOptions
    return {
      canGenerateLegend: true,
      source: 'auto',
      isEditable: options.editable ?? false,
      supportsGroups: false,
    }
  },
}
