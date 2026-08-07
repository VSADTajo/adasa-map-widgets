import type { TimeControlsPosition, TimeControlsTheme } from './TimelineProps'

/**
 * Props de `ASMapTimeRangeControls`.
 *
 * Hermano de {@link TimelineProps} (usado por `ASMapTimeControls`): en vez de
 * seleccionar un único instante, selecciona un **rango** `[inicio, fin]`
 * dentro de la misma `timeline`. Comparte la misma filosofía — componente
 * controlado y agnóstico de cualquier fuente de datos o store — y el mismo
 * conjunto de props de apariencia (`position`, `theme`, `accentColor`, `width`).
 * A diferencia de `ASMapTimeControls`, no tiene reproducción automática.
 */
export interface TimeRangeProps {
  /** Instantes de tiempo disponibles, ordenados cronológicamente. */
  timeline: Date[]
  /** Índices `[inicio, fin]` (dentro de `timeline`) del rango seleccionado. */
  currentRange: [number, number]
  /** Lado del contenedor donde se ancla el widget. @default 'bottom' */
  position?: TimeControlsPosition
  /** Tema visual. @default 'dark' */
  theme?: TimeControlsTheme
  /**
   * Color de acento para el rango actual (CSS válido: hex, rgb, hsl...).
   * Igual que en `ASMapTimeControls`: pensado para recibir el resultado de
   * una escala de color propia del proyecto consumidor. Si se omite, usa el
   * color primario del tema.
   */
  accentColor?: string
  /**
   * Ancho del widget. Un `number` se interpreta en píxeles; un `string` se
   * usa tal cual (admite cualquier unidad CSS válida: `'90%'`, `'40rem'`...).
   * Si se omite, usa el ancho responsive por defecto según `position`.
   */
  width?: string | number
}

/**
 * Contrato de eventos de `ASMapTimeRangeControls`, útil para tipar listeners
 * externos sin duplicar las firmas declaradas en el propio componente.
 */
export interface TimeRangeEmits {
  /** Nuevo rango `[inicio, fin]` propuesto (arrastre de un manejador o paso manual). */
  'update:currentRange': [range: [number, number]]
  /** Se emite cuando el par de instantes resuelto (`timeline[inicio]`/`timeline[fin]`) cambia. */
  'range-changed': [range: { start: Date; end: Date }]
}
