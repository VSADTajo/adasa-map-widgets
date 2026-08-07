<script setup lang="ts">
import { computed } from 'vue'
import PropsEditor from './PropsEditor.vue'
import CodePreview from './CodePreview.vue'
import EventLog, { type LogEntry } from './EventLog.vue'
import { getWidgetEntry } from '../utils/widgetRegistry'
import { buildSnippet } from '../propTypes'
import type { WidgetPlacement } from '@/types/playground'

/**
 * Panel derecho del compositor: lista los widgets colocados sobre el mapa
 * (para seleccionarlos/eliminarlos) y, para el seleccionado, muestra su
 * editor de props en vivo, el código Vue generado y el monitor de eventos.
 */
const props = defineProps<{
  placements: WidgetPlacement[]
  selectedId: string | null
  eventLog: LogEntry[]
}>()

const emit = defineEmits<{
  select: [instanceId: string]
  remove: [instanceId: string]
  'update-prop': [instanceId: string, key: string, value: string | number | boolean]
}>()

const selectedPlacement = computed(
  () => props.placements.find((placement) => placement.instanceId === props.selectedId) ?? null,
)

const selectedEntry = computed(() =>
  selectedPlacement.value ? getWidgetEntry(selectedPlacement.value.widgetType) : undefined,
)

const editableProps = computed<Record<string, string | number | boolean>>(
  () => (selectedPlacement.value?.props as Record<string, string | number | boolean>) ?? {},
)

const code = computed(() => {
  if (!selectedPlacement.value || !selectedEntry.value) return ''
  return buildSnippet(
    selectedEntry.value.componentName,
    selectedEntry.value.propsSchema,
    editableProps.value,
  )
})

function handleUpdateField(key: string, value: string | number | boolean): void {
  if (!selectedPlacement.value) return
  emit('update-prop', selectedPlacement.value.instanceId, key, value)
}
</script>

<template>
  <aside class="widget-panel" aria-label="Panel de widgets colocados">
    <section class="widget-panel__section">
      <h2 class="widget-panel__heading">Widgets en el mapa</h2>
      <p v-if="props.placements.length === 0" class="widget-panel__empty">
        Añade un widget desde el panel izquierdo para empezar a componer.
      </p>
      <ul v-else class="widget-panel__list">
        <li v-for="placement in props.placements" :key="placement.instanceId">
          <button
            type="button"
            class="widget-panel__item"
            :class="{ 'widget-panel__item--active': placement.instanceId === props.selectedId }"
            @click="emit('select', placement.instanceId)"
          >
            <span>{{ getWidgetEntry(placement.widgetType)?.label ?? placement.widgetType }}</span>
            <span class="widget-panel__item-position">{{ placement.position }}</span>
          </button>
          <button
            type="button"
            class="widget-panel__remove"
            :aria-label="`Eliminar ${getWidgetEntry(placement.widgetType)?.label ?? placement.widgetType}`"
            @click="emit('remove', placement.instanceId)"
          >
            ✕
          </button>
        </li>
      </ul>
    </section>

    <template v-if="selectedPlacement && selectedEntry">
      <section class="widget-panel__section">
        <h2 class="widget-panel__heading">Props — {{ selectedEntry.label }}</h2>
        <PropsEditor
          :schema="selectedEntry.propsSchema"
          :values="editableProps"
          @update-field="handleUpdateField"
        />
      </section>

      <section class="widget-panel__section">
        <h2 class="widget-panel__heading">Código</h2>
        <CodePreview :code="code" />
      </section>

      <section class="widget-panel__section">
        <h2 class="widget-panel__heading">Eventos emitidos</h2>
        <EventLog :entries="props.eventLog" />
      </section>
    </template>
    <p v-else class="widget-panel__empty">
      Selecciona un widget del mapa o de la lista para editarlo.
    </p>
  </aside>
</template>

<style scoped>
.widget-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  overflow-y: auto;
}

.widget-panel__section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.widget-panel__heading {
  margin: 0;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--pg-text-muted);
}

.widget-panel__empty {
  margin: 0;
  font-size: 0.82rem;
  color: var(--pg-text-muted);
}

.widget-panel__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.widget-panel__list li {
  display: flex;
  align-items: center;
  gap: 6px;
}

.widget-panel__item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  text-align: left;
  padding: 8px 10px;
  border: 1px solid var(--pg-border);
  border-radius: 6px;
  background-color: var(--pg-surface);
  color: var(--pg-text);
  font-size: 0.8rem;
  cursor: pointer;
}

.widget-panel__item--active {
  border-color: var(--pg-primary);
  background-color: var(--pg-surface-muted);
}

.widget-panel__item-position {
  font-size: 0.68rem;
  color: var(--pg-text-muted);
}

.widget-panel__remove {
  border: 1px solid var(--pg-border);
  background: none;
  color: var(--pg-text-muted);
  border-radius: 6px;
  width: 28px;
  height: 28px;
  cursor: pointer;
  flex-shrink: 0;
}

.widget-panel__remove:hover {
  color: var(--pg-text);
  background-color: var(--pg-surface-muted);
}
</style>
