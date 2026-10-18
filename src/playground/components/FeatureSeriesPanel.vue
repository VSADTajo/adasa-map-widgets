<script setup lang="ts">
import { computed } from 'vue'
import ASChart from '@/charts/components/ASChart.vue'
import type { ChartSeries } from '@/charts/types/chart'
import type { FeatureSelectedEvent } from '@/map/types/layers'

/**
 * Serie temporal de la feature seleccionada en el mapa del compositor:
 * ejemplo del patrón "feature-selected → gráfica" y de los grupos de
 * sincronización. Las dos gráficas (caudal y lluvia) comparten cursor,
 * tooltip y zoom (`sync-group`), marcan el instante de los controles de
 * tiempo (`current-time`) y, al hacer clic, lo cambian (`time-select`).
 *
 * Los datos son sintéticos pero estables: salen de la propia feature, así
 * que cada feature tiene "su" serie.
 */
const props = defineProps<{
  feature: FeatureSelectedEvent | null
  /** Instantes de la serie (los mismos que los de los controles de tiempo, para poder enlazarlos). */
  timeline: Date[]
  /** Instante actual de los controles de tiempo, si hay alguno colocado. */
  currentTime?: Date
  chartLibrary: 'echarts' | 'chartjs' | 'apexcharts'
}>()

const emit = defineEmits<{
  'time-select': [time: Date]
}>()

/** Número estable a partir de la feature, para que cada una tenga datos distintos pero repetibles. */
const seed = computed(() => {
  const feature = props.feature
  if (!feature) return 0
  const text = `${feature.layerId}:${JSON.stringify(feature.properties)}:${feature.coordinates.join(',')}`
  let hash = 0
  for (const char of text) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return Math.abs(hash)
})

const title = computed(() => {
  const properties = props.feature?.properties ?? {}
  const name = properties.name ?? properties.nombre ?? properties.id
  return name ? String(name) : `Feature de ${props.feature?.layerId}`
})

const flowSeries = computed<ChartSeries[]>(() => {
  const base = 20 + (seed.value % 60)
  const peak = 40 + (seed.value % 90)
  const peakAt = seed.value % props.timeline.length
  return [
    {
      id: 'flow',
      name: 'Caudal',
      type: 'line',
      showPoints: true,
      data: props.timeline.map((time, index) => [
        time,
        Math.round((base + peak * Math.exp(-(((index - peakAt) / 3) ** 2))) * 10) / 10,
      ]),
    },
  ]
})

const rainSeries = computed<ChartSeries[]>(() => [
  {
    id: 'rain',
    name: 'Precipitación',
    type: 'bar',
    color: 'var(--as-data-cat-3)',
    data: props.timeline.map((time, index) => [
      time,
      Math.round(Math.max(0, 6 * Math.sin((index + (seed.value % 5)) / 2)) * 10) / 10,
    ]),
  },
])

function onTimeSelect(event: { time: Date }): void {
  emit('time-select', event.time)
}
</script>

<template>
  <section class="feature-series" aria-label="Serie temporal de la feature seleccionada">
    <p v-if="!props.feature" class="feature-series__hint">
      Activa una capa vectorial (p. ej. "GeoJSON" en Capas de ejemplo) y pulsa una de sus features
      para ver aquí su serie temporal. Si colocas unos <strong>Controles de tiempo</strong>, la
      gráfica marca su instante y, al hacer clic en ella, lo mueve.
    </p>
    <template v-else>
      <h3 class="feature-series__title">
        {{ title }}
        <span class="feature-series__layer">{{ props.feature.layerId }}</span>
      </h3>
      <ASChart
        :chart-library="props.chartLibrary"
        :series="flowSeries"
        :y-axes="[{ id: 'y', label: 'Caudal', unit: 'm³/s' }]"
        :current-time="props.currentTime"
        sync-group="feature"
        :height="200"
        @time-select="onTimeSelect"
      />
      <ASChart
        :chart-library="props.chartLibrary"
        :series="rainSeries"
        :y-axes="[{ id: 'y', label: 'Precipitación', unit: 'mm' }]"
        :current-time="props.currentTime"
        sync-group="feature"
        :height="150"
        @time-select="onTimeSelect"
      />
    </template>
  </section>
</template>

<style scoped>
.feature-series {
  padding: 12px 16px;
  border: 1px solid var(--pg-border);
  border-radius: 12px;
  background: var(--pg-surface);
}

.feature-series__hint {
  margin: 0;
  font-size: 0.85rem;
  color: var(--pg-text-muted);
}

.feature-series__title {
  margin: 0 0 8px;
  font-size: 0.95rem;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.feature-series__layer {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--pg-text-muted);
}
</style>
