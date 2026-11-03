<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ASIcon from '@/core/components/ASIcon.vue'
import { ICONS } from '@/core/icons/icons'
import { useLocale } from '@/core/composables/useLocale'
import type { AppDetailPanelEmits, AppDetailPanelProps } from '@/layout/types/AppPanelsProps'

/**
 * Panel de detalle (el `RightNavigation` de los visores SAIH): entra por la
 * derecha y tapa el contenido desde `offset`, normalmente el borde de los
 * menús. Si `offset` cambia (se abre o se cierra el panel de sección), se
 * desplaza con transición sin cerrarse. Cerrado, es inerte.
 *
 * Con `width` mide eso, pegado a la derecha, y el contenido se ve a su
 * izquierda. Con `resizable`, un asa en su borde izquierdo cambia el ancho
 * arrastrando o con las flechas (`v-model:width`; funciona también sin él).
 *
 * Es una pieza de `ASAppShell`; se puede usar sola dentro de un contenedor
 * con `position: relative`.
 *
 * @example
 * ```vue
 * <ASAppDetailPanel :open="detalle" :offset="56" resizable v-model:width="ancho" @close="detalle = false">
 *   <ASDetailHeader title="3E01" ... />
 * </ASAppDetailPanel>
 * ```
 */
const props = withDefaults(defineProps<AppDetailPanelProps>(), {
  offset: 0,
  label: undefined,
  closeButton: true,
  closeLabel: undefined,
  width: undefined,
  resizable: false,
  minWidth: 320,
})

const emit = defineEmits<AppDetailPanelEmits>()
const { t } = useLocale()

/** Paso de las flechas del teclado (con Mayús, ×4). */
const KEY_STEP = 16

const panel = ref<HTMLElement | null>(null)
// El ancho vive aquí también: el asa funciona aunque el proyecto no enlace `v-model:width`.
const currentWidth = ref(props.width)
watch(
  () => props.width,
  (width) => (currentWidth.value = width),
)
const resizing = ref(false)

/** Ancho disponible: del `offset` al borde derecho del contenedor. */
function available(): number {
  const container = panel.value?.parentElement
  return Math.max(0, (container?.clientWidth ?? 0) - props.offset)
}

function setWidth(width: number | undefined): void {
  const next =
    width === undefined
      ? undefined
      : Math.round(Math.max(Math.min(width, available()), Math.min(props.minWidth, available())))
  if (next === currentWidth.value) return
  currentWidth.value = next
  emit('update:width', next)
}

/** Ancho que se ve ahora (sin `width`, todo lo disponible). */
const shownWidth = (): number => Math.min(currentWidth.value ?? Infinity, available())

function onPointerDown(event: PointerEvent): void {
  if (event.button !== 0) return
  event.preventDefault()
  ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
  resizing.value = true
}
function onPointerMove(event: PointerEvent): void {
  if (!resizing.value) return
  const right = panel.value?.parentElement?.getBoundingClientRect().right ?? 0
  setWidth(right - event.clientX)
}
function onPointerUp(): void {
  resizing.value = false
}

function onKeydown(event: KeyboardEvent): void {
  const step = event.shiftKey ? KEY_STEP * 4 : KEY_STEP
  // El asa está a la izquierda: hacia la izquierda, más ancho.
  if (event.key === 'ArrowLeft') setWidth(shownWidth() + step)
  else if (event.key === 'ArrowRight') setWidth(shownWidth() - step)
  else if (event.key === 'Home') setWidth(undefined)
  else if (event.key === 'End') setWidth(props.minWidth)
  else return
  event.preventDefault()
}

const style = computed(() => ({
  '--as-app-detail-offset': `${props.offset}px`,
  '--as-app-detail-width': currentWidth.value === undefined ? undefined : `${currentWidth.value}px`,
}))
</script>

