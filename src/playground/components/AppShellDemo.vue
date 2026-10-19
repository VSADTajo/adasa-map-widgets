<script setup lang="ts">
import { ref } from 'vue'
import ASAppShell from '@/layout/components/ASAppShell.vue'
import ASAppPanelHeader from '@/layout/components/ASAppPanelHeader.vue'
import ASMap from '@/map/components/ASMap.vue'
import type { AppShellEmits, AppShellProps } from '@/layout/types/AppShellProps'

/**
 * Ejemplo de `ASAppShell` para el playground: un visor con mapa, secciones
 * de muestra y el panel de detalle (vacío por ahora), que se abre al hacer
 * clic en el mapa. Los props y v-models del playground pasan tal cual al
 * shell; los contenidos de los slots son de ejemplo.
 */
// Los booleanos sin valor serían false: se fijan los mismos valores por defecto que el shell.
const props = withDefaults(defineProps<AppShellProps>(), {
  activeSection: null,
  detailCloseButton: true,
})
const emit = defineEmits<AppShellEmits>()

const searchText = ref('')
const DEMO_ITEMS: Record<string, string[]> = {
  capas: ['Estaciones SAIH', 'Zonas', 'Mapas meteo', 'EFAS', 'Avisos AEMET'],
  avisos: ['Aviso amarillo · Sierra de Gredos', 'Aviso naranja · Alto Tajo'],
  informes: ['Informe diario', 'Resumen semanal'],
  mapasbase: ['IGN', 'OpenStreetMap', 'Satélite', 'Oscuro'],
  ajustes: ['Unidades', 'Idioma', 'Tema'],
}
</script>

<template>
  <ASAppShell
    v-bind="props"
    @update:active-section="emit('update:activeSection', $event)"
    @update:detail-open="emit('update:detailOpen', $event)"
  >
    <template #brand>
      <span class="demo-brand">ADASA <small>visor</small></span>
    </template>
    <template #search>
      <input
        v-model="searchText"
        class="demo-search"
        type="search"
        placeholder="Buscar estación, subcuenca o zona"
        aria-label="Buscar"
      />
    </template>
    <template #actions>
      <span class="demo-avatar" aria-label="Usuario" role="img">PC</span>
    </template>

    <template #section="{ section, close, mobile }">
      <ASAppPanelHeader
        :title="section.label"
        :direction="mobile ? 'down' : 'left'"
        @close="close"
      />
      <ul class="demo-list">
        <li v-for="item in DEMO_ITEMS[section.id] ?? []" :key="item">{{ item }}</li>
      </ul>
    </template>

    <template #detail>
      <p class="demo-detail">
        Panel de detalle (por ahora vacío). Se abre al hacer clic en el mapa; aquí irán las fichas
        de estación, hidrogramas, avisos...
      </p>
    </template>

    <ASMap
      map-library="leaflet"
      :center="[40.2, -4]"
      :zoom="7"
      @map-click="emit('update:detailOpen', true)"
    />
  </ASAppShell>
</template>

<style scoped>
.demo-brand {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.demo-brand small {
  font-weight: 400;
  opacity: 0.8;
}

.demo-search {
  box-sizing: border-box;
  width: 100%;
  height: 40px;
  padding: 0 16px;
  border: none;
  border-radius: 20px;
  font: inherit;
  background: #ffffff;
  color: #0f172a;
}

.demo-avatar {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #ffffff;
  color: var(--as-app-chrome, #1d283a);
  font-weight: 700;
  font-size: 0.8rem;
}

.demo-list {
  margin: 0;
  padding: 0 16px 16px;
  list-style: none;
}

.demo-list li {
  margin-bottom: 8px;
  padding: 12px 16px;
  border-radius: 4px;
  background: var(--as-app-panel-surface, light-dark(#ffffff, #393939));
}

.demo-detail {
  margin: 0;
  padding: 24px 64px 24px 24px;
  color: var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
}
</style>
