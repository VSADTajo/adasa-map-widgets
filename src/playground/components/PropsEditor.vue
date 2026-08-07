<script setup lang="ts">
import type { PropField } from '../propTypes'

/**
 * Formulario genérico que renderiza un control por cada prop declarada en
 * `schema`, y notifica cambios al padre (que es quien posee el estado real).
 */
const props = defineProps<{
  schema: PropField[]
  /**
   * Valores actuales, indexados por prop. Solo las claves declaradas en
   * `schema` son leídas/escritas por este formulario (siempre primitivas);
   * el objeto puede contener además otras claves no editables aquí (p. ej.
   * estado complejo sincronizado directamente por el propio widget).
   */
  values: Record<string, unknown>
}>()

const emit = defineEmits<{
  'update-field': [key: string, value: string | number | boolean]
}>()

function handleInput(field: PropField, event: Event): void {
  const target = event.target as HTMLInputElement | HTMLSelectElement
  if (field.type === 'boolean') {
    emit('update-field', field.key, (target as HTMLInputElement).checked)
    return
  }
  if (field.type === 'number') {
    emit('update-field', field.key, Number(target.value))
    return
  }
  emit('update-field', field.key, target.value)
}
</script>

<template>
  <form class="pg-props-editor" @submit.prevent>
    <p v-if="props.schema.length === 0" class="pg-props-editor__empty">
      Este componente no tiene props editables en el playground.
    </p>
    <div v-for="field in props.schema" :key="field.key" class="pg-props-editor__field">
      <label class="pg-props-editor__label" :for="`field-${field.key}`">{{ field.label }}</label>

      <select
        v-if="field.type === 'select'"
        :id="`field-${field.key}`"
        class="pg-props-editor__control"
        :value="props.values[field.key]"
        @change="handleInput(field, $event)"
      >
        <option v-for="option in field.options ?? []" :key="option" :value="option">
          {{ option }}
        </option>
      </select>

      <label v-else-if="field.type === 'boolean'" class="pg-props-editor__checkbox">
        <input
          :id="`field-${field.key}`"
          type="checkbox"
          :checked="Boolean(props.values[field.key])"
          @change="handleInput(field, $event)"
        />
        <span>{{ props.values[field.key] ? 'true' : 'false' }}</span>
      </label>

      <input
        v-else-if="field.type === 'number'"
        :id="`field-${field.key}`"
        class="pg-props-editor__control"
        type="number"
        :value="props.values[field.key]"
        :min="field.min"
        :max="field.max"
        :step="field.step ?? 1"
        @input="handleInput(field, $event)"
      />

      <div v-else-if="field.type === 'color'" class="pg-props-editor__color-row">
        <input
          :id="`field-${field.key}`"
          type="color"
          class="pg-props-editor__color-swatch"
          :value="props.values[field.key]"
          @input="handleInput(field, $event)"
        />
        <input
          type="text"
          class="pg-props-editor__control"
          :value="props.values[field.key]"
          :aria-label="`${field.label} (hex)`"
          @input="handleInput(field, $event)"
        />
      </div>

      <input
        v-else
        :id="`field-${field.key}`"
        class="pg-props-editor__control"
        type="text"
        :value="props.values[field.key]"
        @input="handleInput(field, $event)"
      />

      <p v-if="field.description" class="pg-props-editor__hint">{{ field.description }}</p>
    </div>
  </form>
</template>

<style scoped>
.pg-props-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pg-props-editor__empty {
  font-size: 0.85rem;
  color: var(--pg-text-muted);
  margin: 0;
}

.pg-props-editor__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pg-props-editor__label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--pg-text-muted);
}

.pg-props-editor__control {
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid var(--pg-border);
  background-color: var(--pg-surface);
  color: var(--pg-text);
  font-size: 0.85rem;
}

.pg-props-editor__control:focus-visible {
  outline: 2px solid var(--pg-primary);
  outline-offset: 1px;
}

.pg-props-editor__color-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pg-props-editor__color-swatch {
  flex-shrink: 0;
  width: 32px;
  height: 30px;
  padding: 2px;
  border: 1px solid var(--pg-border);
  border-radius: 6px;
  background-color: var(--pg-surface);
  cursor: pointer;
}

.pg-props-editor__checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  cursor: pointer;
}

.pg-props-editor__hint {
  margin: 0;
  font-size: 0.72rem;
  color: var(--pg-text-muted);
}
</style>
