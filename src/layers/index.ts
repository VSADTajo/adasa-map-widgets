import type * as L from 'leaflet'
import type { MapLibreMap } from 'maplibre-gl'
import type { MapLibraryOption } from '@/types/playground'
import type { LayerType } from '@/types/layers'
import { leafletLayerRegistry } from './leaflet'
import { maplibreLayerRegistry } from './maplibre'
import type { LayerRenderer } from './types'

export type { LayerRenderer, LayerRenderHooks, RenderedLayer } from './types'
export { toErrorInstance } from './types'
export { detectCapabilities } from './capabilities'
export { leafletLayerRegistry } from './leaflet'
export { maplibreLayerRegistry } from './maplibre'

/** Motor de mapas al que corresponde cada registro de renderers de capas. */
type LayerRegistryMap<TEngine extends MapLibraryOption> = Record<
  LayerType,
  LayerRenderer<TEngine extends 'leaflet' ? L.Map : MapLibreMap>
>

/**
 * Devuelve el registro de renderers de capas correspondiente a un motor de
 * mapas. Se usa junto a la instancia real que expone `ASMap` (`mapInstanceRef`
 * o `getMapInstance()`) — normalmente a través de `useLayerManager`, no
 * directamente:
 *
 * ```ts
 * const registry = getLayerRegistry(mapLibrary) // 'leaflet' | 'maplibre'
 * const { event, remove, setVisible } = await registry[layer.type].render(map, layer, hooks)
 * ```
 */
export function getLayerRegistry<TEngine extends MapLibraryOption>(
  engine: TEngine,
): LayerRegistryMap<TEngine> {
  return (engine === 'leaflet' ? leafletLayerRegistry : maplibreLayerRegistry) as never
}
