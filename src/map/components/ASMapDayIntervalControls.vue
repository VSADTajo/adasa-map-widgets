<script setup lang="ts">
import { computed } from 'vue'
import { useResolvedTheme } from '@/core/composables/useTheme'
import type { DayIntervalEmits, DayIntervalProps } from '@/map/types/DayIntervalProps'

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
  // Tokens de aviso de core (tokens.css), con su valor como fallback para
  // funcionar sin importar el CSS.
  levelColors: () => ({
    amarillo: 'var(--as-alert-amarillo, #ffd54f)',
    naranja: 'var(--as-alert-naranja, #fb8c00)',
    rojo: 'var(--as-alert-rojo, #d32f2f)',
  }),
  levelTextColors: () => ({
    amarillo: 'var(--as-alert-amarillo-text, #2f2f2f)',
    naranja: 'var(--as-alert-naranja-text, #1a1a1a)',
    rojo: 'var(--as-alert-rojo-text, #ffffff)',
  }),
  days: 3,
  intervalHours: 6,
  baseDate: () => new Date(),
  dayLabels: undefined,
  title: 'Avisos',
  subtitle: undefined,
  position: 'bottom',
  offset: 20,
  theme: undefined,
  accentColor: undefined,
  width: undefined,
})

/** Prop `theme` o, si no se pasa, el tema de `provideTheme` (ver `useResolvedTheme`). */
const resolvedTheme = useResolvedTheme(() => props.theme)

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

/** Override local de `--as-color-primary` cuando se pasa `accentColor` (p. ej. desde una escala de color). */
const accentStyle = computed(() =>
  props.accentColor ? { '--as-color-primary': props.accentColor } : undefined,
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
    class="as-day-interval-controls"
    :class="[
      `as-day-interval-controls--${props.position}`,
      `as-day-interval-controls--${resolvedTheme}`,
    ]"
    :style="[accentStyle, widthStyle, offsetStyle]"
  >
    <div class="as-day-interval-controls__header">
      <div>
        <div class="as-day-interval-controls__title">{{ props.title }}</div>
        <div v-if="props.subtitle" class="as-day-interval-controls__subtitle">
          {{ props.subtitle }}
        </div>
      </div>

      <div v-if="props.selectedIntervalStart" class="as-day-interval-controls__current">
        Intervalo seleccionado: {{ selectedDayLabel }} {{ selectedIntervalLabel }} hs
      </div>
    </div>

    <div class="as-day-interval-controls__days" :style="gridStyle">
      <div v-for="day in dayViews" :key="day.key" class="as-day-interval-controls__day">
        <div class="as-day-interval-controls__day-title">{{ day.title }}</div>

        <div class="as-day-interval-controls__row" :style="rowStyle">
          <button
            v-for="interval in day.intervals"
            :key="interval.key"
            type="button"
            class="as-day-interval-controls__pill"
            :class="{
              'as-day-interval-controls__pill--selected': interval.isSelected,
              'as-day-interval-controls__pill--selected-neutral':
                interval.isSelected && !interval.level,
              'as-day-interval-controls__pill--current': interval.isCurrent,
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
.as-day-interval-controls {
  /* Colores de overlay sobre el mapa: tokens --as-overlay-* (con su valor
     por defecto como fallback). El modo claro/oscuro lo elige color-scheme,
     que fijan las clases --light/--dark según la prop theme. */
  --as-color-text: var(--as-overlay-text, light-dark(#0f172a, #ffffff));
  --as-color-text-muted: var(
    --as-overlay-text-muted,
    light-dark(#5a6a81, rgba(255, 255, 255, 0.8))
  );
  --as-color-surface-muted: var(
    --as-overlay-surface-muted,
    light-dark(#f1f5f9, rgba(255, 255, 255, 0.15))
  );
  --as-color-border: var(--as-overlay-border, light-dark(#cbd5e1, rgba(255, 255, 255, 0.45)));
  background-color: var(
    --as-overlay-bg,
    light-dark(rgba(255, 255, 255, 0.92), rgba(24, 24, 27, 0.85))
  );
  color: var(--as-color-text);
  position: absolute;
  z-index: var(--as-z-map-control, 1000);
  width: min(760px, calc(100% - 48px));
  border-radius: var(--as-radius, 14px);
  padding: calc(var(--as-spacing-unit, 4px) * 4);
  backdrop-filter: blur(10px);
  font-family: var(--as-font-family, system-ui, sans-serif);
  box-shadow: var(--as-shadow, 0 2px 8px rgba(15, 23, 42, 0.16));
}

.as-day-interval-controls--bottom,
.as-day-interval-controls--top {
  left: 50%;
  transform: translateX(-50%);
}

.as-day-interval-controls--left,
.as-day-interval-controls--right {
  top: 50%;
  transform: translateY(-50%);
  width: min(400px, calc(100% - 32px));
}

.as-day-interval-controls--dark {
  color-scheme: dark;
}

.as-day-interval-controls--light {
  color-scheme: light;
}

.as-day-interval-controls__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: calc(var(--as-spacing-unit, 4px) * 4);
  margin-bottom: calc(var(--as-spacing-unit, 4px) * 3);
}

.as-day-interval-controls__title {
  font-size: 1.125rem;
  font-weight: 600;
}

.as-day-interval-controls__subtitle,
.as-day-interval-controls__current {
  font-size: 0.8125rem;
  color: var(--as-color-text-muted);
}

.as-day-interval-controls__days {
  display: grid;
  gap: calc(var(--as-spacing-unit, 4px) * 4);
}

.as-day-interval-controls__day {
  display: flex;
  flex-direction: column;
  gap: calc(var(--as-spacing-unit, 4px) * 2);
  min-width: 0;
}

.as-day-interval-controls__day-title {
  font-size: 0.875rem;
  font-weight: 700;
}

.as-day-interval-controls__row {
  display: grid;
  gap: calc(var(--as-spacing-unit, 4px) * 2);
}

.as-day-interval-controls__pill {
  box-sizing: border-box;
  border: 2px solid var(--as-color-border);
  border-radius: 999px;
  background-color: var(--as-color-surface-muted);
  color: var(--as-color-text);
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 600;
  padding: calc(var(--as-spacing-unit, 4px) * 2) calc(var(--as-spacing-unit, 4px) * 1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    transform 0.15s ease;
}

.as-day-interval-controls__pill:hover {
  filter: brightness(1.1);
}

.as-day-interval-controls__pill--current {
  outline: 2px solid var(--as-color-primary, #2563eb);
  outline-offset: 1px;
}

.as-day-interval-controls__pill--selected {
  border-color: var(--as-color-text);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.as-day-interval-controls__pill--selected-neutral {
  background-color: var(--as-color-surface, #fff);
  border-color: var(--as-color-surface, #fff);
  color: var(--as-color-primary, #2563eb);
}

@media (max-width: 640px) {
  .as-day-interval-controls__days {
    grid-template-columns: 1fr !important;
  }
}
</style>
