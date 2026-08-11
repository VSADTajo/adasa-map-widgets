import type { Component } from 'vue'
import ASMap from '@/components/mapping/ASMap.vue'
import ASMapTimeControls from '@/components/controls/ASMapTimeControls.vue'
import ASMapTimeRangeControls from '@/components/controls/ASMapTimeRangeControls.vue'
import ASMapDayIntervalControls from '@/components/controls/ASMapDayIntervalControls.vue'
import ASMapBasemapsSelector from '@/components/controls/ASMapBasemapsSelector.vue'
import type { ComponentDoc } from './propTypes'
import type { DayIntervalAlert } from '@/types/DayIntervalProps'
import { layerExamples } from './utils/layerExamples'
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
      'Contenedor de mapa agnóstico del motor subyacente (Leaflet o MapLibre GL JS), con un basemap de OpenStreetMap por defecto (prop `basemaps`). Su slot por defecto aloja los widgets posicionados sobre el mapa; su prop `layers` carga capas dinámicas (GeoJSON, WMS, WFS, Tiles, GeoServer).',
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
      'Si la librería de mapas elegida no está instalada en el proyecto, ASMap muestra un mensaje de error en su lugar en vez de fallar en silencio. Aquí se precarga el ejemplo de capa GeoJSON (sin red); para probar WMS/WFS/GeoServer/Tiles usa el modo "Compositor sobre mapa". `basemaps` (lista de `{id, name, tileLayer?, style?, attribution?}`) se fija aquí como prop estática con los 5 basemaps reales de `basemapExamples` (no editable por no ser un tipo primitivo); prueba a escribir su id ("osm", "topo", "positron", "dark-matter" o "satellite") en "Basemap activo" para alternar entre ellos, o usa el widget `ASMapBasemapsSelector` para un selector visual real (ver el modo "Compositor sobre mapa"). `maxBounds`/`bounds` (bboxes `[[latSur,lngOeste],[latNorte,lngEste]]`) tampoco son editables aquí, pero se pueden probar aparte. Haz pan/zoom en la vista previa para ver `update:center`/`update:zoom`, o click en el mapa: sobre la capa GeoJSON precargada verás `feature-selected`, en cualquier otro punto verás `map-click`.',
    component: ASMap,
    bindings: (values, log) => ({
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
      onFeatureSelected: (event) => log('feature-selected', event),
      onMapClick: (event) => log('map-click', event),
      onLayerLoaded: (event) =>
        log('layer-loaded', {
          layerId: event.layerId,
          type: event.type,
          capabilities: event.capabilities,
          error: event.error?.message,
        }),
      onLayerError: (event) =>
        log('layer-error', { layerId: event.layerId, error: event.error.message }),
      onCapabilityDetected: (event) => log('capability-detected', event),
    }),
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
]

export function getEntry(id: string): RegistryEntry | undefined {
  return registry.find((entry) => entry.id === id)
}
