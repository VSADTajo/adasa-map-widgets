<script setup lang="ts">
import { computed, nextTick, ref, watchEffect } from 'vue'
import ASIcon from '@/core/components/ASIcon.vue'
import { ICONS } from '@/core/icons/icons'
import { useFieldId } from '@/core/composables/useFieldId'
import { useResolvedTheme } from '@/core/composables/useTheme'
import type { CheckboxEmits, CheckboxProps } from '@/forms/types/CheckboxProps'
import { describedByOf, isInvalid } from '@/forms/utils/field'
import FieldMessages from './FieldMessages.vue'

/**
 * Casilla de verificación: un `<input type="checkbox">` nativo (oculto a la
 * vista, pero es el que recibe el foco y el que anuncian los lectores de
 * pantalla) con la casilla dibujada en SVG. Toda la fila es clicable.
 *
 * Controlado: con un booleano emite el contrario; con un array (varios
 * checkboxes compartiendo `v-model`), el array con `value` añadido o quitado.
 *
 * @example
 * ```vue
 * <ASCheckbox v-model="tipos" value="aforo" label="Aforos" />
 * <ASCheckbox v-model="tipos" value="embalse" label="Embalses" />
 * ```
 */
const props = withDefaults(defineProps<CheckboxProps>(), {
  label: undefined,
  hint: undefined,
  error: undefined,
  size: 'md',
  id: undefined,
  theme: undefined,
  modelValue: undefined,
  value: undefined,
})

const emit = defineEmits<CheckboxEmits>()
const theme = useResolvedTheme(() => props.theme, null)
const id = useFieldId(() => props.id)
const input = ref<HTMLInputElement | null>(null)

const checked = computed(() =>
  Array.isArray(props.modelValue)
    ? props.value !== undefined && props.modelValue.includes(props.value)
    : Boolean(props.modelValue),
)

// `indeterminate` solo existe como propiedad del DOM, no como atributo.
watchEffect(
  () => {
    if (input.value) input.value.indeterminate = props.indeterminate
  },
  { flush: 'post' },
)

function onChange(): void {
  const list = props.modelValue
  if (Array.isArray(list) && props.value !== undefined) {
    const value = props.value
    emit('update:modelValue', checked.value ? list.filter((v) => v !== value) : [...list, value])
  } else {
    emit('update:modelValue', !checked.value)
  }
  // Controlado: si el padre no acepta el cambio, el input vuelve a lo que diga la prop.
  void nextTick(() => {
    if (!input.value) return
    input.value.checked = checked.value
    input.value.indeterminate = props.indeterminate
  })
}
</script>

<template>
  <div
    class="as-checkbox"
    :class="[
      `as-checkbox--${props.size}`,
      theme && `as-checkbox--${theme}`,
      {
        'as-checkbox--checked': checked || props.indeterminate,
        'as-checkbox--disabled': props.disabled,
        'as-checkbox--invalid': isInvalid(props.error),
      },
    ]"
  >
    <label class="as-checkbox__row">
      <input
        :id="id"
        ref="input"
        class="as-checkbox__input"
        type="checkbox"
        :checked="checked"
        :value="props.value"
        :disabled="props.disabled"
        :aria-required="props.required || undefined"
        :aria-invalid="isInvalid(props.error) || undefined"
        :aria-describedby="describedByOf(id, props.hint, props.error)"
        @change="onChange"
      />
      <span class="as-checkbox__box" aria-hidden="true">
        <ASIcon
          v-if="checked || props.indeterminate"
          :path="props.indeterminate ? ICONS.minus : ICONS.check"
          size="100%"
        />
      </span>
      <span v-if="$slots.default || props.label" class="as-checkbox__label">
        <slot>{{ props.label }}</slot>
        <span v-if="props.required" class="as-checkbox__required" aria-hidden="true">*</span>
      </span>
    </label>
    <div class="as-checkbox__messages">
      <FieldMessages :id="id" :hint="props.hint" :error="props.error" />
    </div>
  </div>
</template>

<style scoped>
.as-checkbox {
  --as-checkbox-box: 18px;
  font-family: var(--as-font-family, system-ui, sans-serif);
  font-size: var(--as-font-size-sm, 0.875rem);
  color: var(--as-color-text, light-dark(#0f172a, #f1f5f9));
}

.as-checkbox--dark {
  color-scheme: dark;
}

.as-checkbox--light {
  color-scheme: light;
}

.as-checkbox--sm {
  --as-checkbox-box: 16px;
  font-size: var(--as-font-size-xs, 0.75rem);
}

.as-checkbox--lg {
  --as-checkbox-box: 20px;
  font-size: var(--as-font-size-md, 1rem);
}

.as-checkbox__row {
  position: relative;
  display: inline-flex;
  gap: var(--as-space-2, 8px);
  align-items: flex-start;
  line-height: var(--as-line-height-tight, 1.25);
  cursor: pointer;
}

.as-checkbox--disabled .as-checkbox__row {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Oculto a la vista pero accesible: sigue recibiendo el foco y los clics de la etiqueta. */
.as-checkbox__input {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: 0;
  opacity: 0;
}

.as-checkbox__box {
  display: grid;
  flex: none;
  box-sizing: border-box;
  width: var(--as-checkbox-box);
  height: var(--as-checkbox-box);
  padding: 1px;
  /* Centra la casilla con la primera línea de texto. */
  margin-top: calc((1.25em - var(--as-checkbox-box)) / 2);
  border: 2px solid var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
  border-radius: var(--as-radius-sm, 4px);
  background-color: var(--as-color-surface, light-dark(#ffffff, #1e293b));
  color: var(--as-color-primary-contrast, light-dark(#ffffff, #0f172a));
  transition:
    background-color 0.15s,
    border-color 0.15s;
}

.as-checkbox--checked .as-checkbox__box {
  border-color: var(--as-color-primary, light-dark(#2563eb, #60a5fa));
  background-color: var(--as-color-primary, light-dark(#2563eb, #60a5fa));
}

.as-checkbox--invalid .as-checkbox__box {
  border-color: var(--as-color-danger, light-dark(#dc2626, #f87171));
}

.as-checkbox__input:focus-visible + .as-checkbox__box {
  box-shadow: var(--as-focus-ring, 0 0 0 2px light-dark(#2563eb, #60a5fa));
}

.as-checkbox__required {
  margin-left: 2px;
  color: var(--as-color-danger, light-dark(#dc2626, #f87171));
}

/* La ayuda y el error, alineados con el texto y no con la casilla. */
.as-checkbox__messages {
  padding-left: calc(var(--as-checkbox-box) + var(--as-space-2, 8px));
}
</style>
