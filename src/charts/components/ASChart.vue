<script lang="ts">
/** Contador para ids únicos (`useId` llega en Vue 3.5 y la librería admite 3.4). */
let instanceCount = 0
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useSlots } from 'vue'
import { ICONS } from '@/core/icons/icons'
import { useLocale } from '@/core/composables/useLocale'
import ASButton from '@/forms/components/ASButton.vue'
import ASIconButton from '@/forms/components/ASIconButton.vue'
import ASMenu from '@/forms/components/ASMenu.vue'
import type { MenuItem } from '@/forms/types/MenuProps'
import ChartToolbarItems from './ChartToolbarItems.vue'
import { useChart } from '@/charts/core/useChart'
import { chartDataTable } from '@/charts/core/data'
import { chartAnnouncement, chartAriaLabel, chartDescription } from '@/charts/core/describe'
import type {
  ChartEmits,
  ChartExposed,
  ChartImageFormat,
  ChartProps,
  ChartToolbarItem,
} from '@/charts/types/chart'

/**
 * Gráfica cartesiana (líneas, barras, áreas, bandas y dispersión sobre un
 * eje X temporal, numérico o de categorías), con el mismo API para tres
 * motores: ECharts (por defecto), Chart.js y ApexCharts. Igual que `ASMap`
 * con Leaflet/MapLibre, el motor se elige con `chart-library` y se carga
 * bajo demanda; ninguno es dependencia obligatoria.
 *
 * Todo se ajusta por props: de 1 a 4 ejes Y, paneles apilados con el eje X
 * compartido, umbrales e instantes como anotaciones, línea "ahora",
 * tooltip, leyenda, zoom y barra de herramientas (PNG, SVG, CSV, pantalla
 * completa). Colores, textos y formatos salen de los tokens del tema y del
 * idioma activo (`provideTheme` / `provideLocale`).
 *
 * Accesible sin configurar nada: nombre y descripción generados (tipo,
 * series, rangos), recorrido con el teclado (flechas, Inicio/Fin, Intro),
 * tabla de datos para lectores de pantalla y tramas opcionales (`patterns`).
 *
 * @example
 * ```vue
 * <ASChart
 *   :series="[{ id: 'q', name: 'Caudal', type: 'line', data: caudal }]"
 *   :y-axes="[{ id: 'q', unit: 'm³/s', label: 'Caudal' }]"
 *   :annotations="{ y: [{ value: 120, label: 'Umbral rojo', level: 'rojo' }] }"
 *   now
 *   toolbar
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
  fileName: undefined,
  patterns: false,
  height: 320,
  animation: true,
  loading: false,
  emptyText: undefined,
  error: undefined,
  theme: undefined,
  ariaLabel: undefined,
  description: undefined,
  dataTable: true,
  nativeOptions: undefined,
})

const emit = defineEmits<ChartEmits>()

const { t, intlLocale } = useLocale()
const root = ref<HTMLElement | null>(null)
const canvas = ref<HTMLElement | null>(null)
const {
  spec,
  theme,
  loadError,
  refresh,
  exportImage,
  exportData,
  getInstance,
  resetZoom,
  moveCursor,
  selectX,
} = useChart(props, root, canvas, emit)

const id = `as-chart-${++instanceCount}`

// ── Pantalla completa ──
const fullscreenSupported = ref(false)
const isFullscreen = ref(false)
const onFullscreenChange = () => {
  isFullscreen.value = Boolean(root.value) && document.fullscreenElement === root.value
}
onMounted(() => {
  fullscreenSupported.value = Boolean(document.fullscreenEnabled)
  document.addEventListener('fullscreenchange', onFullscreenChange)
})
onBeforeUnmount(() => document.removeEventListener('fullscreenchange', onFullscreenChange))

async function toggleFullscreen(): Promise<void> {
  if (isFullscreen.value) await document.exitFullscreen()
  else await root.value?.requestFullscreen()
}

// ── Barra de herramientas ──
const slots = useSlots()

/** Acciones visibles (por defecto, solo "Restablecer zoom" con zoom) y elementos propios. */
const toolbarActions = computed(() => {
  const hasZoom = Boolean(props.zoom)
  const none = {
    png: false,
    svg: false,
    csv: false,
    resetZoom: false,
    fullscreen: false,
    downloadMenu: true,
    items: [] as ChartToolbarItem[],
  }
  if (props.toolbar === false) return none
  if (props.toolbar === undefined) return { ...none, resetZoom: hasZoom }
  const config = props.toolbar === true ? {} : props.toolbar
  return {
    png: config.png ?? config.download ?? true,
    svg: config.svg ?? true,
    csv: config.csv ?? true,
    resetZoom: (config.resetZoom ?? true) && hasZoom,
    fullscreen: (config.fullscreen ?? true) && fullscreenSupported.value,
    downloadMenu: config.downloadMenu ?? true,
    items: config.items ?? [],
  }
})
const hasDownloads = computed(
  () => toolbarActions.value.png || toolbarActions.value.svg || toolbarActions.value.csv,
)
/** Descargas visibles, como opciones del menú (o un botón cada una con `downloadMenu: false`). */
const downloadItems = computed<MenuItem[]>(() =>
  (
    [
      ['png', t('chart.downloadPng')],
      ['svg', t('chart.downloadSvg')],
      ['csv', t('chart.downloadCsv')],
    ] as const
  )
    .filter(([format]) => toolbarActions.value[format])
    .map(([id, label]) => ({ id, label })),
)
const showToolbar = computed(
  () =>
    props.toolbar !== false &&
    (toolbarActions.value.resetZoom ||
      hasDownloads.value ||
      toolbarActions.value.fullscreen ||
      toolbarActions.value.items.length > 0 ||
      Boolean(slots['toolbar-start'] || slots['toolbar-end'])),
)

