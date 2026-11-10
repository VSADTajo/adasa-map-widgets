<script setup lang="ts">
import { computed } from 'vue'
import { useFieldId } from '@/core/composables/useFieldId'
import { useLocale } from '@/core/composables/useLocale'
import { useResolvedTheme } from '@/core/composables/useTheme'
import type { SliderEmits, SliderProps } from '@/forms/types/SliderProps'
import { describedByOf } from '@/forms/utils/field'
import FieldMessages from './FieldMessages.vue'

/**
 * Slider: un `<input type="range">` nativo con estilo propio. Al ser nativo,
 * los lectores de pantalla lo anuncian como control deslizante y responde a
 * las flechas, Re Pág / Av Pág e Inicio / Fin sin código extra.
 *
 * Controlado: emite `update:modelValue` en cada movimiento y `change` al soltar.
 *
 * @example
 * ```vue
 * <ASSlider v-model="opacidad" label="Opacidad" :step="5" :format="(v) => `${v} %`" />
 * ```
 */
const props = withDefaults(defineProps<SliderProps>(), {
  min: 0,
  max: 100,
  step: 1,
  hideLabel: false,
  showValue: true,
  format: undefined,
  hint: undefined,
  focusable: true,
  id: undefined,
  theme: undefined,
})

const emit = defineEmits<SliderEmits>()
const theme = useResolvedTheme(() => props.theme, null)
const id = useFieldId(() => props.id)
const { formatNumber } = useLocale()

const valueText = computed(() => props.format?.(props.modelValue) ?? formatNumber(props.modelValue))

/** Parte del carril ya recorrida, en %, para pintarla con el color principal. */
const fill = computed(() => {
  const span = props.max - props.min
  const ratio = span > 0 ? (props.modelValue - props.min) / span : 0
  return `${Math.min(100, Math.max(0, ratio * 100))}%`
})

const read = (event: Event): number => Number((event.target as HTMLInputElement).value)
</script>

<template>
  <div
    class="as-slider"
    :class="[theme && `as-slider--${theme}`, { 'as-slider--disabled': props.disabled }]"
  >
    <div class="as-slider__header">
      <label
        :for="id"
        class="as-slider__label"
        :class="{ 'as-slider__label--hidden': props.hideLabel }"
      >
        {{ props.label }}
      </label>
      <!-- Ya lo anuncia aria-valuetext: a la vista, nada más. -->
      <output v-if="props.showValue" class="as-slider__value" :for="id" aria-hidden="true">
        {{ valueText }}
      </output>
    </div>
    <input
      :id="id"
      class="as-slider__input"
      type="range"
      :style="{ '--as-slider-fill': fill }"
      :value="props.modelValue"
      :min="props.min"
      :max="props.max"
      :step="props.step"
      :disabled="props.disabled"
      :tabindex="props.focusable ? undefined : -1"
      :aria-valuetext="valueText"
      :aria-describedby="describedByOf(id, props.hint, undefined)"
      @input="emit('update:modelValue', read($event))"
      @change="emit('change', read($event))"
    />
    <FieldMessages :id="id" :hint="props.hint" />
  </div>
</template>

<style scoped>
.as-slider {
  --as-slider-thumb: 16px;
  display: flex;
  flex-direction: column;
  gap: var(--as-space-1, 4px);
  font-family: var(--as-font-family, system-ui, sans-serif);
  font-size: var(--as-font-size-sm, 0.875rem);
  color: var(--as-color-text, light-dark(#0f172a, #f1f5f9));
}

.as-slider--dark {
  color-scheme: dark;
}

.as-slider--light {
  color-scheme: light;
}

.as-slider--disabled {
  opacity: 0.5;
}

/* Vacía si la etiqueta está oculta y no se muestra el valor: no ocupa sitio. */
.as-slider__header:not(:has(.as-slider__value, .as-slider__label:not(.as-slider__label--hidden))) {
  height: 0;
}

.as-slider__header {
  display: flex;
  position: relative;
  gap: var(--as-space-2, 8px);
  align-items: baseline;
  justify-content: space-between;
}

.as-slider__label {
  font-weight: var(--as-font-weight-medium, 500);
}

/* Oculta a la vista pero no a los lectores de pantalla. */
.as-slider__label--hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.as-slider__value {
  margin-left: auto;
  color: var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
  font-size: var(--as-font-size-xs, 0.75rem);
  font-variant-numeric: tabular-nums;
}

.as-slider__input {
  width: 100%;
  height: var(--as-slider-thumb);
  margin: 0;
  background: transparent;
  cursor: pointer;
  appearance: none;
}

.as-slider__input:disabled {
  cursor: not-allowed;
}

/* El carril, con la parte recorrida en el color principal (Chromium/WebKit y Firefox). */
.as-slider__input::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: var(--as-radius-full, 9999px);
  background: linear-gradient(
    to right,
    var(--as-color-primary, light-dark(#2563eb, #60a5fa)) var(--as-slider-fill),
    var(--as-color-border, light-dark(#cbd5e1, #475569)) var(--as-slider-fill)
  );
}

.as-slider__input::-moz-range-track {
  height: 4px;
  border-radius: var(--as-radius-full, 9999px);
  background: var(--as-color-border, light-dark(#cbd5e1, #475569));
}

.as-slider__input::-moz-range-progress {
  height: 4px;
  border-radius: var(--as-radius-full, 9999px);
  background: var(--as-color-primary, light-dark(#2563eb, #60a5fa));
}

.as-slider__input::-webkit-slider-thumb {
  width: var(--as-slider-thumb);
  height: var(--as-slider-thumb);
  margin-top: calc((4px - var(--as-slider-thumb)) / 2);
  border: 2px solid var(--as-color-primary, light-dark(#2563eb, #60a5fa));
  border-radius: 50%;
  background: var(--as-color-surface, light-dark(#ffffff, #1e293b));
  appearance: none;
}

.as-slider__input::-moz-range-thumb {
  box-sizing: border-box;
  width: var(--as-slider-thumb);
  height: var(--as-slider-thumb);
  border: 2px solid var(--as-color-primary, light-dark(#2563eb, #60a5fa));
  border-radius: 50%;
  background: var(--as-color-surface, light-dark(#ffffff, #1e293b));
}

.as-slider__input:focus-visible {
  outline: none;
}

.as-slider__input:focus-visible::-webkit-slider-thumb {
  box-shadow: var(--as-focus-ring, 0 0 0 2px light-dark(#2563eb, #60a5fa));
}

.as-slider__input:focus-visible::-moz-range-thumb {
  box-shadow: var(--as-focus-ring, 0 0 0 2px light-dark(#2563eb, #60a5fa));
}
</style>
