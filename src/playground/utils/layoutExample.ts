import type { SearchSuggestion } from '@/forms/types/SearchInputProps'
import type { AppLogo } from '@/layout/types/AppBrandProps'
import type { AppUser } from '@/layout/types/AppUserMenuProps'
import type { CodeExample } from '../registry'
import { demoFetchSuggestions } from './formsExample'

/**
 * Datos de ejemplo de las piezas del layout (marca, buscador, menú de
 * usuario) y el código de la composición manual, al estilo del
 * `MainLayout.vue` de los visores SAIH.
 */

/** Logo de texto en SVG (sin imágenes externas: el playground no tiene backend). */
function textLogo(text: string, width: number, size = 22): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='40' viewBox='0 0 ${width} 40'><text x='0' y='28' font-family='Segoe UI, sans-serif' font-size='${size}' font-weight='700' fill='white'>${text}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export const DEMO_LOGOS: AppLogo[] = [
  { src: textLogo('ADASA', 92), alt: 'ADASA', href: '#' },
  {
    src: textLogo('Ministerio para la Transición Ecológica', 330, 15),
    alt: 'Ministerio para la Transición Ecológica',
    hideOnMobile: true,
  },
]

export const DEMO_USER: AppUser = { name: 'Ana Pérez', email: 'ana.perez@adasa.es' }

const MAP_MARKER =
  'M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z'

const TYPE_COLORS: Record<string, string> = { Aforo: '#2a78d6', Embalse: '#6250d6' }

/**
 * Búsqueda de ejemplo con lo del autocompletado de la TopBar de TAJO: tipo
 * de estación y origen como etiquetas, "Centrar en el mapa" y un embalse no
 * visible con el modelo seleccionado.
 */
export function appSearchSuggestions(latency = 300) {
  const search = demoFetchSuggestions(latency, false)
  return async (query: string, signal: AbortSignal): Promise<SearchSuggestion[]> =>
    (await search(query, signal)).map((suggestion) => {
      const type = suggestion.description?.split(' · ')[0]
      const isStation = suggestion.group === 'Estaciones'
      return {
        ...suggestion,
        tags: [
          ...(isStation && type ? [{ label: type, color: TYPE_COLORS[type] }] : []),
          { label: isStation ? 'Punto SAIH' : 'Municipio' },
        ],
        actions: [{ id: 'centrar', icon: MAP_MARKER, label: 'Centrar en el mapa' }],
        unavailable: suggestion.id === 'R02',
        unavailableReason:
          suggestion.id === 'R02'
            ? 'No visible en el mapa con el modelo actualmente seleccionado'
            : undefined,
      }
    })
}

/** El layout montado pieza a pieza, como el `MainLayout.vue` de TAJO. */
export const manualLayoutExample: CodeExample = {
  title: 'Layout montado pieza a pieza (como el MainLayout de TAJO)',
  description:
    'Lo normal es usar ASAppShell, que coordina las piezas (reapertura al cambiar de sección, Escape, móvil). Si un proyecto necesita otra estructura, las mismas piezas se montan a mano. Aquí, la versión de escritorio: barra con marca, buscador y usuario; barra de iconos; panel de sección que empuja el mapa; y el detalle por la derecha.',
  code: `<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  ASAppBrand,
  ASAppDetailPanel,
  ASAppDrawer,
  ASAppPanelHeader,
  ASAppRail,
  ASAppSearch,
  ASAppTopBar,
  ASAppUserMenu,
  type AppSection,
} from '@vsadtajo/adasa-ui/layout'
import { ASMap } from '@vsadtajo/adasa-ui/map'

const secciones: AppSection[] = [/* { id, label, icon }... */]
const seccion = ref<string | null>(null)
const detalle = ref(false)
const actual = computed(() => secciones.find((s) => s.id === seccion.value))
const alternar = (id: string) => (seccion.value = seccion.value === id ? null : id)
</script>

<template>
  <div class="app">
    <!-- TopBar.vue -->
    <ASAppTopBar>
      <template #brand><ASAppBrand :logos="logos" /></template>
      <template #search>
        <ASAppSearch :fetch-suggestions="buscar" @select="abrirFicha" />
      </template>
      <template #actions>
        <ASAppUserMenu :user="usuario" @logout="cerrarSesion" />
      </template>
    </ASAppTopBar>

    <div class="app__cuerpo">
      <!-- DesktopRail.vue -->
      <ASAppRail :sections="secciones" :active-section="seccion" @toggle="alternar" />
      <!-- SecondaryDrawer.vue -->
      <ASAppDrawer :open="seccion !== null" :label="actual?.label">
        <ASAppPanelHeader v-if="actual" :title="actual.label" @close="seccion = null" />
        <PanelDeSeccion :seccion="seccion" />
      </ASAppDrawer>
      <main class="app__mapa"><ASMap :center="[40.4, -3.7]" :zoom="7" /></main>
      <!-- RightNavigation.vue -->
      <ASAppDetailPanel :open="detalle" :offset="seccion ? 376 : 56" @close="detalle = false">
        <FichaEstacion />
      </ASAppDetailPanel>
    </div>
  </div>
</template>

<style scoped>
.app { display: flex; flex-direction: column; height: 100vh; }
.app__cuerpo { position: relative; display: flex; flex: 1; min-height: 0; }
.app__mapa { flex: 1; min-width: 0; }
</style>`,
}
