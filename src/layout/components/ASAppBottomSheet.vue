<script setup lang="ts">
import { ref, watch } from 'vue'
import { useLocale } from '@/core/composables/useLocale'
import type { AppBottomSheetEmits, AppBottomSheetProps } from '@/layout/types/AppPanelsProps'

/**
 * Panel móvil que sube desde abajo (el `MobileBottomDrawer` de los visores
 * SAIH): ocupa `height` de alto y un asa arriba lo amplía a toda la altura
 * (`v-model:expanded`). Al cerrarse, vuelve a su altura. Cerrado, es inerte.
 *
 * Funciona aunque no se enlace `expanded`: el estado vive aquí y se emite;
 * si el proyecto lo pasa, manda la prop.
 *
 * Es una pieza de `ASAppShell` en móvil; se puede usar sola dentro de un
 * contenedor con `position: relative`.
 *
 * @example
 * ```vue
 * <ASAppBottomSheet :open="seccion !== null" label="Capas"><PanelCapas /></ASAppBottomSheet>
 * ```
 */
const props = withDefaults(defineProps<AppBottomSheetProps>(), {
  expanded: undefined,
  height: '60%',
  label: undefined,
  id: undefined,
})

const emit = defineEmits<AppBottomSheetEmits>()
const { t } = useLocale()

const isExpanded = ref(props.expanded ?? false)
watch(
  () => props.expanded,
  (value) => (isExpanded.value = value ?? false),
)
watch(
  () => props.open,
  (open) => {
    if (!open && isExpanded.value) setExpanded(false)
  },
)

function setExpanded(value: boolean): void {
  isExpanded.value = value
  emit('update:expanded', value)
}
</script>

<template>
  <aside
    :id="props.id"
    class="as-app-bottom-sheet"
    :class="{
      'as-app-bottom-sheet--open': props.open,
      'as-app-bottom-sheet--expanded': isExpanded,
    }"
    :style="{ '--as-app-bottom-sheet-height': props.height }"
    :aria-label="props.label"
    :inert="!props.open || undefined"
  >
    <button
      type="button"
      class="as-app-bottom-sheet__handle"
      :aria-label="isExpanded ? t('layout.collapseSheet') : t('layout.expandSheet')"
      :aria-expanded="isExpanded"
      @click="setExpanded(!isExpanded)"
    >
      <span aria-hidden="true" />
    </button>
    <div class="as-app-bottom-sheet__content"><slot /></div>
  </aside>
</template>

<style scoped>
.as-app-bottom-sheet {
  --as-app-sheet-transition: var(--as-app-transition, 0.2s cubic-bezier(0.4, 0, 0.2, 1));
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: var(--as-app-bottom-sheet-height);
  border-radius: var(--as-radius-lg, 12px) var(--as-radius-lg, 12px) 0 0;
  background: var(--as-app-panel-bg, light-dark(#e7e7e7, #212121));
  color: var(--as-app-panel-text, light-dark(#0f172a, #f1f5f9));
  box-shadow: var(--as-shadow-lg, 0 10px 30px rgba(0, 0, 0, 0.2));
  transform: translateY(100%);
  visibility: hidden;
  transition:
    transform var(--as-app-sheet-transition),
    height var(--as-app-sheet-transition),
    visibility 0s linear 0.2s;
}

.as-app-bottom-sheet--open {
  transform: none;
  visibility: visible;
  transition:
    transform var(--as-app-sheet-transition),
    height var(--as-app-sheet-transition);
}

.as-app-bottom-sheet--expanded {
  height: 100%;
  border-radius: 0;
}

.as-app-bottom-sheet__handle {
  display: grid;
  flex: none;
  place-items: center;
  width: 100%;
  height: 24px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}

.as-app-bottom-sheet__handle span {
  width: 40px;
  height: 4px;
  border-radius: 2px;
  background: var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
}

.as-app-bottom-sheet__handle:focus-visible {
  outline: none;
  box-shadow: inset var(--as-focus-ring, 0 0 0 2px #2563eb);
}

.as-app-bottom-sheet__content {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}

@media (prefers-reduced-motion: reduce) {
  .as-app-bottom-sheet {
    --as-app-sheet-transition: 0s;
  }
}
</style>
