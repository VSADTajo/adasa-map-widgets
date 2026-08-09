<script setup lang="ts">
import { computed, ref } from 'vue'
import MapCanvas from './MapCanvas.vue'
import WidgetPanel from './WidgetPanel.vue'
import type { LogEntry } from './EventLog.vue'
import { widgetRegistry, getWidgetEntry } from '../utils/widgetRegistry'
import { LAYER_TYPE_LABELS, layerExamples } from '../utils/layerExamples'
import type { MapLibraryOption, WidgetPlacement } from '@/types/playground'
import type { WidgetPosition } from '@/types/common'
import type { LayerCapabilities, LayerConfig, LayerLoadedEvent } from '@/types/layers'
import type { LayerCapabilityName } from '@/components/mapping/ASMap.vue'

/**
 * Compositor de widgets sobre un mapa: permite elegir el motor de mapas,
 * añadir instancias de widgets del registro (`widgetRegistry.ts`) en una
 * esquina concreta, y editar sus props en vivo — todo sobre `ASMap` a
 * través de `MapCanvas`. Es el "contenedor principal" del playground de
 * composición, independiente de la galería de un solo componente.
 *
 * También deja activar/desactivar capas dinámicas de ejemplo (una por cada
 * tipo: GeoJSON, WMS, WFS, Tiles, GeoServer — ver `layerExamples.ts`) para
 * probar el sistema de capas de `ASMap` (`useLayerManager`) en el mismo sitio.
 */
const mapLibrary = ref<MapLibraryOption>('leaflet')
const placements = ref<WidgetPlacement[]>([])
const selectedId = ref<string | null>(null)
const eventLog = ref<LogEntry[]>([])

/** Estado en vivo de cada capa de ejemplo activada (se rellena con los eventos de `ASMap`). */
interface LayerStatus {
  state: 'loading' | 'loaded' | 'error'
  capabilities?: LayerCapabilities
  error?: string
}
const activeLayerIds = ref<Set<string>>(new Set())
const layerStatus = ref<Record<string, LayerStatus>>({})

const activeLayers = computed<LayerConfig[]>(() =>
  layerExamples
    .filter((example) => activeLayerIds.value.has(example.config.id))
    .map((example) => example.config),
)

function toggleLayerExample(id: string): void {
  const next = new Set(activeLayerIds.value)
  if (next.has(id)) {
    next.delete(id)
    delete layerStatus.value[id]
  } else {
    next.add(id)
    layerStatus.value[id] = { state: 'loading' }
  }
  activeLayerIds.value = next
}

function onLayerLoaded(event: LayerLoadedEvent): void {
  layerStatus.value[event.layerId] = event.error
    ? { state: 'error', error: event.error.message }
    : { state: 'loaded', capabilities: event.capabilities }
  onLogEvent('ASMap', 'layer-loaded', event)
}

function onLayerError(event: { layerId: string; error: Error }): void {
  layerStatus.value[event.layerId] = { state: 'error', error: event.error.message }
  onLogEvent('ASMap', 'layer-error', event)
}

function onLayerUnloaded(event: { layerId: string }): void {
  delete layerStatus.value[event.layerId]
  onLogEvent('ASMap', 'layer-unloaded', event)
}

function onCapabilityDetected(event: { layerId: string; capability: LayerCapabilityName }): void {
  onLogEvent('ASMap', 'capability-detected', event)
}

const widgetTypeToAdd = ref<string>(widgetRegistry[0]!.id)
const positionToAdd = ref<WidgetPosition>('top-left')

const positions: WidgetPosition[] = [
  'top-left',
  'top-center',
  'top-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
]

function addWidget(): void {
  const entry = getWidgetEntry(widgetTypeToAdd.value)
  if (!entry) return

  const placement: WidgetPlacement = {
    instanceId: crypto.randomUUID(),
    widgetType: entry.id,
    position: positionToAdd.value,
    props: Object.fromEntries(entry.propsSchema.map((field) => [field.key, field.default])),
  }

  placements.value = [...placements.value, placement]
  selectedId.value = placement.instanceId
}

function removeWidget(instanceId: string): void {
  placements.value = placements.value.filter((placement) => placement.instanceId !== instanceId)
  if (selectedId.value === instanceId) selectedId.value = null
}

function selectWidget(instanceId: string): void {
  selectedId.value = instanceId
}

function updateProp(instanceId: string, key: string, value: string | number | boolean): void {
  const placement = placements.value.find((item) => item.instanceId === instanceId)
  if (placement) placement.props[key] = value
}

function onLogEvent(widgetLabel: string, name: string, payload: unknown): void {
  eventLog.value = [
    { name: `${widgetLabel} → ${name}`, payload, time: new Date().toLocaleTimeString('es-ES') },
    ...eventLog.value,
  ].slice(0, 20)
}
</script>

