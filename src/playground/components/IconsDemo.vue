<script setup lang="ts">
import { mdiAlert, mdiFileDocument, mdiLayers, mdiMap, mdiTune } from '@mdi/js'
import { FileText, Layers, Map as MapIcon, SlidersHorizontal, TriangleAlert } from 'lucide-vue-next'
import ASIcon from '@/core/components/ASIcon.vue'
import type { IconValue } from '@/core/types/icon'
import ASAppRail from '@/layout/components/ASAppRail.vue'
import type { AppSection } from '@/layout/types/AppShellProps'

/**
 * Demo de iconos: el icono editable arriba y, debajo, la misma barra de
 * secciones con cada origen de iconos (todos pasan por `ASIcon`). Los
 * nombres los traduce el `provideIcons` del playground (`utils/icons.ts`).
 */
const props = withDefaults(defineProps<{ icon?: string; size?: number; label?: string }>(), {
  icon: 'mdi:layers',
  size: 24,
  label: undefined,
})

const LABELS = ['Capas', 'Avisos', 'Informes', 'Mapas base', 'Ajustes']

/** Las dos últimas, abajo de la barra, como mapas base y ajustes en un visor. */
function sections(icons: IconValue[]): AppSection[] {
  return icons.map((icon, index) => ({
    id: String(index),
    label: LABELS[index]!,
    icon,
    position: index >= 3 ? 'bottom' : 'top',
  }))
}

const SOURCES: { title: string; code: string; sections: AppSection[] }[] = [
  {
    title: 'Trazados de @mdi/js',
    code: ':icon="mdiLayers"',
    sections: sections([mdiLayers, mdiAlert, mdiFileDocument, mdiMap, mdiTune]),
  },
  {
    title: 'Componentes de Lucide',
    code: ':icon="Layers"',
    sections: sections([Layers, TriangleAlert, FileText, MapIcon, SlidersHorizontal]),
  },
  {
    title: 'Nombres de Iconify',
    code: 'icon="tabler:stack-2"',
    sections: sections([
      'tabler:stack-2',
      'tabler:alert-triangle',
      'tabler:file-text',
      'tabler:map',
      'tabler:adjustments',
    ]),
  },
  {
    title: 'Clases de @mdi/font',
    code: 'icon="mdi-layers"',
    sections: sections(['mdi-layers', 'mdi-alert', 'mdi-file-document', 'mdi-map', 'mdi-tune']),
  },
]
</script>

<template>
  <div class="pg-icons-demo">
    <div class="pg-icons-demo__live">
      <ASIcon :icon="props.icon" :size="props.size" :label="props.label" />
      <code>{{ props.icon }}</code>
    </div>
    <div class="pg-icons-demo__sources">
      <figure v-for="source in SOURCES" :key="source.title" class="pg-icons-demo__source">
        <ASAppRail :sections="source.sections" active-section="0" />
        <figcaption>
          <strong>{{ source.title }}</strong>
          <code>{{ source.code }}</code>
        </figcaption>
      </figure>
    </div>
  </div>
</template>

<style scoped>
.pg-icons-demo {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 16px;
  color: var(--pg-text);
}

.pg-icons-demo__live {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pg-icons-demo__sources {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
}

.pg-icons-demo__source {
  display: flex;
  gap: 10px;
  height: 300px;
  margin: 0;
}

.pg-icons-demo__source figcaption {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.78rem;
}

.pg-icons-demo__source code {
  font-size: 0.72rem;
  color: var(--pg-text-muted);
  word-break: break-all;
}
</style>
