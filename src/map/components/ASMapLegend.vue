<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useResolvedTheme } from '@/core/composables/useTheme'
import type { LegendProps } from '@/map/types/LegendProps'
import type { LayerConfig } from '@/map/types/layers'
import type { LegendItem, LegendRamp } from '@/map/types/legend'
import { generateLegend, getLegendCapabilities } from '@/map/legend'

/**
 * Leyenda de las capas dinámicas del mapa: por cada capa de `layers` genera
 * su leyenda con el adapter correspondiente (`src/map/legend/`), y la muestra
 * como una lista de símbolos, una imagen ya renderizada por el servidor
 * (WMS `GetLegendGraphic`) o un degradado continuo (p. ej. un COG con
 * `colorScale`), según lo que devuelva ese adapter.
 *
 * Es un componente **controlado** y agnóstico del motor de mapas: no lee el
 * mapa ni sus capas ya renderizadas, recibe `layers` como prop — el mismo
 * array que ya tienes en la prop `layers` de `ASMap`. Las capas sin leyenda
 * generable (Tiles/WMTS, un COG sin `colorScale`...) no aparecen.
 *
 * @example
 * ```vue
 * <ASMap :layers="layers">
 *   <ASMapLegend :layers="layers" />
 * </ASMap>
 * ```
 */
const props = withDefaults(defineProps<LegendProps>(), {
  title: 'Leyenda',
  collapsible: true,
  position: 'bottom-right',
  offset: 20,
  theme: undefined,
})

/** Prop `theme` o, si no se pasa, el tema de `provideTheme` (ver `useResolvedTheme`). */
const resolvedTheme = useResolvedTheme(() => props.theme)

interface LegendSection {
  layerId: string
  layerName: string
  result: LegendItem[] | LegendRamp
}

const sections = ref<LegendSection[]>([])
const collapsed = ref(false)

async function resolveSections(layers: LayerConfig[]): Promise<void> {
  const candidates = layers.filter((layer) => getLegendCapabilities(layer).canGenerateLegend)
  const resolved = await Promise.all(
    candidates.map(async (layer) => ({
      layerId: layer.id,
      layerName: layer.name,
      result: await generateLegend(layer),
    })),
  )
  sections.value = resolved.filter(
    (section) => !Array.isArray(section.result) || section.result.length > 0,
  )
}

watch(
  () => props.layers,
  (layers) => void resolveSections(layers),
  { immediate: true, deep: true },
)

function isRamp(result: LegendItem[] | LegendRamp): result is LegendRamp {
  return !Array.isArray(result)
}

/** Degradado CSS a partir de las muestras de una `LegendRamp` — mismos colores que pinta la propia capa. */
function rampGradient(ramp: LegendRamp): string {
  const stops = ramp.steps.map(
    (step, index) => `${step.color} ${(index / (ramp.steps.length - 1)) * 100}%`,
  )
  return `linear-gradient(to right, ${stops.join(', ')})`
}

const offsetStyle = computed(() => {
  const resolved = typeof props.offset === 'number' ? `${props.offset}px` : props.offset
  const [vertical, horizontal] = props.position.split('-') as ['top' | 'bottom', 'left' | 'right']
  return { [vertical]: resolved, [horizontal]: resolved }
})
</script>

