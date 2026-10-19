/**
 * Props de `ASIcon`: un icono SVG de 24 × 24 a partir de su trazado.
 *
 * @example
 * ```vue
 * <script setup>
 * import { mdiFilter } from '@mdi/js'
 * </script>
 * <ASIcon :path="mdiFilter" />
 * ```
 */
export interface IconProps {
  /**
   * Atributo `d` del `<path>` en una caja de 24 × 24, el formato de
   * `@mdi/js` (p. ej. `mdiFilter`). La librería no depende de `@mdi/js`:
   * cada proyecto importa solo los iconos que usa.
   */
  path: string
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
