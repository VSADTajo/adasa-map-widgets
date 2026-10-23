/**
 * Props de `ASSlider`: un valor numérico dentro de un rango.
 *
 * @example
 * ```vue
 * <ASSlider v-model="opacidad" label="Opacidad" :min="0" :max="100" :step="5"
 *   :format="(v) => `${v} %`" />
 * ```
 */
export interface SliderProps {
  /** Valor (`v-model`). Se ajusta a `min`, `max` y `step`. */
  modelValue: number
  /**
   * Mínimo.
   * @default 0
   */
  min?: number
  /**
   * Máximo.
   * @default 100
   */
  max?: number
  /**
   * Paso: lo que avanza con cada flecha (Re Pág / Av Pág, diez pasos).
   * @default 1
   */
  step?: number
  /** Etiqueta (también el nombre accesible). */
  label: string
  /**
   * Oculta la etiqueta a la vista; los lectores de pantalla la siguen
   * leyendo (p. ej. un slider de opacidad dentro de una fila que ya dice qué capa es).
   * @default false
   */
  hideLabel?: boolean
  /**
   * Muestra el valor junto a la etiqueta.
   * @default true
   */
  showValue?: boolean
  /**
   * Texto del valor, a la vista y para los lectores de pantalla
   * (`aria-valuetext`). Por defecto, el número con el formato del idioma.
   */
  format?: (value: number) => string
  /** Texto de ayuda bajo el control. */
  hint?: string
  /** Deshabilitado: ni se enfoca ni emite. */
  disabled?: boolean
  /**
   * Entra en el orden de tabulación. `false` lo deja fuera (tabindex -1) para
   * los controles compuestos que mueven el foco con las flechas, como `ASTreeList`.
   * @default true
   */
  focusable?: boolean
  /** Id del control. Si no se pasa, se genera uno. */
  id?: string
  /**
   * Tema. Sin prop, el de `provideTheme`; si tampoco hay, el del contenedor.
   */
  theme?: 'light' | 'dark'
}

/** Eventos de `ASSlider`. */
export interface SliderEmits {
  /** Cada cambio mientras se arrastra o con el teclado (para `v-model`). */
  'update:modelValue': [value: number]
  /** Valor definitivo, al soltar el control (para guardar o pedir datos solo una vez). */
  change: [value: number]
}
