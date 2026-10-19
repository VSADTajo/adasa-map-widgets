<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import {
  addDays,
  addMonths,
  addYears,
  endOfWeek,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfWeek,
} from 'date-fns'
import ASIcon from '@/core/components/ASIcon.vue'
import { ICONS } from '@/core/icons/icons'
import { useFieldId } from '@/core/composables/useFieldId'
import { useLocale } from '@/core/composables/useLocale'
import { calendarWeeks, isDayDisabled } from '@/forms/utils/dates'

/**
 * Calendario de un mes (interno del dominio): la rejilla del patrón "date
 * picker dialog" de WAI-ARIA. El día enfocado lleva el único `tabindex="0"`
 * y el teclado lo mueve: flechas (día y semana), Inicio/Fin (semana),
 * RePág/AvPág (mes; con Mayús, año), Intro/Espacio (elegir).
 *
 * Controlado: el mes visible es el del día enfocado (`focused`), y tanto
 * moverse como elegir se emiten al padre (`ASDatePicker`, `ASDateRangePicker`).
 */
const props = defineProps<{
  /** Día enfocado: decide el mes que se ve. */
  focused: Date
  /** Día elegido (selección única). */
  selected?: Date | null
  /** Selección de periodo: inicio y fin (el fin puede faltar mientras se elige). */
  rangeStart?: Date | null
  rangeEnd?: Date | null
  min?: Date
  max?: Date
}>()

const emit = defineEmits<{
  'update:focused': [day: Date]
  select: [day: Date]
}>()

const { t, formatDate, dateFnsLocale } = useLocale()
const titleId = useFieldId(() => undefined, 'as-calendar')
const grid = ref<HTMLTableElement | null>(null)
/** Día bajo el ratón: previsualiza el periodo mientras falta el fin. */
const hovered = ref<Date | null>(null)

const weekStartsOn = computed(() => dateFnsLocale.value?.options?.weekStartsOn ?? 1)
const weeks = computed(() => calendarWeeks(props.focused, weekStartsOn.value))
const title = computed(() => formatDate(props.focused, { month: 'long', year: 'numeric' }))
const today = startOfDay(new Date())

const weekdays = computed(() =>
  weeks.value[0]!.map((day) => ({
    short: formatDate(day, { weekday: 'narrow' }),
    long: formatDate(day, { weekday: 'long' }),
  })),
)

/** Fin del periodo a pintar: el elegido o, mientras falta, el día bajo el ratón o enfocado. */
const previewEnd = computed(() => {
  if (!props.rangeStart || props.rangeEnd) return props.rangeEnd ?? null
  return hovered.value ?? props.focused
})

function inRange(day: Date): boolean {
  const start = props.rangeStart
  const end = previewEnd.value
  if (!start || !end) return false
  const [from, to] = start <= end ? [start, end] : [end, start]
  return startOfDay(day) >= startOfDay(from) && startOfDay(day) <= startOfDay(to)
}

/** Inicio o fin del periodo: se pintan llenos, el resto del periodo en tono suave. */
function isEdge(day: Date): boolean {
  return Boolean(
    (props.rangeStart && isSameDay(day, props.rangeStart)) ||
    (props.rangeEnd && isSameDay(day, props.rangeEnd)),
  )
}

function isSelected(day: Date): boolean {
  if (props.selected) return isSameDay(day, props.selected)
  return Boolean(
    (props.rangeStart && isSameDay(day, props.rangeStart)) ||
    (props.rangeEnd && isSameDay(day, props.rangeEnd)) ||
    (props.rangeStart && props.rangeEnd && inRange(day)),
  )
}

function label(day: Date): string {
  const date = formatDate(day, { dateStyle: 'full' })
  if (props.rangeStart && isSameDay(day, props.rangeStart)) return t('dates.rangeStart', { date })
  if (props.rangeEnd && isSameDay(day, props.rangeEnd)) return t('dates.rangeEnd', { date })
  return date
}

function choose(day: Date): void {
  if (isDayDisabled(day, props.min, props.max)) return
  emit('update:focused', day)
  emit('select', day)
}

function moveTo(day: Date): void {
  emit('update:focused', day)
  void nextTick(focusActive)
}

function onKeydown(event: KeyboardEvent): void {
  const day = props.focused
  const options = { weekStartsOn: weekStartsOn.value }
  const moves: Record<string, () => Date> = {
    ArrowLeft: () => addDays(day, -1),
    ArrowRight: () => addDays(day, 1),
    ArrowUp: () => addDays(day, -7),
    ArrowDown: () => addDays(day, 7),
    Home: () => startOfWeek(day, options),
    End: () => endOfWeek(day, options),
    PageUp: () => (event.shiftKey ? addYears(day, -1) : addMonths(day, -1)),
    PageDown: () => (event.shiftKey ? addYears(day, 1) : addMonths(day, 1)),
  }
  if (moves[event.key]) {
    event.preventDefault()
    moveTo(moves[event.key]!())
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    choose(day)
  }
}

