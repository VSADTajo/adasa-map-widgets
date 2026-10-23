<script setup lang="ts">
import { useAttrs } from 'vue'
import ASAppBottomSheet from '@/layout/components/ASAppBottomSheet.vue'
import ASAppBrand from '@/layout/components/ASAppBrand.vue'
import ASAppDetailPanel from '@/layout/components/ASAppDetailPanel.vue'
import ASAppDrawer from '@/layout/components/ASAppDrawer.vue'
import ASAppMobileMenu from '@/layout/components/ASAppMobileMenu.vue'
import ASAppPanelHeader from '@/layout/components/ASAppPanelHeader.vue'
import ASAppRail from '@/layout/components/ASAppRail.vue'
import ASAppSearch from '@/layout/components/ASAppSearch.vue'
import ASAppTopBar from '@/layout/components/ASAppTopBar.vue'
import ASAppUserMenu from '@/layout/components/ASAppUserMenu.vue'

/**
 * Muestra una pieza del layout en su sitio, para el playground: las de la
 * barra (marca, buscador, usuario) sobre el color corporativo; los paneles,
 * dentro de un marco con su contenido de ejemplo. Los props y los listeners
 * (`$attrs`) pasan tal cual a la pieza.
 */
defineOptions({ inheritAttrs: false })
defineProps<{
  piece:
    | 'brand'
    | 'search'
    | 'user-menu'
    | 'top-bar'
    | 'rail'
    | 'panel-header'
    | 'drawer'
    | 'detail'
    | 'sheet'
    | 'mobile-menu'
}>()

// Los props llegan como $attrs desde el registro (cada pieza tiene los suyos):
// el tipo no se puede conocer aquí.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const attrs = useAttrs() as any

const PANEL_TEXT = 'Contenido del panel: capas, avisos, mapas base...'
</script>

<template>
  <!-- Piezas de la barra: sobre el color corporativo, como en la aplicación. -->
  <ASAppTopBar v-if="piece === 'brand'"
    ><template #brand><ASAppBrand v-bind="attrs" /></template
  ></ASAppTopBar>
  <ASAppTopBar v-else-if="piece === 'search'"
    ><template #search><ASAppSearch v-bind="attrs" /></template
  ></ASAppTopBar>
  <div v-else-if="piece === 'user-menu'" class="demo-piece demo-piece--tall">
    <ASAppTopBar
      ><template #actions><ASAppUserMenu v-bind="attrs" /></template
    ></ASAppTopBar>
  </div>
  <ASAppTopBar v-else-if="piece === 'top-bar'" v-bind="attrs">
    <template #brand><strong>Marca</strong></template>
    <template #search><span class="demo-piece__slot">slot search</span></template>
    <template #actions><span class="demo-piece__slot">slot actions</span></template>
  </ASAppTopBar>

  <div v-else-if="piece === 'rail'" class="demo-piece demo-piece--row">
    <ASAppRail v-bind="attrs" />
    <p class="demo-piece__main">Contenido principal</p>
  </div>
  <div v-else-if="piece === 'panel-header'" class="demo-piece demo-piece--panel">
    <ASAppPanelHeader v-bind="attrs" />
    <p class="demo-piece__text">{{ PANEL_TEXT }}</p>
  </div>
  <div v-else-if="piece === 'drawer'" class="demo-piece demo-piece--row">
    <ASAppDrawer v-bind="attrs"
      ><p class="demo-piece__text">{{ PANEL_TEXT }}</p></ASAppDrawer
    >
    <p class="demo-piece__main">El contenido principal se desplaza (no queda tapado).</p>
  </div>
  <div v-else-if="piece === 'detail'" class="demo-piece">
    <p class="demo-piece__main">Contenido principal</p>
    <ASAppDetailPanel v-bind="attrs"
      ><p class="demo-piece__text">Ficha de la estación</p></ASAppDetailPanel
    >
  </div>
  <div v-else-if="piece === 'sheet'" class="demo-piece demo-piece--phone">
    <p class="demo-piece__main">Mapa</p>
    <ASAppBottomSheet v-bind="attrs"
      ><p class="demo-piece__text">{{ PANEL_TEXT }}</p></ASAppBottomSheet
    >
  </div>
  <div v-else-if="piece === 'mobile-menu'" class="demo-piece demo-piece--phone">
    <p class="demo-piece__main">Mapa</p>
    <ASAppMobileMenu v-bind="attrs" />
  </div>
</template>

<style scoped>
.demo-piece {
  position: relative;
  height: 320px;
  overflow: hidden;
  border-radius: var(--as-radius-sm, 4px);
  background: var(--as-app-panel-bg, light-dark(#e7e7e7, #212121));
  color: var(--as-app-panel-text, light-dark(#0f172a, #f1f5f9));
}

.demo-piece--tall {
  height: 420px;
  background: transparent;
}

.demo-piece--row {
  display: flex;
}

.demo-piece--panel {
  max-width: 320px;
  height: auto;
}

/* Proporción de un móvil, para los paneles que solo se usan ahí. */
.demo-piece--phone {
  max-width: 375px;
  height: 560px;
}

.demo-piece__main {
  flex: 1;
  margin: 0;
  padding: var(--as-space-4, 16px);
  color: var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
}

.demo-piece__text {
  margin: 0;
  padding: var(--as-space-4, 16px);
}

.demo-piece__slot {
  padding: 2px 8px;
  border: 1px dashed currentColor;
  border-radius: var(--as-radius-sm, 4px);
  opacity: 0.8;
}
</style>
