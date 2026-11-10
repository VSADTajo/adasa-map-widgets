import { computed, type ComputedRef } from 'vue'

let counter = 0

/**
 * Id estable de un control de formulario, para enlazar su `<label>`, su
 * ayuda y su error (`for`, `aria-describedby`...). Usa el `id` que pase el
 * proyecto y, si no pasa ninguno, uno generado al crear el componente.
 *
 * Contador propio en vez de `useId()` de Vue, que llegó en la 3.5: la
 * librería admite `vue ^3.4`.
 */
export function useFieldId(id: () => string | undefined, prefix = 'as-field'): ComputedRef<string> {
  const generated = `${prefix}-${++counter}`
  return computed(() => id() || generated)
}
