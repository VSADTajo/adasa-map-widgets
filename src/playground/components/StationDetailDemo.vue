<script setup lang="ts">
import { computed, ref } from 'vue'
import ASHydrographChart from '@/charts/components/ASHydrographChart.vue'
import ASCard from '@/detail/components/ASCard.vue'
import ASDetailHeader from '@/detail/components/ASDetailHeader.vue'
import ASAlertStatus from '@/detail/components/ASAlertStatus.vue'
import ASObservedSummary from '@/detail/components/ASObservedSummary.vue'
import ASThresholdSummary from '@/detail/components/ASThresholdSummary.vue'
import ASValueMatrix from '@/detail/components/ASValueMatrix.vue'
import ASThresholdLegend from '@/detail/components/ASThresholdLegend.vue'
import type { AggregateKind, ExceededLevel } from '@/detail/types/hydro'
import { exampleDischarge, examplePrecipitation, exampleThresholds } from '../utils/chartExamples'
import {
  DEMO_FORECASTS,
  DEMO_OBSERVED,
  DEMO_PERCENTILES,
  DEMO_TAGS,
  DEMO_THRESHOLDS,
} from '../utils/detailExample'

/**
 * Ficha de estación de ejemplo para el playground: la cabecera, las tarjetas
 * del dominio `detail` y el hidrograma, como el panel de estación de TAJO.
 * Pulsar un umbral de la leyenda lo resalta en el hidrograma.
 */
const props = defineProps<{ loading?: boolean; theme?: 'light' | 'dark' }>()
const emit = defineEmits<{
  close: []
  'update:selectedThreshold': [level: ExceededLevel | null]
}>()

const selected = ref<ExceededLevel | null>(null)
const aggregate = ref<AggregateKind>('max')

function select(level: ExceededLevel | null): void {
  selected.value = level
  emit('update:selectedThreshold', level)
}

/** Con un umbral resaltado, el hidrograma solo dibuja ese. */
const chartThresholds = computed(() =>
  selected.value ? exampleThresholds.filter((t) => t.level === selected.value) : exampleThresholds,
)
</script>

<template>
  <article class="demo-station">
    <ASDetailHeader
      title="3E01"
      subtitle="Tajo en Aranjuez"
      :tags="DEMO_TAGS"
      :loading="props.loading"
      @close="emit('close')"
    />
    <div class="demo-station__body">
      <div class="demo-station__row">
        <ASAlertStatus
          :series="[DEMO_OBSERVED]"
          :thresholds="DEMO_THRESHOLDS"
          :loading="props.loading"
          :theme="props.theme"
        />
        <ASAlertStatus
          :series="DEMO_FORECASTS"
          :thresholds="DEMO_THRESHOLDS"
          mode="max"
          :loading="props.loading"
          :theme="props.theme"
        />
        <ASObservedSummary
          :series="[DEMO_OBSERVED]"
          :thresholds="DEMO_THRESHOLDS"
          :loading="props.loading"
          :theme="props.theme"
        />
        <ASThresholdSummary
          :series="DEMO_FORECASTS"
          :thresholds="DEMO_THRESHOLDS"
          mode="forecast"
          :loading="props.loading"
          :theme="props.theme"
        />
      </div>

      <ASThresholdLegend
        :thresholds="DEMO_THRESHOLDS"
        unit="m³/s"
        :selected="selected"
        :loading="props.loading"
        :theme="props.theme"
        @update:selected="select"
      />

      <ASCard title="Hidrograma" :theme="props.theme">
        <ASHydrographChart
          :discharge="exampleDischarge"
          :precipitation="examplePrecipitation"
          :thresholds="chartThresholds"
          :loading="props.loading"
          :theme="props.theme"
          :height="360"
        />
      </ASCard>

      <ASValueMatrix
        v-model:aggregate="aggregate"
        :series="[DEMO_OBSERVED, ...DEMO_FORECASTS, ...DEMO_PERCENTILES]"
        :thresholds="DEMO_THRESHOLDS"
        :days="4"
        :loading="props.loading"
        :theme="props.theme"
      />
    </div>
  </article>
</template>

<style scoped>
.demo-station {
  display: flex;
  flex-direction: column;
  max-height: 760px;
  overflow-y: auto;
  border-radius: var(--as-radius-sm, 4px);
  background-color: var(--as-app-panel-bg, light-dark(#e7e7e7, #212121));
}

.demo-station__body {
  display: flex;
  flex-direction: column;
  gap: var(--as-space-3, 12px);
  padding: var(--as-space-3, 12px);
}

.demo-station__row {
  display: grid;
  align-items: start;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--as-space-3, 12px);
}
</style>
