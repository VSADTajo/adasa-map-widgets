<script setup lang="ts">
import { useFieldId } from '@/core/composables/useFieldId'
import { useResolvedTheme } from '@/core/composables/useTheme'
import type { SwitchEmits, SwitchProps } from '@/forms/types/SwitchProps'
import { describedByOf } from '@/forms/utils/field'
import FieldMessages from './FieldMessages.vue'

/**
 * Interruptor de encendido y apagado con efecto inmediato: un `<button
 * role="switch">` con `aria-checked`, que se activa con clic, Espacio o
 * Intro. La etiqueta es un `<label>` asociado, así que pulsarla también
 * lo cambia.
 *
 * Controlado: emite el estado contrario y muestra lo que devuelva el padre.
 * No tiene estado de error: un interruptor no puede quedar mal rellenado.
 *
 * @example
 * ```vue
 * <ASSwitch v-model="autoRefresh" label="Actualizar cada 5 minutos" />
 * ```
 */
const props = withDefaults(defineProps<SwitchProps>(), {
  modelValue: false,
  label: undefined,
  hint: undefined,
  size: 'md',
  labelPosition: 'end',
  id: undefined,
  theme: undefined,
})

const emit = defineEmits<SwitchEmits>()
const theme = useResolvedTheme(() => props.theme, null)
const id = useFieldId(() => props.id)

function toggle(): void {
  if (!props.disabled) emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <div
    class="as-switch"
    :class="[
      `as-switch--${props.size}`,
      theme && `as-switch--${theme}`,
      {
        'as-switch--on': props.modelValue,
        'as-switch--disabled': props.disabled,
        'as-switch--label-start': props.labelPosition === 'start',
      },
    ]"
  >
    <div class="as-switch__row">
      <button
        :id="id"
        class="as-switch__track"
        type="button"
        role="switch"
        :aria-checked="props.modelValue"
        :disabled="props.disabled"
        :aria-describedby="describedByOf(id, props.hint, undefined)"
        @click="toggle"
      >
        <span class="as-switch__thumb" />
      </button>
      <label v-if="$slots.default || props.label" class="as-switch__label" :for="id">
        <slot>{{ props.label }}</slot>
      </label>
    </div>
    <FieldMessages :id="id" :hint="props.hint" />
  </div>
</template>

<style scoped>
.as-switch {
  --as-switch-width: 36px;
  --as-switch-height: 20px;
  font-family: var(--as-font-family, system-ui, sans-serif);
  font-size: var(--as-font-size-sm, 0.875rem);
  color: var(--as-color-text, light-dark(#0f172a, #f1f5f9));
}

.as-switch--dark {
  color-scheme: dark;
}

.as-switch--light {
  color-scheme: light;
}

.as-switch--sm {
  --as-switch-width: 28px;
  --as-switch-height: 16px;
  font-size: var(--as-font-size-xs, 0.75rem);
}

.as-switch--lg {
  --as-switch-width: 44px;
  --as-switch-height: 24px;
  font-size: var(--as-font-size-md, 1rem);
}

.as-switch__row {
  display: flex;
  gap: var(--as-space-2, 8px);
  align-items: center;
  line-height: var(--as-line-height-tight, 1.25);
}

/* Etiqueta a la izquierda y el interruptor al final, como en una lista de ajustes. */
.as-switch--label-start .as-switch__row {
  flex-direction: row-reverse;
  justify-content: space-between;
}

.as-switch--disabled .as-switch__row {
  opacity: 0.5;
}

.as-switch__track {
  position: relative;
  flex: none;
  box-sizing: border-box;
  width: var(--as-switch-width);
  height: var(--as-switch-height);
  padding: 0;
  border: none;
  border-radius: var(--as-radius-full, 9999px);
  /* Apagado: gris con contraste ≥ 3:1 sobre la superficie (no el del borde, que no llega). */
  background-color: var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
  cursor: pointer;
  transition: background-color 0.15s;
}

.as-switch--on .as-switch__track {
  background-color: var(--as-color-primary, light-dark(#2563eb, #60a5fa));
}

.as-switch__track:disabled {
  cursor: not-allowed;
}

.as-switch__track:focus-visible {
  outline: 2px solid transparent;
  box-shadow:
    0 0 0 2px var(--as-color-surface, light-dark(#ffffff, #1e293b)),
    0 0 0 4px var(--as-color-primary, light-dark(#2563eb, #60a5fa));
}

.as-switch__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: calc(var(--as-switch-height) - 4px);
  height: calc(var(--as-switch-height) - 4px);
  border-radius: 50%;
  background-color: var(--as-color-surface, light-dark(#ffffff, #1e293b));
  box-shadow: var(--as-shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.16));
  transition: transform 0.15s;
}

.as-switch--on .as-switch__thumb {
  transform: translateX(calc(var(--as-switch-width) - var(--as-switch-height)));
}

@media (prefers-reduced-motion: reduce) {
  .as-switch__track,
  .as-switch__thumb {
    transition: none;
  }
}

.as-switch__label {
  cursor: pointer;
}

.as-switch--disabled .as-switch__label {
  cursor: not-allowed;
}
</style>
