import type { TimeControlsPosition, TimeControlsTheme } from './TimelineProps'

/**
 * Evento/aviso con vigencia temporal y un nivel de severidad, usado para
 * colorear los intervalos de {@link DayIntervalProps} con los que solape.
 */
export interface DayIntervalAlert {
  /** Inicio de vigencia. */
  start: Date
  /** Fin de vigencia. */
  end: Date
  /**
   * Nivel de severidad (cadena libre, p. ej. `'amarillo' | 'naranja' | 'rojo'`
   * o `'low' | 'medium' | 'high'`). Determina el color del intervalo vía
   * `levelColors`/`levelTextColors` y su prioridad frente a otros niveles
   * solapados según su posición dentro de `levels`. Los niveles que no
   * aparezcan en `levels` se ignoran.
   */
  level: string
}

/** Intervalo ya resuelto, expuesto en el evento `interval-changed`. */
export interface DayIntervalSelection {
  start: Date
  end: Date
  /** Nivel de mayor severidad activo en este intervalo, o `null` si ninguno. */
  level: string | null
}

/**
 * Props de `ASMapDayIntervalControls`.
 *
 * Genera una rejilla de `days` columnas (días) × intervalos de `intervalHours`
 * horas cada una (por defecto: 3 días × bloques de 6h) y permite seleccionar
 * uno. Es un componente **controlado** y agnóstico de cualquier fuente de
 * datos o store: recibe los `alerts` ya resueltos (con su vigencia y nivel)
 * y `selectedIntervalStart` se usa con `v-model` — el proyecto consumidor
 * decide qué hacer con la selección (p. ej. filtrar una capa por el
 * intervalo elegido). El propio widget no sabe nada de AEMET, de avisos
 * reales, de capas ni de mapas.
 */
export interface DayIntervalProps {
  /**
   * Inicio del intervalo actualmente seleccionado. Debe coincidir
   * exactamente (mismo instante) con el inicio de alguno de los intervalos
   * generados internamente para marcarlo como seleccionado.
   */
  selectedIntervalStart: Date | null
  /** Eventos/avisos con vigencia temporal y nivel. @default [] */
  alerts?: DayIntervalAlert[]
  /**
   * Niveles conocidos, ordenados de menor a mayor severidad: decide qué
   * nivel "gana" cuando varios solapan un intervalo, y qué alertas se
   * ignoran (las de un nivel ausente de esta lista).
   * @default ['amarillo', 'naranja', 'rojo']
   */
  levels?: string[]
  /**
   * Color de fondo por nivel (CSS válido).
   * @default { amarillo: '#ffd54f', naranja: '#fb8c00', rojo: '#e53935' }
   */
  levelColors?: Record<string, string>
  /**
   * Color de texto por nivel; los niveles no listados usan blanco.
   * @default { amarillo: '#2f2f2f' }
   */
  levelTextColors?: Record<string, string>
  /** Número de columnas de día. @default 3 */
  days?: number
  /** Ancho en horas de cada intervalo dentro de un día (debe dividir a 24). @default 6 */
  intervalHours?: number
  /** Fecha ancla para la columna "hoy". @default `new Date()` */
  baseDate?: Date
  /**
   * Etiquetas de columna de día, en orden (p. ej. `['Hoy', 'Mañana']`). Si
   * falta la etiqueta de algún índice, se genera automáticamente ('Hoy',
   * 'Mañana', 'Pasado mañana', o el nombre del día de la semana).
   */
  dayLabels?: string[]
  /** Título de la cabecera. @default 'Avisos' */
  title?: string
  /** Subtítulo opcional bajo el título (p. ej. el tipo de aviso activo). Se omite si no se indica. */
  subtitle?: string
  /** Lado del contenedor donde se ancla el widget. @default 'bottom' */
  position?: TimeControlsPosition
  /**
   * Distancia desde el lado anclado (`position`). Un `number` se interpreta
   * en píxeles. Útil para apilar este widget sobre otro (p. ej. sobre
   * `ASMapTimeControls`) sin que se superpongan.
   * @default 20 (píxeles)
   */
  offset?: string | number
  /** Tema visual. @default 'dark' */
  theme?: TimeControlsTheme
  /**
   * Color de acento (CSS válido) usado para el resaltado del intervalo
   * seleccionado sin nivel y el indicador del intervalo actual.
   */
  accentColor?: string
  /**
   * Ancho del widget. Un `number` se interpreta en píxeles; un `string` se
   * usa tal cual (admite cualquier unidad CSS válida: `'90%'`, `'40rem'`...).
   */
  width?: string | number
}

/**
 * Contrato de eventos de `ASMapDayIntervalControls`, útil para tipar
 * listeners externos sin duplicar las firmas declaradas en el propio componente.
 */
export interface DayIntervalEmits {
  /** Nuevo inicio de intervalo seleccionado. */
  'update:selectedIntervalStart': [start: Date]
  /** Se emite junto a `update:selectedIntervalStart`, con el intervalo resuelto (fin y nivel incluidos). */
  'interval-changed': [interval: DayIntervalSelection]
}
