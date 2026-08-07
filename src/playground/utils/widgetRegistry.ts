import ASMapTimeControls from '@/components/controls/ASMapTimeControls.vue'
import ASMapTimeRangeControls from '@/components/controls/ASMapTimeRangeControls.vue'
import ASMapDayIntervalControls from '@/components/controls/ASMapDayIntervalControls.vue'
import type { WidgetRegistryEntry } from '@/types/playground'
import type { DayIntervalAlert } from '@/types/DayIntervalProps'

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

/**
 * Registro de widgets disponibles para componer sobre el mapa en el
 * playground: mapea un id estable a su componente Vue, sus props editables
 * y (cuando aplica) los datos de ejemplo/listeners necesarios para que
 * funcione de forma autónoma sin un backend real.
 */
export const widgetRegistry: WidgetRegistryEntry[] = [
  {
    id: 'time-controls',
    label: 'Controles de tiempo (ASMapTimeControls)',
    componentName: 'ASMapTimeControls',
    component: ASMapTimeControls,
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
    staticProps: () => ({ timeline: buildDemoTimeline() }),
    bindings: (widgetProps, log) => ({
      'onUpdate:currentTimeIndex': (value) => {
        widgetProps.currentTimeIndex = value
        log('update:currentTimeIndex', value)
      },
      'onUpdate:isPlaying': (value) => {
        widgetProps.isPlaying = value
        log('update:isPlaying', value)
      },
      onTimeChanged: (date) => log('time-changed', date),
    }),
  },
  {
    id: 'time-range-controls',
    label: 'Controles de rango de tiempo (ASMapTimeRangeControls)',
    componentName: 'ASMapTimeRangeControls',
    component: ASMapTimeRangeControls,
    propsSchema: [
      { key: 'theme', label: 'Tema', type: 'select', options: ['dark', 'light'], default: 'dark' },
      { key: 'accentColor', label: 'Color de acento', type: 'color', default: '#f97316' },
      { key: 'width', label: 'Ancho (CSS, ej. 760px / 90%)', type: 'string', default: '' },
    ],
    staticProps: () => ({ timeline: buildDemoTimeline(), currentRange: [2, 9] }),
    bindings: (widgetProps, log) => ({
      'onUpdate:currentRange': (value) => {
        widgetProps.currentRange = value
        log('update:currentRange', value)
      },
      onRangeChanged: (range) => log('range-changed', range),
    }),
  },
  {
    id: 'day-interval-controls',
    label: 'Intervalos por día (ASMapDayIntervalControls)',
    componentName: 'ASMapDayIntervalControls',
    component: ASMapDayIntervalControls,
    propsSchema: [
      { key: 'title', label: 'Título', type: 'string', default: 'Avisos AEMET' },
      { key: 'subtitle', label: 'Subtítulo', type: 'string', default: 'Viento y lluvia' },
      { key: 'days', label: 'Días', type: 'number', default: 3, min: 1, max: 5, step: 1 },
      { key: 'theme', label: 'Tema', type: 'select', options: ['dark', 'light'], default: 'dark' },
      { key: 'accentColor', label: 'Color de acento', type: 'color', default: '#2563eb' },
      { key: 'width', label: 'Ancho (CSS, ej. 760px / 90%)', type: 'string', default: '' },
    ],
    staticProps: () => ({ alerts: buildDemoAlerts(), selectedIntervalStart: null }),
    bindings: (widgetProps, log) => ({
      'onUpdate:selectedIntervalStart': (value) => {
        widgetProps.selectedIntervalStart = value
        log('update:selectedIntervalStart', value)
      },
      onIntervalChanged: (interval) => log('interval-changed', interval),
    }),
  },
]

export function getWidgetEntry(id: string): WidgetRegistryEntry | undefined {
  return widgetRegistry.find((entry) => entry.id === id)
}