async function download(format: ChartImageFormat | 'csv'): Promise<void> {
  let url: string
  if (format === 'csv') {
    // Con BOM: sin él, Excel abre el UTF-8 como ANSI y estropea tildes y "m³/s".
    const blob = new Blob(['﻿', exportData()], { type: 'text/csv;charset=utf-8' })
    url = URL.createObjectURL(blob)
  } else {
    url = await exportImage(format)
  }
  if (!url) return
  const link = document.createElement('a')
  link.href = url
  link.download = `${props.fileName ?? t('chart.fileName')}.${format}`
  link.click()
  if (format === 'csv') setTimeout(() => URL.revokeObjectURL(url))
}

// ── Estado ──
const isEmpty = computed(() => props.series.every((series) => series.data.length === 0))
const message = computed(() => {
  if (props.error) return props.error
  if (loadError.value) return loadError.value
  if (props.loading) return t('chart.loading')
  if (isEmpty.value) return props.emptyText ?? t('chart.empty')
  return null
})
const heightStyle = computed(() => {
  if (isFullscreen.value) return '100%'
  return typeof props.height === 'number' ? `${props.height}px` : props.height
})

// ── Accesibilidad ──
const label = computed(() => props.ariaLabel ?? chartAriaLabel(props.series, intlLocale.value, t))
const description = computed(
  () => props.description ?? (spec.value ? chartDescription(spec.value, t) : ''),
)
/** Todos los datos en filas: base de la tabla alternativa y del recorrido con el teclado. */
const dataModel = computed(() => (spec.value ? chartDataTable(spec.value, t) : null))

/** Con muchos puntos, la tabla se recorta: un lector de pantalla no recorre 10 000 filas. */
const MAX_TABLE_ROWS = 500
const table = computed(() => {
  const model = dataModel.value
  const current = spec.value
  if (!props.dataTable || !model || !current || !model.rows.length) return null
  return {
    caption: t('chart.dataTable', { label: label.value }),
    truncated:
      model.rows.length > MAX_TABLE_ROWS
        ? t('chart.dataTruncated', { shown: MAX_TABLE_ROWS, total: model.rows.length })
        : null,
    headers: [
      model.xLabel,
      ...model.columns.map((column) =>
        column.unit ? `${column.label} (${column.unit})` : column.label,
      ),
    ],
    rows: model.rows.slice(0, MAX_TABLE_ROWS).map((row) => ({
      key: String(row.x),
      x: current.xAxis.formatTooltip(row.x),
      values: row.values.map((value, index) =>
        current.yAxes[model.columns[index]!.yAxisIndex]!.formatValue(value),
      ),
    })),
  }
})

// Teclado: las flechas recorren los valores de X, como si se moviera el ratón.
const cursorIndex = ref<number | null>(null)
const announcement = ref('')
const PAGE = 10

function onKeydown(event: KeyboardEvent): void {
  const xs = dataModel.value?.rows.map((row) => row.x) ?? []
  if (!xs.length || !spec.value) return
  const last = xs.length - 1
  const current = cursorIndex.value
  let next: number
  switch (event.key) {
    case 'ArrowRight':
      next = current === null ? 0 : Math.min(current + 1, last)
      break
    case 'ArrowLeft':
      next = current === null ? last : Math.max(current - 1, 0)
      break
    case 'PageDown':
      next = Math.min((current ?? -1) + PAGE, last)
      break
    case 'PageUp':
      next = Math.max((current ?? last + 1) - PAGE, 0)
      break
    case 'Home':
      next = 0
      break
    case 'End':
      next = last
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      if (current !== null) selectX(xs[current]!)
      return
    case 'Escape':
      clearCursor()
      return
    default:
      return
  }
  event.preventDefault()
  cursorIndex.value = next
  moveCursor(xs[next]!)
  announcement.value = chartAnnouncement(spec.value, xs[next]!, t)
}

function clearCursor(): void {
  if (cursorIndex.value === null) return
  cursorIndex.value = null
  announcement.value = ''
  moveCursor(null)
}

const exposed: ChartExposed = {
  exportImage,
  exportData,
  download,
  toggleFullscreen,
  resetZoom,
  getInstance,
  refresh,
}
defineExpose(exposed)
</script>

