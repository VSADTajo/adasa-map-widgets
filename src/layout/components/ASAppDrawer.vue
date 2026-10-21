<script setup lang="ts">
import type { AppDrawerProps } from '@/layout/types/AppPanelsProps'

/**
 * Panel de sección de escritorio (el `SecondaryDrawer` de los visores
 * SAIH): junto a la barra de iconos, se abre ensanchándose y **empuja** el
 * contenido en vez de taparlo. Cerrado, mide 0 y es inerte, pero mantiene
 * su contenido para que no desaparezca de golpe mientras sale.
 *
 * Es una pieza de `ASAppShell`, que la abre y la cierra; se puede usar
 * sola en un layout propio (dentro de una fila flex).
 *
 * @example
 * ```vue
 * <div style="display: flex">
 *   <ASAppRail :sections="secciones" :active-section="seccion" @toggle="alternar" />
 *   <ASAppDrawer :open="seccion !== null" label="Capas"><PanelCapas /></ASAppDrawer>
 *   <main style="flex: 1"><ASMap ... /></main>
 * </div>
 * ```
 */
const props = withDefaults(defineProps<AppDrawerProps>(), {
  width: 320,
  label: undefined,
  id: undefined,
})
</script>

<template>
  <div
    class="as-app-drawer"
    :class="{ 'as-app-drawer--open': props.open }"
    :style="{ '--as-app-drawer-width': `${props.width}px` }"
  >
    <aside
      :id="props.id"
      class="as-app-drawer__panel"
      :aria-label="props.label"
      :inert="!props.open || undefined"
    >
      <slot />
    </aside>
  </div>
</template>

<style scoped>
.as-app-drawer {
  position: relative;
  flex: none;
  width: 0;
  overflow: hidden;
  transition: width var(--as-app-transition, 0.2s cubic-bezier(0.4, 0, 0.2, 1));
}

.as-app-drawer--open {
  width: var(--as-app-drawer-width);
}

/* El contenido mide siempre lo mismo y se descubre al ensancharse el marco. */
.as-app-drawer__panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: var(--as-app-drawer-width);
  overflow-y: auto;
  background: var(--as-app-panel-bg, light-dark(#e7e7e7, #212121));
  color: var(--as-app-panel-text, light-dark(#0f172a, #f1f5f9));
}

@media (prefers-reduced-motion: reduce) {
  .as-app-drawer {
    transition: none;
  }
}
</style>
