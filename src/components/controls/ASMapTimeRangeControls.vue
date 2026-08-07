<script setup lang="ts">
import { computed, watch } from 'vue'
import { format } from 'date-fns'
import type { TimeRangeEmits, TimeRangeProps } from '@/types/TimeRangeProps'

/**
 * Control de selección de un **rango** de tiempo dentro de una línea
 * temporal: dos manejadores (inicio/fin) sobre un slider doble y botones de
 * ajuste fino ±1 paso para cada extremo.
 *
 * Es un componente **controlado** y agnóstico de cualquier fuente de datos o
 * store: recibe la línea de tiempo ya calculada y `currentRange` se usa con
 * `v-model` — el proyecto consumidor decide qué hacer con el rango
 * resultante (p. ej. actualizar los parámetros `from`/`to` de una capa
 * temporal en su propio store). El propio widget no sabe nada de capas ni de
 * mapas, y no tiene reproducción automática (a diferencia de `ASMapTimeControls`).
 *
 * Hermano de `ASMapTimeControls` (que selecciona un único instante en vez de
 * un rango): comparte el mismo lenguaje visual y la misma filosofía de props.
 *
 * @example
 * ```vue
 * <ASMapTimeRangeControls
 *   :timeline="timeline"
 *   v-model:current-range="range"
 *   @range-changed="({ start, end }) => setLayerRange(start, end)"
 * />
 * ```
 */
const props = withDefaults(defineProps<TimeRangeProps>(), {
  position: 'bottom',
  theme: 'dark',
  accentColor: undefined,
  width: undefined,
})

const emit = defineEmits<TimeRangeEmits>()

const startIndex = computed(() => props.currentRange[0])
const endIndex = computed(() => props.currentRange[1])
const maxIndex = computed(() => Math.max(props.timeline.length - 1, 0))

const startTime = computed<Date | undefined>(() => props.timeline[startIndex.value])
const endTime = computed<Date | undefined>(() => props.timeline[endIndex.value])

const formattedStartDate = computed(() =>
  startTime.value ? format(startTime.value, 'd MMM yyyy') : '',
)
const formattedStartHour = computed(() => (startTime.value ? format(startTime.value, 'HH:mm') : ''))
const formattedEndDate = computed(() => (endTime.value ? format(endTime.value, 'd MMM yyyy') : ''))
const formattedEndHour = computed(() => (endTime.value ? format(endTime.value, 'HH:mm') : ''))

const startLabel = computed(() =>
  props.timeline.length > 0 ? format(props.timeline[0] as Date, 'd MMM HH:mm') : '',
)
const endLabel = computed(() =>
  props.timeline.length > 0
    ? format(props.timeline[props.timeline.length - 1] as Date, 'd MMM HH:mm')
    : '',
)

watch(
  () => [startTime.value?.getTime(), endTime.value?.getTime()],
  () => {
    if (startTime.value && endTime.value) {
      emit('range-changed', { start: startTime.value, end: endTime.value })
    }
  },
)

function setRange(next: [number, number]): void {
  emit('update:currentRange', next)
}

const isFromBackDisabled = computed(() => props.timeline.length === 0 || startIndex.value <= 0)
const isFromForwardDisabled = computed(
  () => props.timeline.length === 0 || startIndex.value >= endIndex.value,
)
const isToBackDisabled = computed(
  () => props.timeline.length === 0 || endIndex.value <= startIndex.value,
)
const isToForwardDisabled = computed(
  () => props.timeline.length === 0 || endIndex.value >= maxIndex.value,
)

function stepFromBack(): void {
  if (!isFromBackDisabled.value) setRange([startIndex.value - 1, endIndex.value])
}
function stepFromForward(): void {
  if (!isFromForwardDisabled.value) setRange([startIndex.value + 1, endIndex.value])
}
function stepToBack(): void {
  if (!isToBackDisabled.value) setRange([startIndex.value, endIndex.value - 1])
}
function stepToForward(): void {
  if (!isToForwardDisabled.value) setRange([startIndex.value, endIndex.value + 1])
}

function onStartInput(event: Event): void {
  const value = Number((event.target as HTMLInputElement).value)
  setRange([Math.min(value, endIndex.value), endIndex.value])
}
function onEndInput(event: Event): void {
  const value = Number((event.target as HTMLInputElement).value)
  setRange([startIndex.value, Math.max(value, startIndex.value)])
}

