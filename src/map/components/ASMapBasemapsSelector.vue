<script setup lang="ts">
import { computed, ref } from 'vue'
import { useResolvedTheme } from '@/core/composables/useTheme'
import { useClickOutside } from '@/core/composables/useClickOutside'
import type { BasemapOption } from '@/map/components/ASMap.vue'
import type {
  BasemapsSelectorEmits,
  BasemapsSelectorProps,
} from '@/map/types/BasemapsSelectorProps'

/**
 * Selector de basemap: un recuadro con la miniatura del basemap activo que,
 * al hacer click, despliega un menú con un recuadro por cada uno de los
 * demás `basemaps`. Elegir uno cambia el basemap y cierra el menú.
 *
 * Es un componente **controlado** y agnóstico del motor de mapas: recibe
 * `basemaps` (mismo formato que la prop homónima de `ASMap`) y `basemap` se
 * usa con `v-model` — normalmente pasado tal cual a la prop `basemap` de
 * `ASMap`. El propio widget no sabe nada de Leaflet ni de MapLibre.
 *
 * @example
 * ```vue
 * <ASMap :basemaps="basemaps" v-model:basemap="basemap">
 *   <ASMapBasemapsSelector :basemaps="basemaps" v-model:basemap="basemap" />
 * </ASMap>
 * ```
 */
const props = withDefaults(defineProps<BasemapsSelectorProps>(), {
  basemap: undefined,
  position: 'bottom-right',
  offset: 20,
  theme: undefined,
})

/** Prop `theme` o, si no se pasa, el tema de `provideTheme` (ver `useResolvedTheme`). */
const resolvedTheme = useResolvedTheme(() => props.theme)

const emit = defineEmits<BasemapsSelectorEmits>()

const isOpen = ref(false)
const rootEl = ref<HTMLElement | null>(null)

const activeBasemap = computed<BasemapOption | undefined>(
  () => props.basemaps.find((option) => option.id === props.basemap) ?? props.basemaps[0],
)

/** El resto de `basemaps`, para el menú (el activo ya se muestra en el recuadro cerrado). */
const otherBasemaps = computed<BasemapOption[]>(() =>
  props.basemaps.filter((option) => option.id !== activeBasemap.value?.id),
)

function initials(name: string | undefined): string {
  return (name ?? '?').trim().charAt(0).toUpperCase() || '?'
}

function toggleOpen(): void {
  if (otherBasemaps.value.length === 0) return
  isOpen.value = !isOpen.value
}

function select(id: string): void {
  isOpen.value = false
  emit('update:basemap', id)
}

useClickOutside(rootEl, () => {
  isOpen.value = false
})

const offsetStyle = computed(() => {
  const resolved = typeof props.offset === 'number' ? `${props.offset}px` : props.offset
  const [vertical, horizontal] = props.position.split('-') as ['top' | 'bottom', 'left' | 'right']
  return { [vertical]: resolved, [horizontal]: resolved }
})
</script>

