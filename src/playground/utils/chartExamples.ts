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

/** Caudal observado (puntos), para las demos que no usan el hidrograma. */
export const exampleFlowPoints = series(PAST, observedFlow)

/**
 * Aforos manuales: una medida cada 6 h, algo por encima o por debajo del
 * SAIH (un segundo observado del mismo punto).
 */
export const exampleGaugings: HydroPoint[] = range(-48, 0)
  .filter((hour) => hour % 6 === 0)
  .map((hour) => [at(hour), round(observedFlow(hour) * (1 + 0.06 * Math.sin(hour)))])

export const exampleDischarge: HydroVariable = {
  observed: [{ id: 'saih', name: 'Observado', values: exampleFlowPoints }],
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

/** Lluvia observada (puntos), para las demos que no usan el hidrograma. */
export const exampleRainPoints = series(PAST, (h) => rain(h, -30, 9) + rain(h, -6, 4))

export const examplePrecipitation: HydroVariable = {
  observed: [{ id: 'saih', name: 'Observado', values: exampleRainPoints }],
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

// ── Embalse: entrada, salida, volumen y nivel ──

/** Entrada al embalse (m³/s): la avenida de aguas arriba, algo mayor y adelantada al caudal del ejemplo. */
const inflowAt = (hour: number) => flood(hour, -24, 118, 32) + flood(hour, 20, 150, 0) * 0.3
const inflowMedian = (hour: number) => flood(hour, -24, 118, 32) + flood(hour, 20, 150, 0)

/** Desembalse (m³/s): 25 de base; se abren compuertas hace 10 h y se sube a 60 en la punta prevista. */
const outflowAt = (hour: number) => (hour < -10 ? 25 : hour < 12 ? 45 : 60)

/** Volumen (hm³) acumulando entrada menos salida hora a hora desde `start`. */
function volumeSeries(hours: number[], inflow: (hour: number) => number, start: number) {
  let volume = start
  return hours.map((hour): HydroPoint => {
    volume += ((inflow(hour) - outflowAt(hour)) * 3600) / 1e6
    return [at(hour), Math.round(volume * 100) / 100]
  })
}

/** Curva cota-volumen local: unos 4 cm por hm³ alrededor de 649 msnm. */
const levelOf = (volume: number) => Math.round((649 + (volume - 812) * 0.04) * 100) / 100

const observedVolume = volumeSeries(PAST, inflowAt, 812)
const lastVolume = observedVolume.at(-1)![1]!
const volumeAt = (factor = 1) => volumeSeries(FUTURE, (h) => inflowMedian(h) * factor, lastVolume)
const toLevel = (points: HydroPoint[]): HydroPoint[] =>
  points.map(([date, volume]) => [date, volume === null ? null : levelOf(volume)])

export const exampleInflow: HydroVariable = {
  observed: [{ id: 'saih', name: 'Caudal de entrada', values: series(PAST, inflowAt) }],
  forecasts: [{ id: 'eps', name: 'EPS', values: series(FUTURE, inflowMedian) }],
}

export const exampleOutflow: HydroVariable = {
  observed: [{ id: 'saih', name: 'Caudal de salida', values: series(PAST, outflowAt) }],
  forecasts: [{ id: 'eps', name: 'EPS', values: series(FUTURE, outflowAt) }],
}

export const exampleVolume: HydroVariable = {
  observed: [{ id: 'saih', name: 'Volumen', values: observedVolume }],
  forecasts: [{ id: 'eps', name: 'EPS', values: volumeAt() }],
}

/** Nivel con la previsión EPS y sus percentiles (de distintas entradas posibles). */
export const exampleLevel: HydroVariable = {
  observed: [{ id: 'saih', name: 'Nivel', values: toLevel(observedVolume) }],
  forecasts: [
    {
      id: 'eps',
      name: 'EPS',
      values: toLevel(volumeAt()),
      percentiles: {
        p10: toLevel(volumeAt(0.55)),
        p25: toLevel(volumeAt(0.8)),
        p75: toLevel(volumeAt(1.25)),
        p90: toLevel(volumeAt(1.6)),
      },
    },
  ],
}

/** Umbrales del embalse: resguardo en volumen y cota máxima en nivel. */
export const exampleReservoirThresholds: HydroThreshold[] = [
  { value: 826, level: 'amarillo', variable: 'volume', label: 'Resguardo' },
  { value: 649.9, level: 'rojo', variable: 'level', label: 'Cota máxima' },
]