/** Override local de `--amw-color-primary` cuando se pasa `accentColor` (p. ej. desde una escala de color). */
const accentStyle = computed(() =>
  props.accentColor ? { '--amw-color-primary': props.accentColor } : undefined,
)

/** Ancho explícito (sobreescribe el responsive por defecto de `position`) cuando se pasa `width`. */
const widthStyle = computed(() => {
  if (props.width === undefined || props.width === '') return undefined
  return { width: typeof props.width === 'number' ? `${props.width}px` : props.width }
})

/** Posición/ancho de la barra que resalta el rango seleccionado sobre el track del slider. */
const fillStyle = computed(() => {
  if (maxIndex.value === 0) return { left: '0%', width: '100%' }
  const startPct = (startIndex.value / maxIndex.value) * 100
  const endPct = (endIndex.value / maxIndex.value) * 100
  return { left: `${startPct}%`, width: `${endPct - startPct}%` }
})
</script>

<template>
  <div
    class="amw-time-range-controls"
    :class="[
      `amw-time-range-controls--${props.position}`,
      `amw-time-range-controls--${props.theme}`,
    ]"
    :style="[accentStyle, widthStyle]"
  >
    <div class="amw-time-range-controls__header">
      <div class="amw-time-range-controls__block">
        <span class="amw-time-range-controls__date">{{ formattedStartDate }}</span>
        <span class="amw-time-range-controls__hour">{{ formattedStartHour }}</span>
      </div>
      <div class="amw-time-range-controls__block amw-time-range-controls__block--end">
        <span class="amw-time-range-controls__date">{{ formattedEndDate }}</span>
        <span class="amw-time-range-controls__hour">{{ formattedEndHour }}</span>
      </div>
    </div>

    <div class="amw-time-range-controls__row">
      <button
        type="button"
        class="amw-time-range-controls__button"
        aria-label="Retroceder inicio del rango"
        title="Inicio -1"
        :disabled="isFromBackDisabled"
        @click="stepFromBack"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M19 20 9 12l10-8v16ZM5 19V5" />
        </svg>
      </button>
      <button
        type="button"
        class="amw-time-range-controls__button"
        aria-label="Avanzar inicio del rango"
        title="Inicio +1"
        :disabled="isFromForwardDisabled"
        @click="stepFromForward"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M5 4l10 8-10 8V4ZM19 5v14" />
        </svg>
      </button>

      <!--
        Slider de doble manejador implementado con dos <input type="range">
        superpuestos (técnica CSS estándar, sin dependencias): el track de
        cada input es transparente y solo su thumb es interactivo, así que
        cada manejador se puede arrastrar de forma independiente aunque
        compartan el mismo espacio.
      -->
      <div class="amw-time-range-controls__slider-track">
        <div class="amw-time-range-controls__slider-fill" :style="fillStyle" />
        <input
          type="range"
          class="amw-time-range-controls__slider"
          min="0"
          :max="maxIndex"
          step="1"
          :value="startIndex"
          aria-label="Inicio del rango"
          :aria-valuetext="`${formattedStartDate} ${formattedStartHour}`"
          @input="onStartInput"
        />
        <input
          type="range"
          class="amw-time-range-controls__slider"
          min="0"
          :max="maxIndex"
          step="1"
          :value="endIndex"
          aria-label="Fin del rango"
          :aria-valuetext="`${formattedEndDate} ${formattedEndHour}`"
          @input="onEndInput"
        />
      </div>

      <button
        type="button"
        class="amw-time-range-controls__button"
        aria-label="Retroceder fin del rango"
        title="Fin -1"
        :disabled="isToBackDisabled"
        @click="stepToBack"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M19 20 9 12l10-8v16ZM5 19V5" />
        </svg>
      </button>
      <button
        type="button"
        class="amw-time-range-controls__button"
        aria-label="Avanzar fin del rango"
        title="Fin +1"
        :disabled="isToForwardDisabled"
        @click="stepToForward"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M5 4l10 8-10 8V4ZM19 5v14" />
        </svg>
      </button>
    </div>

    <div class="amw-time-range-controls__range">
      <span>{{ startLabel }}</span>
      <span>{{ endLabel }}</span>
    </div>
  </div>
</template>

