<script setup lang="ts">
import type { RegistryEntry } from '../registry'

const props = defineProps<{ entry: RegistryEntry }>()
</script>

<template>
  <div class="pg-docs">
    <span v-if="props.entry.layerKind" class="pg-docs__kind-badge">
      {{ props.entry.layerKind === 'vector' ? 'Vectorial' : 'Ráster' }}
    </span>

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

    <template v-if="props.entry.layerOptionsSchema">
      <h3 class="pg-docs__heading">Opciones de la capa (<code>options</code>)</h3>
      <table class="pg-docs__table">
        <thead>
          <tr>
            <th>Campo</th>
            <th>Tipo</th>
            <th>Descripción</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="field in props.entry.layerOptionsSchema" :key="field.key">
            <td>
              <code>{{ field.key }}{{ field.required ? '' : '?' }}</code>
            </td>
            <td>
              <code>{{ field.type }}</code>
            </td>
            <td>{{ field.description }}</td>
          </tr>
        </tbody>
      </table>
    </template>

    <template v-if="props.entry.layerCapabilities">
      <h3 class="pg-docs__heading">Capacidades detectadas en este ejemplo</h3>
      <ul class="pg-docs__capabilities">
        <li v-for="[key, value] in Object.entries(props.entry.layerCapabilities)" :key="key">
          <code>{{ key }}</code
          >: {{ typeof value === 'boolean' ? (value ? 'sí' : 'no') : JSON.stringify(value) }}
        </li>
      </ul>
    </template>

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

.pg-docs__kind-badge {
  align-self: flex-start;
  padding: 2px 8px;
  border-radius: 999px;
  background-color: var(--pg-surface-muted);
  color: var(--pg-text-muted);
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
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

.pg-docs__capabilities {
  margin: 0;
  padding: 0 0 0 18px;
  font-size: 0.8rem;
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