<template>
  <div
    ref="rootEl"
    class="as-basemaps-selector"
    :class="[`as-basemaps-selector--${props.position}`, `as-basemaps-selector--${resolvedTheme}`]"
    :style="offsetStyle"
    @keydown.escape="isOpen = false"
  >
    <button
      type="button"
      class="as-basemaps-selector__trigger"
      aria-haspopup="menu"
      :aria-expanded="isOpen"
      :aria-label="`Basemap: ${activeBasemap?.name ?? 'ninguno'}. Cambiar basemap`"
      :title="activeBasemap?.name"
      :disabled="otherBasemaps.length === 0"
      @click="toggleOpen"
    >
      <span class="as-basemaps-selector__thumb">
        <img
          v-if="activeBasemap?.thumbnail"
          class="as-basemaps-selector__thumb-img"
          :src="activeBasemap.thumbnail"
          alt=""
        />
        <span v-else class="as-basemaps-selector__thumb-fallback">{{
          initials(activeBasemap?.name)
        }}</span>
      </span>
    </button>

    <div
      v-if="isOpen"
      class="as-basemaps-selector__menu"
      role="menu"
      aria-label="Basemaps disponibles"
    >
      <button
        v-for="option in otherBasemaps"
        :key="option.id"
        type="button"
        role="menuitem"
        class="as-basemaps-selector__option"
        :title="option.name"
        @click="select(option.id)"
      >
        <span class="as-basemaps-selector__thumb">
          <img
            v-if="option.thumbnail"
            class="as-basemaps-selector__thumb-img"
            :src="option.thumbnail"
            alt=""
          />
          <span v-else class="as-basemaps-selector__thumb-fallback">{{
            initials(option.name)
          }}</span>
        </span>
        <span class="as-basemaps-selector__option-name">{{ option.name }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.as-basemaps-selector {
  position: absolute;
  z-index: var(--as-z-map-control, 1000);
  font-family: var(--as-font-family, system-ui, sans-serif);
}

.as-basemaps-selector--dark {
  --as-color-text: #ffffff;
  --as-color-text-muted: rgba(255, 255, 255, 0.8);
  --as-color-surface-muted: rgba(255, 255, 255, 0.15);
  --as-color-border: rgba(255, 255, 255, 0.45);
  --as-basemaps-selector-bg: rgba(24, 24, 27, 0.85);
}

.as-basemaps-selector--light {
  --as-color-text: #0f172a;
  --as-color-text-muted: #64748b;
  --as-color-surface-muted: #f1f5f9;
  --as-color-border: #cbd5e1;
  --as-basemaps-selector-bg: rgba(255, 255, 255, 0.92);
}

.as-basemaps-selector__trigger {
  display: flex;
  padding: 3px;
  border: 1px solid var(--as-color-border);
  border-radius: var(--as-radius, 10px);
  background-color: var(--as-basemaps-selector-bg);
  backdrop-filter: blur(10px);
  box-shadow: var(--as-shadow, 0 2px 8px rgba(15, 23, 42, 0.16));
  cursor: pointer;
}

.as-basemaps-selector__trigger:focus-visible {
  outline: none;
  box-shadow: var(--as-focus-ring, 0 0 0 2px #2563eb);
}

.as-basemaps-selector__trigger:disabled {
  cursor: default;
}

.as-basemaps-selector__thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: calc(var(--as-radius, 10px) - 3px);
  overflow: hidden;
  background-color: var(--as-color-surface-muted, #f1f5f9);
  color: var(--as-color-text, #0f172a);
  flex-shrink: 0;
}

.as-basemaps-selector__thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.as-basemaps-selector__thumb-fallback {
  font-size: 1rem;
  font-weight: 600;
}

.as-basemaps-selector__menu {
  position: absolute;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 160px;
  max-height: 260px;
  overflow-y: auto;
  padding: 6px;
  border: 1px solid var(--as-color-border);
  border-radius: var(--as-radius, 10px);
  background-color: var(--as-basemaps-selector-bg);
  backdrop-filter: blur(10px);
  box-shadow: var(--as-shadow, 0 2px 8px rgba(15, 23, 42, 0.16));
}

.as-basemaps-selector--bottom-left .as-basemaps-selector__menu,
.as-basemaps-selector--bottom-right .as-basemaps-selector__menu {
  bottom: calc(100% + 8px);
}

.as-basemaps-selector--top-left .as-basemaps-selector__menu,
.as-basemaps-selector--top-right .as-basemaps-selector__menu {
  top: calc(100% + 8px);
}

.as-basemaps-selector--top-left .as-basemaps-selector__menu,
.as-basemaps-selector--bottom-left .as-basemaps-selector__menu {
  left: 0;
}

.as-basemaps-selector--top-right .as-basemaps-selector__menu,
.as-basemaps-selector--bottom-right .as-basemaps-selector__menu {
  right: 0;
}

.as-basemaps-selector__option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
  border: none;
  border-radius: calc(var(--as-radius, 10px) - 4px);
  background: transparent;
  color: var(--as-color-text, #0f172a);
  font: inherit;
  font-size: 0.8rem;
  text-align: left;
  cursor: pointer;
}

.as-basemaps-selector__option:hover {
  background-color: var(--as-color-surface-muted, #f1f5f9);
}

.as-basemaps-selector__option:focus-visible {
  outline: none;
  box-shadow: var(--as-focus-ring, 0 0 0 2px #2563eb);
}

.as-basemaps-selector__option .as-basemaps-selector__thumb {
  width: 32px;
  height: 32px;
}

.as-basemaps-selector__option-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
