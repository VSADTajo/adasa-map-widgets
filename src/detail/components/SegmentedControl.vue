<script setup lang="ts" generic="T extends string">
/**
 * Grupo de botones de selección única (interno del dominio): elegir la serie
 * de `ASObservedSummary` o el agregado de `ASValueMatrix`. Botones nativos
 * con `aria-pressed` dentro de un `role="group"` con nombre.
 */
const props = defineProps<{
  label: string
  options: { value: T; label: string; disabled?: boolean }[]
  modelValue: T | undefined
}>()

const emit = defineEmits<{ 'update:modelValue': [value: T] }>()
</script>

<template>
  <div class="as-segmented" role="group" :aria-label="props.label">
    <button
      v-for="option in props.options"
      :key="option.value"
      type="button"
      class="as-segmented__button"
      :aria-pressed="option.value === props.modelValue"
      :disabled="option.disabled"
      @click="option.value !== props.modelValue && emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
.as-segmented {
  display: inline-flex;
  overflow: hidden;
  border: 1px solid var(--as-color-border, light-dark(#cbd5e1, #475569));
  border-radius: var(--as-radius-sm, 4px);
}

.as-segmented__button {
  height: var(--as-control-height-sm, 28px);
  padding: 0 var(--as-space-3, 12px);
  border: none;
  border-left: 1px solid var(--as-color-border, light-dark(#cbd5e1, #475569));
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: var(--as-font-size-xs, 0.75rem);
  font-weight: var(--as-font-weight-medium, 500);
  cursor: pointer;
}

.as-segmented__button:first-child {
  border-left: none;
}

.as-segmented__button:hover:not(:disabled) {
  background-color: var(--as-color-surface-muted, light-dark(#f1f5f9, #334155));
}

.as-segmented__button[aria-pressed='true'] {
  background-color: var(--as-color-primary, light-dark(#2563eb, #60a5fa));
  color: var(--as-color-primary-contrast, light-dark(#ffffff, #0f172a));
}

.as-segmented__button:focus-visible {
  outline: none;
  box-shadow: inset var(--as-focus-ring, 0 0 0 2px light-dark(#2563eb, #60a5fa));
}

.as-segmented__button[aria-pressed='true']:focus-visible {
  box-shadow: inset 0 0 0 2px var(--as-color-primary-contrast, light-dark(#ffffff, #0f172a));
}

.as-segmented__button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
