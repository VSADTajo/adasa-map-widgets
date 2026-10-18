/**
 * Dominio `map` (`@vsadtajo/adasa-ui/map`): `ASMap`, los widgets `ASMap*`,
 * el sistema de capas y de leyendas. Leaflet, MapLibre y el resto de
 * dependencias de mapas son `peerDependencies` opcionales cargadas con
 * `import()` dinámico: solo se descargan al montar un `ASMap`.
 */

export { default as ASMap } from './components/ASMap.vue'
export type { ASMapProps } from './components/ASMap.vue'
export { default as ASMapTimeControls } from './components/ASMapTimeControls.vue'
export { default as ASMapTimeRangeControls } from './components/ASMapTimeRangeControls.vue'
export { default as ASMapDayIntervalControls } from './components/ASMapDayIntervalControls.vue'
export { default as ASMapBasemapsSelector } from './components/ASMapBasemapsSelector.vue'
export { default as ASMapScale } from './components/ASMapScale.vue'
export { default as ASMapLegend } from './components/ASMapLegend.vue'
export { default as ASMapButtonToggle } from './components/ASMapButtonToggle.vue'

export { provideMapAdapter, useMapAdapter, useMapView } from './composables/useMapAdapter'
export { useLayerManager, type LayerManagerEvents } from './composables/useLayerManager'

export * from './layers'
export * from './legend'

export type {
  LatLng,
  MapBounds,
  MapViewState,
  MapAdapter,
  MapAdapterEvent,
  MapAdapterEventHandler,
  MapLibraryOption,
} from './types/map'
export type {
  TimeControlsPosition,
  TimeControlsTheme,
  TimelineProps,
  TimelineEmits,
} from './types/TimelineProps'
export type { TimeRangeProps, TimeRangeEmits } from './types/TimeRangeProps'
export type {
  BasemapsSelectorPosition,
  BasemapsSelectorProps,
  BasemapsSelectorEmits,
} from './types/BasemapsSelectorProps'
export type { ScalePosition, ScaleMode, ScaleUnits, ScaleProps } from './types/ScaleProps'
export type { LegendPosition, LegendProps } from './types/LegendProps'
export type {
  ButtonTogglePosition,
  ButtonToggleOption,
  ButtonToggleProps,
  ButtonToggleEmits,
} from './types/ButtonToggleProps'
export type {
  DayIntervalAlert,
  DayIntervalSelection,
  DayIntervalProps,
  DayIntervalEmits,
} from './types/DayIntervalProps'
export type {
  LayerType,
  LayerKind,
  GeoJsonGeometry,
  GeoJsonFeature,
  GeoJsonFeatureCollection,
  LayerCapabilities,
  GeoJSONOptions,
  TopoJSONTopology,
  TopoJSONOptions,
  KMLOptions,
  WMSOptions,
  WFSOptions,
  TilesOptions,
  WMTSOptions,
  COGColorScale,
  COGOptions,
  MVTOptions,
  GeoServerOptions,
  LayerTypeOptions,
  LayerConfig,
  LayerLoadedEvent,
  FeatureSelectedEvent,
} from './types/layers'
export type {
  LegendType,
  LegendSource,
  LegendSymbol,
  LegendItem,
  LegendRamp,
  LegendCapabilities,
  LegendAdapter,
} from './types/legend'
