<script setup lang="ts">
import { computed, ref } from 'vue'
import ASHydrographChart from '@/charts/components/ASHydrographChart.vue'
import type {
  ChartLibrary,
  ChartToolbarActionEvent,
  ChartToolbarChangeEvent,
  ChartToolbarItem,
} from '@/charts/types/chart'
import type { HydroBand, HydroThreshold } from '@/charts/types/HydrographProps'
import { useLocale } from '@/core/composables/useLocale'
import { ICONS } from '@/core/icons/icons'
import {
  EXAMPLE_NOW,
  exampleDischarge,
  examplePrecipitation,
  exampleThresholds,
} from '../utils/chartExamples'

/**
 * Ejemplo para el playground: un hidrograma con la barra de herramientas de
 * un visor de embalses (la de un proyecto real, hecha antes a mano sobre
 * ApexCharts): simulación elegida, datos de la avenida, fuente de la lluvia,
 * y las acciones propias del hidrograma (previsiones, percentiles y enfocar
 * umbral) más las descargas.
 */
const props = defineProps<{ chartLibrary?: ChartLibrary; theme?: 'light' | 'dark' }>()
const emit = defineEmits<{
  'toolbar-action': [event: ChartToolbarActionEvent]
  'toolbar-change': [event: ChartToolbarChangeEvent]
  'update:visibleForecasts': [ids: string[]]
  'update:bands': [bands: HydroBand[]]
  'threshold-focus': [threshold: HydroThreshold | null]
}>()

const { formatDate } = useLocale()

/** Simulaciones de ejemplo: la más reciente y dos anteriores, cada 6 h. */
const SIMULATIONS = [0, 6, 12].map((hours) => new Date(EXAMPLE_NOW.getTime() - hours * 3_600_000))
const simulation = ref(0)
const rainSource = ref('harmonie')

/** Datos de la avenida prevista (máximo y volumen) con la previsión de la lluvia elegida. */
const flood = computed(() => {
  const forecast = exampleDischarge.forecasts!.find((f) => f.id === rainSource.value)!
  const values = (forecast.values ?? []).map(([, value]) => value ?? 0)
  const peak = Math.max(...values)
  // m³/s cada hora → hm³.
  const volume = (values.reduce((sum, value) => sum + value, 0) * 3600) / 1e6
  return { peak, volume }
})

const items = computed<ChartToolbarItem[]>(() => [
  {
    type: 'button',
    id: 'simulacion',
    label: 'Cambiar de simulación',
    icon: ICONS.calendar,
  },
  {
    type: 'chip',
    id: 'simulacion-fecha',
    label: formatDate(SIMULATIONS[simulation.value]!, 'datetimeShort'),
    tone: 'primary',
  },
  {
    type: 'info',
    id: 'avenida',
    label: 'Avenida',
    values: [
      { label: 'Caudal máximo', value: flood.value.peak, unit: 'm³/s' },
      { label: 'Volumen', value: flood.value.volume, unit: 'hm³' },
    ],
  },
  {
    type: 'select',
    id: 'lluvia',
    label: 'Lluvia',
    icon: 'M6,14.03A1,1 0 0,1 7,15.03C7,15.58 6.55,16.03 6,16.03C3.24,16.03 1,13.79 1,11.03C1,8.27 3.24,6.03 6,6.03C7,3.68 9.3,2.03 12,2.03C15.43,2.03 18.24,4.69 18.5,8.06L19,8.03A4,4 0 0,1 23,12.03A4,4 0 0,1 19,16.03H18C17.45,16.03 17,15.58 17,15.03C17,14.47 17.45,14.03 18,14.03H19A2,2 0 0,0 21,12.03A2,2 0 0,0 19,10.03H17V9.03C17,6.27 14.76,4.03 12,4.03C9.5,4.03 7.45,5.84 7.06,8.21C6.73,8.09 6.37,8.03 6,8.03A3,3 0 0,0 3,11.03A3,3 0 0,0 6,14.03M12,14.15C12.18,14.39 12.37,14.66 12.56,14.94C13,15.56 14,17.03 14,18C14,19.11 13.1,20 12,20A2,2 0 0,1 10,18C10,17.03 11,15.56 11.44,14.94C11.63,14.66 11.82,14.4 12,14.15M12,11.03L11.5,11.59C11.5,11.59 10.65,12.55 9.79,13.81C8.93,15.06 8,16.56 8,18A4,4 0 0,0 12,22A4,4 0 0,0 16,18C16,16.56 15.07,15.06 14.21,13.81C13.35,12.55 12.5,11.59 12.5,11.59',
    value: rainSource.value,
    showCount: true,
    options: examplePrecipitation.forecasts!.map((f) => ({ value: f.id, label: f.name })),
  },
])

/** La lluvia solo de la fuente elegida en la barra. */
const precipitation = computed(() => ({
  ...examplePrecipitation,
  forecasts: examplePrecipitation.forecasts!.filter((f) => f.id === rainSource.value),
}))

function onAction(event: ChartToolbarActionEvent): void {
  if (event.id === 'simulacion') simulation.value = (simulation.value + 1) % SIMULATIONS.length
  emit('toolbar-action', event)
}

function onChange(event: ChartToolbarChangeEvent): void {
  if (event.id === 'lluvia') rainSource.value = event.value as string
  emit('toolbar-change', event)
}
</script>

<template>
  <ASHydrographChart
    :chart-library="props.chartLibrary"
    :theme="props.theme"
    :discharge="exampleDischarge"
    :precipitation="precipitation"
    :thresholds="exampleThresholds"
    :now="EXAMPLE_NOW"
    :toolbar="{ items }"
    zoom
    file-name="embalse"
    @toolbar-action="onAction"
    @toolbar-change="onChange"
    @update:visible-forecasts="emit('update:visibleForecasts', $event)"
    @update:bands="emit('update:bands', $event)"
    @threshold-focus="emit('threshold-focus', $event)"
  />
</template>
