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
  currentTime: undefined,
  syncGroup: undefined,
  tooltip: true,
  legend: undefined,
  legendValues: false,
  zoom: false,
  toolbar: undefined,
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
const { theme, loadError, refresh, exportImage, getInstance, resetZoom } = useChart(
  props,
  root,
  canvas,
  emit,
)

/** Acciones visibles de la barra de herramientas (por defecto, solo "Restablecer zoom" con zoom). */
const toolbarActions = computed(() => {
  const hasZoom = Boolean(props.zoom)
  const toolbar = props.toolbar
  if (toolbar === false) return { download: false, resetZoom: false }
  if (toolbar === undefined) return { download: false, resetZoom: hasZoom }
  if (toolbar === true) return { download: true, resetZoom: hasZoom }
  return { download: toolbar.download ?? true, resetZoom: (toolbar.resetZoom ?? true) && hasZoom }
})
const showToolbar = computed(() => toolbarActions.value.download || toolbarActions.value.resetZoom)

async function download(): Promise<void> {
  const url = await exportImage()
  if (!url) return
  const link = document.createElement('a')
  link.href = url
  link.download = `${t('chart.fileName')}.png`
  link.click()
}

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
  /** Vuelve al rango X completo tras un zoom. */
  resetZoom,
})
</script>

<template>
  <div
    ref="root"
    class="as-chart"
    :class="theme ? `as-${theme}` : undefined"
    :style="{ height: heightStyle }"
    role="figure"
    :aria-label="label"
    :aria-busy="props.loading || undefined"
  >
    <div
      v-if="showToolbar"
      class="as-chart__toolbar"
      role="toolbar"
      :aria-label="t('chart.toolbar')"
    >
      <button
        v-if="toolbarActions.resetZoom"
        type="button"
        class="as-chart__tool"
        @click="resetZoom()"
      >
        {{ t('chart.resetZoom') }}
      </button>
      <button v-if="toolbarActions.download" type="button" class="as-chart__tool" @click="download">
        {{ t('chart.download') }}
      </button>
    </div>
    <div class="as-chart__body">
      <div ref="canvas" class="as-chart__canvas" :class="{ 'as-chart__canvas--hidden': message }" />
      <div
        v-if="message"
        class="as-chart__message"
        :class="{ 'as-chart__message--error': props.error || loadError }"
      >
        {{ message }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.as-chart {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  font-family: var(--as-font-family, system-ui, sans-serif);
  color: var(--as-color-text, #0f172a);
}

.as-chart__toolbar {
  display: flex;
  justify-content: flex-end;
  gap: var(--as-space-2, 8px);
  padding-bottom: var(--as-space-1, 4px);
}

.as-chart__tool {
  padding: 2px 10px;
  border: 1px solid var(--as-color-border, #cbd5e1);
  border-radius: var(--as-radius-sm, 4px);
  background: var(--as-color-surface, #ffffff);
  color: var(--as-color-text, #0f172a);
  font: inherit;
  font-size: var(--as-font-size-xs, 0.75rem);
  cursor: pointer;
}

.as-chart__tool:hover {
  background: var(--as-color-surface-muted, #f1f5f9);
}

.as-chart__tool:focus-visible {
  outline: none;
  box-shadow: var(--as-focus-ring, 0 0 0 2px #2563eb);
}

.as-chart__body {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
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
