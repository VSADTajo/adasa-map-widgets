<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { LegendProps } from '@/types/LegendProps'
import type { LayerConfig } from '@/types/layers'
import type { LegendItem, LegendRamp } from '@/types/legend'
import { generateLegend, getLegendCapabilities } from '@/legend'

/**
 * Leyenda de las capas dinámicas del mapa: por cada capa de `layers` genera
 * su leyenda con el adapter correspondiente (`src/legend/`), y la muestra
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
  theme: 'dark',
})

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
    class="amw-legend"
    :class="[`amw-legend--${props.position}`, `amw-legend--${props.theme}`]"
    :style="offsetStyle"
  >
    <div class="amw-legend__header">
      <span class="amw-legend__title">{{ props.title }}</span>
      <button
        v-if="props.collapsible"
        type="button"
        class="amw-legend__toggle"
        :aria-label="collapsed ? 'Expandir leyenda' : 'Colapsar leyenda'"
        :aria-expanded="!collapsed"
        @click="collapsed = !collapsed"
      >
        {{ collapsed ? '▸' : '▾' }}
      </button>
    </div>

    <div v-if="!collapsed" class="amw-legend__body">
      <p v-if="sections.length === 0" class="amw-legend__empty">Sin leyenda disponible.</p>

      <section v-for="section in sections" :key="section.layerId" class="amw-legend__section">
        <h4 class="amw-legend__section-title">{{ section.layerName }}</h4>

        <div v-if="isRamp(section.result)" class="amw-legend__ramp">
          <div class="amw-legend__ramp-bar" :style="{ background: rampGradient(section.result) }" />
          <div class="amw-legend__ramp-labels">
            <span v-for="step in section.result.steps" :key="step.id">{{ step.label }}</span>
          </div>
        </div>

        <ul v-else class="amw-legend__items">
          <li v-for="item in section.result" :key="item.id" class="amw-legend__item">
            <img
              v-if="item.type === 'image' && item.image"
              class="amw-legend__item-image"
              :src="item.image"
              :alt="item.label"
            />
            <span
              v-else-if="item.symbol"
              class="amw-legend__item-swatch"
              :class="`amw-legend__item-swatch--${item.symbol.type}`"
              :style="{
                backgroundColor: item.symbol.color,
                borderColor: item.symbol.strokeColor,
                opacity: item.symbol.opacity,
              }"
            />
            <span class="amw-legend__item-label">{{ item.label }}</span>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped>
.amw-legend {
  position: absolute;
  z-index: 1000;
  min-width: 180px;
  max-width: 260px;
  font-family: var(--amw-font-family, system-ui, sans-serif);
  font-size: 0.78rem;
  color: var(--amw-color-text);
  background-color: var(--amw-legend-bg);
  border: 1px solid var(--amw-color-border);
  border-radius: var(--amw-radius, 10px);
  backdrop-filter: blur(10px);
  box-shadow: var(--amw-shadow, 0 2px 8px rgba(15, 23, 42, 0.16));
  overflow: hidden;
}

.amw-legend--dark {
  --amw-color-text: #ffffff;
  --amw-color-text-muted: rgba(255, 255, 255, 0.8);
  --amw-color-border: rgba(255, 255, 255, 0.45);
  --amw-legend-bg: rgba(24, 24, 27, 0.85);
}

.amw-legend--light {
  --amw-color-text: #0f172a;
  --amw-color-text-muted: #64748b;
  --amw-color-border: #cbd5e1;
  --amw-legend-bg: rgba(255, 255, 255, 0.92);
}

.amw-legend__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--amw-color-border);
}

.amw-legend__title {
  font-weight: 600;
}

.amw-legend__toggle {
  border: none;
  background: none;
  color: inherit;
  font-size: 0.9rem;
  line-height: 1;
  cursor: pointer;
  padding: 2px 4px;
}

.amw-legend__toggle:focus-visible {
  outline: none;
  box-shadow: var(--amw-focus-ring, 0 0 0 2px #2563eb);
}

.amw-legend__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 280px;
  overflow-y: auto;
  padding: 8px 10px;
}

.amw-legend__empty {
  margin: 0;
  color: var(--amw-color-text-muted);
}

.amw-legend__section-title {
  margin: 0 0 4px;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--amw-color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.amw-legend__items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.amw-legend__item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.amw-legend__item-swatch {
  display: inline-block;
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  border: 1px solid var(--amw-color-border);
}

.amw-legend__item-swatch--circle {
  border-radius: 50%;
}

.amw-legend__item-swatch--square,
.amw-legend__item-swatch--polygon {
  border-radius: 2px;
}

.amw-legend__item-swatch--line {
  width: 16px;
  height: 3px;
  border: none;
  border-radius: 1px;
}

.amw-legend__item-image {
  max-width: 100%;
  height: auto;
}

.amw-legend__item-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.amw-legend__ramp-bar {
  height: 10px;
  border: 1px solid var(--amw-color-border);
  border-radius: 2px;
}

.amw-legend__ramp-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 3px;
  font-size: 0.68rem;
  color: var(--amw-color-text-muted);
}
</style>
