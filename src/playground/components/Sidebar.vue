<script setup lang="ts">
import { computed } from 'vue'
import { registry } from '../registry'

const props = defineProps<{ activeId: string }>()
const emit = defineEmits<{ select: [id: string] }>()

const categories = [
  { key: 'mapping', label: 'Mapping' },
  { key: 'controls', label: 'Controls' },
] as const

const grouped = computed(() =>
  categories
    .map((category) => ({
      ...category,
      items: registry.filter((entry) => entry.category === category.key),
    }))
    .filter((group) => group.items.length > 0),
)
</script>

<template>
  <nav class="pg-sidebar" aria-label="Selector de componentes">
    <div class="pg-sidebar__brand">
      <strong>@adasa/map-widgets</strong>
      <span class="pg-sidebar__version">playground</span>
    </div>
    <div v-for="group in grouped" :key="group.key" class="pg-sidebar__group">
      <h3 class="pg-sidebar__group-title">{{ group.label }}</h3>
      <ul class="pg-sidebar__list">
        <li v-for="item in group.items" :key="item.id">
          <button
            type="button"
            class="pg-sidebar__item"
            :class="{ 'pg-sidebar__item--active': item.id === props.activeId }"
            :aria-current="item.id === props.activeId ? 'true' : undefined"
            @click="emit('select', item.id)"
          >
            {{ item.name }}
          </button>
        </li>
      </ul>
    </div>
  </nav>
</template>

<style scoped>
.pg-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 16px 12px;
  overflow-y: auto;
  height: 100%;
}

.pg-sidebar__brand {
  display: flex;
  flex-direction: column;
  padding: 0 8px 12px;
  border-bottom: 1px solid var(--pg-border);
  font-size: 0.9rem;
}

.pg-sidebar__version {
  font-size: 0.7rem;
  color: var(--pg-text-muted);
}

.pg-sidebar__group-title {
  margin: 0 0 6px 8px;
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--pg-text-muted);
}

.pg-sidebar__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pg-sidebar__item {
  width: 100%;
  text-align: left;
  padding: 8px;
  border: none;
  background: none;
  border-radius: 6px;
  font-size: 0.85rem;
  color: inherit;
  cursor: pointer;
}

.pg-sidebar__item:hover {
  background-color: var(--pg-surface-muted);
}

.pg-sidebar__item--active {
  background-color: var(--pg-primary);
  color: var(--pg-primary-contrast);
}

.pg-sidebar__item:focus-visible {
  outline: 2px solid var(--pg-primary);
  outline-offset: 2px;
}
</style>
