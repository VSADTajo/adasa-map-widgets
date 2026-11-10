import type { IconValue } from './icon'

/**
 * Props de `ASIcon`: un icono, venga de un trazado SVG, de un componente de
 * cualquier librería o de un nombre (`'mdi:layers'`) que traduce `provideIcons`.
 *
 * @example
 * ```vue
 * <script setup>
 * import { mdiFilter } from '@mdi/js'
 * import { Map } from 'lucide-vue-next'
 * </script>
 * <ASIcon :icon="mdiFilter" />
 * <ASIcon :icon="Map" />
 * <ASIcon icon="tabler:map" />
 * ```
 */
export interface IconProps {
  /** El icono (ver `IconValue`). */
  icon?: IconValue
  /**
   * @deprecated Usa `icon`. Atributo `d` del `<path>`: se mantiene por
   * compatibilidad y equivale a `icon` con un trazado.
   */
  path?: string
  /**
   * Lado: un número son píxeles; un string se usa tal cual (`'1em'`
   * para que siga al tamaño del texto).
   * @default 24
   */
  size?: number | string
  /**
   * Nombre accesible. Sin él, el icono es decorativo (`aria-hidden`) y el
   * nombre lo pone el botón o el texto que lo acompaña; con él, se anuncia
   * como imagen (`role="img"`).
   */
  label?: string
}
