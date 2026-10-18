import type { ChartAnnotations } from '@/charts/types/chart'
import type { HydroPoint, HydroThreshold, HydroVariable } from '@/charts/types/HydrographProps'

/**
 * Datos sintéticos para las gráficas del playground: un episodio de
 * crecida con 48 h de observación y 72 h de previsión (Harmonie
 * determinista y EPS con percentiles). Deterministas (sin aleatoriedad)
 * para que las capturas y los ejemplos sean reproducibles.
 */

const HOUR = 3_600_000

/** Instante "ahora" de los ejemplos: la hora en punto actual. */
export const EXAMPLE_NOW = (() => {
  const now = new Date()
  now.setMinutes(0, 0, 0)
  return now
})()

const at = (offsetHours: number) => new Date(EXAMPLE_NOW.getTime() + offsetHours * HOUR)
const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i)

/** Pulso de crecida: subida rápida y recesión lenta, centrado en `peakAt` (horas). */
function flood(hour: number, peakAt: number, peak: number, base: number): number {
  const dt = hour - peakAt
  const shape = dt < 0 ? Math.exp(-((dt / 9) ** 2)) : Math.exp(-dt / 20)
  return base + (peak - base) * shape
}

/** Lluvia horaria en ráfagas, sin aleatoriedad. */
function rain(hour: number, center: number, intensity: number): number {
  const value =
    intensity *
    Math.exp(-(((hour - center) / 4) ** 2)) *
    (0.6 + 0.4 * Math.abs(Math.sin(hour * 1.7)))
  return Math.round(Math.max(value, 0) * 10) / 10
}

const round = (value: number) => Math.round(value * 10) / 10
const series = (hours: number[], value: (hour: number) => number): HydroPoint[] =>
  hours.map((hour) => [at(hour), round(value(hour))])

const PAST = range(-48, 0)
const FUTURE = range(0, 72)

/** Caudal (m³/s): un pico observado hace 20 h y otro previsto dentro de 26 h. */
const observedFlow = (hour: number) => flood(hour, -20, 96, 28) + flood(hour, 26, 140, 0) * 0.35
const medianFlow = (hour: number) => flood(hour, -20, 96, 28) + flood(hour, 26, 140, 0)
/** Dispersión del conjunto: crece con el horizonte de previsión. */
const spread = (hour: number, factor: number) => 1 + (factor * hour) / 72

export const exampleDischarge: HydroVariable = {
  observed: series(PAST, observedFlow),
  forecasts: [
    {
      id: 'harmonie',
      name: 'Harmonie',
      values: series(FUTURE, (h) => flood(h, -20, 96, 28) + flood(h, 22, 165, 0)),
    },
    {
      id: 'eps',
      name: 'EPS',
      values: series(FUTURE, medianFlow),
      percentiles: {
        p10: series(FUTURE, (h) => medianFlow(h) / spread(h, 0.55)),
        p25: series(FUTURE, (h) => medianFlow(h) / spread(h, 0.25)),
        p75: series(FUTURE, (h) => medianFlow(h) * spread(h, 0.25)),
        p90: series(FUTURE, (h) => medianFlow(h) * spread(h, 0.6)),
      },
    },
  ],
}

export const examplePrecipitation: HydroVariable = {
  observed: series(PAST, (h) => rain(h, -30, 9) + rain(h, -6, 4)),
  forecasts: [
    { id: 'harmonie', name: 'Harmonie', values: series(range(1, 48), (h) => rain(h, 14, 11)) },
    { id: 'eps', name: 'EPS', values: series(range(1, 48), (h) => rain(h, 18, 8)) },
  ],
}

export const exampleThresholds: HydroThreshold[] = [
  { value: 90, level: 'amarillo' },
  { value: 130, level: 'naranja' },
  { value: 180, level: 'rojo' },
]

/** Anotaciones del ejemplo de `ASChart`: un umbral y un intervalo sombreado. */
export const exampleChartAnnotations: ChartAnnotations = {
  y: [{ yAxis: 'y1', value: 90, level: 'amarillo', label: 'Umbral amarillo' }],
  x: [{ type: 'range', from: at(-26), to: at(-14), label: 'Episodio' }],
}
