<script setup lang="ts">
import { computed } from 'vue'
import { useResolvedTheme } from '@/core/composables/useTheme'
import { useFieldId } from '@/core/composables/useFieldId'
import type { FormFieldProps, FormFieldSlotProps } from '@/forms/types/FormFieldProps'
import { describedByOf, isInvalid } from '@/forms/utils/field'
import FieldMessages from './FieldMessages.vue'

/**
 * Marco de un campo de formulario: etiqueta, control (slot) y, debajo, la
 * ayuda y el error. Da al control su `id` y los ids de `aria-describedby`
 * por el slot, para que la etiqueta y los mensajes queden asociados.
 *
 * Es la base de `ASInput` y `ASSelect`, y sirve para que un proyecto
 * envuelva sus propios controles con el mismo aspecto.
 *
 * @example
 * ```vue
 * <ASFormField label="Cuenca" :error="errores.cuenca" required v-slot="{ id, describedBy, invalid }">
 *   <MiControl :id="id" :aria-describedby="describedBy" :aria-invalid="invalid" />
 * </ASFormField>
 * ```
 */
const props = withDefaults(defineProps<FormFieldProps>(), {
  label: undefined,
  hint: undefined,
  error: undefined,
  size: 'md',
  id: undefined,
  theme: undefined,
  as: 'div',
})

defineSlots<{ default(props: FormFieldSlotProps): unknown }>()

const theme = useResolvedTheme(() => props.theme, null)
const id = useFieldId(() => props.id)
const slotProps = computed<FormFieldSlotProps>(() => ({
  id: id.value,
  labelId: `${id.value}-label`,
  describedBy: describedByOf(id.value, props.hint, props.error),
  invalid: isInvalid(props.error),
}))
</script>

<template>
  <component
    :is="props.as"
    class="as-form-field"
    :class="[
      `as-form-field--${props.size}`,
      theme && `as-form-field--${theme}`,
      { 'as-form-field--disabled': props.disabled, 'as-form-field--invalid': slotProps.invalid },
    ]"
    :disabled="props.as === 'fieldset' ? props.disabled : undefined"
    :aria-describedby="props.as === 'fieldset' ? slotProps.describedBy : undefined"
  >
    <legend
      v-if="props.as === 'fieldset' && props.label"
      :id="slotProps.labelId"
      class="as-form-field__label"
    >
      {{ props.label
      }}<span v-if="props.required" class="as-form-field__required" aria-hidden="true">*</span>
    </legend>
    <label v-else-if="props.label" :id="slotProps.labelId" :for="id" class="as-form-field__label">
      {{ props.label
      }}<span v-if="props.required" class="as-form-field__required" aria-hidden="true">*</span>
    </label>
    <slot v-bind="slotProps" />
    <FieldMessages :id="id" :hint="props.hint" :error="props.error" />
  </component>
</template>

<style scoped>
.as-form-field {
  display: flex;
  flex-direction: column;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: none;
  font-family: var(--as-font-family, system-ui, sans-serif);
  color: var(--as-color-text, light-dark(#0f172a, #f1f5f9));
}

.as-form-field--dark {
  color-scheme: dark;
}

.as-form-field--light {
  color-scheme: light;
}

.as-form-field__label {
  margin-bottom: var(--as-space-1, 4px);
  padding: 0;
  font-size: var(--as-font-size-sm, 0.875rem);
  font-weight: var(--as-font-weight-medium, 500);
  line-height: var(--as-line-height-tight, 1.25);
}

.as-form-field--lg .as-form-field__label {
  font-size: var(--as-font-size-md, 1rem);
}

.as-form-field--sm .as-form-field__label {
  font-size: var(--as-font-size-xs, 0.75rem);
}

.as-form-field__required {
  margin-left: 2px;
  color: var(--as-color-danger, light-dark(#dc2626, #f87171));
}

.as-form-field--disabled .as-form-field__label {
  color: var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
}
</style>
