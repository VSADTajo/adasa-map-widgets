<script setup lang="ts">
import { computed } from 'vue'
import type { DayIntervalEmits, DayIntervalProps } from '@/types/DayIntervalProps'

/**
 * Selector de intervalos horarios agrupados por día: una rejilla de `days`
 * columnas × intervalos de `intervalHours` horas cada una (por defecto: 3
 * días × bloques de 6h), con cada intervalo coloreado según el nivel de
 * severidad más alto entre los `alerts` que solapen con él.
 *
 * Es un componente **controlado** y agnóstico de cualquier fuente de datos o
 * store: recibe los avisos ya resueltos (`start`/`end`/`level`) y
 * `selectedIntervalStart` se usa con `v-model` — el proyecto consumidor
 * decide qué hacer con la selección (p. ej. filtrar una capa por el
 * intervalo elegido). El propio widget no sabe nada de AEMET, de avisos
 * reales, de capas ni de mapas.
 *
 * @example
 * ```vue
 * <ASMapDayIntervalControls
 *   title="Avisos AEMET"
 *   :subtitle="tipoSeleccionado"
 *   :alerts="avisos.map((a) => ({ start: a.effective, end: a.expires, level: a.level }))"
 *   v-model:selected-interval-start="selectedStart"
 *   @interval-changed="({ start, end }) => setLayerRange(start, end)"
 * />
 * ```
 */
const props = withDefaults(defineProps<DayIntervalProps>(), {
  alerts: () => [],
  levels: () => ['amarillo', 'naranja', 'rojo'],
  levelColors: () => ({ amarillo: '#ffd54f', naranja: '#fb8c00', rojo: '#e53935' }),
  levelTextColors: () => ({ amarillo: '#2f2f2f' }),
  days: 3,
  intervalHours: 6,
  baseDate: () => new Date(),
  dayLabels: undefined,
  title: 'Avisos',
  subtitle: undefined,
  position: 'bottom',
  offset: 20,
  theme: 'dark',
  accentColor: undefined,
  width: undefined,
})

const emit = defineEmits<DayIntervalEmits>()

function startOfDay(date: Date): Date {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}
function addDays(date: Date, amount: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}
function addHours(date: Date, amount: number): Date {
  const next = new Date(date)
  next.setHours(next.getHours() + amount)
  return next
}

const dayFormatter = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit' })
const hourFormatter = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', hour12: false })
const weekdayFormatter = new Intl.DateTimeFormat('es-ES', { weekday: 'long' })

function formatIntervalLabel(start: Date, end: Date): string {
  return `${hourFormatter.format(start)}-${hourFormatter.format(end)}`
}

