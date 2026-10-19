/**
 * `aria-describedby` de un control: la ayuda y el error que pinta
 * `FieldMessages`, más los ids extra que aporte el control (p. ej. la unidad
 * de `ASInput`). `undefined` si no hay ninguno, para no dejar el atributo vacío.
 */
export function describedByOf(
  id: string,
  hint: string | undefined,
  error: string | boolean | undefined,
  ...extra: (string | undefined | false)[]
): string | undefined {
  const ids = [
    hint ? `${id}-hint` : undefined,
    typeof error === 'string' && error ? `${id}-error` : undefined,
    ...extra,
  ].filter(Boolean)
  return ids.length ? ids.join(' ') : undefined
}

/** Si el campo está en error: un mensaje no vacío o `true`. */
export function isInvalid(error: string | boolean | undefined): boolean {
  return Boolean(error)
}

/**
 * Número escrito por el usuario, con coma o punto decimal (`'12,5'` y
 * `'12.5'` son 12.5). `null` si está vacío o no es un número. Los estados
 * intermedios al escribir (`'12,'`, `'-'`) dan el número que ya hay o `null`.
 */
export function parseDecimal(text: string): number | null {
  const clean = text.replace(/\s/g, '').replace(',', '.')
  if (!/^-?\d*\.?\d*$/.test(clean) || !/\d/.test(clean)) return null
  return Number(clean)
}

/** Texto sin mayúsculas ni tildes, para buscar "rio" y encontrar "Río". */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}
