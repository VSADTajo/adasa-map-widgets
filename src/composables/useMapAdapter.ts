import { inject, onBeforeUnmount, provide, ref, type InjectionKey, type Ref } from 'vue'
import type { LatLng, MapAdapter, MapViewState } from '@/types/map'

const MAP_ADAPTER_KEY: InjectionKey<MapAdapter> = Symbol('amw-map-adapter')

/**
 * Provee un {@link MapAdapter} a los widgets descendientes, evitando tener que
 * pasarlo como prop a cada uno. Útil cuando varios widgets comparten el mismo mapa.
 */
export function provideMapAdapter(adapter: MapAdapter): void {
  provide(MAP_ADAPTER_KEY, adapter)
}

/**
 * Resuelve el {@link MapAdapter} a usar: el pasado explícitamente (p. ej. vía
 * prop de un widget) tiene prioridad sobre el inyectado con {@link provideMapAdapter}.
 * Lanza un error descriptivo si ninguno está disponible.
 */
export function useMapAdapter(explicit?: MapAdapter): MapAdapter {
  const adapter = explicit ?? inject(MAP_ADAPTER_KEY, null)
  if (!adapter) {
    throw new Error(
      '[adasa-map-widgets] No se encontró un MapAdapter. Pásalo como prop `map-adapter` ' +
        'o provéelo en un ancestro con provideMapAdapter().',
    )
  }
  return adapter
}

/**
 * Sincroniza refs reactivos de zoom/centro con un {@link MapAdapter}, suscribiéndose
 * a sus eventos de movimiento y liberando los listeners automáticamente al desmontar.
 */
export function useMapView(adapter: MapAdapter): {
  zoom: Ref<number>
  center: Ref<LatLng>
} {
  const zoom = ref(adapter.getZoom())
  const center = ref<LatLng>(adapter.getCenter())

  const handleChange = (state: MapViewState): void => {
    zoom.value = state.zoom
    center.value = state.center
  }

  adapter.on('move', handleChange)
  adapter.on('zoom', handleChange)

  onBeforeUnmount(() => {
    adapter.off('move', handleChange)
    adapter.off('zoom', handleChange)
  })

  return { zoom, center }
}
