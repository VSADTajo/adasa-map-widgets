import type {
  FeatureSelectedEvent,
  LayerCapabilities,
  LayerConfig,
  LayerLoadedEvent,
} from '@/types/layers'

/**
 * Ganchos que un {@link LayerRenderer} puede invocar mientras la capa está
 * activa. Sustituyen al bus global (`window.dispatchEvent`) por callbacks
 * tipados: quien orquesta el renderizado (típicamente un composable como
 * `useLayerManager`) decide qué hacer con cada evento, p. ej. reemitirlo
 * como un evento de componente Vue normal.
 */
export interface LayerRenderHooks {
  /** Se invoca cuando el usuario selecciona (click) un feature de la capa. */
  onFeatureSelected?: (event: FeatureSelectedEvent) => void
}

/** Resultado de renderizar una capa: el evento de carga y cómo controlarla después. */
export interface RenderedLayer {
  event: LayerLoadedEvent
  /** Quita la capa del mapa y libera sus recursos (listeners, fuentes, paneles...). */
  remove: () => void
  /** Muestra u oculta la capa ya renderizada, sin volver a pedirla/reconstruirla. */
  setVisible: (visible: boolean) => void
}

/**
 * Sabe renderizar y limpiar un tipo de capa sobre un motor de mapas concreto
 * (`TMap` es `L.Map` en el registro de Leaflet, o `MapLibreMap` en el de
 * MapLibre). `detectCapabilities` no depende del mapa: solo inspecciona la
 * configuración de la capa, por lo que es la misma función para ambos motores.
 */
export interface LayerRenderer<TMap> {
  render: (map: TMap, layer: LayerConfig, hooks: LayerRenderHooks) => Promise<RenderedLayer>
  detectCapabilities: (layer: LayerConfig) => LayerCapabilities
}

/** Convierte cualquier valor capturado en un `catch` a una instancia real de `Error`. */
export function toErrorInstance(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value))
}