function defaultDayLabel(index: number, date: Date): string {
  if (index === 0) return 'Hoy'
  if (index === 1) return 'Mañana'
  if (index === 2) return 'Pasado mañana'
  const label = weekdayFormatter.format(date)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

const levelPriority = computed<Record<string, number>>(() =>
  Object.fromEntries(props.levels.map((level, index) => [level, index])),
)

function topLevelForInterval(start: Date, end: Date): string | null {
  const intervalStart = start.getTime()
  const intervalEnd = end.getTime()
  let top: string | null = null

  for (const alert of props.alerts) {
    const overlaps = alert.start.getTime() < intervalEnd && alert.end.getTime() > intervalStart
    if (!overlaps) continue
    if (!(alert.level in levelPriority.value)) continue
    if (!top || levelPriority.value[alert.level]! > levelPriority.value[top]!) {
      top = alert.level
    }
  }

  return top
}

function currentIntervalStart(): Date {
  const next = new Date()
  next.setMinutes(0, 0, 0)
  next.setHours(Math.floor(next.getHours() / props.intervalHours) * props.intervalHours)
  return next
}

interface IntervalView {
  key: string
  start: Date
  end: Date
  label: string
  ariaLabel: string
  isSelected: boolean
  isCurrent: boolean
  level: string | null
}

interface DayView {
  key: string
  title: string
  intervals: IntervalView[]
}

const intervalsPerDay = computed(() => Math.max(Math.floor(24 / props.intervalHours), 1))

const dayViews = computed<DayView[]>(() => {
  const today = startOfDay(props.baseDate)
  const currentStart = currentIntervalStart().getTime()
  const selectedTime = props.selectedIntervalStart?.getTime()

  return Array.from({ length: Math.max(props.days, 0) }, (_, dayIndex) => {
    const dayDate = addDays(today, dayIndex)
    const label = props.dayLabels?.[dayIndex] ?? defaultDayLabel(dayIndex, dayDate)
    const dayTitle = `${label} ${dayFormatter.format(dayDate)}`

    return {
      key: `day-${dayIndex}`,
      title: dayTitle,
      intervals: Array.from({ length: intervalsPerDay.value }, (_, slot) => {
        const start = addHours(dayDate, slot * props.intervalHours)
        const end = addHours(start, props.intervalHours)
        const label = formatIntervalLabel(start, end)
        const level = topLevelForInterval(start, end)
        const isSelected = selectedTime === start.getTime()

        return {
          key: `day-${dayIndex}-${slot}`,
          start,
          end,
          label,
          ariaLabel:
            `${dayTitle}, ${label}h` +
            (level ? `, nivel ${level}` : '') +
            (isSelected ? ', seleccionado' : ''),
          isSelected,
          isCurrent: currentStart === start.getTime(),
          level,
        }
      }),
    }
  })
})

function selectInterval(interval: IntervalView): void {
  emit('update:selectedIntervalStart', interval.start)
  emit('interval-changed', { start: interval.start, end: interval.end, level: interval.level })
}

function pillStyle(interval: IntervalView): Record<string, string> | undefined {
  if (!interval.level) return undefined
  const background = props.levelColors[interval.level]
  if (!background) return undefined
  return {
    backgroundColor: background,
    borderColor: background,
    color: props.levelTextColors[interval.level] ?? '#ffffff',
  }
}

const selectedDayLabel = computed(() =>
  props.selectedIntervalStart ? dayFormatter.format(props.selectedIntervalStart) : '',
)
const selectedIntervalLabel = computed(() =>
  props.selectedIntervalStart
    ? formatIntervalLabel(
        props.selectedIntervalStart,
        addHours(props.selectedIntervalStart, props.intervalHours),
      )
    : '',
)

/** Override local de `--amw-color-primary` cuando se pasa `accentColor` (p. ej. desde una escala de color). */
const accentStyle = computed(() =>
  props.accentColor ? { '--amw-color-primary': props.accentColor } : undefined,
)

/** Ancho explícito (sobreescribe el responsive por defecto de `position`) cuando se pasa `width`. */
const widthStyle = computed(() => {
  if (props.width === undefined || props.width === '') return undefined
  return { width: typeof props.width === 'number' ? `${props.width}px` : props.width }
})

/** Distancia desde el lado anclado según `position` (permite apilar sobre otro widget vía `offset`). */
const offsetStyle = computed(() => {
  const resolved = typeof props.offset === 'number' ? `${props.offset}px` : props.offset
  switch (props.position) {
    case 'top':
      return { top: resolved }
    case 'left':
      return { left: resolved }
    case 'right':
      return { right: resolved }
    default:
      return { bottom: resolved }
  }
})

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${Math.max(props.days, 1)}, minmax(0, 1fr))`,
}))
const rowStyle = computed(() => ({
  gridTemplateColumns: `repeat(${intervalsPerDay.value}, minmax(0, 1fr))`,
}))
</script>

<template>
  <div
    class="amw-day-interval-controls"
    :class="[
      `amw-day-interval-controls--${props.position}`,
      `amw-day-interval-controls--${props.theme}`,
    ]"
    :style="[accentStyle, widthStyle, offsetStyle]"
  >
    <div class="amw-day-interval-controls__header">
      <div>
        <div class="amw-day-interval-controls__title">{{ props.title }}</div>
        <div v-if="props.subtitle" class="amw-day-interval-controls__subtitle">
          {{ props.subtitle }}
        </div>
      </div>

      <div v-if="props.selectedIntervalStart" class="amw-day-interval-controls__current">
        Intervalo seleccionado: {{ selectedDayLabel }} {{ selectedIntervalLabel }} hs
      </div>
    </div>

    <div class="amw-day-interval-controls__days" :style="gridStyle">
      <div v-for="day in dayViews" :key="day.key" class="amw-day-interval-controls__day">
        <div class="amw-day-interval-controls__day-title">{{ day.title }}</div>

        <div class="amw-day-interval-controls__row" :style="rowStyle">
          <button
            v-for="interval in day.intervals"
            :key="interval.key"
            type="button"
            class="amw-day-interval-controls__pill"
            :class="{
              'amw-day-interval-controls__pill--selected': interval.isSelected,
              'amw-day-interval-controls__pill--selected-neutral':
                interval.isSelected && !interval.level,
              'amw-day-interval-controls__pill--current': interval.isCurrent,
            }"
            :style="pillStyle(interval)"
            :aria-pressed="interval.isSelected"
            :aria-label="interval.ariaLabel"
            @click="selectInterval(interval)"
          >
            {{ interval.label }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.amw-day-interval-controls {
  position: absolute;
  z-index: 1000;
  width: min(760px, calc(100% - 48px));
  border-radius: var(--amw-radius, 14px);
  padding: calc(var(--amw-spacing-unit, 4px) * 4);
  backdrop-filter: blur(10px);
  font-family: var(--amw-font-family, system-ui, sans-serif);
  box-shadow: var(--amw-shadow, 0 2px 8px rgba(15, 23, 42, 0.16));
}

.amw-day-interval-controls--bottom,
.amw-day-interval-controls--top {
  left: 50%;
  transform: translateX(-50%);
}

.amw-day-interval-controls--left,
.amw-day-interval-controls--right {
  top: 50%;
  transform: translateY(-50%);
  width: min(400px, calc(100% - 32px));
}

.amw-day-interval-controls--dark {
  --amw-color-text: #ffffff;
  --amw-color-text-muted: rgba(255, 255, 255, 0.8);
  --amw-color-surface-muted: rgba(255, 255, 255, 0.15);
  --amw-color-border: rgba(255, 255, 255, 0.45);
  background-color: rgba(24, 24, 27, 0.85);
  color: var(--amw-color-text);
}

.amw-day-interval-controls--light {
  --amw-color-text: #0f172a;
  --amw-color-text-muted: #64748b;
  --amw-color-surface-muted: #f1f5f9;
  --amw-color-border: #cbd5e1;
  background-color: rgba(255, 255, 255, 0.92);
  color: var(--amw-color-text);
}

.amw-day-interval-controls__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: calc(var(--amw-spacing-unit, 4px) * 4);
  margin-bottom: calc(var(--amw-spacing-unit, 4px) * 3);
}

.amw-day-interval-controls__title {
  font-size: 1.125rem;
  font-weight: 600;
}

.amw-day-interval-controls__subtitle,
.amw-day-interval-controls__current {
  font-size: 0.8125rem;
  color: var(--amw-color-text-muted);
}

.amw-day-interval-controls__days {
  display: grid;
  gap: calc(var(--amw-spacing-unit, 4px) * 4);
}

.amw-day-interval-controls__day {
  display: flex;
  flex-direction: column;
  gap: calc(var(--amw-spacing-unit, 4px) * 2);
  min-width: 0;
}

.amw-day-interval-controls__day-title {
  font-size: 0.875rem;
  font-weight: 700;
}

.amw-day-interval-controls__row {
  display: grid;
  gap: calc(var(--amw-spacing-unit, 4px) * 2);
}

.amw-day-interval-controls__pill {
  box-sizing: border-box;
  border: 2px solid var(--amw-color-border);
  border-radius: 999px;
  background-color: var(--amw-color-surface-muted);
  color: var(--amw-color-text);
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 600;
  padding: calc(var(--amw-spacing-unit, 4px) * 2) calc(var(--amw-spacing-unit, 4px) * 1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    transform 0.15s ease;
}

.amw-day-interval-controls__pill:hover {
  filter: brightness(1.1);
}

.amw-day-interval-controls__pill--current {
  outline: 2px solid var(--amw-color-primary, #2563eb);
  outline-offset: 1px;
}

.amw-day-interval-controls__pill--selected {
  border-color: var(--amw-color-text);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.amw-day-interval-controls__pill--selected-neutral {
  background-color: var(--amw-color-surface, #fff);
  border-color: var(--amw-color-surface, #fff);
  color: var(--amw-color-primary, #2563eb);
}

@media (max-width: 640px) {
  .amw-day-interval-controls__days {
    grid-template-columns: 1fr !important;
  }
}
</style>
