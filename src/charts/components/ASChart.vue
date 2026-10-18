<script setup lang="ts">
import { computed, ref } from 'vue'
import { useLocale } from '@/core/composables/useLocale'
import { useChart } from '@/charts/core/useChart'
import type { ChartEmits, ChartProps } from '@/charts/types/chart'

/**
 * Gráfica cartesiana (líneas, barras, áreas, bandas y dispersión sobre un
 * eje X temporal, numérico o de categorías), con el mismo API para tres
 * motores: ECharts (por defecto), Chart.js y ApexCharts. Igual que `ASMap`
 * con Leaflet/MapLibre, el motor se elige con `chart-library` y se carga
 * bajo demanda; ninguno es dependencia obligatoria.
 *
 * Todo se ajusta por props: de 1 a 4 ejes Y, paneles apilados con el eje X
 * compartido, umbrales e instantes como anotaciones, línea "ahora",
 * tooltip, leyenda y zoom. Colores, textos y formatos salen de los tokens
 * del tema y del idioma activo (`provideTheme` / `provideLocale`).
 *
 * @example
 * ```vue
 * <ASChart
 *   :series="[{ id: 'q', name: 'Caudal', type: 'line', data: caudal }]"
 *   :y-axes="[{ id: 'q', unit: 'm³/s', label: 'Caudal' }]"
 *   :annotations="{ y: [{ value: 120, label: 'Umbral rojo', level: 'rojo' }] }"
 *   now
 * />
 * ```
 */
const props = withDefaults(defineProps<ChartProps>(), {
  chartLibrary: 'echarts',
  xAxis: undefined,
  yAxes: undefined,
  panels: undefined,
  annotations: undefined,
  now: false,
  tooltip: true,
  legend: undefined,
  zoom: false,
  height: 320,
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
const root = ref<HTMLElement | null>(null)
const canvas = ref<HTMLElement | null>(null)
const { theme, loadError, refresh, exportImage, getInstance } = useChart(props, root, canvas, emit)

const isEmpty = computed(() => props.series.every((series) => series.data.length === 0))
const message = computed(() => {
  if (props.error) return props.error
  if (loadError.value) return loadError.value
  if (props.loading) return t('chart.loading')
  if (isEmpty.value) return props.emptyText ?? t('chart.empty')
  return null
})
const label = computed(
  () =>
    props.ariaLabel ??
    t('chart.ariaLabel', { series: props.series.map((series) => series.name).join(', ') }),
)
const heightStyle = computed(() =>
  typeof props.height === 'number' ? `${props.height}px` : props.height,
)

defineExpose({
  /** PNG de la gráfica como data URL. */
  exportImage,
  /** Objeto nativo del motor (instancia de ECharts, Chart.js o ApexCharts). */
  getInstance,
  /** Vuelve a leer los colores del tema, si cambió por una vía distinta de `provideTheme`. */
  refresh,
})
</script>

<template>
  <div
    ref="root"
    class="as-chart"
    :class="theme ? `as-${theme}` : undefined"
    :style="{ height: heightStyle }"
    role="img"
    :aria-label="label"
    :aria-busy="props.loading || undefined"
  >
    <div ref="canvas" class="as-chart__canvas" :class="{ 'as-chart__canvas--hidden': message }" />
    <div
      v-if="message"
      class="as-chart__message"
      :class="{ 'as-chart__message--error': props.error || loadError }"
    >
      {{ message }}
    </div>
  </div>
</template>

<style scoped>
.as-chart {
  position: relative;
  width: 100%;
  font-family: var(--as-font-family, system-ui, sans-serif);
  color: var(--as-color-text, #0f172a);
}

.as-chart__canvas {
  position: absolute;
  inset: 0;
}

.as-chart__canvas--hidden {
  visibility: hidden;
}

.as-chart__message {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: var(--as-space-4, 16px);
  text-align: center;
  font-size: var(--as-font-size-sm, 0.875rem);
  color: var(--as-color-text-muted, #64748b);
}

.as-chart__message--error {
  color: var(--as-color-danger, #dc2626);
}
</style>
