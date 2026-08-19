<script setup lang="ts">
import { computed, ref } from 'vue'
import { useClickOutside } from '@/composables/useClickOutside'
import type { BasemapOption } from '@/components/mapping/ASMap.vue'
import type { BasemapsSelectorEmits, BasemapsSelectorProps } from '@/types/BasemapsSelectorProps'

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
  theme: 'dark',
})

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
    class="amw-basemaps-selector"
    :class="[`amw-basemaps-selector--${props.position}`, `amw-basemaps-selector--${props.theme}`]"
    :style="offsetStyle"
    @keydown.escape="isOpen = false"
  >
    <button
      type="button"
      class="amw-basemaps-selector__trigger"
      aria-haspopup="menu"
      :aria-expanded="isOpen"
      :aria-label="`Basemap: ${activeBasemap?.name ?? 'ninguno'}. Cambiar basemap`"
      :title="activeBasemap?.name"
      :disabled="otherBasemaps.length === 0"
      @click="toggleOpen"
    >
      <span class="amw-basemaps-selector__thumb">
        <img
          v-if="activeBasemap?.thumbnail"
          class="amw-basemaps-selector__thumb-img"
          :src="activeBasemap.thumbnail"
          alt=""
        />
        <span v-else class="amw-basemaps-selector__thumb-fallback">{{
          initials(activeBasemap?.name)
        }}</span>
      </span>
    </button>

    <div
      v-if="isOpen"
      class="amw-basemaps-selector__menu"
      role="menu"
      aria-label="Basemaps disponibles"
    >
      <button
        v-for="option in otherBasemaps"
        :key="option.id"
        type="button"
        role="menuitem"
        class="amw-basemaps-selector__option"
        :title="option.name"
        @click="select(option.id)"
      >
        <span class="amw-basemaps-selector__thumb">
          <img
            v-if="option.thumbnail"
            class="amw-basemaps-selector__thumb-img"
            :src="option.thumbnail"
            alt=""
          />
          <span v-else class="amw-basemaps-selector__thumb-fallback">{{
            initials(option.name)
          }}</span>
        </span>
        <span class="amw-basemaps-selector__option-name">{{ option.name }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.amw-basemaps-selector {
  position: absolute;
  z-index: 1000;
  font-family: var(--amw-font-family, system-ui, sans-serif);
}

.amw-basemaps-selector--dark {
  --amw-color-text: #ffffff;
  --amw-color-text-muted: rgba(255, 255, 255, 0.8);
  --amw-color-surface-muted: rgba(255, 255, 255, 0.15);
  --amw-color-border: rgba(255, 255, 255, 0.45);
  --amw-basemaps-selector-bg: rgba(24, 24, 27, 0.85);
}

.amw-basemaps-selector--light {
  --amw-color-text: #0f172a;
  --amw-color-text-muted: #64748b;
  --amw-color-surface-muted: #f1f5f9;
  --amw-color-border: #cbd5e1;
  --amw-basemaps-selector-bg: rgba(255, 255, 255, 0.92);
}

.amw-basemaps-selector__trigger {
  display: flex;
  padding: 3px;
  border: 1px solid var(--amw-color-border);
  border-radius: var(--amw-radius, 10px);
  background-color: var(--amw-basemaps-selector-bg);
  backdrop-filter: blur(10px);
  box-shadow: var(--amw-shadow, 0 2px 8px rgba(15, 23, 42, 0.16));
  cursor: pointer;
}

.amw-basemaps-selector__trigger:focus-visible {
  outline: none;
  box-shadow: var(--amw-focus-ring, 0 0 0 2px #2563eb);
}

.amw-basemaps-selector__trigger:disabled {
  cursor: default;
}

.amw-basemaps-selector__thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: calc(var(--amw-radius, 10px) - 3px);
  overflow: hidden;
  background-color: var(--amw-color-surface-muted, #f1f5f9);
  color: var(--amw-color-text, #0f172a);
  flex-shrink: 0;
}

.amw-basemaps-selector__thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.amw-basemaps-selector__thumb-fallback {
  font-size: 1rem;
  font-weight: 600;
}

.amw-basemaps-selector__menu {
  position: absolute;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 160px;
  max-height: 260px;
  overflow-y: auto;
  padding: 6px;
  border: 1px solid var(--amw-color-border);
  border-radius: var(--amw-radius, 10px);
  background-color: var(--amw-basemaps-selector-bg);
  backdrop-filter: blur(10px);
  box-shadow: var(--amw-shadow, 0 2px 8px rgba(15, 23, 42, 0.16));
}

.amw-basemaps-selector--bottom-left .amw-basemaps-selector__menu,
.amw-basemaps-selector--bottom-right .amw-basemaps-selector__menu {
  bottom: calc(100% + 8px);
}

.amw-basemaps-selector--top-left .amw-basemaps-selector__menu,
.amw-basemaps-selector--top-right .amw-basemaps-selector__menu {
  top: calc(100% + 8px);
}

.amw-basemaps-selector--top-left .amw-basemaps-selector__menu,
.amw-basemaps-selector--bottom-left .amw-basemaps-selector__menu {
  left: 0;
}

.amw-basemaps-selector--top-right .amw-basemaps-selector__menu,
.amw-basemaps-selector--bottom-right .amw-basemaps-selector__menu {
  right: 0;
}

.amw-basemaps-selector__option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
  border: none;
  border-radius: calc(var(--amw-radius, 10px) - 4px);
  background: transparent;
  color: var(--amw-color-text, #0f172a);
  font: inherit;
  font-size: 0.8rem;
  text-align: left;
  cursor: pointer;
}

.amw-basemaps-selector__option:hover {
  background-color: var(--amw-color-surface-muted, #f1f5f9);
}

.amw-basemaps-selector__option:focus-visible {
  outline: none;
  box-shadow: var(--amw-focus-ring, 0 0 0 2px #2563eb);
}

.amw-basemaps-selector__option .amw-basemaps-selector__thumb {
  width: 32px;
  height: 32px;
}

.amw-basemaps-selector__option-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
