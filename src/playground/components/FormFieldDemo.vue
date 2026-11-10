<script setup lang="ts">
import { ref } from 'vue'
import ASFormField from '@/forms/components/ASFormField.vue'
import type { FormFieldProps } from '@/forms/types/FormFieldProps'

/**
 * Ejemplo de `ASFormField` para el playground: envuelve un control que no es
 * de la librería (un `<input type="range">` nativo) para darle etiqueta,
 * ayuda y error enlazados.
 */
const props = defineProps<FormFieldProps>()
const value = ref(40)
</script>

<template>
  <ASFormField v-slot="{ id, describedBy, invalid }" v-bind="props">
    <div class="demo-range">
      <input
        :id="id"
        v-model.number="value"
        type="range"
        min="0"
        max="100"
        :disabled="props.disabled"
        :aria-describedby="describedBy"
        :aria-invalid="invalid || undefined"
      />
      <output :for="id">{{ value }} %</output>
    </div>
  </ASFormField>
</template>

<style scoped>
.demo-range {
  display: flex;
  gap: var(--as-space-3, 12px);
  align-items: center;
}

.demo-range input {
  flex: 1;
  accent-color: var(--as-color-primary, #2563eb);
}

.demo-range output {
  min-width: 3.5em;
  font-variant-numeric: tabular-nums;
  text-align: right;
}
</style>
