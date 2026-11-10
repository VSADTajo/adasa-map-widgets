<script setup lang="ts">
import { reactive, ref } from 'vue'
import ASButton from '@/forms/components/ASButton.vue'
import ASIconButton from '@/forms/components/ASIconButton.vue'
import ASInput from '@/forms/components/ASInput.vue'
import ASSelect from '@/forms/components/ASSelect.vue'
import ASCheckbox from '@/forms/components/ASCheckbox.vue'
import ASSwitch from '@/forms/components/ASSwitch.vue'
import ASRadioGroup from '@/forms/components/ASRadioGroup.vue'
import ASSearchInput from '@/forms/components/ASSearchInput.vue'
import ASDateRangePicker from '@/forms/components/ASDateRangePicker.vue'
import type { DateRange } from '@/forms/types/DateRangePickerProps'
import type { ControlSize, SelectValue } from '@/forms/types/common'
import {
  DEMO_ICONS,
  DEMO_SOURCES,
  DEMO_STATIONS,
  demoFetchSuggestions,
} from '../utils/formsExample'

/**
 * Formulario de ejemplo para el playground: un filtro de estaciones con
 * todas las primitivas juntas, para ver cómo casan en claro y oscuro y en
 * cada tamaño. Valida al enviar y emite el filtro aplicado.
 */
const props = defineProps<{
  size?: ControlSize
  disabled?: boolean
  theme?: 'light' | 'dark'
}>()

const emit = defineEmits<{ submit: [filter: Record<string, unknown>]; reset: [] }>()

const BASINS = [
  { value: 'tajo', label: 'Tajo' },
  { value: 'jarama', label: 'Jarama' },
  { value: 'alberche', label: 'Alberche' },
  { value: 'tietar', label: 'Tiétar' },
]
const TYPES = [
  { value: 'aforo', label: 'Aforo' },
  { value: 'embalse', label: 'Embalse' },
  { value: 'pluviometro', label: 'Pluviómetro' },
  { value: 'piezometro', label: 'Piezómetro' },
]

function initial() {
  return {
    search: '',
    period: null as DateRange | null,
    basin: null as SelectValue | null,
    types: ['aforo'] as SelectValue[],
    stations: [] as SelectValue[],
    threshold: 150 as number | null,
    source: 'observado' as SelectValue | null,
    onlyAlerts: false,
    autoRefresh: true,
  }
}

const form = reactive(initial())
const errors = reactive<{ basin?: string; threshold?: string }>({})
const showFilters = ref(true)
const fetchSuggestions = demoFetchSuggestions(400, false)

function submit(): void {
  errors.basin = form.basin ? undefined : 'Elige una cuenca'
  errors.threshold =
    form.threshold === null || form.threshold < 0
      ? 'Indica un caudal mayor o igual que 0'
      : undefined
  if (!errors.basin && !errors.threshold) emit('submit', { ...form })
}

function reset(): void {
  Object.assign(form, initial())
  errors.basin = undefined
  errors.threshold = undefined
  emit('reset')
}
</script>

<template>
  <form class="demo-form" novalidate @submit.prevent="submit">
    <div class="demo-form__row">
      <ASSearchInput
        v-model="form.search"
        class="demo-form__wide"
        label="Buscar"
        placeholder="Estación o municipio"
        :fetch-suggestions="fetchSuggestions"
        :size="props.size"
        :disabled="props.disabled"
        :theme="props.theme"
      />
      <ASIconButton
        :icon="DEMO_ICONS.filtro!.path"
        label="Mostrar filtros avanzados"
        :pressed="showFilters"
        :size="props.size"
        :disabled="props.disabled"
        :theme="props.theme"
        @update:pressed="showFilters = $event"
      />
    </div>

    <div class="demo-form__grid">
      <ASDateRangePicker
        v-model="form.period"
        class="demo-form__wide"
        label="Periodo"
        :max="new Date()"
        clearable
        :size="props.size"
        :disabled="props.disabled"
        :theme="props.theme"
      />
      <ASSelect
        v-model="form.basin"
        label="Cuenca"
        :options="BASINS"
        searchable
        required
        :error="errors.basin"
        :size="props.size"
        :disabled="props.disabled"
        :theme="props.theme"
      />
      <ASSelect
        v-model="form.types"
        label="Tipos de estación"
        :options="TYPES"
        multiple
        :max-chips="2"
        :size="props.size"
        :disabled="props.disabled"
        :theme="props.theme"
      />
      <ASSelect
        v-model="form.stations"
        class="demo-form__wide"
        label="Estaciones"
        hint="Agrupadas por río; escribe para filtrar"
        :options="DEMO_STATIONS"
        multiple
        searchable
        clearable
        :size="props.size"
        :disabled="props.disabled"
        :theme="props.theme"
      />
      <ASInput
        v-model="form.threshold"
        type="number"
        label="Umbral de caudal"
        unit="m³/s"
        :min="0"
        :step="10"
        required
        :error="errors.threshold"
        hint="↑/↓ suman o restan 10"
        :size="props.size"
        :disabled="props.disabled"
        :theme="props.theme"
      />
      <ASRadioGroup
        v-model="form.source"
        label="Fuente de datos"
        :options="DEMO_SOURCES"
        :size="props.size"
        :disabled="props.disabled"
        :theme="props.theme"
      />
    </div>

    <div class="demo-form__toggles">
      <ASCheckbox
        v-model="form.onlyAlerts"
        label="Solo estaciones con aviso activo"
        :size="props.size"
        :disabled="props.disabled"
        :theme="props.theme"
      />
      <ASSwitch
        v-model="form.autoRefresh"
        label="Actualizar cada 5 minutos"
        :size="props.size"
        :disabled="props.disabled"
        :theme="props.theme"
      />
    </div>

    <div class="demo-form__actions">
      <ASButton
        variant="ghost"
        :icon="DEMO_ICONS.borrar!.path"
        :size="props.size"
        :disabled="props.disabled"
        :theme="props.theme"
        @click="reset"
      >
        Restablecer
      </ASButton>
      <ASButton
        type="submit"
        variant="primary"
        :icon="DEMO_ICONS.filtro!.path"
        :size="props.size"
        :disabled="props.disabled"
        :theme="props.theme"
      >
        Aplicar filtro
      </ASButton>
    </div>
  </form>
</template>

<style scoped>
.demo-form {
  display: flex;
  flex-direction: column;
  gap: var(--as-space-5, 20px);
  max-width: 760px;
  padding: var(--as-space-4, 16px);
}

.demo-form__row {
  display: flex;
  gap: var(--as-space-2, 8px);
  align-items: flex-end;
}

.demo-form__row .demo-form__wide {
  flex: 1;
}

.demo-form__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--as-space-4, 16px);
  align-items: start;
}

.demo-form__grid .demo-form__wide {
  grid-column: 1 / -1;
}

.demo-form__toggles {
  display: flex;
  flex-wrap: wrap;
  gap: var(--as-space-3, 12px) var(--as-space-8, 32px);
}

.demo-form__actions {
  display: flex;
  gap: var(--as-space-2, 8px);
  justify-content: flex-end;
}
</style>
