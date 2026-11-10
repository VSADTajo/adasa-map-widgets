/**
 * Índice del instante de `timeline` más cercano a `time`. Une los
 * componentes que trabajan con un índice (p. ej. `currentTimeIndex` de
 * `ASMapTimeControls`) con los que trabajan con fechas (p. ej.
 * `currentTime` / `time-select` de las gráficas). `-1` si `timeline` está vacío.
 *
 * @example
 * ```ts
 * // Clic en la gráfica → mover el slider al instante más cercano.
 * onTimeSelect = ({ time }) => (index.value = nearestTimeIndex(timeline, time))
 * ```
 */
export function nearestTimeIndex(
  timeline: readonly (Date | number)[],
  time: Date | number,
): number {
  const target = typeof time === 'number' ? time : time.getTime()
  let best = -1
  let bestDistance = Infinity
  timeline.forEach((instant, index) => {
    const distance = Math.abs((typeof instant === 'number' ? instant : instant.getTime()) - target)
    if (distance < bestDistance) {
      best = index
      bestDistance = distance
    }
  })
  return best
}
