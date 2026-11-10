import type { HydroThreshold } from '@/charts/types/HydrographProps'
import type { AlertThresholds, MeasureSeries, TimePoint } from '@/detail/types/hydro'
import type { DetailTag } from '@/detail/types/DetailHeaderProps'
import { exampleDischarge, exampleFlowPoints, exampleThresholds } from './chartExamples'

/**
 * Datos de ejemplo de las tarjetas de detalle: los mismos del hidrograma del
 * playground (`chartExamples.ts`), pasados a `MeasureSeries`, para que la
 * ficha de ejemplo cuadre con la gráfica. Así haría su adaptador cualquier
 * proyecto: de su API a series y umbrales limpios.
 */

/** `HydroThreshold[]` del hidrograma → `AlertThresholds` de las tarjetas. */
export function toAlertThresholds(thresholds: HydroThreshold[]): AlertThresholds {
  return Object.fromEntries(thresholds.map((t) => [t.level, t.value])) as AlertThresholds
}

export const DEMO_THRESHOLDS = toAlertThresholds(exampleThresholds)

const forecast = (id: string) => exampleDischarge.forecasts!.find((f) => f.id === id)!

export const DEMO_OBSERVED: MeasureSeries = {
  id: 'observado',
  label: 'Observado',
  unit: 'm³/s',
  data: exampleFlowPoints,
}

export const DEMO_FORECASTS: MeasureSeries[] = [
  { id: 'harmonie', label: 'Harmonie', unit: 'm³/s', data: forecast('harmonie').values! },
  { id: 'eps', label: 'EPS medio', unit: 'm³/s', data: forecast('eps').values! },
]

export const DEMO_PERCENTILES: MeasureSeries[] = (['p10', 'p25', 'p75', 'p90'] as const).map(
  (p) => ({
    id: p,
    label: `EPS ${p.toUpperCase()}`,
    unit: 'm³/s',
    data: forecast('eps').percentiles![p]!,
  }),
)

/** Embalse: caudal de entrada, de salida (laminado) y volumen, con sus propios umbrales. */
const scale = (data: TimePoint[], factor: number, offset = 0): TimePoint[] =>
  data.map(([date, value]) => [
    date,
    value == null ? null : Math.round((value * factor + offset) * 10) / 10,
  ])

export const DEMO_RESERVOIR: MeasureSeries[] = [
  { id: 'entrada', label: 'Entrada', unit: 'm³/s', data: DEMO_OBSERVED.data },
  { id: 'salida', label: 'Salida', unit: 'm³/s', data: scale(DEMO_OBSERVED.data, 0.6) },
  {
    id: 'volumen',
    label: 'Volumen',
    unit: 'hm³',
    data: scale(DEMO_OBSERVED.data, 0.4, 120),
    thresholds: { amarillo: 150, naranja: 160, rojo: 170 },
  },
]

export const DEMO_TAGS: DetailTag[] = [
  {
    label: 'Aforo',
    icon: 'M12,20A6,6 0 0,1 6,14C6,10 12,3.25 12,3.25C12,3.25 18,10 18,14A6,6 0 0,1 12,20Z',
  },
  {
    label: 'Zona Alta',
    icon: 'M15,19L9,16.89V5L15,7.11M20.5,3C20.44,3 20.39,3 20.34,3L15,5.1L9,3L3.36,4.9C3.15,4.97 3,5.15 3,5.38V20.5A0.5,0.5 0 0,0 3.5,21C3.55,21 3.61,21 3.66,20.97L9,18.9L15,21L20.64,19.1C20.85,19 21,18.85 21,18.62V3.5A0.5,0.5 0 0,0 20.5,3Z',
  },
  {
    label: 'Aranjuez',
    icon: 'M19,15H17V13H19M19,19H17V17H19M13,7H11V5H13M13,11H11V9H13M13,15H11V13H13M13,19H11V17H13M7,11H5V9H7M7,15H5V13H7M7,19H5V17H7M15,11V5L12,2L9,5V7H3V21H21V11H15Z',
  },
  { label: 'Madrid' },
]

/** Conjuntos de datos para probar los estados de las tarjetas en el playground. */
export const DATASETS: Record<string, { series: MeasureSeries[]; thresholds?: AlertThresholds }> = {
  'observado (con aviso)': { series: [DEMO_OBSERVED], thresholds: DEMO_THRESHOLDS },
  previsiones: { series: DEMO_FORECASTS, thresholds: DEMO_THRESHOLDS },
  'previsiones + percentiles': {
    series: [...DEMO_FORECASTS, ...DEMO_PERCENTILES],
    thresholds: DEMO_THRESHOLDS,
  },
  'embalse (entrada, salida, volumen)': { series: DEMO_RESERVOIR, thresholds: DEMO_THRESHOLDS },
  'sin umbrales': { series: [DEMO_OBSERVED] },
  'sin datos': { series: [{ id: 'vacia', label: 'Observado', unit: 'm³/s', data: [] }] },
}
