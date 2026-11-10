<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '@/core/composables/useLocale'
import { useMeasureFormat } from '@/detail/composables/useMeasureFormat'
import type { ValueMatrixEmits, ValueMatrixProps } from '@/detail/types/HydroCardsProps'
import type { AggregateKind } from '@/detail/types/hydro'
import {
  EXCEEDED_LEVELS,
  aggregateByInterval,
  alertLevelOf,
  hasThresholds,
} from '@/detail/utils/hydro'
import ASCard from './ASCard.vue'
import ASStatusBadge from './ASStatusBadge.vue'
import SegmentedControl from './SegmentedControl.vue'

/**
 * Tabla de valores por intervalo (6 h por defecto) durante `days` días: una
 * fila por serie (observado, cada modelo, cada percentil...) y una columna
 * por intervalo, con el mínimo, la media o el máximo de cada uno según el
 * selector de la cabecera (`v-model:aggregate`). Las celdas se tiñen con el
 * color de su nivel de aviso, que también va en el texto para los lectores
 * de pantalla y en una leyenda bajo la tabla.
 *
 * La primera columna queda fija al desplazar en horizontal; la zona de la
 * tabla se puede enfocar para desplazarla con las flechas.
 *
 * @example
 * ```vue
 * <ASValueMatrix :series="[observado, harmonie, eps]" :thresholds="umbrales" v-model:aggregate="agregado" />
 * ```
 */
const props = withDefaults(defineProps<ValueMatrixProps>(), {
  title: undefined,
  theme: undefined,
  thresholds: undefined,
  interval: 6 * 3_600_000,
  days: 7,
  aggregate: 'mean',
})

const emit = defineEmits<ValueMatrixEmits>()
const format = useMeasureFormat()
const { formatNumber, formatDate } = useLocale()

const rows = computed(() =>
  props.series
    .map((series) => ({
      series,
      cells: new Map(aggregateByInterval(series.data, props.interval).map((a) => [+a.start, a])),
    }))
    .filter((row) => row.cells.size > 0),
)

/** Inicios de intervalo con datos en alguna fila, durante `days` días desde el primero. */
const columns = computed(() => {
  const starts = [...new Set(rows.value.flatMap((row) => [...row.cells.keys()]))].sort(
    (a, b) => a - b,
  )
  const first = starts[0]
  if (first === undefined) return []
  const limit = first + props.days * 24 * 3_600_000
  return starts.filter((start) => start < limit)
})

const title = computed(
  () =>
    props.title ??
    format.t('detail.matrixTitle', { hours: formatNumber(props.interval / 3_600_000) }),
)

const aggregateOptions = computed(() =>
  (['min', 'mean', 'max'] as AggregateKind[]).map((kind) => ({
    value: kind,
    label: format.t(`detail.aggregate.${kind}`),
  })),
)

function cell(row: (typeof rows.value)[number], start: number) {
  const aggregate = row.cells.get(start)
  if (!aggregate) return null
  const value = aggregate[props.aggregate]
  return {
    text: formatNumber(value, { maximumFractionDigits: 2 }),
    level: alertLevelOf(value, row.series.thresholds ?? props.thresholds),
  }
}

