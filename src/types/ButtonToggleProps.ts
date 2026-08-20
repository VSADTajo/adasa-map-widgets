import type { TimeControlsTheme } from './TimelineProps'

/** Esquina del contenedor (normalmente un mapa) donde se ancla el grupo de botones. */
export type ButtonTogglePosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

/** Un botón del grupo (el equivalente a un `<v-btn value="...">Label</v-btn>` de Vuetify). */
export interface ButtonToggleOption {
  value: string
  label: string
  disabled?: boolean
}

/**
 * Props de `ASMapButtonToggle`.
 *
 * Componente **controlado**: `modelValue` se usa con `v-model`, y el widget
 * no gestiona ningún store por su cuenta — solo emite qué `value` de
 * `options` se ha elegido. Selección obligatoria (siempre hay un botón
 * activo, no se puede deseleccionar): si `modelValue` no coincide con
 * ninguna opción, se muestra la primera como activa.
 */
export interface ButtonToggleProps {
  /** Botones del grupo. */
  options: ButtonToggleOption[]
  /** `value` de la opción activa. */
  modelValue?: string
  /** Color del botón activo (CSS válido: hex, rgb, hsl...). @default '#2563eb' */
  accentColor?: string
  /** Esquina donde se ancla. @default 'top-left' */
  position?: ButtonTogglePosition
  /**
   * Distancia entre el widget y los bordes del contenedor. Un `number` se
   * interpreta en píxeles; un `string` se usa tal cual. @default 20
   */
  offset?: string | number
  /** Tema visual de los botones no activos. @default 'dark' */
  theme?: TimeControlsTheme
}

/** Contrato de eventos de `ASMapButtonToggle`. */
export interface ButtonToggleEmits {
  /** El usuario eligió otro botón del grupo. */
  'update:modelValue': [value: string]
}
