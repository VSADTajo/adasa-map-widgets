<script setup lang="ts">
import { ref, watch } from 'vue'

/**
 * Editor de una prop compleja (array u objeto) como JSON. Mientras el texto
 * no es JSON válido, se queda el último valor bueno y se muestra el error.
 */
const props = defineProps<{ id: string; value: unknown }>()
const emit = defineEmits<{ change: [value: unknown] }>()

const format = (value: unknown): string => JSON.stringify(value ?? null, null, 2)

const text = ref(format(props.value))
const error = ref('')

// Si el valor cambia desde fuera (otra entrada, reinicio), se reescribe el
// texto; si es el que acaba de salir de aquí, no, para no mover el cursor.
watch(
  () => props.value,
  (value) => {
    let current: unknown
    try {
      current = JSON.parse(text.value)
    } catch {
      current = undefined
    }
    if (JSON.stringify(current) !== JSON.stringify(value)) {
      text.value = format(value)
      error.value = ''
    }
  },
)

function onInput(event: Event): void {
  text.value = (event.target as HTMLTextAreaElement).value
  try {
    const parsed: unknown = JSON.parse(text.value)
    error.value = ''
    emit('change', parsed)
  } catch (cause) {
    error.value = (cause as Error).message
  }
}
</script>

<template>
  <div class="pg-json-field">
    <textarea
      :id="props.id"
      class="pg-json-field__text"
      :class="{ 'pg-json-field__text--invalid': error }"
      :value="text"
      rows="12"
      spellcheck="false"
      :aria-invalid="Boolean(error)"
      :aria-describedby="error ? `${props.id}-error` : undefined"
      @input="onInput"
    />
    <p v-if="error" :id="`${props.id}-error`" class="pg-json-field__error" role="alert">
      JSON no válido: {{ error }}. Se mantiene el último valor correcto.
    </p>
  </div>
</template>

<style scoped>
.pg-json-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pg-json-field__text {
  min-height: 160px;
  padding: 6px 8px;
  border: 1px solid var(--pg-border);
  border-radius: 6px;
  background-color: var(--pg-surface);
  color: var(--pg-text);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.75rem;
  line-height: 1.45;
  resize: vertical;
  tab-size: 2;
}

.pg-json-field__text:focus-visible {
  outline: 2px solid var(--pg-primary);
  outline-offset: 1px;
}

.pg-json-field__text--invalid {
  border-color: #dc2626;
}

.pg-json-field__error {
  margin: 0;
  font-size: 0.72rem;
  color: #dc2626;
}
</style>
