<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { endOfDay, setHours, setMinutes, startOfDay } from 'date-fns'
import ASIcon from '@/core/components/ASIcon.vue'
import { ICONS } from '@/core/icons/icons'
import { useFieldId } from '@/core/composables/useFieldId'
import { useLocale } from '@/core/composables/useLocale'
import type { MessageKey } from '@/core/i18n/messages'
import { usePopover } from '@/forms/composables/usePopover'
import type {
  DateRange,
  DateRangePickerEmits,
  DateRangePickerProps,
  DateRangePreset,
} from '@/forms/types/DateRangePickerProps'
import { BUILT_IN_PRESETS, clampRange, datePattern } from '@/forms/utils/dates'
import ASButton from './ASButton.vue'
import ASFormField from './ASFormField.vue'
import CalendarGrid from './CalendarGrid.vue'
import TimeFields from './TimeFields.vue'

/**
 * Selector de periodo: un botón que muestra el periodo elegido y abre un
 * diálogo con periodos predefinidos ("Últimas 24 h", "Año hidrológico
 * actual"...) y un calendario donde se marcan el día de inicio y el de fin
 * (y sus horas, con `with-time`).
 *
 * Un periodo predefinido se aplica al pulsarlo; uno elegido en el calendario,
 * con "Aplicar" ("Cancelar" o Escape lo descartan). El calendario se maneja
 * con el teclado como el de `ASDatePicker`, y el texto bajo él indica si
 * falta el inicio o el fin.
 *
 * Controlado: emite `{ start, end }` y muestra lo que devuelva el padre.
 *
 * @example
 * ```vue
 * <ASDateRangePicker v-model="periodo" label="Periodo" :presets="['last24h', 'last7d', 'hydroYear']" />
 * ```
 */
const props = withDefaults(defineProps<DateRangePickerProps>(), {
  label: undefined,
  hint: undefined,
  error: undefined,
  size: 'md',
  id: undefined,
  theme: undefined,
  modelValue: null,
  min: undefined,
  max: undefined,
  presets: () => ['last24h', 'last7d', 'last30d', 'hydroYear'],
  minuteStep: 1,
  placeholder: undefined,
  now: undefined,
})

const emit = defineEmits<DateRangePickerEmits>()
const { t, formatDate } = useLocale()
const id = useFieldId(() => props.id)

const root = ref<HTMLElement | null>(null)
const panel = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const calendar = ref<InstanceType<typeof CalendarGrid> | null>(null)

const { isOpen, placement, open, close, onKeydown } = usePopover(root, panel, () => trigger.value, {
  height: 440,
})

const presetList = computed<DateRangePreset[]>(() =>
  props.presets.map((preset) =>
    typeof preset === 'string'
      ? {
          id: preset,
          label: t(`dates.preset.${preset}` as MessageKey),
          range: BUILT_IN_PRESETS[preset],
        }
      : preset,
  ),
)

/** Último periodo predefinido aplicado, mientras el modelo siga siendo ese periodo. */
const applied = ref<{ id: string; range: DateRange } | null>(null)
const activePreset = computed(() => {
  const value = props.modelValue
  const last = applied.value
  return last && value && +value.start === +last.range.start && +value.end === +last.range.end
    ? last.id
    : null
})

const pattern = computed(() => datePattern(props.withTime))
const valueText = computed(() => {
  const value = props.modelValue
  if (!value) return null
  return t('dates.rangeValue', {
    start: formatDate(value.start, { pattern: pattern.value }),
    end: formatDate(value.end, { pattern: pattern.value }),
  })
})

// ── Borrador del calendario ─────────────────────────────────────────────
const draftStart = ref<Date | null>(null)
const draftEnd = ref<Date | null>(null)
const focused = ref(new Date())

const status = computed(() => {
  if (!draftStart.value || draftEnd.value) return t('dates.pickStart')
  return t('dates.pickEnd')
})

