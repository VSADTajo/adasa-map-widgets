import type { FieldProps } from './common'

/**
 * Props de `ASFormField`: etiqueta, ayuda y error de un control, enlazados
 * con él por `for` y `aria-describedby`. Lo usan todos los campos de la
 * librería, y sirve para que un proyecto envuelva sus propios controles.
 *
 * @example
 * ```vue
 * <ASFormField label="Cuenca" hint="Código de 3 cifras" v-slot="{ id, describedBy, invalid }">
 *   <MiControl :id="id" :aria-describedby="describedBy" :aria-invalid="invalid" />
 * </ASFormField>
 * ```
 */
export interface FormFieldProps extends FieldProps {
  /**
   * Elemento raíz. `'fieldset'` agrupa varios controles (radios, checkboxes)
   * bajo una `<legend>` en vez de un `<label>`.
   * @default 'div'
   */
  as?: 'div' | 'fieldset'
  /** Oculta la etiqueta a la vista; sigue asociada al control como su nombre accesible. */
  hideLabel?: boolean
}

/** Props del slot por defecto de `ASFormField`, para enlazar el control. */
export interface FormFieldSlotProps {
  /** Id que debe llevar el control (el `for` de la etiqueta). */
  id: string
  /** Id de la etiqueta, para `aria-labelledby` en controles que no son `<input>`. */
  labelId: string
  /** Ids de la ayuda y del error para `aria-describedby` (`undefined` si no hay). */
  describedBy: string | undefined
  /** Si el campo tiene error. */
  invalid: boolean
}
