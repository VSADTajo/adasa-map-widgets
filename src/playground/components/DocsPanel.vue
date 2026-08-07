<script setup lang="ts">
import type { RegistryEntry } from '../registry'

const props = defineProps<{ entry: RegistryEntry }>()
</script>

<template>
  <div class="pg-docs">
    <p class="pg-docs__description">{{ props.entry.description }}</p>

    <p v-if="props.entry.notes" class="pg-docs__note">ℹ️ {{ props.entry.notes }}</p>

    <h3 class="pg-docs__heading">Props</h3>
    <table v-if="props.entry.propsSchema.length" class="pg-docs__table">
      <thead>
        <tr>
          <th>Prop</th>
          <th>Tipo</th>
          <th>Default</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="field in props.entry.propsSchema" :key="field.key">
          <td>
            <code>{{ field.key }}</code>
          </td>
          <td>{{ field.type }}</td>
          <td>
            <code>{{ String(field.default) }}</code>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-else class="pg-docs__empty">Sin props editables en este playground.</p>

    <h3 class="pg-docs__heading">Eventos</h3>
    <table v-if="props.entry.events.length" class="pg-docs__table">
      <thead>
        <tr>
          <th>Evento</th>
          <th>Payload</th>
          <th>Descripción</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="event in props.entry.events" :key="event.name">
          <td>
            <code>{{ event.name }}</code>
          </td>
          <td>
            <code>{{ event.payload ?? '—' }}</code>
          </td>
          <td>{{ event.description }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else class="pg-docs__empty">Este componente no emite eventos propios.</p>
  </div>
</template>

<style scoped>
.pg-docs {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.85rem;
}

.pg-docs__description {
  margin: 0;
  color: var(--pg-text);
}

.pg-docs__note {
  margin: 0;
  padding: 8px 10px;
  border-radius: 6px;
  background-color: var(--pg-surface-muted);
  font-size: 0.78rem;
  color: var(--pg-text-muted);
}

.pg-docs__heading {
  margin: 8px 0 2px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--pg-text-muted);
}

.pg-docs__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
}

.pg-docs__table th,
.pg-docs__table td {
  text-align: left;
  padding: 4px 6px;
  border-bottom: 1px solid var(--pg-border);
  vertical-align: top;
}

.pg-docs__empty {
  margin: 0;
  font-size: 0.78rem;
  color: var(--pg-text-muted);
}
</style>
