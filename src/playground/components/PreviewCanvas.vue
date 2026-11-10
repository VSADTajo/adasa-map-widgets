<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * Lienzo neutro para previsualizar componentes que no van sobre un mapa
 * (gráficas, tablas, layout...). Se redimensiona arrastrando su esquina o
 * con los anchos predefinidos, para probar el comportamiento responsive, y
 * muestra el ancho real en todo momento.
 */

const PRESETS = [
  { label: 'Móvil', width: '375px' },
  { label: 'Tableta', width: '768px' },
  { label: 'Escritorio', width: '1280px' },
  { label: 'Completo', width: '100%' },
] as const

const frame = ref<HTMLElement | null>(null)
const width = ref<string>('100%')
const measuredWidth = ref(0)

function applyPreset(preset: string): void {
  width.value = preset
  // Si el usuario había arrastrado la esquina, el navegador fijó su propio
  // ancho inline: se limpia para que mande el preset.
  if (frame.value) frame.value.style.width = preset
}

let observer: ResizeObserver | undefined
onMounted(() => {
  if (!frame.value) return
  observer = new ResizeObserver(([entry]) => {
    measuredWidth.value = Math.round(entry!.borderBoxSize[0]?.inlineSize ?? 0)
  })
  observer.observe(frame.value)
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div class="pg-canvas">
    <div class="pg-canvas__toolbar" role="group" aria-label="Ancho del lienzo">
      <button
        v-for="preset in PRESETS"
        :key="preset.label"
        type="button"
        class="pg-canvas__preset"
        :class="{ 'pg-canvas__preset--active': width === preset.width }"
        :aria-pressed="width === preset.width"
        @click="applyPreset(preset.width)"
      >
        {{ preset.label }}
      </button>
      <span class="pg-canvas__width" aria-live="polite">{{ measuredWidth }} px</span>
    </div>
    <div class="pg-canvas__viewport">
      <div ref="frame" class="pg-canvas__frame" :style="{ width }">
        <slot />
      </div>
    </div>
    <p class="pg-canvas__hint">Arrastra la esquina inferior derecha para cambiar el ancho.</p>
  </div>
</template>

<style scoped>
.pg-canvas {
  display: grid;
  gap: 8px;
}

.pg-canvas__toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.pg-canvas__preset {
  border: 1px solid var(--pg-border);
  background: none;
  color: var(--pg-text);
  border-radius: 6px;
  padding: 3px 10px;
  font-size: 0.75rem;
  cursor: pointer;
}

.pg-canvas__preset--active {
  background-color: var(--pg-primary);
  border-color: var(--pg-primary);
  color: var(--pg-primary-contrast);
}

.pg-canvas__width {
  margin-left: auto;
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  color: var(--pg-text-muted);
}

.pg-canvas__viewport {
  overflow-x: auto;
  padding: 12px;
  border-radius: 8px;
  background: var(--pg-surface-muted);
}

.pg-canvas__frame {
  box-sizing: border-box;
  min-width: 280px;
  min-height: 240px;
  padding: 16px;
  /* El lienzo usa la superficie de los tokens: refleja el tema elegido. */
  background: var(--as-color-surface, #ffffff);
  color: var(--as-color-text, #0f172a);
  border: 1px dashed var(--pg-border);
  border-radius: 6px;
  /* `resize` necesita un overflow distinto de visible. */
  overflow: auto;
  resize: horizontal;
}

.pg-canvas__hint {
  margin: 0;
  font-size: 0.7rem;
  color: var(--pg-text-muted);
}
</style>
