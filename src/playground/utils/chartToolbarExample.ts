import type { CodeExample } from '../registry'

/** Ejemplo de código de la barra a medida del hidrograma (ver `HydrographToolbarDemo.vue`). */
export const hydrographToolbarExample: CodeExample = {
  title: 'Barra a medida en el hidrograma',
  description:
    'Los elementos propios van en `toolbar.items` y son controlados: la barra emite toolbar-action (botones y menús) y toolbar-change (selectores), y el proyecto actualiza su estado y vuelve a calcular los items. Las acciones propias del hidrograma (previsiones, percentiles, enfocar umbral) ya vienen con `toolbar` y funcionan solas; usa v-model:visible-forecasts y v-model:bands si quieres su estado.',
  code: `<script setup lang="ts">
import { computed, ref } from 'vue'
import { mdiCalendarClock, mdiCloudOutline } from '@mdi/js'
import { useLocale } from '@vsadtajo/adasa-ui'
import {
  ASHydrographChart,
  type ChartToolbarActionEvent,
  type ChartToolbarChangeEvent,
  type ChartToolbarItem,
} from '@vsadtajo/adasa-ui/charts'

// caudal, umbrales, simulaciones, avenida, lluviaDe() y abrirSelectorDeSimulacion() son del proyecto.
const { formatDate } = useLocale()
const simulacion = ref<Date>(simulaciones[0])
const lluvia = ref('harmonie')
const previsiones = ref<string[]>(['harmonie', 'eps'])

const items = computed<ChartToolbarItem[]>(() => [
  { type: 'button', id: 'simulacion', label: 'Elegir simulación', icon: mdiCalendarClock },
  { type: 'chip', id: 'fecha', label: formatDate(simulacion.value, 'datetimeShort'), tone: 'primary' },
  {
    type: 'info',
    id: 'avenida',
    label: 'Avenida',
    values: [
      { label: 'Caudal máximo', value: avenida.value.maximo, unit: 'm³/s' },
      { label: 'Volumen', value: avenida.value.volumen, unit: 'hm³' },
    ],
  },
  {
    type: 'select',
    id: 'lluvia',
    label: 'Lluvia',
    icon: mdiCloudOutline,
    value: lluvia.value,
    showCount: true,
    options: [
      { value: 'harmonie', label: 'Harmonie' },
      { value: 'eps', label: 'EPS' },
    ],
  },
])

function onAction({ id }: ChartToolbarActionEvent) {
  if (id === 'simulacion') abrirSelectorDeSimulacion()
}

function onChange({ id, value }: ChartToolbarChangeEvent) {
  if (id === 'lluvia') lluvia.value = value as string
}
</script>

<template>
  <ASHydrographChart
    :discharge="caudal"
    :precipitation="lluviaDe(lluvia)"
    :thresholds="umbrales"
    :toolbar="{ items }"
    v-model:visible-forecasts="previsiones"
    zoom
    @toolbar-action="onAction"
    @toolbar-change="onChange"
  />
</template>`,
}
