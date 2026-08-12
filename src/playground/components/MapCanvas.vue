<script setup lang="ts">
import { ref } from 'vue'
import ASMap, { type LayerCapabilityName, type BasemapOption } from '@/components/mapping/ASMap.vue'
import { getWidgetEntry } from '../utils/widgetRegistry'
import type { MapLibraryOption, WidgetPlacement } from '@/types/playground'
import type { LayerConfig, LayerLoadedEvent } from '@/types/layers'

/**
 * Envuelve `ASMap` y renderiza sobre él los widgets colocados por el usuario
 * en el compositor, cada uno anclado a la esquina elegida en `placement.position`.
 *
 * Los widgets `ASMap*Controls` se autoposicionan en absoluto mediante su
 * propia prop `position`. Dentro del compositor esa autoposición se
 * neutraliza a propósito (ver estilos) para que la esquina elegida en el
 * panel de widgets sea siempre la que gane, de forma uniforme para
 * cualquier widget del registro.
 *
 * También reenvía los eventos de capas dinámicas de `ASMap` (ver `layers`),
 * para que `WidgetPlayground` pueda mostrar su estado en el panel.
 */
const props = defineProps<{
  mapLibrary: MapLibraryOption
  placements: WidgetPlacement[]
  selectedId: string | null
  /** Capas dinámicas a cargar sobre el mapa (ver `layerExamples.ts`). */
  layers: LayerConfig[]
  /** Basemaps disponibles, reenviados tal cual a la prop `basemaps` de `ASMap`. */
  basemaps: BasemapOption[]
  /** Basemap activo, reenviado tal cual a la prop `basemap` de `ASMap`. */
  basemap: string
}>()

const emit = defineEmits<{
  /** El usuario hizo click sobre un widget colocado, para seleccionarlo en el panel. */
  select: [instanceId: string]
  /** Un widget colocado emitió un evento (reenviado al monitor de eventos del compositor). */
  'log-event': [widgetLabel: string, name: string, payload: unknown]
  'layer-loaded': [event: LayerLoadedEvent]
  'layer-error': [event: { layerId: string; error: Error }]
  'layer-unloaded': [event: { layerId: string }]
  'capability-detected': [event: { layerId: string; capability: LayerCapabilityName }]
  /** El basemap activo cambió (desde un `ASMapBasemapsSelector` colocado). */
  'update:basemap': [id: string]
}>()

/** Centro/zoom reales de este `ASMap` (a diferencia de antes, ya no son fijos: se leen y escriben con `v-model` en el template). */
const liveCenter = ref<[number, number]>([40.4168, -3.7038])
const liveZoom = ref(6)

function resolveListeners(
  placement: WidgetPlacement,
): Record<string, (...args: unknown[]) => void> {
  const entry = getWidgetEntry(placement.widgetType)
  if (!entry?.bindings) return {}
  return entry.bindings(placement.props, (name, payload) => {
    emit('log-event', entry.label, name, payload)
  })
}

/**
 * Props+listeners de un widget colocado. Casos especiales:
 * - `basemaps-selector`: en vez de su propio `basemap` de demo desconectado,
 *   recibe/gobierna el `basemaps`/`basemap` reales de este mismo `ASMap`, para
 *   que elegir uno cambie de verdad el mapa base (no solo quede registrado en
 *   el log de eventos).
 * - `scale`: en vez de su `center`/`zoom` de demo fijos, recibe el
 *   `center`/`zoom` reales de este mismo `ASMap` (`liveCenter`/`liveZoom`),
 *   para que la escala cambie de verdad al hacer scroll/zoom en el mapa.
 * - `legend`: en vez de su `layers` de demo (vacío), recibe las `layers`
 *   reales activas en este mismo `ASMap`, para que muestre de verdad la
 *   leyenda de lo que esté activado en "Capas de ejemplo".
 */
function resolvePlacementProps(placement: WidgetPlacement): Record<string, unknown> {
  const entry = getWidgetEntry(placement.widgetType)
  const listeners = resolveListeners(placement)
  const merged: Record<string, unknown> = {
    ...entry?.staticProps?.(),
    ...placement.props,
    ...listeners,
  }
  if (placement.widgetType === 'basemaps-selector') {
    merged.basemaps = props.basemaps
    merged.basemap = props.basemap
    merged['onUpdate:basemap'] = (id: string) => {
      ;(listeners['onUpdate:basemap'] as ((id: string) => void) | undefined)?.(id)
      emit('update:basemap', id)
    }
  }
  if (placement.widgetType === 'scale') {
    merged.center = liveCenter.value
    merged.zoom = liveZoom.value
  }
  if (placement.widgetType === 'legend') {
    merged.layers = props.layers
  }
  return merged
}
</script>

<template>
  <ASMap
    v-model:center="liveCenter"
    v-model:zoom="liveZoom"
    class="map-canvas"
    :map-library="props.mapLibrary"
    :layers="props.layers"
    :basemaps="props.basemaps"
    :basemap="props.basemap"
    @layer-loaded="(event) => emit('layer-loaded', event)"
    @layer-error="(event) => emit('layer-error', event)"
    @layer-unloaded="(event) => emit('layer-unloaded', event)"
    @capability-detected="(event) => emit('capability-detected', event)"
    @update:basemap="(id) => emit('update:basemap', id)"
  >
    <div
      v-for="placement in props.placements"
      :key="placement.instanceId"
      class="map-canvas__slot"
      :class="[
        `map-canvas__slot--${placement.position}`,
        { 'map-canvas__slot--selected': placement.instanceId === props.selectedId },
      ]"
      @click="emit('select', placement.instanceId)"
    >
      <component
        :is="getWidgetEntry(placement.widgetType)?.component"
        v-bind="resolvePlacementProps(placement)"
      />
    </div>
  </ASMap>
</template>

<style scoped>
.map-canvas {
  width: 100%;
  height: 100%;
}

.map-canvas__slot {
  position: absolute;
  cursor: pointer;
  border-radius: 8px;
}

.map-canvas__slot--top-left {
  top: 16px;
  left: 16px;
}

.map-canvas__slot--top-center {
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
}

.map-canvas__slot--top-right {
  top: 16px;
  right: 16px;
}

.map-canvas__slot--bottom-left {
  bottom: 16px;
  left: 16px;
}

.map-canvas__slot--bottom-center {
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
}

.map-canvas__slot--bottom-right {
  bottom: 16px;
  right: 16px;
}

.map-canvas__slot--selected {
  outline: 2px dashed var(--pg-primary);
  outline-offset: 4px;
}

/*
 * Los widgets `ASMap*Controls` se autoposicionan usando `position: absolute`
 * internamente. Se neutraliza aquí para que sea siempre `.map-canvas__slot--*`
 * quien decida la esquina, de forma uniforme para cualquier widget del registro.
 */
.map-canvas__slot > :deep(*) {
  position: static !important;
  top: auto !important;
  right: auto !important;
  bottom: auto !important;
  left: auto !important;
  transform: none !important;
}
</style>
