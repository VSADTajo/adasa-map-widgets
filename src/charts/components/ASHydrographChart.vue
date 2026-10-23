<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ICONS } from '@/core/icons/icons'
import { useLocale } from '@/core/composables/useLocale'
import { buildHydrograph } from '@/charts/core/hydrograph'
import type {
  ChartExposed,
  ChartToolbarActionEvent,
  ChartToolbarChangeEvent,
  ChartToolbarConfig,
  ChartToolbarItem,
} from '@/charts/types/chart'
import type {
  HydroBand,
  HydroForecast,
  HydrographEmits,
  HydrographProps,
  HydroVariable,
} from '@/charts/types/HydrographProps'
import ASChart from './ASChart.vue'

/**
 * Hidrograma para visores hidrológicos: precipitación arriba (barras con
 * el eje invertido) y caudal o nivel abajo, con el eje temporal compartido.
 * En el panel del caudal admite también caudal de entrada y de salida (en su
 * mismo eje), volumen y nivel (cada uno con su eje), p. ej. para un embalse.
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
 *   :discharge="{
 *     observed: [{ id: 'saih', name: 'Observado', values: caudal }],
 *     forecasts: [{ id: 'eps', name: 'EPS', values: mediana, percentiles }],
 *   }"
 *   :precipitation="{ observed: [{ id: 'saih', name: 'Lluvia', values: lluvia }] }"
 *   :thresholds="[{ value: 120, level: 'naranja' }, { value: 180, level: 'rojo' }]"
 * />
 * ```
 */
