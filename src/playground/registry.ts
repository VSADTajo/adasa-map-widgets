import type { Component } from 'vue'
import ASMap from '@/components/mapping/ASMap.vue'
import ASMapTimeControls from '@/components/controls/ASMapTimeControls.vue'
import ASMapTimeRangeControls from '@/components/controls/ASMapTimeRangeControls.vue'
import ASMapDayIntervalControls from '@/components/controls/ASMapDayIntervalControls.vue'
import type { ComponentDoc } from './propTypes'
import type { DayIntervalAlert } from '@/types/DayIntervalProps'

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
      'Contenedor de mapa agnóstico del motor subyacente (Leaflet o MapLibre GL JS), con un mapa base de OpenStreetMap por defecto. Su slot por defecto aloja los widgets posicionados sobre el mapa.',
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
    ],
    events: [],
    staticProps: { center: [40.4168, -3.7038] },
    notes:
      'Si la librería de mapas elegida no está instalada en el proyecto, ASMap muestra un mensaje de error en su lugar en vez de fallar en silencio.',
    component: ASMap,
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
]

export function getEntry(id: string): RegistryEntry | undefined {
  return registry.find((entry) => entry.id === id)
}
