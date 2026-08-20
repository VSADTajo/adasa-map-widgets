<script setup lang="ts">
import { computed } from 'vue'
import { registry, type RegistryEntry } from '../registry'
import type { LayerKind } from '@/types/layers'

const props = defineProps<{ activeId: string }>()
const emit = defineEmits<{ select: [id: string] }>()

const categories = [
  { key: 'mapping', label: 'Mapping' },
  { key: 'controls', label: 'Controls' },
  { key: 'layers', label: 'Layers' },
] as const

/** Subgrupos dentro de la categoría 'layers': vectoriales antes que ráster. */
const LAYER_KIND_LABELS: Record<LayerKind, string> = {
  vector: 'Vectoriales',
  raster: 'Ráster',
}

interface Subgroup {
  key: string
  /** `null` = sin subtítulo visible (categorías que no se subdividen). */
  label: string | null
  items: RegistryEntry[]
}

/**
 * Cada categoría se divide en subgrupos: para 'layers', por `layerKind`
 * (vector/raster, ver `src/types/layers.ts`); para el resto, un único
 * subgrupo sin subtítulo. Así, cuando se añadan más tipos de capa, solo hace
 * falta que declaren su `layerKind` para encajar en el sitio correcto.
 */
const grouped = computed(() =>
  categories
    .map((category) => {
      const items = registry.filter((entry) => entry.category === category.key)
      const subgroups: Subgroup[] =
        category.key === 'layers'
          ? (['vector', 'raster'] as const)
              .map((kind) => ({
                key: kind,
                label: LAYER_KIND_LABELS[kind],
                items: items.filter((entry) => entry.layerKind === kind),
              }))
              .filter((subgroup) => subgroup.items.length > 0)
          : [{ key: 'all', label: null, items }]
      return { key: category.key, label: category.label, subgroups }
    })
    .filter((group) => group.subgroups.length > 0),
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
      <div v-for="subgroup in group.subgroups" :key="subgroup.key" class="pg-sidebar__subgroup">
        <h4 v-if="subgroup.label" class="pg-sidebar__subgroup-title">{{ subgroup.label }}</h4>
        <ul class="pg-sidebar__list">
          <li v-for="item in subgroup.items" :key="item.id">
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

.pg-sidebar__subgroup {
  margin-bottom: 8px;
}

.pg-sidebar__subgroup-title {
  margin: 0 0 4px 8px;
  font-size: 0.65rem;
  letter-spacing: 0.04em;
  color: var(--pg-text-muted);
  opacity: 0.8;
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
