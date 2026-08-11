import type { Component } from 'vue'
import ASMap from '@/components/mapping/ASMap.vue'
import ASMapTimeControls from '@/components/controls/ASMapTimeControls.vue'
import ASMapTimeRangeControls from '@/components/controls/ASMapTimeRangeControls.vue'
import ASMapDayIntervalControls from '@/components/controls/ASMapDayIntervalControls.vue'
import ASMapBasemapsSelector from '@/components/controls/ASMapBasemapsSelector.vue'
import type { ComponentDoc, EventDoc, LayerOptionField } from './propTypes'
import type { DayIntervalAlert } from '@/types/DayIntervalProps'
import type {
  FeatureSelectedEvent,
  LayerCapabilities,
  LayerKind,
  LayerLoadedEvent,
} from '@/types/layers'
import type { LayerCapabilityName } from '@/components/mapping/ASMap.vue'
import { detectCapabilities, LAYER_KIND } from '@/layers'
import { getLayerExample, layerExamples } from './utils/layerExamples'
import { basemapExamples } from './utils/basemapExamples'

/** Handlers de eventos que sincronizan el estado del preview y registran el evento en el log. */
export type LiveBindings = Record<string, (...args: unknown[]) => void>

export interface RegistryEntry extends ComponentDoc {
  component: Component
  /** Props estáticas no editables desde el formulario (p. ej. arrays complejos). */
  staticProps?: Record<string, unknown>
  /** Genera los listeners a aplicar en la preview en vivo, con acceso a los valores editables y al logger de eventos. */
  bindings?: (
    values: Record<string, unknown>,
    log: (name: string, payload?: unknown) => void,
  ) => LiveBindings
  /**
   * Código a mostrar en el panel "Código" en vez del snippet Vue generado
   * automáticamente a partir de `propsSchema`. Lo usan las entradas de
   * categoría `'layers'`: lo relevante ahí es el objeto `LayerConfig` en sí,
   * no las props de `ASMap` (que solo lo recibe tal cual en su prop `layers`).
   */
  codeOverride?: string
  /** Documentación de `options` para entradas de categoría `'layers'` (ver `src/types/layers.ts`). */
  layerOptionsSchema?: LayerOptionField[]
  /** Capacidades detectadas para el ejemplo de esta capa (ver `detectCapabilities`), solo categoría `'layers'`. */
  layerCapabilities?: LayerCapabilities
  /** Si el cliente ve datos vectoriales o solo una imagen ya renderizada (ver `LAYER_KIND`), solo categoría `'layers'`. */
  layerKind?: LayerKind
}

/**
 * Construye una entrada de documentación de categoría `'layers'`: usa `ASMap`
 * como vista previa en vivo con un único ejemplo de `layerExamples.ts`
 * cargado, y muestra el propio `LayerConfig` (no un snippet de props de
 * `ASMap`) en el panel de código.
 */
function buildLayerEntry(params: {
  id: string
  name: string
  description: string
  layerOptionsSchema: LayerOptionField[]
  events: EventDoc[]
  center: [number, number]
  zoom: number
  exampleId: string
  notes: string
}): RegistryEntry {
  const example = getLayerExample(params.exampleId)
  if (!example) throw new Error(`No existe el ejemplo de capa "${params.exampleId}"`)

  return {
    id: params.id,
    name: params.name,
    category: 'layers',
    description: params.description,
    propsSchema: [
      {
        key: 'mapLibrary',
        label: 'Motor de mapas',
        type: 'select',
        options: ['leaflet', 'maplibre'],
        default: 'leaflet',
        description: 'El sistema de capas es el mismo para los dos motores.',
      },
    ],
    events: params.events,
    layerOptionsSchema: params.layerOptionsSchema,
    layerCapabilities: detectCapabilities(example.config),
    layerKind: LAYER_KIND[example.config.type],
    staticProps: { center: params.center, zoom: params.zoom, layers: [example.config] },
    notes: params.notes,
    component: ASMap,
    codeOverride: JSON.stringify(example.config, null, 2),
    bindings: (_values, log) =>
      ({
        onLayerLoaded: (event: LayerLoadedEvent) =>
          log('layer-loaded', {
            layerId: event.layerId,
            type: event.type,
            capabilities: event.capabilities,
            error: event.error?.message,
          }),
        onLayerError: (event: { layerId: string; error: Error }) =>
          log('layer-error', { layerId: event.layerId, error: event.error.message }),
        onCapabilityDetected: (event: { layerId: string; capability: LayerCapabilityName }) =>
          log('capability-detected', event),
        onFeatureSelected: (event: FeatureSelectedEvent) => log('feature-selected', event),
      }) as LiveBindings,
  }
}

function buildDemoTimeline(hours = 12): Date[] {
  const start = new Date()
  start.setMinutes(0, 0, 0)
  return Array.from({ length: hours }, (_, index) => new Date(start.getTime() + index * 3600_000))
}

function buildDemoAlerts(): DayIntervalAlert[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const at = (dayOffset: number, hour: number) =>
    new Date(today.getTime() + dayOffset * 86_400_000 + hour * 3_600_000)

  return [
    { start: at(0, 6), end: at(0, 18), level: 'amarillo' },
    { start: at(1, 12), end: at(1, 24), level: 'naranja' },
    { start: at(2, 0), end: at(2, 12), level: 'rojo' },
  ]
}