function openPanel(): void {
  if (props.disabled) return
  if (isOpen.value) return close()
  draftStart.value = props.modelValue?.start ?? null
  draftEnd.value = props.modelValue?.end ?? null
  focused.value = startOfDay(props.modelValue?.end ?? props.max ?? new Date())
  open()
  void nextTick(() => calendar.value?.focusActive())
}

/** Clic o Intro en un día: empieza un periodo nuevo o lo cierra (en cualquier orden). */
function selectDay(day: Date): void {
  const start = draftStart.value
  if (!start || draftEnd.value) {
    draftStart.value = props.withTime ? withTimeOf(day, start, 0, 0) : startOfDay(day)
    draftEnd.value = null
  } else if (day < startOfDay(start)) {
    draftEnd.value = props.withTime ? withTimeOf(start, null, 23, 59) : endOfDay(start)
    draftStart.value = props.withTime ? withTimeOf(day, start, 0, 0) : startOfDay(day)
  } else {
    draftEnd.value = props.withTime
      ? withTimeOf(day, props.modelValue?.end ?? null, 23, 59)
      : endOfDay(day)
  }
}

/** `day` con la hora de `source` (o la indicada si no hay `source`). */
function withTimeOf(day: Date, source: Date | null, hours: number, minutes: number): Date {
  return setMinutes(
    setHours(startOfDay(day), source?.getHours() ?? hours),
    source?.getMinutes() ?? minutes,
  )
}

const canApply = computed(() =>
  Boolean(draftStart.value && draftEnd.value && draftStart.value <= draftEnd.value),
)

function apply(): void {
  if (!canApply.value) return
  emit('update:modelValue', { start: draftStart.value!, end: draftEnd.value! })
  close()
}

function applyPreset(preset: DateRangePreset): void {
  const range = clampRange(preset.range(props.now ?? new Date()), props.min, props.max)
  applied.value = { id: preset.id, range }
  emit('update:modelValue', range)
  emit('preset-selected', preset.id)
  close()
}

function clear(): void {
  emit('update:modelValue', null)
  trigger.value?.focus()
}
</script>

<template>
  <ASFormField
    :id="id"
    v-slot="{ describedBy, invalid }"
    class="as-date-range-picker"
    :label="props.label"
    :hint="props.hint"
    :error="props.error"
    :required="props.required"
    :disabled="props.disabled"
    :size="props.size"
    :theme="props.theme"
  >
    <div ref="root" class="as-popover-anchor">
      <div
        class="as-control-box"
        :class="[
          `as-control-box--${props.size}`,
          { 'as-control-box--invalid': invalid, 'as-control-box--disabled': props.disabled },
        ]"
      >
        <button
          :id="id"
          ref="trigger"
          type="button"
          class="as-date-range-picker__trigger"
          aria-haspopup="dialog"
          :aria-expanded="isOpen"
          :aria-describedby="describedBy"
          :aria-invalid="invalid || undefined"
          :aria-required="props.required || undefined"
          :disabled="props.disabled"
          @click="openPanel"
        >
          <ASIcon class="as-control-box__icon as-date-range-picker__icon" :path="ICONS.calendar" />
          <span v-if="valueText" class="as-date-range-picker__value">{{ valueText }}</span>
          <span v-else class="as-control-box__placeholder">
            {{ props.placeholder ?? t('dates.rangePlaceholder') }}
          </span>
        </button>
        <button
          v-if="props.clearable && props.modelValue && !props.disabled"
          type="button"
          class="as-control-box__button"
          :aria-label="t('forms.clear')"
          :title="t('forms.clear')"
          @click="clear"
        >
          <ASIcon :path="ICONS.close" :size="16" />
        </button>
      </div>

      <div
        v-if="isOpen"
        ref="panel"
        class="as-popover as-date-range-picker__panel"
        :class="`as-popover--${placement}`"
        role="dialog"
        aria-modal="true"
        :aria-label="t('dates.chooseRange')"
        @keydown="onKeydown"
      >
        <ul
          v-if="presetList.length"
          class="as-date-range-picker__presets"
          :aria-label="t('dates.presets')"
        >
          <li v-for="preset in presetList" :key="preset.id">
            <button
              type="button"
              class="as-date-range-picker__preset"
              :aria-pressed="activePreset === preset.id"
              @click="applyPreset(preset)"
            >
              {{ preset.label }}
            </button>
          </li>
        </ul>

        <div class="as-date-range-picker__custom">
          <CalendarGrid
            ref="calendar"
            v-model:focused="focused"
            :range-start="draftStart"
            :range-end="draftEnd"
            :min="props.min"
            :max="props.max"
            @select="selectDay"
          />
          <template v-if="props.withTime">
            <TimeFields
              :legend="t('dates.startTime')"
              :date="draftStart"
              :minute-step="props.minuteStep"
              @update="draftStart = $event"
            />
            <TimeFields
              :legend="t('dates.endTime')"
              :date="draftEnd"
              :minute-step="props.minuteStep"
              @update="draftEnd = $event"
            />
          </template>
          <div class="as-popover__footer">
            <p class="as-popover__footer-start as-date-range-picker__status" aria-live="polite">
              {{ status }}
            </p>
            <ASButton variant="ghost" size="sm" @click="close()">{{ t('dates.cancel') }}</ASButton>
            <ASButton variant="primary" size="sm" :disabled="!canApply" @click="apply">
              {{ t('dates.apply') }}
            </ASButton>
          </div>
        </div>
      </div>
    </div>
  </ASFormField>
