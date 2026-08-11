import { readonly, ref, unref } from 'vue'
import type { Ref } from 'vue'
import type * as L from 'leaflet'
import type { MapLibreMap } from 'maplibre-gl'
import { getLayerRegistry, toErrorInstance } from '@/layers'
import type {
  FeatureSelectedEvent,
  LayerCapabilities,
  LayerConfig,
  LayerLoadedEvent,
} from '@/types/layers'
import type { MapLibraryOption } from '@/types/playground'

/** Eventos que emite {@link useLayerManager}, con su payload tipado. */
export interface LayerManagerEvents {
  /** Una capa terminó de cargar (con éxito o con error: revisa `event.error`). */
  'layer-loaded': LayerLoadedEvent
  /** Fallo al cargar una capa (también se registra en `errors`). */
  'layer-error': { layerId: string; error: Error }
  /** Una capa se quitó del mapa. */
  'layer-unloaded': { layerId: string }
  /** Cambió la visibilidad de una capa ya cargada. */
  'layer-visibility-changed': { layerId: string; visible: boolean }
  /** El usuario seleccionó (click) un feature de alguna capa. */
  'feature-selected': FeatureSelectedEvent
  /** Una capa recién cargada tiene una capacidad relevante para mostrar un widget específico. */
  'capability-detected': {
    layerId: string
    capability: 'temporal' | 'editable' | 'filterable' | 'searchable'
  }
}

type LayerManagerEventName = keyof LayerManagerEvents
type LayerManagerListener<E extends LayerManagerEventName> = (
  payload: LayerManagerEvents[E],
) => void
/** Forma de almacenamiento interna: borra el tipo del payload a `unknown` para poder guardar listeners de distintos eventos en la misma colección (invocarlo con un payload concreto sigue siendo seguro). */
type AnyLayerManagerListener = (payload: unknown) => void
type BooleanCapabilityKey = Exclude<keyof LayerCapabilities, 'timeRange'>

/**
 * Gestiona el ciclo de vida de capas dinámicas (GeoJSON, TopoJSON, KML, WMS,
 * WFS, Tiles, WMTS) sobre un mapa de `ASMap`: carga, descarga, visibilidad y
 * detección de capacidades — apoyándose en `src/layers/` (`getLayerRegistry`)
 * para el renderizado real por motor.
 *
 * Es agnóstico de componentes Vue: no emite eventos de un `<template>`, expone
 * un pequeño pub/sub tipado (`on`/`off`) para que quien lo use decida qué
 * hacer con cada evento (p. ej. reenviarlo como `emit` de su propio componente).
 *
 * @param mapInstance - Normalmente `asMapRef.value?.mapInstanceRef` (ver `ASMap.vue`).
 * @param mapLibrary - El mismo motor con el que se creó ese mapa (`ASMap`'s `mapLibrary`).
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const mapRef = ref<InstanceType<typeof ASMap>>()
 * const manager = useLayerManager(
 *   computed(() => mapRef.value?.mapInstanceRef.value ?? null),
 *   'leaflet',
 * )
 * manager.on('feature-selected', (event) => console.log(event.properties))
 * await manager.loadLayer({ id: 'rios', name: 'Ríos', type: 'geojson', visible: true, options: { data: url } })
 * </script>
 * ```
 */
