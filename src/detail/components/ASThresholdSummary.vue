<script setup lang="ts">
import { computed } from 'vue'
import { isSameDay } from 'date-fns'
import { useMeasureFormat } from '@/detail/composables/useMeasureFormat'
import type { ThresholdSummaryProps } from '@/detail/types/HydroCardsProps'
import type { ExceededLevel } from '@/detail/types/hydro'
import { EXCEEDED_LEVELS, exceedanceSegments } from '@/detail/utils/hydro'
import ASCard from './ASCard.vue'

/**
 * Resumen de superaciones de umbral: para cada serie y nivel (de rojo a
 * amarillo), cuántos intervalos lo superan y cuándo fue el último, p. ej.
 * "Harmonie: nivel rojo superado en 2 intervalos. Último: 19 oct, 06:00 –
 * 19 oct, 12:00". Si nada supera ningún umbral, lo dice.
 *
 * Un intervalo es un tramo de valores seguidos en el mismo nivel (ver
 * `exceedanceSegments`). Cada línea lleva un punto del color del nivel,
 * además del nombre del nivel en el texto.
 *
 * @example
 * ```vue
 * <ASThresholdSummary :series="[harmonie, eps]" :thresholds="umbrales" mode="forecast" />
 * ```
 */
const props = withDefaults(defineProps<ThresholdSummaryProps>(), {
  title: undefined,
  theme: undefined,
  thresholds: undefined,
  mode: 'observed',
})

const format = useMeasureFormat()

const hasData = computed(() =>
  props.series.some((series) => series.data.some(([, value]) => value != null)),
)

const items = computed(() => {
  const result: { id: string; level: ExceededLevel; text: string }[] = []
  for (const series of props.series) {
    const segments = exceedanceSegments(series.data, series.thresholds ?? props.thresholds)
    for (const level of EXCEEDED_LEVELS) {
      const ofLevel = segments.filter((segment) => segment.level === level)
      const last = ofLevel[ofLevel.length - 1]
      if (!last) continue
      const when =
        +last.start === +last.end
          ? format.dateTimeShort(last.start)
          : format.t('dates.rangeValue', {
              start: format.dateTimeShort(last.start),
              // El mismo día no se repite: "20 oct, 11:00 – 16:00".
              end: isSameDay(last.start, last.end)
                ? format.time(last.end)
                : format.dateTimeShort(last.end),
            })
      const params = {
        series: series.label,
        level: format.levelName(level).toLowerCase(),
        count: ofLevel.length,
        when,
      }
      result.push({
        id: `${series.id}-${level}`,
        level,
        text: format.t(
          ofLevel.length === 1 ? 'detail.exceedanceOne' : 'detail.exceedanceMany',
          params,
        ),
      })
    }
  }
  return result
})
</script>

<template>
  <ASCard
    :title="props.title ?? format.t('detail.thresholdSummary')"
    :loading="props.loading"
    :skeleton-lines="4"
    :empty="!hasData"
    :empty-text="format.t(props.mode === 'forecast' ? 'detail.noForecast' : 'detail.noObserved')"
    :theme="props.theme"
  >
    <ul v-if="items.length" class="as-threshold-summary">
      <li v-for="item in items" :key="item.id" class="as-threshold-summary__item">
        <span
          class="as-threshold-summary__dot"
          :class="`as-threshold-summary__dot--${item.level}`"
          aria-hidden="true"
        />
        <span>{{ item.text }}</span>
      </li>
    </ul>
    <p v-else class="as-threshold-summary__none">
      <span
        class="as-threshold-summary__dot as-threshold-summary__dot--normal"
        aria-hidden="true"
      />
      {{
        format.t(
          props.mode === 'forecast' ? 'detail.noExceedanceForecast' : 'detail.noExceedanceObserved',
        )
      }}
    </p>
  </ASCard>
</template>

<style scoped>
.as-threshold-summary {
  display: flex;
  flex-direction: column;
  gap: var(--as-space-3, 12px);
  margin: 0;
  padding: 0;
  list-style: none;
}

.as-threshold-summary__item,
.as-threshold-summary__none {
  display: flex;
  gap: var(--as-space-3, 12px);
  align-items: flex-start;
  margin: 0;
  line-height: 1.35;
}

.as-threshold-summary__dot {
  flex: none;
  width: 10px;
  height: 10px;
  margin-top: 0.3em;
  border-radius: 50%;
}

/* Variante -strong: los puntos son marcas sobre la superficie (≥ 3:1). */
.as-threshold-summary__dot--normal {
  background-color: var(--as-alert-normal-strong, #43a047);
}

.as-threshold-summary__dot--amarillo {
  background-color: var(--as-alert-amarillo-strong, light-dark(#b28f09, #ffd54f));
}

.as-threshold-summary__dot--naranja {
  background-color: var(--as-alert-naranja-strong, light-dark(#dc7b09, #fb8c00));
}

.as-threshold-summary__dot--rojo {
  background-color: var(--as-alert-rojo-strong, light-dark(#d32f2f, #e53935));
}
</style>
