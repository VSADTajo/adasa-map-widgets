<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '@/core/composables/useLocale'
import { useResolvedTheme } from '@/core/composables/useTheme'
import type { ScaleProps } from '@/map/types/ScaleProps'
import {
  computeImperialScaleBar,
  computeMetricScaleBar,
  computeScaleRatio,
  metersPerPixel,
  pickScaleLabels,
} from '@/map/utils/mapScale'

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
  theme: undefined,
})

/** Prop `theme` o, si no se pasa, el tema de `provideTheme` (ver `useResolvedTheme`). */
const resolvedTheme = useResolvedTheme(() => props.theme)

/** Números en el idioma de `provideLocale` (español por defecto). */
const { formatNumber } = useLocale()

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

/**
 * Etiquetas que caben sin solaparse, en la posición real de su marca. Si
 * solo cabe la última, `single` la saca de la regla para que el recuadro
 * crezca con el texto en vez de desbordarse.
 */
const visibleTicks = computed(() => {
  const indices = pickScaleLabels(ticks.value, bar.value.widthPx)
  return {
    single: indices.length === 1 ? ticks.value[indices[0]!] : undefined,
    items: indices.map((index) => ({
      index,
      text: ticks.value[index]!,
      align: index === 0 ? 'start' : index === SEGMENT_COUNT ? 'end' : 'center',
      left: `${(index / SEGMENT_COUNT) * 100}%`,
    })),
  }
})

const ratioLabel = computed(() => `1 : ${formatNumber(computeScaleRatio(metersPerPx.value))}`)

const offsetStyle = computed(() => {
  const resolved = typeof props.offset === 'number' ? `${props.offset}px` : props.offset
  const [vertical, horizontal] = props.position.split('-') as ['top' | 'bottom', 'left' | 'right']
  return { [vertical]: resolved, [horizontal]: resolved }
})
</script>

<template>
  <div
    class="as-scale"
    :class="[`as-scale--${props.position}`, `as-scale--${resolvedTheme}`]"
    :style="offsetStyle"
  >
    <div v-if="props.mode === 'bar'" class="as-scale__ruler">
      <!-- La regla mide exactamente `bar.widthPx`: es la distancia que representa. -->
      <div class="as-scale__ruler-track" :style="{ width: `${bar.widthPx}px` }">
        <span
          v-for="segment in SEGMENT_COUNT"
          :key="segment"
          class="as-scale__ruler-segment"
          :class="{ 'as-scale__ruler-segment--alt': segment % 2 === 0 }"
        />
      </div>
      <div v-if="visibleTicks.single" class="as-scale__ruler-label-single">
        {{ visibleTicks.single }}
      </div>
      <div v-else class="as-scale__ruler-labels" :style="{ width: `${bar.widthPx}px` }">
        <span
          v-for="tick in visibleTicks.items"
          :key="tick.index"
          class="as-scale__ruler-label"
          :class="`as-scale__ruler-label--${tick.align}`"
          :style="{ left: tick.left }"
        >
          {{ tick.text }}
        </span>
      </div>
    </div>
    <div v-else class="as-scale__ratio">{{ ratioLabel }}</div>
  </div>
</template>

<style scoped>
.as-scale {
  /* Colores de overlay sobre el mapa: tokens --as-overlay-* (con su valor
     por defecto como fallback). El modo claro/oscuro lo elige color-scheme,
     que fijan las clases --light/--dark según la prop theme. */
  /* Más transparente y con bordes más marcados que el resto de overlays
     para no tapar el mapa bajo la regla: valores propios. */
  --as-color-text: var(--as-overlay-text, light-dark(#0f172a, #ffffff));
  --as-color-border: light-dark(rgba(15, 23, 42, 0.55), rgba(255, 255, 255, 0.7));
  --as-scale-bg: light-dark(rgba(255, 255, 255, 0.85), rgba(24, 24, 27, 0.72));
  position: absolute;
  z-index: var(--as-z-map-control, 1000);
  font-family: var(--as-font-family, system-ui, sans-serif);
  font-size: 0.7rem;
  line-height: 1.2;
}

.as-scale--dark {
  color-scheme: dark;
}

.as-scale--light {
  color-scheme: light;
}

.as-scale__ruler {
  box-sizing: border-box;
  padding: 4px 6px 5px;
  color: var(--as-color-text);
  background-color: var(--as-scale-bg);
  border: 1px solid var(--as-color-border);
  border-radius: var(--as-radius, 10px);
  backdrop-filter: blur(6px);
  box-shadow: var(--as-shadow, 0 2px 8px rgba(15, 23, 42, 0.16));
}

.as-scale__ruler-track {
  box-sizing: border-box;
  display: flex;
  height: 6px;
  overflow: hidden;
  border: 1px solid var(--as-color-border);
  border-radius: 1px;
}

.as-scale__ruler-segment {
  flex: 1 1 0%;
}

.as-scale__ruler-segment--alt {
  background-color: var(--as-color-text);
  opacity: 0.65;
}

.as-scale__ruler-labels {
  position: relative;
  height: 1.2em;
  margin-top: 3px;
}

.as-scale__ruler-label {
  position: absolute;
  top: 0;
  white-space: nowrap;
}

.as-scale__ruler-label--center {
  transform: translateX(-50%);
}

.as-scale__ruler-label--end {
  transform: translateX(-100%);
}

.as-scale__ruler-label-single {
  margin-top: 3px;
  white-space: nowrap;
}

.as-scale__ratio {
  padding: 3px 8px;
  color: var(--as-color-text);
  background-color: var(--as-scale-bg);
  border: 1px solid var(--as-color-border);
  border-radius: var(--as-radius, 10px);
  backdrop-filter: blur(6px);
  box-shadow: var(--as-shadow, 0 2px 8px rgba(15, 23, 42, 0.16));
  white-space: nowrap;
}
</style>
