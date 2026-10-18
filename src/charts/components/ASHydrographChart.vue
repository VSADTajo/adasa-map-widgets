<script setup lang="ts">
import { computed, ref } from 'vue'
import { useLocale } from '@/core/composables/useLocale'
import { buildHydrograph } from '@/charts/core/hydrograph'
import type { ChartEmits } from '@/charts/types/chart'
import type { HydrographProps } from '@/charts/types/HydrographProps'
import ASChart from './ASChart.vue'

/**
 * Hidrograma para visores hidrológicos: precipitación arriba (barras con
 * el eje invertido) y caudal o nivel abajo, con el eje temporal compartido.
 * Distingue observado (sólido) de previsto (discontinuo) con una línea
 * "ahora", admite varias fuentes de previsión (p. ej. Harmonie, EPS) con
 * bandas de incertidumbre por percentiles, y marca los umbrales de aviso
 * del punto de control.
 *
 * Es una configuración de `ASChart`: funciona con los tres motores
 * (`chart-library`) y acepta sus mismos props de tooltip, leyenda, zoom...
 *
 * @example
 * ```vue
 * <ASHydrographChart
 *   :discharge="{ observed: caudal, forecasts: [{ id: 'eps', name: 'EPS', values: mediana, percentiles }] }"
 *   :precipitation="{ observed: lluvia }"
 *   :thresholds="[{ value: 120, level: 'naranja' }, { value: 180, level: 'rojo' }]"
 * />
 * ```
 */
const props = withDefaults(defineProps<HydrographProps>(), {
  chartLibrary: 'echarts',
  magnitude: 'flow',
  precipitation: undefined,
  precipitationLayout: 'panel',
  precipitationInverted: true,
  precipitationWeight: 0.35,
  thresholds: undefined,
  now: undefined,
  bands: undefined,
  extraSeries: undefined,
  extraYAxes: undefined,
  seriesOverrides: undefined,
  yAxisOverrides: undefined,
  toolbar: undefined,
  currentTime: undefined,
  syncGroup: undefined,
  tooltip: true,
  legend: undefined,
  legendValues: false,
  zoom: false,
  height: 420,
  animation: true,
  loading: false,
  emptyText: undefined,
  error: undefined,
  theme: undefined,
  ariaLabel: undefined,
  nativeOptions: undefined,
})

const emit = defineEmits<ChartEmits>()

const { t } = useLocale()
const chartProps = computed(() => buildHydrograph(props, t))
const chart = ref<InstanceType<typeof ASChart> | null>(null)

defineExpose({
  /** PNG del hidrograma como data URL. */
  exportImage: () => chart.value?.exportImage() ?? Promise.resolve(''),
  /** Objeto(s) nativo(s) del motor. */
  getInstance: () => chart.value?.getInstance(),
  /** Vuelve al rango de tiempo completo tras un zoom. */
  resetZoom: () => chart.value?.resetZoom(),
})
</script>

<template>
  <ASChart
    ref="chart"
    v-bind="chartProps"
    @point-click="emit('point-click', $event)"
    @x-click="emit('x-click', $event)"
    @range-change="emit('range-change', $event)"
    @ready="emit('ready', $event)"
    @time-select="emit('time-select', $event)"
    @update:current-time="emit('update:currentTime', $event)"
  />
</template>
