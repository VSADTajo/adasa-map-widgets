import { shallowRef } from 'vue'
import { addCollection, Icon } from '@iconify/vue'
import type { IconResolver, ResolvedIcon } from '@/core/types/icon'

/*
 * Resolvedor de iconos del playground: el mismo que registraría un proyecto
 * con `provideIcons`. Con él, los iconos se pueden escribir por nombre (en el
 * editor JSON de `sections`, por ejemplo) en vez de pegar un trazado.
 *
 * Los dos juegos completos (MDI y Tabler) pesan varios MB: se cargan aparte,
 * después de la app. El resolvedor lee refs reactivas, así que ASIcon vuelve
 * a pintar el icono cuando llegan; mientras, un hueco del mismo tamaño.
 */

const mdiPaths = shallowRef<Record<string, string> | null>(null)
const tablerReady = shallowRef(false)

void import('@mdi/js').then(
  (module) => (mdiPaths.value = module as unknown as Record<string, string>),
)
// Tabler, sin conexión: Iconify no tiene que pedirlo a su API.
void import('@iconify-json/tabler').then(({ icons }) => {
  addCollection(icons)
  tablerReady.value = true
})

/** Hueco mientras carga el juego de iconos (sin aviso de "sin resolver"). */
const LOADING: ResolvedIcon = { path: '' }

/** `'map-marker'` → `'mdiMapMarker'` (el nombre del export de `@mdi/js`). */
function mdiExport(name: string): string {
  return `mdi${name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')}`
}

/**
 * - `'mdi:map-marker'`: trazado de `@mdi/js` (sin conexión).
 * - `'mdi-map-marker'`: clase de la fuente `@mdi/font` (su CSS se importa en `main.ts`).
 * - `'tabler:map'`: componente `Icon` de Iconify, con la colección incluida.
 * - Cualquier otro `'prefijo:nombre'` (`'lucide:map'`...): `Icon` de Iconify, que
 *   lo descarga de su API.
 */
export const playgroundIcons: IconResolver = (name) => {
  if (name.startsWith('mdi:')) {
    if (!mdiPaths.value) return LOADING
    const path = mdiPaths.value[mdiExport(name.slice('mdi:'.length))]
    return path ? { path } : undefined
  }
  if (name.startsWith('mdi-')) return { class: `mdi ${name}` }
  if (name.startsWith('tabler:') && !tablerReady.value) return LOADING
  if (name.includes(':')) return { component: Icon, props: { icon: name } }
  return undefined
}
