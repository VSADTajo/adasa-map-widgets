<script setup lang="ts">
import { computed } from 'vue'
import type { ScaleProps } from '@/types/ScaleProps'
import {
  computeImperialScaleBar,
  computeMetricScaleBar,
  computeScaleRatio,
  metersPerPixel,
} from '@/utils/mapScale'

/**
 * Indicador de escala del mapa: una regla graduada (`mode: 'bar'`, por
 * defecto — segmentos alternos y una marca cada 25% de su longitud, como un
 * control de escala cartográfico normal) o una razón numérica tipo
 * `1 : 50 000` (`mode: 'numeric'`).
 *
 * Es un componente **controlado** y agnóstico del motor de mapas subyacente:
 * no lee el mapa directamente, recibe `center`/`zoom` como props — los
 * mismos valores que ya tienes en `v-model:center`/`v-model:zoom` de `ASMap`
 * — y se recalcula automáticamente cada vez que cambian (p. ej. al hacer
 * zoom). El cálculo (metros por píxel en Web Mercator) es el mismo para
 * Leaflet y MapLibre, así que no hace falta indicar el motor.
 *
 * @example
 * ```vue
 * <ASMap v-model:center="center" v-model:zoom="zoom">
 *   <ASMapScale :center="center" :zoom="zoom" />
 * </ASMap>
 * ```
 */
const props = withDefaults(defineProps<ScaleProps>(), {
  mode: 'bar',
  units: 'metric',
  width: 100,
  position: 'bottom-left',
  offset: 20,
  theme: 'dark',
})

/** Número de segmentos (y de marcas intermedias) de la regla graduada. */
const SEGMENT_COUNT = 4

const metersPerPx = computed(() => metersPerPixel(props.center[0], props.zoom))

/** Ancho real, distancia total y unidad de la regla — se recalcula cada vez que cambian `zoom`/`center`/`width`/`units`. */
const bar = computed(() =>
  props.units === 'imperial'
    ? computeImperialScaleBar(metersPerPx.value, props.width)
    : computeMetricScaleBar(metersPerPx.value, props.width),
)

/** Una etiqueta por marca (0%, 25%, 50%... 100%): la unidad solo se muestra en la última. */
const ticks = computed<string[]>(() => {
  const { distance, unit } = bar.value
  return Array.from({ length: SEGMENT_COUNT + 1 }, (_, index) => {
    const value = Math.round(((distance * index) / SEGMENT_COUNT) * 100) / 100
    return index === SEGMENT_COUNT ? `${value} ${unit}` : `${value}`
  })
})

const ratioLabel = computed(
  () => `1 : ${computeScaleRatio(metersPerPx.value).toLocaleString('es-ES')}`,
)

const offsetStyle = computed(() => {
  const resolved = typeof props.offset === 'number' ? `${props.offset}px` : props.offset
  const [vertical, horizontal] = props.position.split('-') as ['top' | 'bottom', 'left' | 'right']
  return { [vertical]: resolved, [horizontal]: resolved }
})
</script>

<template>
  <div
    class="amw-scale"
    :class="[`amw-scale--${props.position}`, `amw-scale--${props.theme}`]"
    :style="offsetStyle"
  >
    <div
      v-if="props.mode === 'bar'"
      class="amw-scale__ruler"
      :style="{ width: `${bar.widthPx}px` }"
    >
      <div class="amw-scale__ruler-track">
        <span
          v-for="segment in SEGMENT_COUNT"
          :key="segment"
          class="amw-scale__ruler-segment"
          :class="{ 'amw-scale__ruler-segment--alt': segment % 2 === 0 }"
        />
      </div>
      <div class="amw-scale__ruler-labels">
        <span v-for="(tick, index) in ticks" :key="index">{{ tick }}</span>
      </div>
    </div>
    <div v-else class="amw-scale__ratio">{{ ratioLabel }}</div>
  </div>
</template>

<style scoped>
.amw-scale {
  position: absolute;
  z-index: 1000;
  font-family: var(--amw-font-family, system-ui, sans-serif);
  font-size: 0.7rem;
  line-height: 1.2;
}

.amw-scale--dark {
  --amw-color-text: #ffffff;
  --amw-color-border: rgba(255, 255, 255, 0.7);
  --amw-scale-bg: rgba(24, 24, 27, 0.72);
}

.amw-scale--light {
  --amw-color-text: #0f172a;
  --amw-color-border: rgba(15, 23, 42, 0.55);
  --amw-scale-bg: rgba(255, 255, 255, 0.85);
}

.amw-scale__ruler {
  box-sizing: border-box;
  padding: 4px 6px 5px;
  color: var(--amw-color-text);
  background-color: var(--amw-scale-bg);
  border: 1px solid var(--amw-color-border);
  border-radius: var(--amw-radius, 10px);
  backdrop-filter: blur(6px);
  box-shadow: var(--amw-shadow, 0 2px 8px rgba(15, 23, 42, 0.16));
}

.amw-scale__ruler-track {
  display: flex;
  height: 6px;
  overflow: hidden;
  border: 1px solid var(--amw-color-border);
  border-radius: 1px;
}

.amw-scale__ruler-segment {
  flex: 1 1 0%;
}

.amw-scale__ruler-segment--alt {
  background-color: var(--amw-color-text);
  opacity: 0.65;
}

.amw-scale__ruler-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 3px;
}

.amw-scale__ruler-labels span {
  white-space: nowrap;
}

.amw-scale__ratio {
  padding: 3px 8px;
  color: var(--amw-color-text);
  background-color: var(--amw-scale-bg);
  border: 1px solid var(--amw-color-border);
  border-radius: var(--amw-radius, 10px);
  backdrop-filter: blur(6px);
  box-shadow: var(--amw-shadow, 0 2px 8px rgba(15, 23, 42, 0.16));
  white-space: nowrap;
}
</style>
