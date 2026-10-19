<script setup lang="ts">
import { computed } from 'vue'
import { useMeasureFormat } from '@/detail/composables/useMeasureFormat'
import type { ObservedSummaryEmits, ObservedSummaryProps } from '@/detail/types/HydroCardsProps'
import { alertLevelOf, summarizeSeries } from '@/detail/utils/hydro'
import ASCard from './ASCard.vue'
import ASStatusBadge from './ASStatusBadge.vue'
import SegmentedControl from './SegmentedControl.vue'

/**
 * Resumen de lo observado: último valor y su fecha, y máximo y su fecha, con
 * los valores en una píldora del color de su nivel de aviso. Con varias
 * series (p. ej. caudal de entrada, de salida y volumen de un embalse), un
 * selector elige cuál se ve; las series sin datos quedan deshabilitadas.
 *
 * Controlado: `v-model:active` es el id de la serie visible.
 *
 * @example
 * ```vue
 * <ASObservedSummary :series="[entrada, salida, volumen]" v-model:active="vista" :thresholds="umbrales" />
 * ```
 */
const props = withDefaults(defineProps<ObservedSummaryProps>(), {
  title: undefined,
  theme: undefined,
  active: undefined,
  thresholds: undefined,
})

const emit = defineEmits<ObservedSummaryEmits>()
const format = useMeasureFormat()

const summaries = computed(() =>
  props.series.map((series) => ({ series, summary: summarizeSeries(series.data) })),
)

/** Serie visible: la de `active` o, si no la hay, la primera con datos. */
const current = computed(
  () =>
    summaries.value.find((item) => item.series.id === props.active) ??
    summaries.value.find((item) => item.summary.count > 0) ??
    summaries.value[0],
)

const options = computed(() =>
  summaries.value.map(({ series, summary }) => ({
    value: series.id,
    label: series.label,
    disabled: summary.count === 0,
  })),
)

const rows = computed(() => {
  const item = current.value
  if (!item?.summary.last || !item.summary.max) return []
  const { series, summary } = item
  const thresholds = series.thresholds ?? props.thresholds
  const point = (key: 'last' | 'max') => summary[key]!
  return [
    {
      key: 'last',
      label: format.t('detail.lastValue'),
      value: format.value(point('last')[1], series.unit),
      level: alertLevelOf(point('last')[1], thresholds),
    },
    {
      key: 'lastDate',
      label: format.t('detail.lastDate'),
      text: format.dateTime(point('last')[0]),
    },
    {
      key: 'max',
      label: format.t('detail.maxValue'),
      value: format.value(point('max')[1], series.unit),
      level: alertLevelOf(point('max')[1], thresholds),
    },
    { key: 'maxDate', label: format.t('detail.maxDate'), text: format.dateTime(point('max')[0]) },
  ]
})
</script>

<template>
  <ASCard
    :title="props.title ?? format.t('detail.observedSummary')"
    :loading="props.loading"
    :skeleton-lines="4"
    :empty="!rows.length"
    :empty-text="format.t('detail.noObserved')"
    :theme="props.theme"
  >
    <template v-if="props.series.length > 1" #actions>
      <SegmentedControl
        :label="format.t('detail.series')"
        :options="options"
        :model-value="current?.series.id"
        @update:model-value="emit('update:active', $event)"
      />
    </template>
    <dl class="as-observed-summary">
      <div v-for="row in rows" :key="row.key" class="as-observed-summary__row">
        <dt class="as-observed-summary__label">{{ row.label }}</dt>
        <dd class="as-observed-summary__value">
          <ASStatusBadge v-if="row.level" :level="row.level" :label="row.value" />
          <template v-else>{{ row.text }}</template>
        </dd>
      </div>
    </dl>
  </ASCard>
</template>

<style scoped>
.as-observed-summary {
  display: flex;
  flex-direction: column;
  gap: var(--as-space-3, 12px);
  margin: 0;
}

.as-observed-summary__row {
  display: flex;
  gap: var(--as-space-2, 8px);
  align-items: center;
  justify-content: space-between;
}

.as-observed-summary__label {
  font-size: var(--as-font-size-xs, 0.75rem);
  color: var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
}

.as-observed-summary__value {
  margin: 0;
  font-weight: var(--as-font-weight-medium, 500);
  font-variant-numeric: tabular-nums;
  text-align: right;
}
</style>
