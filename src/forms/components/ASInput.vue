<script setup lang="ts">
import { computed, ref, useAttrs, watch } from 'vue'
import ASIcon from '@/core/components/ASIcon.vue'
import { ICONS } from '@/core/icons/icons'
import { useLocale } from '@/core/composables/useLocale'
import type { InputEmits, InputProps } from '@/forms/types/InputProps'
import { parseDecimal } from '@/forms/utils/field'
import ASFormField from './ASFormField.vue'

/**
 * Campo de texto con etiqueta, ayuda, error, iconos o contenido a los lados
 * (`prefix`/`suffix`), unidad y botón de borrar.
 *
 * Es controlado: emite `update:modelValue` al escribir y muestra lo que le
 * devuelva el padre. Con `type="number"` emite `number | null` y admite coma
 * o punto decimal; ↑/↓ suman o restan `step` dentro de `min`/`max`.
 *
 * Los atributos que no son props (`name`, `maxlength`, `inputmode`...) van
 * al `<input>`; `class` y `style`, al marco del campo.
 *
 * @example
 * ```vue
 * <ASInput v-model="umbral" type="number" label="Umbral" unit="m³/s" :min="0" clearable />
 * ```
 */
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<InputProps>(), {
  label: undefined,
  hint: undefined,
  error: undefined,
  size: 'md',
  id: undefined,
  theme: undefined,
  modelValue: undefined,
  type: 'text',
  placeholder: undefined,
  prefixIcon: undefined,
  suffixIcon: undefined,
  unit: undefined,
  min: undefined,
  max: undefined,
  step: 1,
  autocomplete: undefined,
})

const emit = defineEmits<InputEmits>()
const attrs = useAttrs()
const { t, formatNumber } = useLocale()

const isNumber = computed(() => props.type === 'number')
const inputAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  return rest
})

function display(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number') {
    return formatNumber(value, { useGrouping: false, maximumFractionDigits: 20 })
  }
  return value
}

/**
 * Texto que se ve. Se guarda aparte del valor porque, con números, lo que
 * se escribe no siempre es el valor emitido ("12," emite 12): solo se
 * reescribe cuando el padre cambia el valor por su cuenta.
 */
const text = ref(display(props.modelValue))
watch(
  () => props.modelValue,
  (value) => {
    const current = isNumber.value ? parseDecimal(text.value) : text.value
    if (current !== (value ?? (isNumber.value ? null : ''))) text.value = display(value)
  },
)

const input = ref<HTMLInputElement | null>(null)

function emitText(value: string): void {
  text.value = value
  emit('update:modelValue', isNumber.value ? parseDecimal(value) : value)
}

function onInput(event: Event): void {
  emitText((event.target as HTMLInputElement).value)
}

function onKeydown(event: KeyboardEvent): void {
  if (!isNumber.value || props.readonly || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) {
    return
  }
  event.preventDefault()
  const base = parseDecimal(text.value) ?? props.min ?? 0
  let next = base + (event.key === 'ArrowUp' ? props.step : -props.step)
  if (props.min !== undefined) next = Math.max(props.min, next)
  if (props.max !== undefined) next = Math.min(props.max, next)
  // Evita los restos de coma flotante (0.1 + 0.2).
  next = Number(next.toFixed(10))
  text.value = display(next)
  emit('update:modelValue', next)
}

const showClear = computed(
  () => props.clearable && !props.disabled && !props.readonly && text.value !== '',
)

function clear(): void {
  emitText('')
  emit('clear')
  input.value?.focus()
}

/** Un clic en el marco (iconos, unidad) enfoca el campo, como en un input nativo. */
function focusFromBox(event: MouseEvent): void {
  if (event.target !== input.value && !(event.target as Element).closest('button')) {
    input.value?.focus()
  }
}

defineExpose({
  /** Enfoca el campo. */
  focus: () => input.value?.focus(),
  /** Selecciona todo el texto. */
  select: () => input.value?.select(),
})
</script>

<template>
  <ASFormField
    :id="props.id"
    v-slot="{ id, describedBy, invalid }"
    class="as-input"
    :class="attrs.class"
    :style="attrs.style"
    :label="props.label"
    :hint="props.hint"
    :error="props.error"
    :required="props.required"
    :disabled="props.disabled"
    :size="props.size"
    :theme="props.theme"
  >
    <div
      class="as-control-box as-input__box"
      :class="[
        `as-control-box--${props.size}`,
        {
          'as-control-box--invalid': invalid,
          'as-control-box--disabled': props.disabled,
          'as-control-box--readonly': props.readonly,
        },
      ]"
      @click="focusFromBox"
    >
      <span v-if="$slots.prefix || props.prefixIcon" class="as-control-box__affix">
        <slot name="prefix"><ASIcon class="as-control-box__icon" :icon="props.prefixIcon" /></slot>
      </span>
      <input
        v-bind="inputAttrs"
        :id="id"
        ref="input"
        class="as-input__control"
        :class="{ 'as-input__control--number': isNumber }"
        :type="isNumber ? 'text' : props.type"
        :inputmode="isNumber ? 'decimal' : undefined"
        :value="text"
        :placeholder="props.placeholder"
        :readonly="props.readonly"
        :disabled="props.disabled"
        :autocomplete="props.autocomplete"
        :aria-required="props.required || undefined"
        :aria-invalid="invalid || undefined"
        :aria-describedby="
          [describedBy, props.unit && `${id}-unit`].filter(Boolean).join(' ') || undefined
        "
        @input="onInput"
        @keydown="onKeydown"
        @focus="emit('focus', $event)"
        @blur="emit('blur', $event)"
      />
      <button
        v-if="showClear"
        type="button"
        class="as-control-box__button"
        :aria-label="t('forms.clear')"
        :title="t('forms.clear')"
        @click="clear"
      >
        <ASIcon :path="ICONS.close" :size="16" />
      </button>
      <span v-if="props.unit" :id="`${id}-unit`" class="as-control-box__affix as-input__unit">{{
        props.unit
      }}</span>
      <span v-if="$slots.suffix || props.suffixIcon" class="as-control-box__affix">
        <slot name="suffix"><ASIcon class="as-control-box__icon" :icon="props.suffixIcon" /></slot>
      </span>
    </div>
  </ASFormField>
</template>

<style scoped src="../styles/control-box.css"></style>

<style scoped>
.as-input__box:not(.as-control-box--disabled) {
  cursor: text;
}

.as-input__control {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  color: inherit;
  font: inherit;
}

.as-input__control:disabled {
  cursor: not-allowed;
}

.as-input__control::placeholder {
  color: var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
  opacity: 1;
}

.as-input__control--number {
  font-variant-numeric: tabular-nums;
}

/* El aspa nativa de type="search" duplicaría el botón de borrar. */
.as-input__control::-webkit-search-cancel-button {
  appearance: none;
}

.as-input__unit {
  white-space: nowrap;
}
</style>