<template>
  <div
    ref="root"
    class="as-chart"
    :class="[theme ? `as-${theme}` : undefined, { 'as-chart--fullscreen': isFullscreen }]"
    :style="{ height: heightStyle }"
    role="figure"
    :aria-label="label"
    :aria-describedby="description ? `${id}-description` : undefined"
    :aria-busy="props.loading || undefined"
  >
    <div v-if="showToolbar" class="as-chart__toolbar" role="group" :aria-label="t('chart.toolbar')">
      <div class="as-chart__toolbar-start">
        <slot name="toolbar-start" />
        <ChartToolbarItems
          v-if="toolbarActions.items.length"
          :items="toolbarActions.items"
          @action="emit('toolbar-action', $event)"
          @change="emit('toolbar-change', $event)"
        />
      </div>
      <div class="as-chart__toolbar-end">
        <slot name="toolbar-end" />
        <ASIconButton
          v-if="toolbarActions.resetZoom"
          :icon="ICONS.zoomReset"
          :label="t('chart.resetZoom')"
          size="sm"
          @click="resetZoom()"
        />
        <ASMenu
          v-if="hasDownloads && toolbarActions.downloadMenu"
          :label="t('chart.downloadMenu')"
          :icon="ICONS.download"
          icon-only
          size="sm"
          align="end"
          :items="downloadItems"
          @select="download($event.id as ChartImageFormat | 'csv')"
        />
        <template v-else-if="hasDownloads">
          <ASButton
            v-for="item in downloadItems"
            :key="item.id"
            variant="ghost"
            size="sm"
            :icon="ICONS.download"
            :aria-label="item.label"
            :title="item.label"
            @click="download(item.id as ChartImageFormat | 'csv')"
          >
            {{ item.id.toUpperCase() }}
          </ASButton>
        </template>
        <ASIconButton
          v-if="toolbarActions.fullscreen"
          :icon="isFullscreen ? ICONS.fullscreenExit : ICONS.fullscreen"
          :label="isFullscreen ? t('chart.exitFullscreen') : t('chart.fullscreen')"
          size="sm"
          @click="toggleFullscreen"
        />
      </div>
    </div>
    <!--
      Área de datos: con el foco, las flechas mueven el cursor (role="application"
      para que el lector de pantalla deje pasar las teclas en vez de usarlas él).
    -->
    <div
      class="as-chart__body"
      :role="message ? undefined : 'application'"
      :tabindex="message ? undefined : 0"
      :aria-label="message ? undefined : t('chart.plotArea')"
      :aria-describedby="message ? undefined : `${id}-keys`"
      @keydown="onKeydown"
      @blur="clearCursor"
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

    <!-- Solo para lectores de pantalla. -->
    <p v-if="description" :id="`${id}-description`" class="as-chart__sr">{{ description }}</p>
    <p :id="`${id}-keys`" class="as-chart__sr">{{ t('chart.keyboardHelp') }}</p>
    <div class="as-chart__sr" aria-live="polite" aria-atomic="true">{{ announcement }}</div>
    <!--
      La tabla va dentro de un div oculto: una <table> crece hasta su contenido
      aunque se le dé 1 px y overflow: hidden, y desbordaría el contenedor.
    -->
    <div v-if="table && !message" class="as-chart__sr">
      <table>
        <caption>
          {{
            table.caption
          }}
          <template v-if="table.truncated"> {{ table.truncated }}</template>
        </caption>
        <thead>
          <tr>
            <th v-for="header in table.headers" :key="header" scope="col">{{ header }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in table.rows" :key="row.key">
            <th scope="row">{{ row.x }}</th>
            <td v-for="(value, index) in row.values" :key="index">{{ value }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.as-chart {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
  font-family: var(--as-font-family, system-ui, sans-serif);
  color: var(--as-color-text, light-dark(#0f172a, #f1f5f9));
}

.as-chart--fullscreen {
  padding: var(--as-space-4, 16px);
  background: var(--as-color-surface, light-dark(#ffffff, #1e293b));
}

/* Los elementos del proyecto a la izquierda y los de la librería a la derecha;
   si no caben, pasan a otra línea. */
.as-chart__toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: var(--as-space-2, 8px);
  padding-bottom: var(--as-space-1, 4px);
}

.as-chart__toolbar-start,
.as-chart__toolbar-end {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--as-space-1, 4px);
}

.as-chart__toolbar-end {
  margin-left: auto;
}

.as-chart__body:focus-visible {
  outline: none;
  box-shadow: var(--as-focus-ring, 0 0 0 2px #2563eb);
}

.as-chart__body {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  border-radius: var(--as-radius-sm, 4px);
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
  color: var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
}

.as-chart__message--error {
  color: var(--as-color-danger, light-dark(#dc2626, #f87171));
}

/* Oculto a la vista, pero no a los lectores de pantalla. */
.as-chart__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
</style>
