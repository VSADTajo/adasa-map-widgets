import type { AlertLevel } from '@/core/types/theme'

/** Valor de una serie en un instante; `null` es un hueco (sin dato). */
export type TimePoint = [date: Date, value: number | null]

/**
 * Umbrales de aviso de una magnitud (caudal, nivel, volumen...). Cada nivel
 * empieza en su valor (incluido); los que falten no se evalúan.
 */
export interface AlertThresholds {
  amarillo?: number | null
  naranja?: number | null
  rojo?: number | null
}

/** Nivel de aviso superado (todos menos `normal`). */
export type ExceededLevel = Exclude<AlertLevel, 'normal'>

/**
 * Serie de una magnitud ya preparada por el proyecto: observado, una
 * previsión (Harmonie, EPS...), caudal de salida, volumen...
 */
export interface MeasureSeries {
  /** Identificador único entre las series del componente. */
  id: string
  /** Nombre visible ("Observado", "Harmonie", "Caudal de salida"). */
  label: string
  /** Valores. No hace falta que vengan ordenados. */
  data: TimePoint[]
  /** Unidad (`'m³/s'`, `'m'`, `'hm³'`, `'mm'`...), para formatear los valores. */
  unit?: string
  /**
   * Umbrales propios de la serie (p. ej. los de volumen en un embalse). Si
   * no se pasan, se usan los `thresholds` del componente.
   */
  thresholds?: AlertThresholds
}

/** Último valor, máximo y mínimo de una serie, con sus fechas. */
export interface SeriesSummary {
  last: [date: Date, value: number] | null
  max: [date: Date, value: number] | null
  min: [date: Date, value: number] | null
  /** Valores con dato. */
  count: number
}

/** Tramo continuo de valores en un mismo nivel de aviso. */
export interface ExceedanceSegment {
  level: ExceededLevel
  start: Date
  end: Date
  /** Valor más alto del tramo. */
  peak: number
}

/** Valores de un intervalo (p. ej. de 6 h) agregados. */
export interface IntervalAggregate {
  start: Date
  min: number
  mean: number
  max: number
  count: number
}

/** Agregado que muestra `ASValueMatrix` en cada celda. */
export type AggregateKind = 'min' | 'mean' | 'max'
