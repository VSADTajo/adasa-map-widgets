<script setup lang="ts">
import { computed } from 'vue'
import { setHours, setMinutes } from 'date-fns'
import { useLocale } from '@/core/composables/useLocale'
import ASInput from './ASInput.vue'

/**
 * Hora y minutos de una fecha (interno del dominio): dos campos numéricos
 * agrupados bajo una leyenda ("Hora", "Hora de inicio"...). ↑/↓ suman o
 * restan una hora o `minuteStep` minutos. Emite la fecha con la hora nueva.
 */
const props = withDefaults(
  defineProps<{
    legend: string
    /** Fecha cuya hora se edita; sin ella, los campos se ven vacíos y no emiten. */
    date: Date | null
    minuteStep?: number
    disabled?: boolean
  }>(),
  { minuteStep: 1 },
)

const emit = defineEmits<{ update: [date: Date] }>()
const { t } = useLocale()

const hours = computed(() => props.date?.getHours() ?? null)
const minutes = computed(() => props.date?.getMinutes() ?? null)

function update(part: 'hours' | 'minutes', value: string | number | null): void {
  if (!props.date || typeof value !== 'number' || !Number.isInteger(value)) return
  const max = part === 'hours' ? 23 : 59
  const clamped = Math.min(max, Math.max(0, value))
  emit('update', part === 'hours' ? setHours(props.date, clamped) : setMinutes(props.date, clamped))
}
</script>

<template>
  <fieldset class="as-time-fields" :disabled="props.disabled || !props.date">
    <legend class="as-time-fields__legend">{{ props.legend }}</legend>
    <ASInput
      class="as-time-fields__field"
      type="number"
      size="sm"
      :model-value="hours"
      :min="0"
      :max="23"
      :aria-label="t('dates.hours')"
      @update:model-value="update('hours', $event)"
    />
    <span aria-hidden="true">:</span>
    <ASInput
      class="as-time-fields__field"
      type="number"
      size="sm"
      :model-value="minutes"
      :min="0"
      :max="59"
      :step="props.minuteStep"
      :aria-label="t('dates.minutes')"
      @update:model-value="update('minutes', $event)"
    />
  </fieldset>
</template>

<style scoped>
.as-time-fields {
  display: flex;
  gap: var(--as-space-2, 8px);
  align-items: center;
  margin: var(--as-space-2, 8px) 0 0;
  padding: 0;
  border: none;
}

.as-time-fields__legend {
  float: left;
  min-width: 7.5em;
  padding: 0;
  color: var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
}

.as-time-fields__field {
  width: 4.5em;
}
</style>