/** Enfoca el día activo (al abrir el calendario y tras moverse con el teclado). */
function focusActive(): void {
  grid.value?.querySelector<HTMLElement>('td[tabindex="0"]')?.focus()
}

defineExpose({ focusActive })
</script>

<template>
  <div class="as-calendar">
    <div class="as-calendar__header">
      <button
        type="button"
        class="as-calendar__nav"
        :aria-label="t('dates.previousMonth')"
        :title="t('dates.previousMonth')"
        @click="emit('update:focused', addMonths(props.focused, -1))"
      >
        <ASIcon :path="ICONS.chevronLeft" :size="20" />
      </button>
      <h2 :id="titleId" class="as-calendar__title" aria-live="polite">{{ title }}</h2>
      <button
        type="button"
        class="as-calendar__nav"
        :aria-label="t('dates.nextMonth')"
        :title="t('dates.nextMonth')"
        @click="emit('update:focused', addMonths(props.focused, 1))"
      >
        <ASIcon :path="ICONS.chevronRight" :size="20" />
      </button>
    </div>

    <table
      ref="grid"
      class="as-calendar__grid"
      role="grid"
      :aria-labelledby="titleId"
      @keydown="onKeydown"
      @mouseleave="hovered = null"
    >
      <thead>
        <tr>
          <th v-for="weekday in weekdays" :key="weekday.long" scope="col" :abbr="weekday.long">
            <span aria-hidden="true">{{ weekday.short }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="week in weeks" :key="week[0]!.getTime()">
          <td
            v-for="day in week"
            :key="day.getTime()"
            class="as-calendar__day"
            :class="{
              'as-calendar__day--outside': !isSameMonth(day, props.focused),
              'as-calendar__day--today': isSameDay(day, today),
              'as-calendar__day--selected': isSelected(day),
              'as-calendar__day--in-range': inRange(day),
              'as-calendar__day--edge': isEdge(day),
              'as-calendar__day--disabled': isDayDisabled(day, props.min, props.max),
            }"
            :tabindex="isSameDay(day, props.focused) ? 0 : -1"
            :aria-label="label(day)"
            :aria-selected="isSelected(day)"
            :aria-disabled="isDayDisabled(day, props.min, props.max) || undefined"
            :aria-current="isSameDay(day, today) ? 'date' : undefined"
            @click="choose(day)"
            @mouseenter="hovered = day"
          >
            {{ day.getDate() }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.as-calendar {
  width: max-content;
  font-family: var(--as-font-family, system-ui, sans-serif);
  font-size: var(--as-font-size-sm, 0.875rem);
  color: var(--as-color-text, light-dark(#0f172a, #f1f5f9));
}

.as-calendar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--as-space-2, 8px);
}

.as-calendar__title {
  margin: 0;
  font-size: var(--as-font-size-sm, 0.875rem);
  font-weight: var(--as-font-weight-semibold, 600);
}

/* El nombre del mes lo da Intl en minúscula ("octubre de 2026"). */
.as-calendar__title::first-letter {
  text-transform: uppercase;
}

.as-calendar__nav {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: var(--as-radius-full, 9999px);
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.as-calendar__nav:hover {
  background-color: var(--as-color-surface-muted, light-dark(#f1f5f9, #334155));
}

.as-calendar__nav:focus-visible {
  outline: none;
  box-shadow: var(--as-focus-ring, 0 0 0 2px light-dark(#2563eb, #60a5fa));
}

.as-calendar__grid {
  border-collapse: collapse;
}

.as-calendar__grid th {
  width: 36px;
  height: 28px;
  padding: 0;
  font-size: var(--as-font-size-xs, 0.75rem);
  font-weight: var(--as-font-weight-medium, 500);
  color: var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
  text-transform: uppercase;
}

.as-calendar__day {
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: var(--as-radius-sm, 4px);
  font-variant-numeric: tabular-nums;
  text-align: center;
  cursor: pointer;
}

.as-calendar__day:hover {
  background-color: var(--as-color-surface-muted, light-dark(#f1f5f9, #334155));
}

.as-calendar__day:focus-visible {
  outline: none;
  box-shadow: inset var(--as-focus-ring, 0 0 0 2px light-dark(#2563eb, #60a5fa));
}

.as-calendar__day--outside {
  color: var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
}

/* Hoy: subrayado, no solo color. */
.as-calendar__day--today {
  font-weight: var(--as-font-weight-bold, 700);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.as-calendar__day--in-range {
  border-radius: 0;
  background-color: color-mix(
    in srgb,
    var(--as-color-primary, light-dark(#2563eb, #60a5fa)) 16%,
    transparent
  );
}

.as-calendar__day--selected:not(.as-calendar__day--in-range),
.as-calendar__day--edge {
  border-radius: var(--as-radius-sm, 4px);
  background-color: var(--as-color-primary, light-dark(#2563eb, #60a5fa));
  color: var(--as-color-primary-contrast, light-dark(#ffffff, #0f172a));
}

.as-calendar__day--disabled {
  color: var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
  text-decoration: line-through;
  opacity: 0.5;
  cursor: not-allowed;
}

.as-calendar__day--disabled:hover {
  background: none;
}
</style>
