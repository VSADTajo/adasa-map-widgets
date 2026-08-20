<script setup lang="ts">
import { computed } from 'vue'
import type {
  ButtonToggleEmits,
  ButtonToggleOption,
  ButtonToggleProps,
} from '@/types/ButtonToggleProps'

/**
 * Grupo de botones de selección única (el equivalente de este paquete a un
 * `v-btn-toggle` de Vuetify, sin depender de Vuetify: esta librería no exige
 * ningún framework de UI a quien la consume, igual que el resto de widgets).
 * Genérico: `options` son los botones a mostrar, tú decides cuántos y con
 * qué `value`/`label`.
 *
 * Es un componente **controlado**: `modelValue` se usa con `v-model`, y el
 * widget solo emite qué `value` se ha elegido — no gestiona ningún store por
 * su cuenta. Selección obligatoria: siempre hay un botón activo (si
 * `modelValue` no coincide con ninguna opción, se muestra la primera).
 *
 * @example
 * ```vue
 * <ASMap>
 *   <ASMapButtonToggle
 *     :options="[
 *       { value: 'observado', label: 'Observado' },
 *       { value: 'harmonie', label: 'Harmonie' },
 *       { value: 'epsmedio', label: 'EPS Medio' },
 *     ]"
 *     v-model="dataSource"
 *   />
 * </ASMap>
 * ```
 */
const props = withDefaults(defineProps<ButtonToggleProps>(), {
  modelValue: undefined,
  accentColor: '#2563eb',
  position: 'top-left',
  offset: 20,
  theme: 'dark',
})

const emit = defineEmits<ButtonToggleEmits>()

/** El `value` activo real: el que coincide con `modelValue`, o el primero si no coincide con ninguno (selección obligatoria). */
const activeValue = computed(() => {
  const match = props.options.find((option) => option.value === props.modelValue)
  return (match ?? props.options[0])?.value
})

function select(option: ButtonToggleOption): void {
  if (option.disabled || option.value === activeValue.value) return
  emit('update:modelValue', option.value)
}

const offsetStyle = computed(() => {
  const resolved = typeof props.offset === 'number' ? `${props.offset}px` : props.offset
  const [vertical, horizontal] = props.position.split('-') as ['top' | 'bottom', 'left' | 'right']
  return { [vertical]: resolved, [horizontal]: resolved }
})
</script>

<template>
  <div
    class="amw-button-toggle"
    :class="[`amw-button-toggle--${props.position}`, `amw-button-toggle--${props.theme}`]"
    :style="offsetStyle"
    role="group"
  >
    <button
      v-for="option in props.options"
      :key="option.value"
      type="button"
      class="amw-button-toggle__btn"
      :class="{ 'amw-button-toggle__btn--active': option.value === activeValue }"
      :style="
        option.value === activeValue
          ? { backgroundColor: props.accentColor, color: '#ffffff' }
          : undefined
      "
      :disabled="option.disabled"
      :aria-pressed="option.value === activeValue"
      @click="select(option)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
.amw-button-toggle {
  position: absolute;
  z-index: 1000;
  display: inline-flex;
  font-family: var(--amw-font-family, system-ui, sans-serif);
  font-size: 0.78rem;
  border: 1px solid var(--amw-color-border);
  border-radius: var(--amw-radius, 10px);
  overflow: hidden;
  box-shadow: var(--amw-shadow, 0 2px 8px rgba(15, 23, 42, 0.16));
}

.amw-button-toggle--dark {
  --amw-color-text: #ffffff;
  --amw-color-border: rgba(255, 255, 255, 0.45);
  --amw-button-toggle-bg: rgba(24, 24, 27, 0.85);
}

.amw-button-toggle--light {
  --amw-color-text: #0f172a;
  --amw-color-border: #cbd5e1;
  --amw-button-toggle-bg: rgba(255, 255, 255, 0.92);
}

.amw-button-toggle__btn {
  padding: 6px 14px;
  border: none;
  border-left: 1px solid var(--amw-color-border);
  background-color: var(--amw-button-toggle-bg);
  color: var(--amw-color-text);
  font: inherit;
  font-weight: 500;
  white-space: nowrap;
  backdrop-filter: blur(10px);
  cursor: pointer;
}

.amw-button-toggle__btn:first-child {
  border-left: none;
}

.amw-button-toggle__btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.amw-button-toggle__btn:focus-visible {
  outline: none;
  box-shadow: inset var(--amw-focus-ring, 0 0 0 2px #2563eb);
}

.amw-button-toggle__btn--active {
  font-weight: 600;
}
</style>