</template>

<style scoped src="../styles/control-box.css"></style>
<style scoped src="../styles/popover.css"></style>

<style scoped>
.as-date-range-picker__trigger {
  display: flex;
  flex: 1;
  gap: var(--as-space-2, 8px);
  align-items: center;
  min-width: 0;
  height: 100%;
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.as-date-range-picker__trigger:disabled {
  cursor: not-allowed;
}

.as-date-range-picker__icon {
  color: var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
}

.as-date-range-picker__value {
  overflow: hidden;
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.as-date-range-picker__panel {
  display: flex;
  gap: var(--as-space-3, 12px);
}

.as-date-range-picker__presets {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 11em;
  margin: 0;
  padding: 0 var(--as-space-3, 12px) 0 0;
  border-right: 1px solid var(--as-color-border, light-dark(#cbd5e1, #475569));
  list-style: none;
}

.as-date-range-picker__preset {
  width: 100%;
  padding: var(--as-space-2, 8px);
  border: none;
  border-radius: var(--as-radius-sm, 4px);
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.as-date-range-picker__preset:hover {
  background-color: var(--as-color-surface-muted, light-dark(#f1f5f9, #334155));
}

.as-date-range-picker__preset:focus-visible {
  outline: none;
  box-shadow: inset var(--as-focus-ring, 0 0 0 2px light-dark(#2563eb, #60a5fa));
}

/* Activo: marca a la izquierda además del color (alto contraste, daltonismo). */
.as-date-range-picker__preset[aria-pressed='true'] {
  background-color: var(--as-color-surface-muted, light-dark(#f1f5f9, #334155));
  box-shadow: inset 3px 0 0 var(--as-color-primary, light-dark(#2563eb, #60a5fa));
  font-weight: var(--as-font-weight-semibold, 600);
}

.as-date-range-picker__status {
  margin: 0;
  font-size: var(--as-font-size-xs, 0.75rem);
  color: var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
}

/* En pantallas estrechas, los periodos van encima del calendario. */
@media (max-width: 560px) {
  .as-date-range-picker__panel {
    flex-direction: column;
  }

  .as-date-range-picker__presets {
    flex-flow: row wrap;
    padding: 0 0 var(--as-space-3, 12px);
    border-right: none;
    border-bottom: 1px solid var(--as-color-border, light-dark(#cbd5e1, #475569));
  }

  .as-date-range-picker__presets li {
    flex: 1 1 auto;
  }
}
</style>
