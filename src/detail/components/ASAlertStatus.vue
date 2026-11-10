<script setup lang="ts">
import { computed } from 'vue'
import type { AlertLevel } from '@/core/types/theme'
import { useMeasureFormat } from '@/detail/composables/useMeasureFormat'
import type { AlertStatusProps } from '@/detail/types/HydroCardsProps'
import { alertLevelOf, summarizeSeries, worstLevel } from '@/detail/utils/hydro'
import ASCard from './ASCard.vue'
import ASStatusBadge from './ASStatusBadge.vue'

/**
 * Nivel de aviso de una estación: compara con los umbrales el último valor
 * de cada serie (`mode="latest"`, el estado actual de lo observado) o su
 * máximo (`mode="max"`, lo peor que anuncian las previsiones), y muestra el
 * más grave en una píldora. Debajo, el valor que lo decide y su fecha.
 *
 * Sin datos, el nivel es "Normal" y no se muestra valor.
 *
 * @example
 * ```vue
 * <ASAlertStatus :series="[observado]" :thresholds="umbrales" />
 * <ASAlertStatus :series="[harmonie, eps]" :thresholds="umbrales" mode="max" />
 * ```
 */
const props = withDefaults(defineProps<AlertStatusProps>(), {
  title: undefined,
  theme: undefined,
  thresholds: undefined,
  mode: 'latest',
  showValue: true,
})

const format = useMeasureFormat()

/** Para cada serie con datos: su valor de referencia y el nivel que alcanza. */
const evaluations = computed(() =>
  props.series.flatMap((series) => {
    const summary = summarizeSeries(series.data)
    const point = props.mode === 'max' ? summary.max : summary.last
    if (!point) return []
    const level = alertLevelOf(point[1], series.thresholds ?? props.thresholds)
    return [{ series, point, level }]
  }),
)

const level = computed<AlertLevel>(() => worstLevel(evaluations.value.map((item) => item.level)))

/** El valor que decide el nivel: el de la serie más grave (y, a igualdad, el más alto). */
const reference = computed(() => {
  const candidates = evaluations.value.filter((item) => item.level === level.value)
  return candidates.reduce<(typeof candidates)[number] | undefined>(
    (best, item) => (!best || item.point[1] > best.point[1] ? item : best),
    undefined,
  )
})

const title = computed(
  () => props.title ?? format.t(props.mode === 'max' ? 'detail.alertMax' : 'detail.alertLatest'),
)
</script>

<template>
  <ASCard :title="title" :loading="props.loading" :skeleton-lines="1" :theme="props.theme">
    <div class="as-alert-status">
      <ASStatusBadge :level="level" size="lg" />
      <p v-if="props.showValue && reference" class="as-alert-status__value">
        {{
          format.t('detail.referenceValue', {
            value: format.value(reference.point[1], reference.series.unit),
            date: format.dateTimeShort(reference.point[0]),
          })
        }}
        <template v-if="props.series.length > 1">({{ reference.series.label }})</template>
      </p>
    </div>
  </ASCard>
</template>

<style scoped>
.as-alert-status {
  display: flex;
  flex-direction: column;
  gap: var(--as-space-2, 8px);
  align-items: center;
  justify-content: center;
  min-height: 64px;
}

.as-alert-status__value {
  margin: 0;
  font-size: var(--as-font-size-xs, 0.75rem);
  font-variant-numeric: tabular-nums;
  color: var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
  text-align: center;
}
</style>
