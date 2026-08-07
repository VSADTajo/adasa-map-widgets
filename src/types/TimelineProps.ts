/** Lado del contenedor (normalmente un mapa) donde se ancla el widget de tiempo. */
export type TimeControlsPosition = 'bottom' | 'top' | 'left' | 'right'

/** Tema visual del widget de controles de tiempo. */
export type TimeControlsTheme = 'dark' | 'light'

/**
 * Props de `ASMapTimeControls`.
 *
 * El componente es agnóstico de cualquier fuente de datos o store: recibe una
 * línea de tiempo ya calculada (`timeline`) y es controlado externamente —
 * `currentTimeIndex` e `isPlaying` se usan con `v-model` — para que el
 * proyecto consumidor decida qué hacer en cada paso (p. ej. actualizar
 * parámetros de una capa temporal en su propio store).
 */
export interface TimelineProps {
  /** Instantes de tiempo disponibles, ordenados cronológicamente. */
  timeline: Date[]
  /** Índice (dentro de `timeline`) del instante actualmente seleccionado. */
  currentTimeIndex: number
  /** Si es `true`, el widget avanza automáticamente por la línea de tiempo cada `stepMs`. */
  isPlaying: boolean
  /** Intervalo en milisegundos entre pasos automáticos durante la reproducción. @default 2000 */
  stepMs?: number
  /** Lado del contenedor donde se ancla el widget. @default 'bottom' */
  position?: TimeControlsPosition
  /** Tema visual. @default 'dark' */
  theme?: TimeControlsTheme
  /**
   * Color de acento para el instante actual (CSS válido: hex, rgb, hsl...).
   * Pensado para recibir el resultado de una escala de color propia del
   * proyecto consumidor (p. ej. una `d3.scaleSequential` u otra función
   * `valor → color`) evaluada sobre el dato asociado a `timeline[currentTimeIndex]`,
   * de forma que el widget refleje visualmente esa magnitud sin necesidad de
   * conocer la escala ni el dato en sí. Si se omite, usa el color primario del tema.
   */
  accentColor?: string
  /**
   * Ancho del widget. Un `number` se interpreta en píxeles; un `string` se
   * usa tal cual (admite cualquier unidad CSS válida: `'90%'`, `'40rem'`...).
   * Si se omite, usa el ancho responsive por defecto según `position`
   * (más ancho en `top`/`bottom`, más estrecho en `left`/`right`).
   */
  width?: string | number
}

/**
 * Contrato de eventos de `ASMapTimeControls`, útil para tipar listeners
 * externos sin duplicar las firmas declaradas en el propio componente.
 */
export interface TimelineEmits {
  /** Nuevo índice propuesto (arrastre del slider, paso manual o avance automático). */
  'update:currentTimeIndex': [index: number]
  /** Nuevo estado de reproducción (play/pause, o pausa automática al arrastrar el slider). */
  'update:isPlaying': [playing: boolean]
  /** Se emite cuando el instante de tiempo resuelto (`timeline[currentTimeIndex]`) cambia. */
  'time-changed': [date: Date]
}