<template>
  <div class="widget-playground">
    <aside class="widget-playground__left" aria-label="Configuración del compositor">
      <section class="widget-playground__section">
        <h2 class="widget-playground__heading">Motor de mapas</h2>
        <div class="widget-playground__radio-group" role="radiogroup" aria-label="Motor de mapas">
          <label
            v-for="lib in ['leaflet', 'maplibre'] as const"
            :key="lib"
            class="widget-playground__radio"
          >
            <input v-model="mapLibrary" type="radio" name="map-library" :value="lib" />
            <span>{{ lib === 'leaflet' ? 'Leaflet' : 'MapLibre GL JS' }}</span>
          </label>
        </div>
      </section>

      <section class="widget-playground__section">
        <h2 class="widget-playground__heading">Añadir widget</h2>

        <label class="widget-playground__field">
          <span>Widget</span>
          <select v-model="widgetTypeToAdd">
            <option v-for="entry in widgetRegistry" :key="entry.id" :value="entry.id">
              {{ entry.label }}
            </option>
          </select>
        </label>

        <label class="widget-playground__field">
          <span>Posición</span>
          <select v-model="positionToAdd">
            <option v-for="position in positions" :key="position" :value="position">
              {{ position }}
            </option>
          </select>
        </label>

        <button type="button" class="widget-playground__add" @click="addWidget">
          + Añadir al mapa
        </button>
      </section>

      <section class="widget-playground__section">
        <h2 class="widget-playground__heading">Capas de ejemplo</h2>
        <ul class="widget-playground__layer-list">
          <li v-for="example in layerExamples" :key="example.config.id">
            <label class="widget-playground__layer" :title="example.description">
              <input
                type="checkbox"
                :checked="activeLayerIds.has(example.config.id)"
                @change="toggleLayerExample(example.config.id)"
              />
              <span class="widget-playground__layer-name">
                {{ LAYER_TYPE_LABELS[example.config.type] }} — {{ example.config.name }}
              </span>
              <span
                v-if="layerStatus[example.config.id]"
                class="widget-playground__layer-status"
                :class="`widget-playground__layer-status--${layerStatus[example.config.id]!.state}`"
              >
                {{ layerStatus[example.config.id]!.state }}
              </span>
            </label>
            <p
              v-if="layerStatus[example.config.id]?.state === 'error'"
              class="widget-playground__layer-error"
            >
              {{ layerStatus[example.config.id]!.error }}
            </p>
            <p
              v-else-if="layerStatus[example.config.id]?.capabilities"
              class="widget-playground__layer-caps"
            >
              {{
                (
                  Object.entries(layerStatus[example.config.id]!.capabilities!).filter(
                    ([key, value]) => key !== 'timeRange' && value,
                  ) as [string, unknown][]
                )
                  .map(([key]) => key)
                  .join(', ') || 'sin capacidades especiales'
              }}
            </p>
          </li>
        </ul>
      </section>
    </aside>

    <main class="widget-playground__canvas">
      <MapCanvas
        :map-library="mapLibrary"
        :placements="placements"
        :selected-id="selectedId"
        :layers="activeLayers"
        @select="selectWidget"
        @log-event="onLogEvent"
        @layer-loaded="onLayerLoaded"
        @layer-error="onLayerError"
        @layer-unloaded="onLayerUnloaded"
        @capability-detected="onCapabilityDetected"
      />
    </main>

    <WidgetPanel
      class="widget-playground__right"
      :placements="placements"
      :selected-id="selectedId"
      :event-log="eventLog"
      @select="selectWidget"
      @remove="removeWidget"
      @update-prop="updateProp"
    />
  </div>
</template>

<style scoped>
.widget-playground {
  display: grid;
  grid-template-columns: 220px 1fr 300px;
  gap: 16px;
  height: 100%;
  min-height: 600px;
}

.widget-playground__left,
.widget-playground__right {
  background-color: var(--pg-surface);
  border: 1px solid var(--pg-border);
  border-radius: 12px;
  padding: 16px;
  overflow-y: auto;
}

.widget-playground__canvas {
  border: 1px solid var(--pg-border);
  border-radius: 12px;
  overflow: hidden;
  min-height: 400px;
}

.widget-playground__section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.widget-playground__heading {
  margin: 0;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--pg-text-muted);
}

.widget-playground__radio-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.widget-playground__radio {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  cursor: pointer;
}

.widget-playground__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--pg-text-muted);
}

.widget-playground__field select {
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid var(--pg-border);
  background-color: var(--pg-surface);
  color: var(--pg-text);
  font-size: 0.85rem;
  font-weight: normal;
}

.widget-playground__add {
  margin-top: 4px;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid var(--pg-primary);
  background-color: var(--pg-primary);
  color: var(--pg-primary-contrast);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.widget-playground__add:hover {
  filter: brightness(1.08);
}

.widget-playground__layer-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.widget-playground__layer {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  cursor: pointer;
}

.widget-playground__layer-name {
  flex: 1;
  min-width: 0;
}

.widget-playground__layer-status {
  flex-shrink: 0;
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  background-color: var(--pg-surface-muted);
  color: var(--pg-text-muted);
}

.widget-playground__layer-status--loaded {
  background-color: #16a34a;
  color: #fff;
}

.widget-playground__layer-status--error {
  background-color: #dc2626;
  color: #fff;
}

.widget-playground__layer-error,
.widget-playground__layer-caps {
  margin: 2px 0 0 22px;
  font-size: 0.7rem;
  color: var(--pg-text-muted);
}

@media (max-width: 1100px) {
  .widget-playground {
    grid-template-columns: 1fr;
    grid-auto-rows: auto;
  }
}
</style>
