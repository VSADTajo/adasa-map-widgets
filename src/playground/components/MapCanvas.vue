<script setup lang="ts">
import ASMap from '@/components/mapping/ASMap.vue'
import { getWidgetEntry } from '../utils/widgetRegistry'
import type { MapLibraryOption, WidgetPlacement } from '@/types/playground'

/**
 * Envuelve `ASMap` y renderiza sobre él los widgets colocados por el usuario
 * en el compositor, cada uno anclado a la esquina elegida en `placement.position`.
 *
 * Los widgets `ASMap*Controls` se autoposicionan en absoluto mediante su
 * propia prop `position`. Dentro del compositor esa autoposición se
 * neutraliza a propósito (ver estilos) para que la esquina elegida en el
 * panel de widgets sea siempre la que gane, de forma uniforme para
 * cualquier widget del registro.
 */
const props = defineProps<{
  mapLibrary: MapLibraryOption
  placements: WidgetPlacement[]
  selectedId: string | null
}>()

const emit = defineEmits<{
  /** El usuario hizo click sobre un widget colocado, para seleccionarlo en el panel. */
  select: [instanceId: string]
  /** Un widget colocado emitió un evento (reenviado al monitor de eventos del compositor). */
  'log-event': [widgetLabel: string, name: string, payload: unknown]
}>()

function resolveListeners(
  placement: WidgetPlacement,
): Record<string, (...args: unknown[]) => void> {
  const entry = getWidgetEntry(placement.widgetType)
  if (!entry?.bindings) return {}
  return entry.bindings(placement.props, (name, payload) => {
    emit('log-event', entry.label, name, payload)
  })
}
</script>

<template>
  <ASMap class="map-canvas" :map-library="props.mapLibrary" :center="[40.4168, -3.7038]" :zoom="6">
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
        v-bind="{
          ...getWidgetEntry(placement.widgetType)?.staticProps?.(),
          ...placement.props,
          ...resolveListeners(placement),
        }"
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
