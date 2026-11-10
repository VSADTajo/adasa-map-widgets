import { inject, provide, type InjectionKey } from 'vue'
import type { IconResolver } from '@/core/types/icon'

const ICONS_KEY: InjectionKey<IconResolver> = Symbol('as-icons')

/**
 * Registra cómo se traducen los **nombres** de icono (`'mdi:layers'`,
 * `'tabler:map'`, `'mdi-layers'`...) en toda la aplicación. Llámalo una vez
 * en la raíz, como `provideTheme`. Los trazados SVG y los componentes no lo
 * necesitan: solo los nombres.
 *
 * La librería no depende de ninguna librería de iconos: el proyecto elige
 * la suya y la conecta aquí.
 *
 * @example
 * ```ts
 * // Iconify (cualquier set: mdi, tabler, material-symbols...)
 * import { Icon } from '@iconify/vue'
 * provideIcons((name) => ({ component: Icon, props: { icon: name } }))
 *
 * // La fuente @mdi/font, como en Vuetify ('mdi-layers')
 * import '@mdi/font/css/materialdesignicons.css'
 * provideIcons((name) => (name.startsWith('mdi-') ? { class: `mdi ${name}` } : undefined))
 * ```
 */
export function provideIcons(resolve: IconResolver): void {
  provide(ICONS_KEY, resolve)
}

/** El resolvedor de nombres registrado con `provideIcons`, o `undefined` si no hay ninguno. */
export function useIconResolver(): IconResolver | undefined {
  return inject(ICONS_KEY, undefined)
}

/** Si un texto es un trazado SVG (`M`/`m` y un número) y no un nombre de icono. */
export function isSvgPath(value: string): boolean {
  return /^[Mm]\s*-?[\d.]/.test(value.trim())
}
