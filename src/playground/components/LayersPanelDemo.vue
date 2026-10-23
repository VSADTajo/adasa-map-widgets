<script setup lang="ts">
import { computed, ref } from 'vue'
import ASCollapsible from '@/forms/components/ASCollapsible.vue'
import ASTreeList from '@/forms/components/ASTreeList.vue'
import type { TreeNode } from '@/forms/types/TreeListProps'
import ASAppPanelHeader from '@/layout/components/ASAppPanelHeader.vue'
import ASMap from '@/map/components/ASMap.vue'
import { PANEL_STATION_TREE, PANEL_ZONE_TREE, panelLayers } from '../utils/treeListExample'

/**
 * Ejemplo combinado: un panel lateral (como el de una sección de
 * `ASAppShell`) con `ASCollapsible` + `ASTreeList` que enciende capas de
 * `ASMap`. Zonas con selección única, estaciones con selección múltiple y
 * opacidad, y eventos pasados que se "cargan" al desplegarlos.
 */
const props = withDefaults(defineProps<{ dense?: boolean; theme?: 'light' | 'dark' }>(), {
  dense: false,
  theme: undefined,
})
const emit = defineEmits<{ log: [name: string, payload?: unknown] }>()

const zones = ref<string[]>(['subcuencas'])
const stations = ref<string[]>(['AR', 'E'])
const opacities = ref<Record<string, number>>({ E: 0.6 })
const scenario = ref<string[]>([])

const layers = computed(() => panelLayers([...zones.value, ...stations.value], opacities.value))

/** Eventos: se piden al desplegar el grupo (aquí, un retardo simulado). */
const events = ref<TreeNode[]>([])
const loadingEvents = ref(false)
const eventsTree = computed<TreeNode[]>(() => [
  {
    id: 'eventos',
    label: 'Eventos pasados',
    children: events.value,
    emptyText: loadingEvents.value ? 'Cargando eventos…' : 'No hay eventos guardados',
  },
])

function loadEvents(node: TreeNode): void {
  emit('log', 'expand', node.id)
  if (node.id !== 'eventos' || events.value.length || loadingEvents.value) return
  loadingEvents.value = true
  setTimeout(() => {
    events.value = [
      { id: 'ev-2023', label: 'Avenida de diciembre de 2023', description: 'Tajo en Toledo' },
      { id: 'ev-2021', label: 'Borrasca Filomena', description: 'Enero de 2021' },
    ].map((event) => ({
      ...event,
      actions: [
        { id: 'borrar', label: `Borrar ${event.label}`, icon: 'mdi:delete-outline', danger: true },
      ],
    }))
    loadingEvents.value = false
  }, 900)
}

function onAction({ node, action }: { node: TreeNode; action: string }): void {
  emit('log', 'node-action', { node: node.id, action })
  if (action === 'borrar') events.value = events.value.filter((event) => event.id !== node.id)
}
</script>

<template>
  <div class="layers-demo">
    <aside class="layers-demo__panel" :class="props.theme && `as-${props.theme}`">
      <ASAppPanelHeader title="Capas" />
      <div class="layers-demo__groups">
        <ASCollapsible title="Zonas" :badge="zones.length" :theme="props.theme">
          <ASTreeList
            v-model="zones"
            :items="PANEL_ZONE_TREE"
            selection="single"
            label="Zonas"
            :dense="props.dense"
            :theme="props.theme"
            @update:model-value="emit('log', 'zonas', $event)"
          />
        </ASCollapsible>
        <ASCollapsible title="Estaciones" :badge="stations.length" :theme="props.theme">
          <ASTreeList
            v-model="stations"
            v-model:opacities="opacities"
            :items="PANEL_STATION_TREE"
            label="Capas de estaciones"
            :dense="props.dense"
            :theme="props.theme"
            @update:model-value="emit('log', 'estaciones', $event)"
            @update:opacities="emit('log', 'opacidades', $event)"
          />
        </ASCollapsible>
        <ASCollapsible title="Escenarios" :default-open="false" :theme="props.theme">
          <ASTreeList
            v-model="scenario"
            :items="eventsTree"
            selection="single"
            label="Eventos pasados"
            :dense="props.dense"
            :theme="props.theme"
            @expand="loadEvents"
            @node-action="onAction"
          />
        </ASCollapsible>
      </div>
    </aside>
    <ASMap
      class="layers-demo__map"
      map-library="leaflet"
      :center="[40.1, -4.1]"
      :zoom="7"
      :layers="layers"
    />
  </div>
</template>

<style scoped>
.layers-demo {
  display: grid;
  grid-template-columns: minmax(260px, 320px) 1fr;
  height: 600px;
  border-radius: 8px;
  overflow: hidden;
}

.layers-demo__panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--as-color-surface-muted, light-dark(#f1f5f9, #334155));
  color: var(--as-color-text, light-dark(#0f172a, #f1f5f9));
}

.layers-demo__groups {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 12px 12px;
  overflow-y: auto;
}

.layers-demo__map {
  min-height: 0;
}

@media (max-width: 640px) {
  .layers-demo {
    grid-template-columns: 1fr;
    grid-template-rows: auto 300px;
    height: auto;
  }
}
</style>
