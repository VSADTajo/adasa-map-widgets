import type { MVTOptions } from '@/types/layers'
import type { LegendAdapter } from '@/types/legend'
import { buildGenericSymbolLegend } from './genericSymbol'

/**
 * Una tesela MVT puede empaquetar varias sub-capas, pero cada `LayerConfig`
 * solo renderiza una (`options.sourceLayer`, ver `src/layers/maplibre.ts`):
 * igual que WFS, un único símbolo genérico con esa sub-capa como etiqueta.
 */
export const mvtLegendAdapter: LegendAdapter = {
  name: 'MVT',
  supports: 'mvt',
  canHandle: (layer) => layer.type === 'mvt',
  generateLegend: (layer) => {
    const options = layer.options as MVTOptions
    return Promise.resolve(buildGenericSymbolLegend(options.sourceLayer))
  },
  getCapabilities: () => ({
    canGenerateLegend: true,
    source: 'auto',
    isEditable: false,
    supportsGroups: false,
  }),
}
