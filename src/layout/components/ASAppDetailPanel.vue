<script setup lang="ts">
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
 * Es una pieza de `ASAppShell`; se puede usar sola dentro de un contenedor
 * con `position: relative`.
 *
 * @example
 * ```vue
 * <ASAppDetailPanel :open="detalle" :offset="56" @close="detalle = false">
 *   <ASDetailHeader title="3E01" ... />
 * </ASAppDetailPanel>
 * ```
 */
const props = withDefaults(defineProps<AppDetailPanelProps>(), {
  offset: 0,
  label: undefined,
  closeButton: true,
  closeLabel: undefined,
})

const emit = defineEmits<AppDetailPanelEmits>()
const { t } = useLocale()
</script>

<template>
  <aside
    class="as-app-detail-panel"
    :class="{ 'as-app-detail-panel--open': props.open }"
    :style="{ left: `${props.offset}px` }"
    :aria-label="props.label ?? t('layout.detail')"
    :inert="!props.open || undefined"
  >
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
  </aside>
</template>

<style scoped>
.as-app-detail-panel {
  --as-app-detail-transition: var(--as-app-transition, 0.2s cubic-bezier(0.4, 0, 0.2, 1));
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  overflow-y: auto;
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

.as-app-detail-panel--open {
  transform: none;
  visibility: visible;
  transition:
    transform var(--as-app-detail-transition),
    left var(--as-app-detail-transition);
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