function header(start: number): string {
  return formatDate(start, {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
}

const legend = computed(() =>
  hasThresholds(props.thresholds)
    ? EXCEEDED_LEVELS.slice()
        .reverse()
        .filter((level) => props.thresholds?.[level] != null)
        .map((level) => ({
          level,
          text: format.t('detail.thresholdFrom', {
            value: format.value(props.thresholds![level], props.series[0]?.unit),
          }),
        }))
    : [],
)
</script>

<template>
  <ASCard
    :title="title"
    :loading="props.loading"
    :skeleton-lines="5"
    :empty="!columns.length"
    :theme="props.theme"
  >
    <template #actions>
      <SegmentedControl
        :label="format.t('detail.aggregate')"
        :options="aggregateOptions"
        :model-value="props.aggregate"
        @update:model-value="emit('update:aggregate', $event)"
      />
    </template>

    <div
      class="as-value-matrix__scroll"
      role="region"
      tabindex="0"
      :aria-label="format.t('detail.matrixRegion', { title })"
    >
      <table class="as-value-matrix">
        <caption class="as-value-matrix__sr-only">
          {{
            title
          }}
        </caption>
        <thead>
          <tr>
            <th scope="col" class="as-value-matrix__corner">{{ format.t('detail.series') }}</th>
            <th v-for="start in columns" :key="start" scope="col">{{ header(start) }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.series.id">
            <th scope="row" class="as-value-matrix__series">
              {{ row.series.label }}
              <span v-if="row.series.unit" class="as-value-matrix__unit"
                >({{ row.series.unit }})</span
              >
            </th>
            <template v-for="start in columns" :key="start">
              <td
                v-if="cell(row, start)"
                class="as-value-matrix__cell"
                :class="`as-value-matrix__cell--${cell(row, start)!.level}`"
                :title="
                  cell(row, start)!.level === 'normal'
                    ? undefined
                    : format.levelName(cell(row, start)!.level)
                "
              >
                {{ cell(row, start)!.text }}
                <span v-if="cell(row, start)!.level !== 'normal'" class="as-value-matrix__sr-only">
                  ,
                  {{
                    format.t('detail.levelName', {
                      level: format.levelName(cell(row, start)!.level).toLowerCase(),
                    })
                  }}
                </span>
              </td>
              <td v-else class="as-value-matrix__cell as-value-matrix__cell--missing">—</td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>

    <ul v-if="legend.length" class="as-value-matrix__legend">
      <li v-for="item in legend" :key="item.level">
        <ASStatusBadge :level="item.level" size="sm" />
        {{ item.text }}
      </li>
    </ul>
  </ASCard>
</template>

<style scoped>
.as-value-matrix__scroll {
  overflow-x: auto;
  border-radius: var(--as-radius-sm, 4px);
}

.as-value-matrix__scroll:focus-visible {
  outline: none;
  box-shadow: var(--as-focus-ring, 0 0 0 2px light-dark(#2563eb, #60a5fa));
}

.as-value-matrix {
  width: max-content;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: var(--as-font-size-xs, 0.75rem);
  font-variant-numeric: tabular-nums;
}

.as-value-matrix th,
.as-value-matrix td {
  height: 30px;
  padding: 4px 8px;
  border-right: 1px solid var(--as-color-border, light-dark(#cbd5e1, #475569));
  border-bottom: 1px solid var(--as-color-border, light-dark(#cbd5e1, #475569));
  text-align: center;
  white-space: nowrap;
}

.as-value-matrix thead th {
  background-color: var(--as-color-surface-muted, light-dark(#f1f5f9, #334155));
  font-weight: var(--as-font-weight-semibold, 600);
}

/* La columna de series queda fija al desplazar en horizontal. */
.as-value-matrix__corner,
.as-value-matrix__series {
  position: sticky;
  left: 0;
  z-index: 1;
  text-align: left !important;
}

.as-value-matrix__series {
  background-color: var(--as-color-surface, light-dark(#ffffff, #1e293b));
  font-weight: var(--as-font-weight-semibold, 600);
}

.as-value-matrix__unit {
  font-weight: var(--as-font-weight-regular, 400);
  color: var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
}

/* Tinte del nivel sobre la superficie, al 40 %: el texto normal sigue por encima de 4.5:1
   en los dos temas (el amarillo en oscuro es el más justo, ~4.8:1). */
.as-value-matrix__cell--amarillo {
  background-color: color-mix(
    in srgb,
    var(--as-alert-amarillo, #ffd54f) 40%,
    var(--as-color-surface, light-dark(#ffffff, #1e293b))
  );
}

.as-value-matrix__cell--naranja {
  background-color: color-mix(
    in srgb,
    var(--as-alert-naranja, #fb8c00) 40%,
    var(--as-color-surface, light-dark(#ffffff, #1e293b))
  );
}

.as-value-matrix__cell--rojo {
  background-color: color-mix(
    in srgb,
    var(--as-alert-rojo, #d32f2f) 40%,
    var(--as-color-surface, light-dark(#ffffff, #1e293b))
  );
  font-weight: var(--as-font-weight-semibold, 600);
}

.as-value-matrix__cell--missing {
  color: var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
}

.as-value-matrix__legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--as-space-2, 8px) var(--as-space-4, 16px);
  margin: var(--as-space-3, 12px) 0 0;
  padding: 0;
  font-size: var(--as-font-size-xs, 0.75rem);
  list-style: none;
}

.as-value-matrix__legend li {
  display: flex;
  gap: var(--as-space-2, 8px);
  align-items: center;
}

.as-value-matrix__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
