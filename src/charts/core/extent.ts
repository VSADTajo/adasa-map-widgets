/**
 * Mínimo y máximo de una lista de números, recorriéndola una vez.
 *
 * No usar `Math.min(...valores)` con datos de series: pasa cada valor como
 * un argumento y, con cientos de miles de puntos, desborda la pila
 * ("Maximum call stack size exceeded"); la gráfica ni se llega a dibujar.
 *
 * @returns `undefined` si no hay ningún número finito.
 */
export function extent(values: Iterable<number | null | undefined>): [number, number] | undefined {
  let min = Infinity
  let max = -Infinity
  for (const value of values) {
    if (value === null || value === undefined || !Number.isFinite(value)) continue
    if (value < min) min = value
    if (value > max) max = value
  }
  return min === Infinity ? undefined : [min, max]
}
