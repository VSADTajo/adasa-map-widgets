<script setup lang="ts">
import { computed } from 'vue'
import { useResolvedTheme } from '@/core/composables/useTheme'
import type {
  ButtonToggleEmits,
  ButtonToggleOption,
  ButtonToggleProps,
} from '@/map/types/ButtonToggleProps'

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
  theme: undefined,
})

/** Prop `theme` o, si no se pasa, el tema de `provideTheme` (ver `useResolvedTheme`). */
const resolvedTheme = useResolvedTheme(() => props.theme)

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
    class="as-button-toggle"
    :class="[`as-button-toggle--${props.position}`, `as-button-toggle--${resolvedTheme}`]"
    :style="offsetStyle"
    role="group"
  >
    <button
      v-for="option in props.options"
      :key="option.value"
      type="button"
      class="as-button-toggle__btn"
      :class="{ 'as-button-toggle__btn--active': option.value === activeValue }"
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
.as-button-toggle {
  /* Colores de overlay sobre el mapa: tokens --as-overlay-* (con su valor
     por defecto como fallback). El modo claro/oscuro lo elige color-scheme,
     que fijan las clases --light/--dark según la prop theme. */
  --as-color-text: var(--as-overlay-text, light-dark(#0f172a, #ffffff));
  --as-color-border: var(--as-overlay-border, light-dark(#cbd5e1, rgba(255, 255, 255, 0.45)));
  --as-button-toggle-bg: var(
    --as-overlay-bg,
    light-dark(rgba(255, 255, 255, 0.92), rgba(24, 24, 27, 0.85))
  );
  position: absolute;
  z-index: var(--as-z-map-control, 1000);
  display: inline-flex;
  font-family: var(--as-font-family, system-ui, sans-serif);
  font-size: 0.78rem;
  border: 1px solid var(--as-color-border);
  border-radius: var(--as-radius, 10px);
  overflow: hidden;
  box-shadow: var(--as-shadow, 0 2px 8px rgba(15, 23, 42, 0.16));
}

.as-button-toggle--dark {
  color-scheme: dark;
}

.as-button-toggle--light {
  color-scheme: light;
}

.as-button-toggle__btn {
  padding: 6px 14px;
  border: none;
  border-left: 1px solid var(--as-color-border);
  background-color: var(--as-button-toggle-bg);
  color: var(--as-color-text);
  font: inherit;
  font-weight: 500;
  white-space: nowrap;
  backdrop-filter: blur(10px);
  cursor: pointer;
}

.as-button-toggle__btn:first-child {
  border-left: none;
}

.as-button-toggle__btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.as-button-toggle__btn:focus-visible {
  outline: none;
  box-shadow: inset var(--as-focus-ring, 0 0 0 2px #2563eb);
}

.as-button-toggle__btn--active {
  font-weight: 600;
}
</style>
