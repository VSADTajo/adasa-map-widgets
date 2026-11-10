<script setup lang="ts">
import { computed } from 'vue'
import { useMeasureFormat } from '@/detail/composables/useMeasureFormat'
import type { ThresholdLegendEmits, ThresholdLegendProps } from '@/detail/types/HydroCardsProps'
import type { ExceededLevel } from '@/detail/types/hydro'
import { EXCEEDED_LEVELS, hasThresholds } from '@/detail/utils/hydro'
import ASCard from './ASCard.vue'
import ASStatusBadge from './ASStatusBadge.vue'

/**
 * Umbrales de aviso de una magnitud (amarillo, naranja y rojo) con su
 * valor. Cada umbral es un botón que lo resalta (`v-model:selected`), p. ej.
 * para destacar esa línea en el hidrograma; pulsar el resaltado lo quita.
 * Un umbral sin valor se ve deshabilitado.
 *
 * @example
 * ```vue
 * <ASThresholdLegend :thresholds="umbrales" unit="m³/s" v-model:selected="umbralResaltado" />
 * <ASHydrographChart :thresholds="lineasDeUmbral(umbralResaltado)" ... />
 * ```
 */
const props = withDefaults(defineProps<ThresholdLegendProps>(), {
  title: undefined,
  theme: undefined,
  thresholds: undefined,
  unit: undefined,
  selected: null,
})

const emit = defineEmits<ThresholdLegendEmits>()
const format = useMeasureFormat()

const items = computed(() =>
  EXCEEDED_LEVELS.slice()
    .reverse()
    .map((level) => {
      const value = props.thresholds?.[level]
      return {
        level,
        value: value ?? null,
        text: format.value(value, props.unit),
        hint:
          value == null
            ? undefined
            : format.t('detail.highlightThreshold', {
                level: format.levelName(level).toLowerCase(),
                value: format.value(value, props.unit),
              }),
      }
    }),
)

function toggle(level: ExceededLevel): void {
  emit('update:selected', props.selected === level ? null : level)
}
</script>

<template>
  <ASCard
    :title="props.title ?? format.t('detail.thresholds')"
    :loading="props.loading"
    :skeleton-lines="1"
    :empty="!hasThresholds(props.thresholds)"
    :empty-text="format.t('detail.noThresholds')"
    :theme="props.theme"
  >
    <ul class="as-threshold-legend">
      <li v-for="item in items" :key="item.level">
        <button
          type="button"
          class="as-threshold-legend__item"
          :aria-pressed="props.selected === item.level"
          :disabled="item.value == null"
          :title="item.hint"
          @click="toggle(item.level)"
        >
          <ASStatusBadge :level="item.level" size="sm" />
          <span class="as-threshold-legend__value">{{ item.text }}</span>
        </button>
      </li>
    </ul>
  </ASCard>
</template>

<style scoped>
.as-threshold-legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--as-space-2, 8px);
  margin: 0;
  padding: 0;
  list-style: none;
}

.as-threshold-legend__item {
  display: inline-flex;
  gap: var(--as-space-2, 8px);
  align-items: center;
  padding: var(--as-space-1, 4px) var(--as-space-2, 8px) var(--as-space-1, 4px)
    var(--as-space-1, 4px);
  border: 1px solid transparent;
  border-radius: var(--as-radius, 8px);
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.as-threshold-legend__item:hover:not(:disabled) {
  background-color: var(--as-color-surface-muted, light-dark(#f1f5f9, #334155));
}

/* Resaltado: borde además del fondo, para que no dependa solo del color. */
.as-threshold-legend__item[aria-pressed='true'] {
  border-color: var(--as-color-text, light-dark(#0f172a, #f1f5f9));
  background-color: var(--as-color-surface-muted, light-dark(#f1f5f9, #334155));
}

.as-threshold-legend__item:focus-visible {
  outline: none;
  box-shadow: var(--as-focus-ring, 0 0 0 2px light-dark(#2563eb, #60a5fa));
}

.as-threshold-legend__item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.as-threshold-legend__value {
  font-weight: var(--as-font-weight-semibold, 600);
  font-variant-numeric: tabular-nums;
}
</style>
