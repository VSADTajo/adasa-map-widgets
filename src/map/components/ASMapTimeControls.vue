<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useLocale } from '@/core/composables/useLocale'
import { useResolvedTheme } from '@/core/composables/useTheme'
import type { TimelineEmits, TimelineProps } from '@/map/types/TimelineProps'

/**
 * Control de reproducción de una línea de tiempo: play/pause, paso a paso y
 * slider, con la cabecera mostrando el instante actual.
 *
 * Es un componente **controlado** y agnóstico de cualquier fuente de datos o
 * store: recibe la línea de tiempo ya calculada y `currentTimeIndex`/`isPlaying`
 * se usan con `v-model` — el proyecto consumidor decide qué hacer en cada paso
 * (p. ej. actualizar los parámetros de una capa temporal en su propio store).
 * El propio widget no sabe nada de capas ni de mapas.
 *
 * @example
 * ```vue
 * <ASMapTimeControls
 *   :timeline="timeline"
 *   v-model:current-time-index="index"
 *   v-model:is-playing="playing"
 *   :accent-color="colorScale(dataAt(index))"
 *   width="900px"
 *   @time-changed="(date) => setLayerTime(date)"
 * />
 * ```
 */
const props = withDefaults(defineProps<TimelineProps>(), {
  stepMs: 2000,
  position: 'bottom',
  theme: undefined,
  accentColor: undefined,
  width: undefined,
})

/** Prop `theme` o, si no se pasa, el tema de `provideTheme` (ver `useResolvedTheme`). */
const resolvedTheme = useResolvedTheme(() => props.theme)

/** Textos y formatos en el idioma de `provideLocale` (español por defecto). */
const { t, formatDate } = useLocale()

/** Override local de `--as-color-primary` cuando se pasa `accentColor` (p. ej. desde una escala de color). */
const accentStyle = computed(() =>
  props.accentColor ? { '--as-color-primary': props.accentColor } : undefined,
)

/** Ancho explícito (sobreescribe el responsive por defecto de `position`) cuando se pasa `width`. */
const widthStyle = computed(() => {
  if (props.width === undefined || props.width === '') return undefined
  return { width: typeof props.width === 'number' ? `${props.width}px` : props.width }
})

const emit = defineEmits<TimelineEmits>()

const isUserSliding = ref(false)
let intervalId: ReturnType<typeof window.setInterval> | null = null

const currentTime = computed<Date | undefined>(() => props.timeline[props.currentTimeIndex])

const formattedDate = computed(() =>
  currentTime.value ? formatDate(currentTime.value, { pattern: 'd MMM yyyy' }) : '',
)
const formattedHour = computed(() =>
  currentTime.value ? formatDate(currentTime.value, { pattern: 'HH:mm' }) : '',
)

const startLabel = computed(() =>
  props.timeline.length > 0
    ? formatDate(props.timeline[0] as Date, { pattern: 'd MMM HH:mm' })
    : '',
)
const endLabel = computed(() =>
  props.timeline.length > 0
    ? formatDate(props.timeline[props.timeline.length - 1] as Date, { pattern: 'd MMM HH:mm' })
    : '',
)

watch(currentTime, (time) => {
  if (time) emit('time-changed', time)
})

function clearPlaybackInterval(): void {
  if (intervalId !== null) {
    window.clearInterval(intervalId)
    intervalId = null
  }
}

function startPlaybackInterval(): void {
  clearPlaybackInterval()
  intervalId = window.setInterval(() => {
    if (props.timeline.length === 0) return
    const next =
      props.currentTimeIndex >= props.timeline.length - 1 ? 0 : props.currentTimeIndex + 1
    emit('update:currentTimeIndex', next)
  }, props.stepMs)
}

watch(
  () => props.isPlaying,
  (playing) => {
    if (playing) {
      startPlaybackInterval()
    } else {
      clearPlaybackInterval()
    }
  },
  { immediate: true },
)

onUnmounted(clearPlaybackInterval)

function togglePlay(): void {
  emit('update:isPlaying', !props.isPlaying)
}

function stepForward(): void {
  if (props.currentTimeIndex < props.timeline.length - 1) {
    emit('update:currentTimeIndex', props.currentTimeIndex + 1)
  }
}

function stepBack(): void {
  if (props.currentTimeIndex > 0) {
    emit('update:currentTimeIndex', props.currentTimeIndex - 1)
  }
}

function onSliderInput(event: Event): void {
  emit('update:currentTimeIndex', Number((event.target as HTMLInputElement).value))
}

function onSliderStart(): void {
  isUserSliding.value = true
  if (props.isPlaying) {
    emit('update:isPlaying', false)
  }
}

function onSliderEnd(): void {
  isUserSliding.value = false
}

const playPauseIconPath = computed(() =>
  props.isPlaying ? 'M6 4h4v16H6ZM14 4h4v16h-4Z' : 'M5 3l14 9-14 9V3Z',
)
</script>

