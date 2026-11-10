<script setup lang="ts">
import { nextTick, ref } from 'vue'
import type { SelectOption } from '@/forms/types/common'
import type { RadioGroupEmits, RadioGroupProps } from '@/forms/types/RadioGroupProps'
import ASFormField from './ASFormField.vue'

/**
 * Grupo de opciones de selección única: radios nativos dentro de un
 * `<fieldset>` con su `<legend>`. El grupo es un solo punto de tabulación y
 * las flechas cambian la opción, con el comportamiento nativo del navegador.
 *
 * Controlado: emite el `value` elegido y marca lo que devuelva el padre.
 * Para más de 5 o 6 opciones, mejor `ASSelect`.
 *
 * @example
 * ```vue
 * <ASRadioGroup
 *   v-model="fuente"
 *   label="Fuente de datos"
 *   orientation="horizontal"
 *   :options="[
 *     { value: 'observado', label: 'Observado' },
 *     { value: 'harmonie', label: 'Harmonie' },
 *   ]"
 * />
 * ```
 */
const props = withDefaults(defineProps<RadioGroupProps>(), {
  label: undefined,
  hint: undefined,
  error: undefined,
  size: 'md',
  id: undefined,
  theme: undefined,
  modelValue: null,
  orientation: 'vertical',
  name: undefined,
})

const emit = defineEmits<RadioGroupEmits>()
const inputs = ref<HTMLInputElement[]>([])

function select(option: SelectOption): void {
  emit('update:modelValue', option.value)
  // Controlado: si el padre no acepta el cambio, vuelve a marcarse la opción de la prop.
  void nextTick(() => {
    props.options.forEach((item, index) => {
      const el = inputs.value[index]
      if (el) el.checked = item.value === props.modelValue
    })
  })
}
</script>

<template>
  <ASFormField
    :id="props.id"
    v-slot="{ id, invalid }"
    as="fieldset"
    class="as-radio-group"
    :label="props.label"
    :hint="props.hint"
    :error="props.error"
    :required="props.required"
    :disabled="props.disabled"
    :size="props.size"
    :theme="props.theme"
  >
    <div
      class="as-radio-group__options"
      :class="[
        `as-radio-group__options--${props.orientation}`,
        `as-radio-group__options--${props.size}`,
      ]"
    >
      <label
        v-for="(option, index) in props.options"
        :key="option.value"
        class="as-radio-group__option"
        :class="{
          'as-radio-group__option--checked': option.value === props.modelValue,
          'as-radio-group__option--disabled': props.disabled || option.disabled,
          'as-radio-group__option--invalid': invalid,
        }"
      >
        <input
          :id="index === 0 ? id : `${id}-${index}`"
          ref="inputs"
          class="as-radio-group__input"
          type="radio"
          :name="props.name ?? `${id}-name`"
          :value="String(option.value)"
          :checked="option.value === props.modelValue"
          :disabled="props.disabled || option.disabled"
          :required="props.required"
          :aria-invalid="invalid || undefined"
          @change="select(option)"
        />
        <span class="as-radio-group__dot" aria-hidden="true" />
        <span class="as-radio-group__text">
          <slot name="option" :option="option" :checked="option.value === props.modelValue">
            {{ option.label }}
            <small v-if="option.description" class="as-radio-group__description">
              {{ option.description }}
            </small>
          </slot>
        </span>
      </label>
    </div>
  </ASFormField>
</template>

<style scoped>
.as-radio-group__options {
  --as-radio-size: 18px;
  display: flex;
  flex-direction: column;
  gap: var(--as-space-2, 8px);
  font-size: var(--as-font-size-sm, 0.875rem);
}

.as-radio-group__options--horizontal {
  flex-flow: row wrap;
  gap: var(--as-space-2, 8px) var(--as-space-5, 20px);
}

.as-radio-group__options--sm {
  --as-radio-size: 16px;
  font-size: var(--as-font-size-xs, 0.75rem);
}

.as-radio-group__options--lg {
  --as-radio-size: 20px;
  font-size: var(--as-font-size-md, 1rem);
}

.as-radio-group__option {
  position: relative;
  display: inline-flex;
  gap: var(--as-space-2, 8px);
  align-items: flex-start;
  line-height: var(--as-line-height-tight, 1.25);
  cursor: pointer;
}

.as-radio-group__option--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Oculto a la vista pero accesible: es el que recibe el foco y las flechas. */
.as-radio-group__input {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: 0;
  opacity: 0;
}

.as-radio-group__dot {
  flex: none;
  box-sizing: border-box;
  width: var(--as-radio-size);
  height: var(--as-radio-size);
  margin-top: calc((1.25em - var(--as-radio-size)) / 2);
  border: 2px solid var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
  border-radius: 50%;
  background-color: var(--as-color-surface, light-dark(#ffffff, #1e293b));
  transition:
    border-color 0.15s,
    border-width 0.15s;
}

/* Marcado: el borde engorda hacia dentro y deja un punto de la superficie. */
.as-radio-group__option--checked .as-radio-group__dot {
  border-width: calc(var(--as-radio-size) * 0.3);
  border-color: var(--as-color-primary, light-dark(#2563eb, #60a5fa));
}

.as-radio-group__option--invalid .as-radio-group__dot {
  border-color: var(--as-color-danger, light-dark(#dc2626, #f87171));
}

.as-radio-group__input:focus-visible + .as-radio-group__dot {
  box-shadow: var(--as-focus-ring, 0 0 0 2px light-dark(#2563eb, #60a5fa));
}

.as-radio-group__text {
  display: flex;
  flex-direction: column;
}

.as-radio-group__description {
  margin-top: 2px;
  font-size: var(--as-font-size-xs, 0.75rem);
  color: var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
}

@media (prefers-reduced-motion: reduce) {
  .as-radio-group__dot {
    transition: none;
  }
}
</style>