<style scoped>
.amw-time-range-controls {
  position: absolute;
  z-index: 1000;
  width: min(760px, 94%);
  border-radius: var(--amw-radius, 14px);
  padding: calc(var(--amw-spacing-unit, 4px) * 3) calc(var(--amw-spacing-unit, 4px) * 4);
  backdrop-filter: blur(10px);
  font-family: var(--amw-font-family, system-ui, sans-serif);
  box-shadow: var(--amw-shadow, 0 2px 8px rgba(15, 23, 42, 0.16));
}

.amw-time-range-controls--bottom {
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
}

.amw-time-range-controls--top {
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
}

.amw-time-range-controls--left {
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: min(500px, 90%);
}

.amw-time-range-controls--right {
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: min(500px, 90%);
}

.amw-time-range-controls--dark {
  --amw-color-text: #ffffff;
  --amw-color-text-muted: #cbd5e1;
  --amw-color-surface-muted: rgba(255, 255, 255, 0.12);
  --amw-color-border: rgba(255, 255, 255, 0.2);
  background-color: rgba(24, 24, 27, 0.85);
  color: var(--amw-color-text);
}

.amw-time-range-controls--light {
  --amw-color-text: #0f172a;
  --amw-color-text-muted: #64748b;
  --amw-color-surface-muted: #f1f5f9;
  --amw-color-border: #cbd5e1;
  background-color: rgba(255, 255, 255, 0.92);
  color: var(--amw-color-text);
}

.amw-time-range-controls__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: calc(var(--amw-spacing-unit, 4px) * 3);
  margin-bottom: calc(var(--amw-spacing-unit, 4px) * 2);
}

.amw-time-range-controls__block {
  display: flex;
  align-items: baseline;
  gap: calc(var(--amw-spacing-unit, 4px) * 2);
  min-width: 0;
}

.amw-time-range-controls__block--end {
  flex-direction: row-reverse;
}

.amw-time-range-controls__date {
  font-size: 1.05rem;
  font-weight: 600;
  white-space: nowrap;
}

.amw-time-range-controls__hour {
  font-size: 0.85rem;
  opacity: 0.75;
  white-space: nowrap;
}

.amw-time-range-controls__row {
  display: flex;
  align-items: center;
  gap: calc(var(--amw-spacing-unit, 4px) * 1);
}

.amw-time-range-controls__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-width: 28px;
  min-height: 28px;
  padding: 0 calc(var(--amw-spacing-unit, 4px) * 2);
  border: 1px solid transparent;
  border-radius: var(--amw-radius, 8px);
  background: transparent;
  color: var(--amw-color-text, #0f172a);
  font: inherit;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    opacity 0.15s ease;
}

.amw-time-range-controls__button:hover:not(:disabled) {
  background-color: var(--amw-color-surface-muted, #f1f5f9);
}

.amw-time-range-controls__button:focus-visible {
  outline: none;
  box-shadow: var(--amw-focus-ring, 0 0 0 2px #2563eb);
}

.amw-time-range-controls__button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.amw-time-range-controls__slider-track {
  position: relative;
  flex: 1;
  height: 20px;
  margin: 0 calc(var(--amw-spacing-unit, 4px) * 2);
}

.amw-time-range-controls__slider-fill {
  position: absolute;
  top: 50%;
  height: 4px;
  transform: translateY(-50%);
  background-color: var(--amw-color-primary, #2563eb);
  border-radius: 2px;
  pointer-events: none;
}

.amw-time-range-controls__slider {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  appearance: none;
  background: transparent;
  pointer-events: none;
}

.amw-time-range-controls__slider::-webkit-slider-runnable-track {
  background: transparent;
}

.amw-time-range-controls__slider::-moz-range-track {
  background: transparent;
  border: none;
}

.amw-time-range-controls__slider::-webkit-slider-thumb {
  appearance: none;
  pointer-events: auto;
  width: 14px;
  height: 14px;
  margin-top: 3px;
  border-radius: 50%;
  background-color: var(--amw-color-primary, #2563eb);
  border: 2px solid var(--amw-color-surface, #fff);
  cursor: pointer;
}

.amw-time-range-controls__slider::-moz-range-thumb {
  pointer-events: auto;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background-color: var(--amw-color-primary, #2563eb);
  border: 2px solid var(--amw-color-surface, #fff);
  cursor: pointer;
}

.amw-time-range-controls__range {
  display: flex;
  justify-content: space-between;
  margin-top: calc(var(--amw-spacing-unit, 4px) * 1.5);
  font-size: 0.7rem;
  opacity: 0.65;
}
</style>
