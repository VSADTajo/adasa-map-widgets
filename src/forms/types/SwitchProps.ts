import type { ControlSize } from './common'

/**
 * Props de `ASSwitch`: interruptor de encendido y apagado con efecto
 * inmediato (mostrar una capa, activar la actualización automática...).
 * Para una opción que se confirma al enviar un formulario, usa `ASCheckbox`.
 *
 * @example
 * ```vue
 * <ASSwitch v-model="autoRefresh" label="Actualizar cada 5 minutos" />
 * ```
 */
export interface SwitchProps {
  /** Encendido (`v-model`). */
  modelValue?: boolean
  /** Etiqueta visible, asociada al interruptor. El slot por defecto tiene prioridad. */
  label?: string
  /** Texto de ayuda bajo el interruptor. */
  hint?: string
  /** Deshabilitado. */
  disabled?: boolean
  /**
   * Tamaño.
   * @default 'md'
   */
  size?: ControlSize
  /**
   * Lado de la etiqueta: `'end'` (a la derecha) o `'start'` (a la izquierda,
   * con el interruptor alineado al final, como en una lista de ajustes).
   * @default 'end'
   */
  labelPosition?: 'start' | 'end'
  /** Id del interruptor. Si no se pasa, se genera uno. */
  id?: string
  /** Tema. Sin prop, el de `provideTheme`; si tampoco hay, el del contenedor. */
  theme?: 'light' | 'dark'
}

/** Eventos de `ASSwitch`. */
export interface SwitchEmits {
  /** Nuevo estado (para `v-model`). */
  'update:modelValue': [value: boolean]
}
