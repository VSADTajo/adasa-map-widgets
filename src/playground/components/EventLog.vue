<script setup lang="ts">
export interface LogEntry {
  name: string
  payload?: unknown
  time: string
}

const props = defineProps<{ entries: LogEntry[] }>()
</script>

<template>
  <div class="pg-event-log">
    <p v-if="props.entries.length === 0" class="pg-event-log__empty">
      Interactúa con el componente para ver aquí los eventos emitidos.
    </p>
    <ul v-else class="pg-event-log__list">
      <li v-for="(entry, index) in props.entries" :key="index" class="pg-event-log__item">
        <span class="pg-event-log__time">{{ entry.time }}</span>
        <code class="pg-event-log__name">{{ entry.name }}</code>
        <span v-if="entry.payload !== undefined" class="pg-event-log__payload">
          {{ JSON.stringify(entry.payload) }}
        </span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.pg-event-log {
  font-size: 0.78rem;
}

.pg-event-log__empty {
  margin: 0;
  color: var(--pg-text-muted);
}

.pg-event-log__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 140px;
  overflow-y: auto;
}

.pg-event-log__item {
  display: flex;
  gap: 6px;
  align-items: baseline;
  padding: 3px 6px;
  border-radius: 4px;
  background-color: var(--pg-surface-muted);
}

.pg-event-log__time {
  color: var(--pg-text-muted);
  font-size: 0.68rem;
}

.pg-event-log__name {
  font-weight: 600;
  color: var(--pg-primary);
}

.pg-event-log__payload {
  color: var(--pg-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