export function useLayerManager(
  mapInstance: Ref<L.Map | MapLibreMap | null>,
  mapLibrary: MapLibraryOption | Ref<MapLibraryOption>,
) {
  const layers = ref(new Map<string, LayerConfig>())
  const loadingLayers = ref(new Set<string>())
  const errors = ref(new Map<string, Error>())

  /** Cómo quitar/ocultar cada capa cargada. No se expone: es un detalle de implementación. */
  const rendered = new Map<string, { remove: () => void; setVisible: (visible: boolean) => void }>()

  const listeners = new Map<LayerManagerEventName, Set<AnyLayerManagerListener>>()

  function on<E extends LayerManagerEventName>(
    event: E,
    callback: LayerManagerListener<E>,
  ): () => void {
    if (!listeners.has(event)) listeners.set(event, new Set())
    listeners.get(event)?.add(callback as AnyLayerManagerListener)
    return () => off(event, callback)
  }

  function off<E extends LayerManagerEventName>(event: E, callback: LayerManagerListener<E>): void {
    listeners.get(event)?.delete(callback as AnyLayerManagerListener)
  }

  function emit<E extends LayerManagerEventName>(event: E, payload: LayerManagerEvents[E]): void {
    listeners.get(event)?.forEach((callback) => callback(payload))
  }

  function emitCapabilityEvents(layerId: string, capabilities: LayerCapabilities): void {
    if (capabilities.isTemporal) emit('capability-detected', { layerId, capability: 'temporal' })
    if (capabilities.isEditable) emit('capability-detected', { layerId, capability: 'editable' })
    if (capabilities.hasFilters) emit('capability-detected', { layerId, capability: 'filterable' })
    if (capabilities.hasSearch) emit('capability-detected', { layerId, capability: 'searchable' })
  }

  /** Carga una capa: detecta sus capacidades, la renderiza y aplica su visibilidad inicial. */
  async function loadLayer(layerConfig: LayerConfig): Promise<void> {
    const map = mapInstance.value
    if (!map) {
      const error = new Error('El mapa todavía no está inicializado: no se puede cargar la capa.')
      errors.value.set(layerConfig.id, error)
      emit('layer-error', { layerId: layerConfig.id, error })
      return
    }

    loadingLayers.value.add(layerConfig.id)
    errors.value.delete(layerConfig.id)

    try {
      const registry = getLayerRegistry(unref(mapLibrary))
      const renderer = registry[layerConfig.type]
      const capabilities = renderer.detectCapabilities(layerConfig)
      // Copia propia: no mutamos el objeto que nos pasó quien llama.
      const resolvedConfig: LayerConfig = { ...layerConfig, capabilities }

      const result = await renderer.render(map, resolvedConfig, {
        onFeatureSelected: (event) => emit('feature-selected', event),
      })

      if (result.event.error) {
        throw result.event.error
      }

      result.setVisible(resolvedConfig.visible)
      rendered.set(layerConfig.id, result)
      layers.value.set(layerConfig.id, resolvedConfig)

      emit('layer-loaded', result.event)
      emitCapabilityEvents(layerConfig.id, capabilities)
    } catch (error) {
      const errorInstance = toErrorInstance(error)
      errors.value.set(layerConfig.id, errorInstance)
      emit('layer-error', { layerId: layerConfig.id, error: errorInstance })
    } finally {
      loadingLayers.value.delete(layerConfig.id)
    }
  }

  /** Quita una capa del mapa y libera sus recursos. No hace nada si no está cargada. */
  function unloadLayer(layerId: string): void {
    rendered.get(layerId)?.remove()
    rendered.delete(layerId)
    if (layers.value.delete(layerId)) {
      emit('layer-unloaded', { layerId })
    }
  }

  /** Quita todas las capas cargadas, dejando el mapa intacto (llama a `remove()` de cada una). */
  function unloadAll(): void {
    for (const layerId of Array.from(layers.value.keys())) {
      unloadLayer(layerId)
    }
  }

  /**
   * Limpia el estado interno del manager (capas, cargas en curso, errores)
   * **sin** invocar `remove()` de cada capa. Pensado únicamente para cuando
   * el propio mapa va a destruirse de todas formas (p. ej. `ASMap` recreando
   * el mapa al cambiar `mapLibrary`, o al desmontarse): `map.remove()` ya
   * desmonta paneles/capas/renderers de forma atómica, y desmontar cada capa
   * a mano justo antes deja renderers SVG/Canvas de Leaflet en un estado
   * inconsistente que el propio `map.remove()` no espera (lanza al intentar
   * limpiarlos por segunda vez). Si el mapa sigue vivo, usa `unloadAll()`.
   */
  function reset(): void {
    rendered.clear()
    layers.value.clear()
    loadingLayers.value.clear()
    errors.value.clear()
  }

  /** Alterna la visibilidad de una capa ya cargada (sin volver a pedirla/reconstruirla). */
  function toggleLayerVisibility(layerId: string): void {
    const layer = layers.value.get(layerId)
    if (!layer) return
    const visible = !layer.visible
    layer.visible = visible
    rendered.get(layerId)?.setVisible(visible)
    emit('layer-visibility-changed', { layerId, visible })
  }

  /** Devuelve las capas cargadas que tengan una capacidad concreta activa. */
  function getLayersWithCapability(capability: BooleanCapabilityKey): LayerConfig[] {
    return Array.from(layers.value.values()).filter((layer) =>
      Boolean(layer.capabilities?.[capability]),
    )
  }

  return {
    layers: readonly(layers),
    loadingLayers: readonly(loadingLayers),
    errors: readonly(errors),
    loadLayer,
    unloadLayer,
    unloadAll,
    reset,
    toggleLayerVisibility,
    getLayersWithCapability,
    on,
    off,
  }
}
