<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { endOfDay, setHours, setMinutes, startOfDay } from 'date-fns'
import ASIcon from '@/core/components/ASIcon.vue'
import { ICONS } from '@/core/icons/icons'
import { useFieldId } from '@/core/composables/useFieldId'
import { useLocale } from '@/core/composables/useLocale'
import { usePopover } from '@/forms/composables/usePopover'
import type { DatePickerEmits, DatePickerProps } from '@/forms/types/DatePickerProps'
import { datePattern, parseDateText } from '@/forms/utils/dates'
import ASButton from './ASButton.vue'
import ASFormField from './ASFormField.vue'
import CalendarGrid from './CalendarGrid.vue'
import TimeFields from './TimeFields.vue'

/**
 * Campo de fecha (y hora, con `with-time`): se escribe con el formato corto
 * del idioma (`dd/mm/aaaa` en es) o se elige en un calendario. Sigue el
 * patrón "date picker dialog" de WAI-ARIA: el botón del calendario abre un
 * diálogo con la rejilla del mes, que se recorre con el teclado (ver
 * `CalendarGrid`); Escape lo cierra y devuelve el foco al botón.
 *
 * Controlado: emite la fecha al elegirla en el calendario o al confirmar lo
 * escrito (Intro o al salir del campo). Si lo escrito no es una fecha, o
 * queda fuera de `min`/`max`, no emite y lo indica como error del campo.
 *
 * @example
 * ```vue
 * <ASDatePicker v-model="fecha" label="Fecha del informe" :max="new Date()" clearable />
 * ```
 */
const props = withDefaults(defineProps<DatePickerProps>(), {
  label: undefined,
  hint: undefined,
  error: undefined,
  size: 'md',
  id: undefined,
  theme: undefined,
  modelValue: null,
  min: undefined,
  max: undefined,
  minuteStep: 1,
  placeholder: undefined,
})

const emit = defineEmits<DatePickerEmits>()
const { t, formatDate, dateFnsLocale } = useLocale()
const id = useFieldId(() => props.id)

const root = ref<HTMLElement | null>(null)
const panel = ref<HTMLElement | null>(null)
const toggle = ref<HTMLButtonElement | null>(null)
const calendar = ref<InstanceType<typeof CalendarGrid> | null>(null)

const { isOpen, placement, open, close, onKeydown } = usePopover(root, panel, () => toggle.value)

function display(date: Date | null): string {
  return date ? formatDate(date, { pattern: datePattern(props.withTime) }) : ''
}

/** Texto del campo: lo escrito mientras no se confirma; si no, la fecha del modelo. */
const text = ref(display(props.modelValue))
/** Error de lo escrito (formato o rango); el `error` de la prop tiene prioridad. */
const inputError = ref<string | null>(null)
watch(
  () => [props.modelValue, props.withTime, dateFnsLocale.value],
  () => {
    text.value = display(props.modelValue)
    inputError.value = null
  },
)

const placeholderText = computed(
  () => props.placeholder ?? t(props.withTime ? 'dates.placeholderTime' : 'dates.placeholder'),
)
const shownError = computed(() => props.error || inputError.value || undefined)

function outOfRange(date: Date): boolean {
  // Sin hora se compara por días: elegir el día de `min` vale aunque `min` tenga hora.
  const value = props.withTime ? date : startOfDay(date)
  const min = props.min && (props.withTime ? props.min : startOfDay(props.min))
  const max = props.max && (props.withTime ? props.max : endOfDay(props.max))
  return Boolean((min && value < min) || (max && value > max))
}

function commit(date: Date | null): void {
  inputError.value = null
  const same =
    date === props.modelValue || (date && props.modelValue && +date === +props.modelValue)
  if (!same) emit('update:modelValue', date)
  text.value = display(date)
}