export const registry: RegistryEntry[] = [
  {
    id: 'as-map',
    name: 'ASMap',
    category: 'mapping',
    description:
      'Contenedor de mapa agnóstico del motor subyacente (Leaflet o MapLibre GL JS), con un basemap de OpenStreetMap por defecto (prop `basemaps`). Su slot por defecto aloja los widgets posicionados sobre el mapa; su prop `layers` carga capas dinámicas (GeoJSON, TopoJSON, KML, WMS, WFS, Tiles, WMTS, COG — ver la categoría "Layers" para el detalle de cada una, incluido el helper `geoServerLayer()` para servidores GeoServer).',
    propsSchema: [
      {
        key: 'mapLibrary',
        label: 'Motor de mapas',
        type: 'select',
        options: ['leaflet', 'maplibre'],
        default: 'leaflet',
        description: 'Leaflet y MapLibre GL JS son peerDependencies opcionales.',
      },
      { key: 'zoom', label: 'Zoom', type: 'number', default: 6, min: 0, max: 18, step: 1 },
      {
        key: 'minZoom',
        label: 'Zoom mínimo',
        type: 'number',
        default: 0,
        min: 0,
        max: 18,
        step: 1,
      },
      {
        key: 'maxZoom',
        label: 'Zoom máximo',
        type: 'number',
        default: 19,
        min: 1,
        max: 22,
        step: 1,
      },
      {
        key: 'interactive',
        label: 'Interactivo',
        type: 'boolean',
        default: true,
        description:
          'Si se desactiva, el usuario no puede hacer pan/zoom/click (mapa de solo lectura).',
      },
      { key: 'zoomControl', label: 'Control de zoom', type: 'boolean', default: true },
      { key: 'attributionControl', label: 'Control de atribución', type: 'boolean', default: true },
      {
        key: 'pitch',
        label: 'Inclinación 3D (pitch)',
        type: 'number',
        default: 0,
        min: 0,
        max: 60,
        step: 5,
        description: 'Solo con motor MapLibre; Leaflet es 2D y la ignora.',
      },
      {
        key: 'bearing',
        label: 'Rotación (bearing)',
        type: 'number',
        default: 0,
        min: 0,
        max: 360,
        step: 15,
        description: 'Solo con motor MapLibre.',
      },
      {
        key: 'basemap',
        label: 'Basemap activo (id)',
        type: 'string',
        default: 'osm',
        description:
          'Id de `basemaps`: "osm", "topo", "positron", "dark-matter" o "satellite". Campo de texto simple; para un selector visual real usa `ASMapBasemapsSelector` en el "Compositor sobre mapa".',
      },
    ],
    events: [
      {
        name: 'map-ready',
        payload: 'L.Map | MapLibreMap',
        description: 'El mapa terminó de inicializarse.',
      },
      {
        name: 'update:center',
        payload: '[number, number]',
        description: 'El usuario hizo pan. Úsalo con v-model:center.',
      },
      {
        name: 'update:zoom',
        payload: 'number',
        description: 'El usuario cambió el zoom. Úsalo con v-model:zoom.',
      },
      {
        name: 'update:pitch',
        payload: 'number',
        description:
          'El usuario cambió la inclinación 3D (solo MapLibre). Úsalo con v-model:pitch.',
      },
      {
        name: 'update:bearing',
        payload: 'number',
        description: 'El usuario rotó el mapa (solo MapLibre). Úsalo con v-model:bearing.',
      },
      {
        name: 'update:basemap',
        payload: 'string',
        description: 'El basemap activo cambió. Úsalo con v-model:basemap.',
      },
      {
        name: 'layer-loaded',
        payload: 'LayerLoadedEvent',
        description: 'Una capa de `layers` terminó de cargar (con éxito o con error).',
      },
      {
        name: 'layer-error',
        payload: '{ layerId, error }',
        description: 'Fallo al cargar una capa de `layers`.',
      },
      {
        name: 'capability-detected',
        payload: "{ layerId, capability: 'temporal' | 'editable' | 'filterable' | 'searchable' }",
        description:
          'Una capa cargada tiene una capacidad relevante para mostrar un widget específico.',
      },
      {
        name: 'feature-selected',
        payload: 'FeatureSelectedEvent',
        description: 'El usuario hizo click en un feature de una capa.',
      },
      {
        name: 'map-click',
        payload: '{ coordinates: [number, number] }',
        description:
          'Click en el mapa que no encontró ningún feature (si lo encuentra, se emite feature-selected en su lugar).',
      },
    ],
    staticProps: {
      center: [40.4168, -3.7038],
      layers: [layerExamples[0]!.config],
      basemaps: basemapExamples,
    },
    notes:
      'Si la librería de mapas elegida no está instalada en el proyecto, ASMap muestra un mensaje de error en su lugar en vez de fallar en silencio. Aquí se precarga el ejemplo de capa GeoJSON (sin red); para probar WMS/WFS/Tiles usa el modo "Compositor sobre mapa", o mira la categoría "Layers" para la documentación completa de cada tipo. `basemaps` (lista de `{id, name, tileLayer?, style?, attribution?}`) se fija aquí como prop estática con los 5 basemaps reales de `basemapExamples` (no editable por no ser un tipo primitivo); prueba a escribir su id ("osm", "topo", "positron", "dark-matter" o "satellite") en "Basemap activo" para alternar entre ellos, o usa el widget `ASMapBasemapsSelector` para un selector visual real (ver el modo "Compositor sobre mapa"). `maxBounds`/`bounds` (bboxes `[[latSur,lngOeste],[latNorte,lngEste]]`) tampoco son editables aquí, pero se pueden probar aparte. Haz pan/zoom en la vista previa para ver `update:center`/`update:zoom`, o click en el mapa: sobre la capa GeoJSON precargada verás `feature-selected`, en cualquier otro punto verás `map-click`.',
    component: ASMap,
    bindings: (values, log) =>
      ({
        'onUpdate:center': (center) => {
          values.center = center
          log('update:center', center)
        },
        'onUpdate:zoom': (zoom) => {
          values.zoom = zoom
          log('update:zoom', zoom)
        },
        'onUpdate:pitch': (pitch) => {
          values.pitch = pitch
          log('update:pitch', pitch)
        },
        'onUpdate:bearing': (bearing) => {
          values.bearing = bearing
          log('update:bearing', bearing)
        },
        'onUpdate:basemap': (id) => {
          values.basemap = id
          log('update:basemap', id)
        },
        onFeatureSelected: (event: FeatureSelectedEvent) => log('feature-selected', event),
        onMapClick: (event: { coordinates: [number, number] }) => log('map-click', event),
        onLayerLoaded: (event: LayerLoadedEvent) =>
          log('layer-loaded', {
            layerId: event.layerId,
            type: event.type,
            capabilities: event.capabilities,
            error: event.error?.message,
          }),
        onLayerError: (event: { layerId: string; error: Error }) =>
          log('layer-error', { layerId: event.layerId, error: event.error.message }),
        onCapabilityDetected: (event: { layerId: string; capability: LayerCapabilityName }) =>
          log('capability-detected', event),
      }) as LiveBindings,
  },
  {
    id: 'as-map-terrain',
    name: 'ASMap: terreno 3D',
    category: 'mapping',
    description:
      'Terreno 3D (relieve real, vía `map.setTerrain`) a partir de un DEM, con la prop `terrain` de `ASMap`. Solo tiene efecto con `mapLibrary="maplibre"` (Leaflet es 2D y la ignora); combínalo con `pitch` para verlo en perspectiva.',
    propsSchema: [
      {
        key: 'mapLibrary',
        label: 'Motor de mapas',
        type: 'select',
        options: ['leaflet', 'maplibre'],
        default: 'maplibre',
        description:
          'Con "leaflet" no se ve ningún relieve: `terrain` no tiene efecto en ese motor.',
      },
      { key: 'zoom', label: 'Zoom', type: 'number', default: 11, min: 8, max: 14, step: 1 },
      {
        key: 'pitch',
        label: 'Inclinación 3D (pitch)',
        type: 'number',
        default: 60,
        min: 0,
        max: 60,
        step: 5,
        description: 'Con pitch=0 el relieve 3D no se aprecia: es solo una vista cenital.',
      },
      {
        key: 'bearing',
        label: 'Rotación (bearing)',
        type: 'number',
        default: 30,
        min: 0,
        max: 360,
        step: 15,
      },
    ],
    events: [
      {
        name: 'map-ready',
        payload: 'L.Map | MapLibreMap',
        description: 'El mapa terminó de inicializarse.',
      },
      {
        name: 'update:pitch',
        payload: 'number',
        description: 'El usuario cambió la inclinación 3D. Úsalo con v-model:pitch.',
      },
      {
        name: 'update:bearing',
        payload: 'number',
        description: 'El usuario rotó el mapa. Úsalo con v-model:bearing.',
      },
    ],
    staticProps: {
      center: [42.500454, 0.999756],
      terrain: {
        url: 'https://cdn.geomatico.es/pirineo_dem_cog_256.tif',
        exaggeration: 1.5,
      },
    },
    notes:
      "DEM público (el mismo que usa la documentación oficial de `@geomatico/maplibre-cog-protocol` para su ejemplo de hillshading/terreno): un GeoTIFF de 333 MB, pero Cloud Optimized de verdad — el navegador solo pide, vía HTTP Range, las teselas que hacen falta para la vista actual, nunca el archivo completo. `url` no es una plantilla de teselas ({z}/{x}/{y}), así que ASMap la resuelve como GeoTIFF vía `cog://...#dem` (mismo protocolo que las capas de tipo `'cog'`). Centrado en el Pirineo (frontera España-Andorra-Francia) para que el relieve se note.",
    component: ASMap,
    bindings: (values, log) =>
      ({
        'onUpdate:pitch': (pitch) => {
          values.pitch = pitch
          log('update:pitch', pitch)
        },
        'onUpdate:bearing': (bearing) => {
          values.bearing = bearing
          log('update:bearing', bearing)
        },
      }) as LiveBindings,
  },
  {
    id: 'time-controls',
    name: 'ASMapTimeControls',
    category: 'controls',
    description:
      'Control de reproducción de una línea de tiempo: play/pause, paso a paso y slider. Componente controlado y agnóstico de cualquier store: currentTimeIndex/isPlaying son v-model.',
    propsSchema: [
      {
        key: 'currentTimeIndex',
        label: 'Índice actual',
        type: 'number',
        default: 0,
        min: 0,
        max: 11,
        step: 1,
      },
      { key: 'isPlaying', label: 'Reproduciendo', type: 'boolean', default: false },
      {
        key: 'stepMs',
        label: 'Intervalo (ms)',
        type: 'number',
        default: 2000,
        min: 250,
        max: 10000,
        step: 250,
      },
      { key: 'theme', label: 'Tema', type: 'select', options: ['dark', 'light'], default: 'dark' },
      { key: 'accentColor', label: 'Color de acento', type: 'color', default: '#22c55e' },
      { key: 'width', label: 'Ancho (CSS, ej. 720px / 90%)', type: 'string', default: '' },
    ],
    events: [
      {
        name: 'update:currentTimeIndex',
        payload: 'number',
        description: 'Nuevo índice propuesto (slider, paso manual o avance automático).',
      },
      {
        name: 'update:isPlaying',
        payload: 'boolean',
        description: 'Nuevo estado de reproducción.',
      },
      {
        name: 'time-changed',
        payload: 'Date',
        description: 'El instante resuelto (timeline[currentTimeIndex]) cambió.',
      },
    ],
    staticProps: { timeline: buildDemoTimeline() },
    component: ASMapTimeControls,
    bindings: (values, log) => ({
      'onUpdate:currentTimeIndex': (value) => {
        values.currentTimeIndex = value
        log('update:currentTimeIndex', value)
      },
      'onUpdate:isPlaying': (value) => {
        values.isPlaying = value
        log('update:isPlaying', value)
      },
      onTimeChanged: (date) => log('time-changed', date),
    }),
  },
  {
    id: 'time-range-controls',
    name: 'ASMapTimeRangeControls',
    category: 'controls',
    description:
      'Selección de un rango de tiempo dentro de una línea temporal: dos manejadores sobre un slider doble y botones de ajuste fino ±1 para cada extremo. Sin reproducción automática.',
    propsSchema: [
      { key: 'theme', label: 'Tema', type: 'select', options: ['dark', 'light'], default: 'dark' },
      { key: 'accentColor', label: 'Color de acento', type: 'color', default: '#f97316' },
      { key: 'width', label: 'Ancho (CSS, ej. 760px / 90%)', type: 'string', default: '' },
    ],
    events: [
      {
        name: 'update:currentRange',
        payload: '[number, number]',
        description: 'Nuevo rango [inicio, fin] propuesto.',
      },
      {
        name: 'range-changed',
        payload: '{ start: Date, end: Date }',
        description: 'El par de instantes resuelto cambió.',
      },
    ],
    staticProps: { timeline: buildDemoTimeline(), currentRange: [2, 9] },
    component: ASMapTimeRangeControls,
    bindings: (values, log) => ({
      'onUpdate:currentRange': (value) => {
        values.currentRange = value
        log('update:currentRange', value)
      },
      onRangeChanged: (range) => log('range-changed', range),
    }),
  },
  {
    id: 'day-interval-controls',
    name: 'ASMapDayIntervalControls',
    category: 'controls',
    description:
      'Selector de intervalos horarios agrupados por día (por defecto: 3 días × bloques de 6h), coloreados según el nivel de severidad más alto entre los avisos que solapen con cada intervalo.',
    propsSchema: [
      { key: 'title', label: 'Título', type: 'string', default: 'Avisos AEMET' },
      { key: 'subtitle', label: 'Subtítulo', type: 'string', default: 'Viento y lluvia' },
      { key: 'days', label: 'Días', type: 'number', default: 3, min: 1, max: 5, step: 1 },
      { key: 'theme', label: 'Tema', type: 'select', options: ['dark', 'light'], default: 'dark' },
      { key: 'accentColor', label: 'Color de acento', type: 'color', default: '#2563eb' },
      { key: 'width', label: 'Ancho (CSS, ej. 760px / 90%)', type: 'string', default: '' },
    ],
    events: [
      {
        name: 'update:selectedIntervalStart',
        payload: 'Date',
        description: 'Nuevo inicio de intervalo seleccionado.',
      },
      {
        name: 'interval-changed',
        payload: '{ start: Date, end: Date, level: string | null }',
        description: 'Se emite junto a update:selectedIntervalStart, con el intervalo resuelto.',
      },
    ],
    staticProps: { alerts: buildDemoAlerts(), selectedIntervalStart: null },
    notes: 'La prop "alerts" no es editable en este playground; se usa un set de ejemplo fijo.',
    component: ASMapDayIntervalControls,
    bindings: (values, log) => ({
      'onUpdate:selectedIntervalStart': (value) => {
        values.selectedIntervalStart = value
        log('update:selectedIntervalStart', value)
      },
      onIntervalChanged: (interval) => log('interval-changed', interval),
    }),
  },
  {
    id: 'basemaps-selector',
    name: 'ASMapBasemapsSelector',
    category: 'controls',
    description:
      'Selector de basemap: un recuadro con la miniatura del basemap activo que, al hacer click, despliega un menú con un recuadro por cada uno de los demás `basemaps`. Elegir uno cambia el basemap y cierra el menú. Pensado para usarse junto a las props `basemaps`/`basemap` de ASMap (mismo formato).',
    propsSchema: [
      {
        key: 'basemap',
        label: 'Basemap activo (id)',
        type: 'string',
        default: 'osm',
        description: 'Id de `basemaps`: "osm", "topo", "positron", "dark-matter" o "satellite".',
      },
      {
        key: 'position',
        label: 'Posición',
        type: 'select',
        options: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
        default: 'bottom-right',
      },
      {
        key: 'offset',
        label: 'Offset (px)',
        type: 'number',
        default: 20,
        min: 0,
        max: 80,
        step: 4,
      },
      { key: 'theme', label: 'Tema', type: 'select', options: ['dark', 'light'], default: 'dark' },
    ],
    events: [
      {
        name: 'update:basemap',
        payload: 'string',
        description: 'El usuario eligió un basemap del menú. Úsalo con v-model:basemap.',
      },
    ],
    staticProps: { basemaps: basemapExamples },
    notes:
      'La prop "basemaps" no es editable en este playground (no es un tipo primitivo); se usan los 5 basemaps reales de `basemapExamples` (OpenStreetMap, OpenTopoMap, CARTO Positron/Dark Matter y Esri World Imagery), con su miniatura real. Haz click en el recuadro para ver el menú con los otros cuatro. Para ver que además cambia el mapa base de verdad, usa el modo "Compositor sobre mapa".',
    component: ASMapBasemapsSelector,
    bindings: (values, log) => ({
      'onUpdate:basemap': (id) => {
        values.basemap = id
        log('update:basemap', id)
      },
    }),
  },
  buildLayerEntry({
    id: 'layer-geojson',
    name: 'Capa GeoJSON',
    description:
      'Carga una colección de features GeoJSON ya resuelta (o una URL desde la que descargarla) como capa vectorial: puntos, líneas y polígonos con estilo por feature. Es la única capa cuyos datos pueden ser 100% locales (sin red).',
    layerOptionsSchema: [
      {
        key: 'data',
        type: 'GeoJsonFeatureCollection | string',
        required: true,
        description: 'Colección de features ya resuelta, o una URL desde la que cargarla.',
      },
      {
        key: 'style',
        type: '(feature) => Record<string, unknown>',
        description:
          'Estilo por feature. El tipo de retorno depende del motor de mapas subyacente (Leaflet `PathOptions`, o propiedades de `paint` para MapLibre).',
      },
      {
        key: 'pointToLayer',
        type: '(feature, latlng) => unknown',
        description: 'Fábrica de la capa a usar para features de tipo punto (solo Leaflet).',
      },
      {
        key: 'onEachFeature',
        type: '(feature, layer) => void',
        description: 'Hook por feature (p. ej. para enlazar popups o listeners), solo Leaflet.',
      },
    ],
    events: [
      {
        name: 'layer-loaded',
        payload: 'LayerLoadedEvent',
        description: 'La capa terminó de cargar.',
      },
      {
        name: 'layer-error',
        payload: '{ layerId, error }',
        description: 'Fallo al cargar la capa.',
      },
      {
        name: 'capability-detected',
        payload: '{ layerId, capability }',
        description:
          'GeoJSON nunca detecta capacidades especiales (siempre `isTemporal/isEditable/hasFilters/hasSearch: false`).',
      },
      {
        name: 'feature-selected',
        payload: 'FeatureSelectedEvent',
        description: 'El usuario hizo click en un feature. Siempre activo en capas GeoJSON.',
      },
    ],
    center: [40.4168, -3.7038],
    zoom: 13,
    exampleId: 'demo-geojson-madrid',
    notes:
      'Datos 100% locales (un punto, una línea y un polígono cerca de Madrid): funciona sin red, ideal para pruebas. Haz click en cualquiera de los tres features para ver `feature-selected`.',
  }),
  buildLayerEntry({
    id: 'layer-topojson',
    name: 'Capa TopoJSON',
    description:
      'Como GeoJSON, pero con la topología (arcos de frontera compartidos entre features vecinos) codificada de forma más compacta. Se convierte a GeoJSON en el cliente con la dependencia opcional `topojson-client` antes de renderizarse — por eso reutiliza exactamente el mismo pipeline que una capa GeoJSON normal.',
    layerOptionsSchema: [
      {
        key: 'data',
        type: 'TopoJSONTopology | string',
        required: true,
        description: 'Topología ya resuelta, o una URL desde la que cargarla.',
      },
      {
        key: 'object',
        type: 'string | string[]',
        description:
          "Qué objeto(s) de `topology.objects` convertir a features (p. ej. 'land'). Si se omite, se convierten todos.",
      },
      {
        key: 'style',
        type: '(feature) => Record<string, unknown>',
        description: 'Estilo por feature (igual que en GeoJSON).',
      },
      {
        key: 'pointToLayer',
        type: '(feature, latlng) => unknown',
        description: 'Fábrica de la capa para features de tipo punto (solo Leaflet).',
      },
      {
        key: 'onEachFeature',
        type: '(feature, layer) => void',
        description: 'Hook por feature, solo Leaflet.',
      },
    ],
    events: [
      {
        name: 'layer-loaded',
        payload: 'LayerLoadedEvent',
        description: 'La capa terminó de cargar (incluye la conversión a GeoJSON).',
      },
      {
        name: 'layer-error',
        payload: '{ layerId, error }',
        description: 'Fallo al cargar la topología, o al convertirla (p. ej. `object` no existe).',
      },
      {
        name: 'capability-detected',
        payload: '{ layerId, capability }',
        description: 'TopoJSON nunca detecta capacidades especiales (mismo motivo que GeoJSON).',
      },
      {
        name: 'feature-selected',
        payload: 'FeatureSelectedEvent',
        description: 'El usuario hizo click en un feature. Siempre activo, igual que en GeoJSON.',
      },
    ],
    center: [20, 0],
    zoom: 1,
    exampleId: 'demo-topojson-land',
    notes:
      'Topología pública de `world-atlas` (vía CDN de jsdelivr): las masas de tierra del mundo (`object: "land"`), sin fronteras entre países. Depende de un CDN de terceros — si está caído, verás `layer-error`. Requiere las dependencias opcionales `topojson-client` (y, si tu proyecto usa esta librería como paquete, `@types/topojson-specification` solo si quieres tipar `TopoJSONTopology` con la especificación real).',
  }),
  buildLayerEntry({
    id: 'layer-kml',
    name: 'Capa KML',
    description:
      'Keyhole Markup Language (formato de Google Earth/Maps): igual que GeoJSON, pero en XML. Se convierte a GeoJSON en el cliente con la dependencia opcional `@tmcw/togeojson` (y `fflate` si es un `.kmz`, un `.kml` comprimido en zip) antes de renderizarse.',
    layerOptionsSchema: [
      {
        key: 'data',
        type: 'string',
        required: true,
        description: 'URL de un `.kml`/`.kmz`, o contenido KML/XML ya cargado como texto.',
      },
      {
        key: 'style',
        type: '(feature) => Record<string, unknown>',
        description: 'Estilo por feature (igual que en GeoJSON).',
      },
      {
        key: 'pointToLayer',
        type: '(feature, latlng) => unknown',
        description: 'Fábrica de la capa para features de tipo punto (solo Leaflet).',
      },
      {
        key: 'onEachFeature',
        type: '(feature, layer) => void',
        description: 'Hook por feature, solo Leaflet.',
      },
    ],
    events: [
      {
        name: 'layer-loaded',
        payload: 'LayerLoadedEvent',
        description: 'La capa terminó de cargar (incluye el parseo del XML y la conversión).',
      },
      {
        name: 'layer-error',
        payload: '{ layerId, error }',
        description: 'Fallo al cargar/descomprimir/parsear el KML.',
      },
      {
        name: 'capability-detected',
        payload: '{ layerId, capability }',
        description: 'KML nunca detecta capacidades especiales (mismo motivo que GeoJSON).',
      },
      {
        name: 'feature-selected',
        payload: 'FeatureSelectedEvent',
        description: 'El usuario hizo click en un feature. Siempre activo, igual que en GeoJSON.',
      },
    ],
    center: [40.4168, -3.7038],
    zoom: 13,
    exampleId: 'demo-kml-madrid',
    notes:
      'Datos 100% locales (contenido KML como texto, sin fetch): mismo punto y polígono que el ejemplo GeoJSON, para comparar. Para un `.kmz` (zip) se necesita además la dependencia opcional `fflate`.',
  }),
  buildLayerEntry({
    id: 'layer-tiles',
    name: 'Capa de teselas (Tiles)',
    description:
      'Superpone una capa ráster de teselas (XYZ) adicional sobre el basemap, con su propia opacidad — p. ej. una capa de relieve o de un servidor propio, distinta del basemap. Es la capa más simple: no tiene features individuales, solo imágenes.',
    layerOptionsSchema: [
      {
        key: 'url',
        type: 'string',
        required: true,
        description: "Plantilla de URL, p. ej. 'https://tile.opentopomap.org/{z}/{x}/{y}.png'.",
      },
      {
        key: 'attribution',
        type: 'string',
        description: 'Atribución de este proveedor de teselas.',
      },
      {
        key: 'maxZoom',
        type: 'number',
        description: 'Zoom máximo al que el proveedor sirve teselas.',
      },
      {
        key: 'minZoom',
        type: 'number',
        description: 'Zoom mínimo al que el proveedor sirve teselas.',
      },
    ],
    events: [
      {
        name: 'layer-loaded',
        payload: 'LayerLoadedEvent',
        description: 'La capa terminó de cargar.',
      },
      {
        name: 'layer-error',
        payload: '{ layerId, error }',
        description: 'Fallo al cargar la capa.',
      },
      {
        name: 'capability-detected',
        payload: '{ layerId, capability }',
        description: 'Tiles nunca detecta capacidades especiales.',
      },
    ],
    center: [42.6, 1.0],
    zoom: 8,
    exampleId: 'demo-tiles-opentopo',
    notes:
      'OpenTopoMap (relieve/topográfico) superpuesto con opacidad 0.85 sobre el basemap de OpenStreetMap, centrado en los Pirineos para que se note el relieve. No admite click en features (es una imagen, no datos vectoriales): no emite `feature-selected`.',
  }),
  buildLayerEntry({
    id: 'layer-wmts',
    name: 'Capa WMTS',
    description:
      'Web Map Tile Service: como WMS, el servidor devuelve la capa ya renderizada (sin datos vectoriales), pero como teselas pre-generadas y fijas en vez de una imagen a medida por petición — más barato de servir para el proveedor. Admite tanto endpoints RESTful (una plantilla de teselas) como KVP (`layer`/`tileMatrixSet`/`format`, con los que se construye la petición `GetTile`); `buildWmtsTileUrl` detecta cuál es cuál a partir de `url`.',
    layerOptionsSchema: [
      {
        key: 'url',
        type: 'string',
        required: true,
        description:
          'Endpoint base del servicio WMTS (estilo KVP), o una plantilla de teselas ya resuelta (estilo RESTful, con {z}/{x}/{y} o {TileMatrix}/{TileRow}/{TileCol}).',
      },
      {
        key: 'layer',
        type: 'string',
        description: 'Nombre de la capa en el servidor. Solo aplica al estilo KVP.',
      },
      { key: 'style', type: 'string', description: "Nombre del estilo. @default 'default'" },
      {
        key: 'tileMatrixSet',
        type: 'string',
        description: "Identificador del TileMatrixSet. @default 'EPSG:3857'",
      },
      { key: 'format', type: 'string', description: "@default 'image/png'" },
      {
        key: 'version',
        type: 'string',
        description: "Versión del protocolo WMTS. @default '1.0.0'",
      },
      { key: 'attribution', type: 'string', description: 'Atribución de este proveedor.' },
      {
        key: 'maxZoom',
        type: 'number',
        description: 'Zoom máximo al que el proveedor sirve teselas.',
      },
      {
        key: 'minZoom',
        type: 'number',
        description: 'Zoom mínimo al que el proveedor sirve teselas.',
      },
    ],
    events: [
      {
        name: 'layer-loaded',
        payload: 'LayerLoadedEvent',
        description: 'La capa terminó de cargar.',
      },
      {
        name: 'layer-error',
        payload: '{ layerId, error }',
        description: 'Fallo al cargar la capa.',
      },
      {
        name: 'capability-detected',
        payload: '{ layerId, capability }',
        description: 'WMTS nunca detecta capacidades especiales (comparte detección con Tiles).',
      },
    ],
    center: [40.2, -3.7],
    zoom: 6,
    exampleId: 'demo-wmts-ign-mtn',
    notes:
      'WMTS público del IGN español (Mapa Topográfico Nacional), estilo KVP: `url` es solo el endpoint base, y `buildWmtsTileUrl` construye la petición `GetTile` con `layer: "MTN"`, `tileMatrixSet: "GoogleMapsCompatible"` y `format: "image/jpeg"`. Como toda imagen ráster, no admite click en features: no emite `feature-selected`. Depende de un servidor de terceros — si está caído, verás `layer-error` en vez de que se rompa el playground.',
  }),
  buildLayerEntry({
    id: 'layer-cog',
    name: 'Capa COG',
    description:
      'Cloud Optimized GeoTIFF: un GeoTIFF teselado internamente (con overviews) para que el cliente pida solo los bytes que necesita por HTTP Range, sin servidor de teselas intermedio — solo un fichero en un storage cualquiera (S3, GCS, un servidor estático...). En Leaflet se apoya en `georaster` + `georaster-layer-for-leaflet`; en MapLibre, en el protocolo `cog://` de `@geomatico/maplibre-cog-protocol` (que exige que el COG esté en EPSG:3857: no reproyecta).',
    layerOptionsSchema: [
      {
        key: 'url',
        type: 'string',
        required: true,
        description: 'URL del GeoTIFF (idealmente Cloud Optimized, en EPSG:3857).',
      },
      {
        key: 'colorScale',
        type: 'string',
        description:
          'Para GeoTIFFs de una sola banda: `{ min, max, colors? }`, rampa de color a aplicar en vez de la escala de grises por defecto (ver `interpolateColorScale` en `src/layers/cog.ts`).',
      },
    ],
    events: [
      {
        name: 'layer-loaded',
        payload: 'LayerLoadedEvent',
        description: 'La capa terminó de cargar.',
      },
      {
        name: 'layer-error',
        payload: '{ layerId, error }',
        description: 'Fallo al cargar la capa (p. ej. si el COG no está en EPSG:3857 en MapLibre).',
      },
      {
        name: 'capability-detected',
        payload: '{ layerId, capability }',
        description: 'COG nunca detecta capacidades especiales (comparte detección con Tiles).',
      },
    ],
    center: [41.656278, 0.501394],
    zoom: 15,
    exampleId: 'demo-cog-kriging',
    notes:
      'El mismo COG de una sola banda (interpolación kriging) que usa la documentación oficial de `@geomatico/maplibre-cog-protocol` para su ejemplo de rampa de color, con `colorScale: { min: 1.7, max: 1.8 }` — los mismos límites que ese ejemplo. Como toda imagen ráster, no admite click en features: no emite `feature-selected`. Depende de un servidor de terceros — si está caído, verás `layer-error` en vez de que se rompa el playground.',
  }),
  buildLayerEntry({
    id: 'layer-wms',
    name: 'Capa WMS',
    description:
      'Web Map Service: el servidor devuelve la capa ya renderizada como imagen (el cliente no ve los datos vectoriales, solo píxeles). Útil para servir cartografía compleja sin que el navegador tenga que procesar los datos.',
    layerOptionsSchema: [
      { key: 'url', type: 'string', required: true, description: 'URL del servidor WMS.' },
      {
        key: 'layers',
        type: 'string',
        required: true,
        description: 'Nombre(s) de capa del servidor, separados por coma.',
      },
      { key: 'format', type: 'string', description: "@default 'image/png'" },
      { key: 'transparent', type: 'boolean', description: 'Fondo transparente en vez de opaco.' },
      {
        key: 'version',
        type: 'string',
        description: "Versión del protocolo WMS. @default '1.3.0'",
      },
      {
        key: 'time',
        type: 'string',
        description: "Instante para WMS temporales (p. ej. '2024-01-01' o un rango ISO).",
      },
      { key: 'style', type: 'string', description: 'Nombre del estilo SLD a aplicar.' },
    ],
    events: [
      {
        name: 'layer-loaded',
        payload: 'LayerLoadedEvent',
        description: 'La capa terminó de cargar.',
      },
      {
        name: 'layer-error',
        payload: '{ layerId, error }',
        description: 'Fallo al cargar la capa.',
      },
      {
        name: 'capability-detected',
        payload: "{ layerId, capability: 'temporal' }",
        description:
          "Se detecta 'temporal' si se indica `time`, o si `layers` contiene la palabra 'time'.",
      },
    ],
    center: [40.4168, -3.7038],
    zoom: 6,
    exampleId: 'demo-wms-osm',
    notes:
      "Servidor WMS público de demostración (terrestris.de) sirviendo el propio OpenStreetMap como imagen: visualmente parecido al basemap, pero servido como una capa WMS real independiente. Como toda imagen ráster, no admite click en features: no emite `feature-selected`. Depende de un servidor de terceros — si está caído, verás `layer-error` en vez de que se rompa el playground. ¿Servidor GeoServer? En vez de construir la URL/`layers` a mano, usa el helper `geoServerLayer({ url, workspace, layer, mode: 'wms' })` (ver categoría \"Capa WFS\" para el ejemplo con `mode: 'wfs'`).",
  }),
  buildLayerEntry({
    id: 'layer-wfs',
    name: 'Capa WFS',
    description:
      'Web Feature Service: al contrario que WMS, el servidor devuelve los datos vectoriales en bruto (GeoJSON), no una imagen — por eso admite edición, filtros y (si `editable`) selección de features, cosas que una imagen WMS no puede ofrecer.',
    layerOptionsSchema: [
      { key: 'url', type: 'string', required: true, description: 'URL del servidor WFS.' },
      { key: 'typeName', type: 'string', required: true, description: "'workspace:featuretype'." },
      { key: 'outputFormat', type: 'string', description: "@default 'application/json'" },
      { key: 'maxFeatures', type: 'number', description: 'Límite de features a pedir.' },
      {
        key: 'editable',
        type: 'boolean',
        description:
          'Si es `true`, la capa admite añadir/editar features (WFS-T) y activa el click en features (`feature-selected`).',
      },
      { key: 'cql_filter', type: 'string', description: 'Filtro CQL opcional.' },
    ],
    events: [
      {
        name: 'layer-loaded',
        payload: 'LayerLoadedEvent',
        description: 'La capa terminó de cargar.',
      },
      {
        name: 'layer-error',
        payload: '{ layerId, error }',
        description: 'Fallo al cargar la capa.',
      },
      {
        name: 'capability-detected',
        payload: "{ layerId, capability: 'editable' | 'filterable' | 'searchable' }",
        description:
          "'editable' si `options.editable`, 'filterable' si hay `cql_filter`, 'searchable' siempre (WFS admite búsqueda de features).",
      },
      {
        name: 'feature-selected',
        payload: 'FeatureSelectedEvent',
        description: 'Solo si `options.editable` es `true` (no es el caso de este ejemplo).',
      },
    ],
    center: [39.5, -98.35],
    zoom: 4,
    exampleId: 'demo-wfs-states',
    notes:
      'Servidor GeoServer público de demostración (ahocevar.com): polígonos reales de los estados de EE. UU. (`topp:states`), limitado a 50 features. Este ejemplo concreto no pasa `editable: true`, así que no emite `feature-selected` (pruébalo en el "Compositor sobre mapa" añadiendo `editable: true` a la config si quieres verlo). Depende de un servidor de terceros — si está caído, verás `layer-error`. Si el servidor es GeoServer (como en este ejemplo), en vez de construir `url`/`typeName` a mano puedes usar el helper `geoServerLayer({ url, workspace, layer, mode: \'wfs\' })` — es justo como se construyó el ejemplo "GeoServer: topp:states" de las capas de ejemplo del compositor.',
  }),
]

export function getEntry(id: string): RegistryEntry | undefined {
  return registry.find((entry) => entry.id === id)
}