<template>
  <aside
    ref="panel"
    class="as-app-detail-panel"
    :class="{
      'as-app-detail-panel--open': props.open,
      'as-app-detail-panel--sized': currentWidth !== undefined,
      'as-app-detail-panel--resizing': resizing,
    }"
    :style="style"
    :aria-label="props.label ?? t('layout.detail')"
    :inert="!props.open || undefined"
  >
    <div
      v-if="props.resizable"
      class="as-app-detail-panel__resizer"
      role="separator"
      aria-orientation="vertical"
      tabindex="0"
      :aria-label="t('layout.resizeDetail')"
      :title="t('layout.resizeDetail')"
      :aria-valuenow="currentWidth"
      :aria-valuemin="props.minWidth"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @dblclick="setWidth(undefined)"
      @keydown="onKeydown"
    />
    <div class="as-app-detail-panel__body">
      <button
        v-if="props.closeButton"
        type="button"
        class="as-app-detail-panel__close"
        :aria-label="props.closeLabel ?? t('layout.closeDetail')"
        :title="props.closeLabel ?? t('layout.closeDetail')"
        @click="emit('close')"
      >
        <ASIcon :path="ICONS.close" />
      </button>
      <slot />
    </div>
  </aside>
</template>

<style scoped>
.as-app-detail-panel {
  --as-app-detail-transition: var(--as-app-transition, 0.2s cubic-bezier(0.4, 0, 0.2, 1));
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: var(--as-app-detail-offset, 0px);
  z-index: 2;
  display: flex;
  background: var(--as-app-panel-bg, light-dark(#e7e7e7, #212121));
  color: var(--as-app-panel-text, light-dark(#0f172a, #f1f5f9));
  box-shadow: var(--as-shadow-lg, 0 10px 30px rgba(0, 0, 0, 0.2));
  transform: translateX(100%);
  visibility: hidden;
  /* Cerrado: se oculta al acabar de salir, no antes. */
  transition:
    transform var(--as-app-detail-transition),
    left var(--as-app-detail-transition),
    visibility 0s linear 0.2s;
}

/* Con ancho: pegado a la derecha, sin pasar nunca del borde de los menús. */
.as-app-detail-panel--sized {
  left: max(var(--as-app-detail-offset, 0px), calc(100% - var(--as-app-detail-width)));
}

.as-app-detail-panel--open {
  transform: none;
  visibility: visible;
  transition:
    transform var(--as-app-detail-transition),
    left var(--as-app-detail-transition);
}

/* Arrastrando, el borde sigue al puntero sin retraso y no se selecciona texto. */
.as-app-detail-panel--resizing {
  transition: none;
  user-select: none;
}

/* El cuerpo hace el scroll, así el asa se queda quieta en el borde. */
.as-app-detail-panel__body {
  flex: 1 1 auto;
  min-width: 0;
  overflow-y: auto;
}

.as-app-detail-panel__resizer {
  position: absolute;
  top: 0;
  bottom: 0;
  left: -4px;
  z-index: 2;
  width: 8px;
  cursor: col-resize;
  touch-action: none;
}

/* Línea visible al pasar por encima, al arrastrar o con el foco. */
.as-app-detail-panel__resizer::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 3px;
  width: 2px;
  background: transparent;
  transition: background-color var(--as-app-detail-transition);
}

.as-app-detail-panel__resizer:hover::after,
.as-app-detail-panel--resizing .as-app-detail-panel__resizer::after {
  background: var(--as-color-primary, light-dark(#2563eb, #60a5fa));
}

.as-app-detail-panel__resizer:focus-visible {
  outline: none;
}

.as-app-detail-panel__resizer:focus-visible::after {
  left: 2px;
  width: 4px;
  background: var(--as-color-primary, light-dark(#2563eb, #60a5fa));
}

.as-app-detail-panel__close {
  position: sticky;
  top: var(--as-space-2, 8px);
  z-index: 1;
  display: grid;
  float: right;
  place-items: center;
  width: 40px;
  height: 40px;
  margin: var(--as-space-2, 8px);
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--as-app-chrome, #1d283a);
  color: var(--as-app-chrome-text, #ffffff);
  cursor: pointer;
}

.as-app-detail-panel__close:focus-visible {
  outline: none;
  box-shadow: var(--as-focus-ring, 0 0 0 2px #2563eb);
}

@media (prefers-reduced-motion: reduce) {
  .as-app-detail-panel {
    --as-app-detail-transition: 0s;
  }
}
</style>