<template>
  <div
    class="as-time-controls"
    :class="[`as-time-controls--${props.position}`, `as-time-controls--${resolvedTheme}`]"
    :style="[accentStyle, widthStyle]"
  >
    <div class="as-time-controls__header">
      <span class="as-time-controls__title">
        <span
          v-if="props.accentColor"
          class="as-time-controls__accent-dot"
          :style="{ backgroundColor: props.accentColor }"
          aria-hidden="true"
        />
        <span class="as-time-controls__date">{{ formattedDate }}</span>
      </span>
      <span class="as-time-controls__hour">{{ formattedHour }}</span>
    </div>

    <div class="as-time-controls__row">
      <button
        type="button"
        class="as-time-controls__button"
        :aria-label="t('time.previous')"
        :disabled="props.currentTimeIndex <= 0"
        @click="stepBack"
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
        class="as-time-controls__button"
        :aria-label="props.isPlaying ? t('time.pause') : t('time.play')"
        @click="togglePlay"
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
          <path :d="playPauseIconPath" />
        </svg>
      </button>

      <button
        type="button"
        class="as-time-controls__button"
        :aria-label="t('time.next')"
        :disabled="props.currentTimeIndex >= props.timeline.length - 1"
        @click="stepForward"
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

      <input
        type="range"
        class="as-time-controls__slider"
        min="0"
        :max="Math.max(props.timeline.length - 1, 0)"
        step="1"
        :value="props.currentTimeIndex"
        :aria-label="t('time.position')"
        :aria-valuetext="`${formattedDate} ${formattedHour}`"
        @input="onSliderInput"
        @pointerdown="onSliderStart"
        @pointerup="onSliderEnd"
      />
    </div>

    <div class="as-time-controls__range">
      <span>{{ startLabel }}</span>
      <span>{{ endLabel }}</span>
    </div>
  </div>
</template>

<style scoped>
.as-time-controls {
  /* Colores de overlay sobre el mapa: tokens --as-overlay-* (con su valor
     por defecto como fallback). El modo claro/oscuro lo elige color-scheme,
     que fijan las clases --light/--dark según la prop theme. */
  /* En oscuro, bordes y texto secundario más suaves que el resto de
     overlays: valores propios, no los tokens --as-overlay-*. */
  --as-color-text: var(--as-overlay-text, light-dark(#0f172a, #ffffff));
  --as-color-text-muted: light-dark(#5a6a81, #cbd5e1);
  --as-color-surface-muted: light-dark(#f1f5f9, rgba(255, 255, 255, 0.12));
  --as-color-border: light-dark(#cbd5e1, rgba(255, 255, 255, 0.2));
  background-color: var(
    --as-overlay-bg,
    light-dark(rgba(255, 255, 255, 0.92), rgba(24, 24, 27, 0.85))
  );
  color: var(--as-color-text);
  position: absolute;
  z-index: var(--as-z-map-control, 1000);
  width: min(720px, 94%);
  border-radius: var(--as-radius, 14px);
  padding: calc(var(--as-spacing-unit, 4px) * 3) calc(var(--as-spacing-unit, 4px) * 4);
  backdrop-filter: blur(10px);
  font-family: var(--as-font-family, system-ui, sans-serif);
  box-shadow: var(--as-shadow, 0 2px 8px rgba(15, 23, 42, 0.16));
}

.as-time-controls--bottom {
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
}

.as-time-controls--top {
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
}

.as-time-controls--left {
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: min(480px, 90%);
}

.as-time-controls--right {
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: min(480px, 90%);
}

.as-time-controls--dark {
  color-scheme: dark;
}

.as-time-controls--light {
  color-scheme: light;
}

.as-time-controls__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: calc(var(--as-spacing-unit, 4px) * 2);
  gap: calc(var(--as-spacing-unit, 4px) * 2);
}

.as-time-controls__title {
  display: flex;
  align-items: center;
  gap: calc(var(--as-spacing-unit, 4px) * 1.5);
  min-width: 0;
}

.as-time-controls__accent-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.15);
}

.as-time-controls__date {
  font-size: 1.05rem;
  font-weight: 600;
}

.as-time-controls__hour {
  font-size: 0.85rem;
  opacity: 0.75;
}

.as-time-controls__row {
  display: flex;
  align-items: center;
  gap: calc(var(--as-spacing-unit, 4px) * 1.5);
}

.as-time-controls__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-width: 28px;
  min-height: 28px;
  padding: 0 calc(var(--as-spacing-unit, 4px) * 2);
  border: 1px solid transparent;
  border-radius: var(--as-radius, 8px);
  background: transparent;
  color: var(--as-color-text, #0f172a);
  font: inherit;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    opacity 0.15s ease;
}

.as-time-controls__button:hover:not(:disabled) {
  background-color: var(--as-color-surface-muted, #f1f5f9);
}

.as-time-controls__button:focus-visible {
  outline: none;
  box-shadow: var(--as-focus-ring, 0 0 0 2px #2563eb);
}

.as-time-controls__button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.as-time-controls__slider {
  flex: 1;
  margin: 0 calc(var(--as-spacing-unit, 4px) * 2);
  accent-color: var(--as-color-primary, #2563eb);
  cursor: pointer;
}

.as-time-controls__range {
  display: flex;
  justify-content: space-between;
  margin-top: calc(var(--as-spacing-unit, 4px) * 1.5);
  font-size: 0.7rem;
  opacity: 0.65;
}
</style>
