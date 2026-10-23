import type { Component } from 'vue'

/**
 * Un icono, venga de donde venga:
 * - **trazado SVG** (el atributo `d` de un `<path>` en una caja de 24 × 24),
 *   el formato de `@mdi/js`: `mdiLayers`;
 * - **componente Vue** de cualquier librería: `Layers` de `lucide-vue-next`,
 *   el `Icon` de `@iconify/vue` (con `IconComponentValue`), Font Awesome...;
 * - **nombre** (`'mdi:layers'`, `'tabler:map'`, `'mdi-layers'`), que traduce
 *   el resolvedor que registra el proyecto con `provideIcons`.
 *
 * Un texto se toma como trazado si empieza como uno (`M` y un número); si
 * no, como nombre.
 */
export type IconValue = string | Component | IconComponentValue

/** Componente con props (p. ej. `{ component: Icon, props: { icon: 'mdi:layers' } }` de Iconify). */
export interface IconComponentValue {
  component: Component
  props?: Record<string, unknown>
}

/** Lo que devuelve un resolvedor de nombres de icono. */
export type ResolvedIcon =
  | { path: string }
  | { component: Component; props?: Record<string, unknown> }
  /** Clases CSS de una fuente de iconos (p. ej. `'mdi mdi-layers'` con `@mdi/font`). */
  | { class: string }

/** Traduce un nombre de icono (`'mdi:layers'`) a algo que se pueda pintar. `undefined` si no lo conoce. */
export type IconResolver = (name: string) => ResolvedIcon | undefined