<template>
  <div
    class="as-legend"
    :class="[`as-legend--${props.position}`, `as-legend--${resolvedTheme}`]"
    :style="offsetStyle"
  >
    <div class="as-legend__header">
      <span class="as-legend__title">{{ props.title }}</span>
      <button
        v-if="props.collapsible"
        type="button"
        class="as-legend__toggle"
        :aria-label="collapsed ? 'Expandir leyenda' : 'Colapsar leyenda'"
        :aria-expanded="!collapsed"
        @click="collapsed = !collapsed"
      >
        {{ collapsed ? '▸' : '▾' }}
      </button>
    </div>

    <div v-if="!collapsed" class="as-legend__body">
      <p v-if="sections.length === 0" class="as-legend__empty">Sin leyenda disponible.</p>

      <section v-for="section in sections" :key="section.layerId" class="as-legend__section">
        <h4 class="as-legend__section-title">{{ section.layerName }}</h4>

        <div v-if="isRamp(section.result)" class="as-legend__ramp">
          <div class="as-legend__ramp-bar" :style="{ background: rampGradient(section.result) }" />
          <div class="as-legend__ramp-labels">
            <span v-for="step in section.result.steps" :key="step.id">{{ step.label }}</span>
          </div>
        </div>

        <ul v-else class="as-legend__items">
          <li v-for="item in section.result" :key="item.id" class="as-legend__item">
            <img
              v-if="item.type === 'image' && item.image"
              class="as-legend__item-image"
              :src="item.image"
              :alt="item.label"
            />
            <span
              v-else-if="item.symbol"
              class="as-legend__item-swatch"
              :class="`as-legend__item-swatch--${item.symbol.type}`"
              :style="{
                backgroundColor: item.symbol.color,
                borderColor: item.symbol.strokeColor,
                opacity: item.symbol.opacity,
              }"
            />
            <span class="as-legend__item-label">{{ item.label }}</span>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped>
.as-legend {
  position: absolute;
  z-index: 1000;
  min-width: 180px;
  max-width: 260px;
  font-family: var(--as-font-family, system-ui, sans-serif);
  font-size: 0.78rem;
  color: var(--as-color-text);
  background-color: var(--as-legend-bg);
  border: 1px solid var(--as-color-border);
  border-radius: var(--as-radius, 10px);
  backdrop-filter: blur(10px);
  box-shadow: var(--as-shadow, 0 2px 8px rgba(15, 23, 42, 0.16));
  overflow: hidden;
}

.as-legend--dark {
  --as-color-text: #ffffff;
  --as-color-text-muted: rgba(255, 255, 255, 0.8);
  --as-color-border: rgba(255, 255, 255, 0.45);
  --as-legend-bg: rgba(24, 24, 27, 0.85);
}

.as-legend--light {
  --as-color-text: #0f172a;
  --as-color-text-muted: #64748b;
  --as-color-border: #cbd5e1;
  --as-legend-bg: rgba(255, 255, 255, 0.92);
}

.as-legend__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--as-color-border);
}

.as-legend__title {
  font-weight: 600;
}

.as-legend__toggle {
  border: none;
  background: none;
  color: inherit;
  font-size: 0.9rem;
  line-height: 1;
  cursor: pointer;
  padding: 2px 4px;
}

.as-legend__toggle:focus-visible {
  outline: none;
  box-shadow: var(--as-focus-ring, 0 0 0 2px #2563eb);
}

.as-legend__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 280px;
  overflow-y: auto;
  padding: 8px 10px;
}

.as-legend__empty {
  margin: 0;
  color: var(--as-color-text-muted);
}

.as-legend__section-title {
  margin: 0 0 4px;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--as-color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.as-legend__items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.as-legend__item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.as-legend__item-swatch {
  display: inline-block;
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  border: 1px solid var(--as-color-border);
}

.as-legend__item-swatch--circle {
  border-radius: 50%;
}

.as-legend__item-swatch--square,
.as-legend__item-swatch--polygon {
  border-radius: 2px;
}

.as-legend__item-swatch--line {
  width: 16px;
  height: 3px;
  border: none;
  border-radius: 1px;
}

.as-legend__item-image {
  max-width: 100%;
  height: auto;
}

.as-legend__item-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.as-legend__ramp-bar {
  height: 10px;
  border: 1px solid var(--as-color-border);
  border-radius: 2px;
}

.as-legend__ramp-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 3px;
  font-size: 0.68rem;
  color: var(--as-color-text-muted);
}
</style>