/** Confirma lo escrito (Intro o al salir del campo). */
function commitText(): void {
  if (text.value.trim() === '') return commit(null)
  if (text.value === display(props.modelValue)) return
  const date = parseDateText(text.value, props.withTime, dateFnsLocale.value)
  if (!date) {
    inputError.value = t('dates.invalid', { format: placeholderText.value })
  } else if (outOfRange(date)) {
    inputError.value = t('dates.outOfRange')
  } else {
    commit(props.withTime ? date : startOfDay(date))
  }
}

// ── Calendario ──────────────────────────────────────────────────────────
const focused = ref(new Date())

function openCalendar(): void {
  if (props.disabled) return
  if (isOpen.value) return close()
  const base = props.modelValue ?? new Date()
  const clamped =
    props.min && base < props.min ? props.min : props.max && base > props.max ? props.max : base
  focused.value = startOfDay(clamped)
  open()
  void nextTick(() => calendar.value?.focusActive())
}

/** Día elegido en el calendario: sin hora, se confirma y se cierra; con hora, se mantiene la hora. */
function selectDay(day: Date): void {
  if (!props.withTime) {
    commit(startOfDay(day))
    close()
    return
  }
  const time = props.modelValue ?? startOfDay(day)
  commit(setMinutes(setHours(day, time.getHours()), time.getMinutes()))
}

function setToday(): void {
  const now = new Date()
  if (props.withTime) {
    commit(now)
    focused.value = startOfDay(now)
  } else {
    commit(startOfDay(now))
    close()
  }
}

function clear(): void {
  commit(null)
  document.getElementById(id.value)?.focus()
}
</script>

<template>
  <ASFormField
    :id="id"
    v-slot="{ describedBy, invalid }"
    class="as-date-picker"
    :label="props.label"
    :hint="props.hint"
    :error="shownError"
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
        <input
          :id="id"
          v-model="text"
          class="as-date-picker__input"
          type="text"
          autocomplete="off"
          :placeholder="placeholderText"
          :disabled="props.disabled"
          :aria-describedby="describedBy"
          :aria-invalid="invalid || undefined"
          :aria-required="props.required || undefined"
          @change="commitText"
          @keydown.enter.prevent="commitText"
          @keydown.alt.down.prevent="openCalendar"
        />
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
        <button
          ref="toggle"
          type="button"
          class="as-control-box__button as-date-picker__toggle"
          :aria-label="t('dates.chooseDate')"
          :title="t('dates.chooseDate')"
          aria-haspopup="dialog"
          :aria-expanded="isOpen"
          :disabled="props.disabled"
          @click="openCalendar"
        >
          <ASIcon :path="ICONS.calendar" :size="18" />
        </button>
      </div>

      <div
        v-if="isOpen"
        ref="panel"
        class="as-popover"
        :class="`as-popover--${placement}`"
        role="dialog"
        aria-modal="true"
        :aria-label="t('dates.chooseDate')"
        @keydown="onKeydown"
      >
        <CalendarGrid
          ref="calendar"
          v-model:focused="focused"
          :selected="props.modelValue"
          :min="props.min"
          :max="props.max"
          @select="selectDay"
        />
        <TimeFields
          v-if="props.withTime"
          :legend="t('dates.time')"
          :date="props.modelValue"
          :minute-step="props.minuteStep"
          @update="commit($event)"
        />
        <div class="as-popover__footer">
          <ASButton
            class="as-popover__footer-start"
            variant="ghost"
            size="sm"
            :disabled="outOfRange(new Date())"
            @click="setToday"
          >
            {{ props.withTime ? t('dates.now') : t('dates.today') }}
          </ASButton>
          <ASButton v-if="props.withTime" variant="primary" size="sm" @click="close()">
            {{ t('dates.done') }}
          </ASButton>
        </div>
      </div>
    </div>
  </ASFormField>
</template>

<style scoped src="../styles/control-box.css"></style>
<style scoped src="../styles/popover.css"></style>

<style scoped>
.as-date-picker__input {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  color: inherit;
  font: inherit;
  font-variant-numeric: tabular-nums;
}

.as-date-picker__input::placeholder {
  color: var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
  opacity: 1;
}

.as-date-picker__toggle {
  margin-right: calc(var(--as-space-1, 4px) * -1);
}
</style>
