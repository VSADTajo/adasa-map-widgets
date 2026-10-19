import type { ButtonVariant, ControlSize } from './common'

/**
 * Props de `ASIconButton`: botón cuadrado solo con icono.
 *
 * @example
 * ```vue
 * <ASIconButton :icon="mdiFilter" label="Filtros" v-model:pressed="filtrosVisibles" />
 * ```
 */
export interface IconButtonProps {
  /**
   * Icono: trazado SVG de 24 × 24 (formato `@mdi/js`). Opcional si se usa
   * el slot `icon` (un SVG propio, p. ej. de trazo en vez de relleno).
   */
  icon?: string
  /** Nombre accesible (`aria-label`) y tooltip nativo (`title`). Obligatorio: el botón no tiene texto. */
  label: string
  /**
   * Variante.
   * @default 'ghost'
   */
  variant?: ButtonVariant
  /**
   * Tamaño.
   * @default 'md'
   */
  size?: ControlSize
  /**
   * Tipo nativo.
   * @default 'button'
   */
  type?: 'button' | 'submit' | 'reset'
  /** Operación en curso (indicador de carga, `aria-busy`, no emite). */
  loading?: boolean
  /** Deshabilitado. */
  disabled?: boolean
  /**
   * Estado de interruptor (`aria-pressed`), para `v-model:pressed`. Sin
   * prop, es un botón normal.
   */
  pressed?: boolean
  /** Tema. Sin prop, el de `provideTheme`; si tampoco hay, el del contenedor. */
  theme?: 'light' | 'dark'
}

/** Eventos de `ASIconButton`. */
export interface IconButtonEmits {
  /** Pulsado. No se emite si está deshabilitado o cargando. */
  click: [event: MouseEvent]
  /** Nuevo estado del interruptor, solo si se pasa `pressed` (para `v-model:pressed`). */
  'update:pressed': [value: boolean]
}
