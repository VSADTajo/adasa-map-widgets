<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ICONS } from '@/core/icons/icons'
import { useLocale } from '@/core/composables/useLocale'
import { buildPrecipitation } from '@/charts/core/precipitationChart'
import type {
  ChartExposed,
  ChartToolbarActionEvent,
  ChartToolbarConfig,
  ChartToolbarItem,
} from '@/charts/types/chart'
import type { PrecipitationEmits, PrecipitationProps } from '@/charts/types/PrecipitationProps'
import ASChart from './ASChart.vue'

/**
 * Gráfica de precipitación: series observadas (telemetría, precipitación
 * areal...) y previstas (WRF, ECMWF...) en intensidad (mm/h) o en mm por
 * intervalo, con el acumulado de cada serie que lo pida en el eje derecho.
 * Cada serie dice cómo llegan sus valores (`input`) y la gráfica los
 * convierte a lo que muestra (`rate`); el acumulado de una previsión
 * continúa el observado.
 *
 * Por defecto el tooltip solo da la fecha y los valores van en la leyenda;
 * con `toolbar`, un botón muestra u oculta los acumulados
 * (`v-model:show-cumulative`). Es una configuración de `ASChart`: funciona
 * con los tres motores y acepta sus mismos props de zoom, exportación...
 *
 * @example
 * ```vue
 * <ASPrecipitationChart
 *   toolbar
 *   :series="[
 *     { id: 'tr', name: 'P. TR', values: telemetria, input: 'intensity', cumulative: true },
 *     { id: 'wrf', name: 'WRF', kind: 'forecast', values: wrf, cumulative: true },
 *   ]"
 * />
 * ```
 */
const props = withDefaults(defineProps<PrecipitationProps>(), {
  chartLibrary: 'echarts',
  rate: 'intensity',
  showCumulative: undefined,
  thresholds: undefined,
  now: true,
  xAxis: undefined,
  annotations: undefined,
  seriesOverrides: undefined,
  yAxisOverrides: undefined,
  toolbar: undefined,
  fileName: undefined,
  patterns: false,
  description: undefined,
  dataTable: true,
  currentTime: undefined,
  syncGroup: undefined,
  tooltip: 'time',
  legend: 'bottom',
  legendValues: true,
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

const emit = defineEmits<PrecipitationEmits>()
const { t } = useLocale()

/** Id interno del botón de los acumulados (no choca con los del proyecto). */
const CUMULATIVE = '__as-cumulative'

// Funciona sin que el proyecto haga nada: el estado vive aquí y se emite
// para `v-model`; si el proyecto lo controla, la prop manda.
const showCumulative = ref(props.showCumulative ?? true)
watch(
  () => props.showCumulative,
  (value) => (showCumulative.value = value ?? true),
)

const hasCumulative = computed(() => props.series.some((series) => series.cumulative))

const toolbarConfig = computed(() =>
  props.toolbar === undefined || props.toolbar === false
    ? null
    : props.toolbar === true
      ? {}
      : props.toolbar,
)

/** La barra de `ASChart`: los elementos del proyecto y después el botón de los acumulados. */
const chartToolbar = computed<boolean | ChartToolbarConfig | undefined>(() => {
  const config = toolbarConfig.value
  if (!config) return props.toolbar as boolean | undefined
  const { cumulativeToggle, ...rest } = config
  const builtIn: ChartToolbarItem[] =
    (cumulativeToggle ?? true) && hasCumulative.value
      ? [
          {
            type: 'button',
            id: CUMULATIVE,
            label: showCumulative.value
              ? t('precipitation.hideCumulative')
              : t('precipitation.showCumulative'),
            icon: ICONS.cumulative,
            pressed: showCumulative.value,
          },
        ]
      : []
  return { ...rest, items: [...(rest.items ?? []), ...builtIn] }
})

function onToolbarAction(event: ChartToolbarActionEvent): void {
  if (event.id === CUMULATIVE) {
    showCumulative.value = !showCumulative.value
    emit('update:showCumulative', showCumulative.value)
  } else {
    emit('toolbar-action', event)
  }
}

const chartProps = computed(() =>
  buildPrecipitation(
    { ...props, showCumulative: showCumulative.value, toolbar: chartToolbar.value },
    t,
  ),
)
const chart = ref<InstanceType<typeof ASChart> | null>(null)

/** Los mismos métodos que `ASChart` (exportar imagen y datos, pantalla completa...). */
const exposed: ChartExposed = {
  exportImage: (format) => chart.value?.exportImage(format) ?? Promise.resolve(''),
  exportData: (options) => chart.value?.exportData(options) ?? '',
  download: (format) => chart.value?.download(format) ?? Promise.resolve(),
  toggleFullscreen: () => chart.value?.toggleFullscreen() ?? Promise.resolve(),
  resetZoom: () => chart.value?.resetZoom(),
  getInstance: () => chart.value?.getInstance(),
  refresh: () => chart.value?.refresh(),
}
defineExpose(exposed)
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
    @toolbar-action="onToolbarAction"
    @toolbar-change="emit('toolbar-change', $event)"
  >
    <template v-if="$slots['toolbar-start']" #toolbar-start><slot name="toolbar-start" /></template>
    <template v-if="$slots['toolbar-end']" #toolbar-end><slot name="toolbar-end" /></template>
  </ASChart>
</template>
