import type { LayerConfig } from '@/types/layers'
import type { LegendAdapter, LegendCapabilities, LegendItem, LegendRamp } from '@/types/legend'
import { geoJsonLegendAdapter, kmlLegendAdapter, topoJsonLegendAdapter } from './geojson'
import { wfsLegendAdapter } from './wfs'
import { mvtLegendAdapter } from './mvt'
import { wmsLegendAdapter } from './wms'
import { tilesLegendAdapter, wmtsLegendAdapter } from './raster'
import { cogLegendAdapter } from './cog'

export type { LegendAdapter } from '@/types/legend'

/**
 * Adapters incorporados, uno por `LayerType` (ver `src/types/layers.ts`).
 * Es un array, no un `Record`: `registerLegendAdapter` puede anteponer
 * adapters propios sin tocar este módulo — el mismo espíritu "plugin" que
 * describe `LegendAdapter`, y también permite sustituir el de un
 * `LayerType` ya soportado (el primero cuyo `canHandle` acepte la capa gana).
 */
const legendAdapters: LegendAdapter[] = [
  geoJsonLegendAdapter,
  topoJsonLegendAdapter,
  kmlLegendAdapter,
  wmsLegendAdapter,
  wfsLegendAdapter,
  tilesLegendAdapter,
  wmtsLegendAdapter,
  cogLegendAdapter,
  mvtLegendAdapter,
]

/** Registra un adapter propio (antepuesto: también sirve para sustituir el de un `LayerType` ya soportado). */
export function registerLegendAdapter(adapter: LegendAdapter): void {
  legendAdapters.unshift(adapter)
}

/** Busca el primer adapter capaz de manejar `layer` (ver `LegendAdapter.canHandle`). */
export function getLegendAdapter(layer: LayerConfig): LegendAdapter | undefined {
  return legendAdapters.find((adapter) => adapter.canHandle(layer))
}

const NO_ADAPTER_CAPABILITIES: LegendCapabilities = {
  canGenerateLegend: false,
  source: 'auto',
  isEditable: false,
  supportsGroups: false,
}

/** Genera la leyenda de una capa con su adapter correspondiente. Sin adapter, resuelve a `[]`. */
export async function generateLegend(layer: LayerConfig): Promise<LegendItem[] | LegendRamp> {
  const adapter = getLegendAdapter(layer)
  if (!adapter) return []
  return adapter.generateLegend(layer)
}

/** Capacidades de leyenda de una capa (ver `LegendCapabilities`). Sin adapter, todas `false`/`'auto'`. */
export function getLegendCapabilities(layer: LayerConfig): LegendCapabilities {
  const adapter = getLegendAdapter(layer)
  return adapter ? adapter.getCapabilities(layer) : NO_ADAPTER_CAPABILITIES
}