const props = withDefaults(defineProps<HydrographProps>(), {
  chartLibrary: 'echarts',
  discharge: undefined,
  magnitude: 'flow',
  inflow: undefined,
  outflow: undefined,
  volume: undefined,
  level: undefined,
  precipitation: undefined,
  precipitationLayout: 'panel',
  precipitationInverted: true,
  precipitationWeight: 0.35,
  thresholds: undefined,
  now: true,
  xAxis: undefined,
  annotations: undefined,
  bands: undefined,
  visibleForecasts: undefined,
  extraSeries: undefined,
  extraYAxes: undefined,
  seriesOverrides: undefined,
  yAxisOverrides: undefined,
  toolbar: undefined,
  fileName: undefined,
  patterns: false,
  description: undefined,
  dataTable: true,
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

const emit = defineEmits<HydrographEmits>()

const { t } = useLocale()

const DEFAULT_BANDS: HydroBand[] = ['p10-p90', 'p25-p75']
/** Ids internos de las acciones propias en la barra (no chocan con los del proyecto). */
const FOCUS = '__as-focus-threshold'
const FORECASTS = '__as-forecasts'
const BANDS = '__as-bands'

// ── Estado de las acciones propias ──
// Funcionan sin que el proyecto haga nada: el estado vive aquí y se emite
// para `v-model`; si el proyecto lo controla, la prop manda.
const sortedThresholds = computed(() =>
  [...(props.thresholds ?? [])].sort((a, b) => a.value - b.value),
)
const focusIndex = ref(-1)
watch(sortedThresholds, () => (focusIndex.value = -1))
const focusedThreshold = computed(() => sortedThresholds.value[focusIndex.value] ?? null)

const bands = ref<HydroBand[]>(props.bands ?? DEFAULT_BANDS)
watch(
  () => props.bands,
  (value) => (bands.value = value ?? DEFAULT_BANDS),
)
/** Últimas bandas visibles, para volver a ellas al mostrar los percentiles. */
let lastBands = bands.value.length ? bands.value : DEFAULT_BANDS

/** Variables en línea (todas menos la precipitación). */
const lineVariables = computed(() =>
  [props.discharge, props.inflow, props.outflow, props.volume, props.level].filter(
    (variable): variable is HydroVariable => Boolean(variable),
  ),
)

/**
 * Fuentes de previsión (id y nombre), en el orden en que llegan, sin
 * repetir: primero las de caudal y lluvia (las que llevan color de fuente).
 */
const sources = computed(() => {
  const all = [
    ...(props.discharge?.forecasts ?? []),
    ...(props.precipitation?.forecasts ?? []),
    ...lineVariables.value.flatMap((variable) => variable.forecasts ?? []),
  ]
  return [...new Map(all.map((f) => [f.id, f.name])).entries()].map(([id, name]) => ({ id, name }))
})
const visible = ref<string[] | undefined>(props.visibleForecasts)
watch(
  () => props.visibleForecasts,
  (value) => (visible.value = value),
)
const visibleIds = computed(() => visible.value ?? sources.value.map((s) => s.id))

const hasPercentiles = computed(() =>
  lineVariables.value
    .flatMap((variable) => variable.forecasts ?? [])
    .some((f) => f.percentiles && Object.values(f.percentiles).some((p) => p?.length)),
)

/**
 * Previsiones filtradas por las visibles. En caudal y lluvia (`sourceColor`),
 * con el color fijado antes de filtrar: el color sigue a la fuente, no a su
 * posición (ocultar una no repinta las demás). En el resto de variables, sus
 * previsiones toman el color de la variable, que no depende del filtro.
 */
function filterForecasts(
  variable: HydroVariable | undefined,
  sourceColor = false,
): HydroVariable | undefined {
  if (!variable?.forecasts) return variable
  const ids = sources.value.map((s) => s.id)
  const colorOf = (f: HydroForecast) =>
    f.style?.color ?? f.color ?? `var(--as-data-cat-${(ids.indexOf(f.id) % 7) + 2})`
  return {
    ...variable,
    forecasts: variable.forecasts
      .filter((f) => visibleIds.value.includes(f.id))
      .map((f) => (sourceColor ? { ...f, style: { ...f.style, color: colorOf(f) } } : f)),
  }
}

// ── Barra ──
const toolbarConfig = computed(() =>
  props.toolbar === undefined || props.toolbar === false
    ? null
    : props.toolbar === true
      ? {}
      : props.toolbar,
)

const builtInItems = computed<ChartToolbarItem[]>(() => {
  const config = toolbarConfig.value
  if (!config) return []
  const items: ChartToolbarItem[] = []
  if ((config.forecastSelector ?? true) && sources.value.length) {
    items.push({
      type: 'select',
      id: FORECASTS,
      label: t('chart.forecasts'),
      icon: ICONS.layers,
      multiple: true,
      selectAll: sources.value.length > 1,
      showCount: true,
      value: visibleIds.value,
      options: sources.value.map((s) => ({ value: s.id, label: s.name })),
    })
  }
  if ((config.bandsToggle ?? true) && hasPercentiles.value) {
    const on = bands.value.length > 0
    items.push({
      type: 'button',
      id: BANDS,
      label: on ? t('chart.hideBands') : t('chart.showBands'),
      icon: ICONS.chartBands,
      pressed: on,
    })
  }
  if ((config.focusThreshold ?? true) && sortedThresholds.value.length) {
    const focused = focusedThreshold.value
    items.push({
      type: 'button',
      id: FOCUS,
      label: focused
        ? t('chart.focusedThreshold', { level: focused.label ?? focused.level })
        : t('chart.focusThreshold'),
      icon: ICONS.focusThreshold,
      pressed: Boolean(focused),
    })
  }
  return items
})

/**
 * La configuración de `ASChart`: sin las claves propias, con los elementos
 * del proyecto primero y después las acciones del hidrograma (las de la
 * librería, descargas y pantalla completa, van a la derecha).
 */
const chartToolbar = computed<boolean | ChartToolbarConfig | undefined>(() => {
  const config = toolbarConfig.value
  if (!config) return props.toolbar as boolean | undefined
  const {
    focusThreshold: _focus,
    forecastSelector: _forecasts,
    bandsToggle: _bands,
    ...rest
  } = config
  return { ...rest, items: [...(rest.items ?? []), ...builtInItems.value] }
})

function onToolbarAction(event: ChartToolbarActionEvent): void {
  if (event.id === FOCUS) {
    const next = focusIndex.value + 1
    focusIndex.value = next < sortedThresholds.value.length ? next : -1
    emit('threshold-focus', focusedThreshold.value)
  } else if (event.id === BANDS) {
    if (bands.value.length) lastBands = bands.value
    bands.value = bands.value.length ? [] : lastBands
    emit('update:bands', bands.value)
  } else {
    emit('toolbar-action', event)
  }
}

function onToolbarChange(event: ChartToolbarChangeEvent): void {
  if (event.id === FORECASTS) {
    visible.value = event.value as string[]
    emit('update:visibleForecasts', visible.value)
  } else {
    emit('toolbar-change', event)
  }
}

const chartProps = computed(() =>
  buildHydrograph(
    {
      ...props,
      discharge: filterForecasts(props.discharge, true),
      precipitation: filterForecasts(props.precipitation, true),
      inflow: filterForecasts(props.inflow),
      outflow: filterForecasts(props.outflow),
      volume: filterForecasts(props.volume),
      level: filterForecasts(props.level),
      bands: bands.value,
      thresholds: focusedThreshold.value ? [focusedThreshold.value] : props.thresholds,
      toolbar: chartToolbar.value,
    },
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
    @toolbar-change="onToolbarChange"
  >
    <template v-if="$slots['toolbar-start']" #toolbar-start><slot name="toolbar-start" /></template>
    <template v-if="$slots['toolbar-end']" #toolbar-end><slot name="toolbar-end" /></template>
  </ASChart>
</template>
