import type { ChartLibrary } from '@/charts/types/chart'
import type { ChartEngine } from './types'

/**
 * Registro de motores, cargados bajo demanda: un proyecto que solo use
 * ECharts nunca descarga el código de Chart.js ni de ApexCharts (y no
 * necesita tenerlos instalados). Mismo patrón que `getLayerRegistry` en
 * `src/map/layers/index.ts`.
 */
const ENGINES: Record<ChartLibrary, () => Promise<ChartEngine>> = {
  echarts: () => import('./echarts').then((module) => module.echartsEngine),
  chartjs: () => import('./chartjs').then((module) => module.chartjsEngine),
  apexcharts: () => import('./apexcharts').then((module) => module.apexchartsEngine),
}

/** Paquetes npm que necesita cada motor (para el mensaje de error si faltan). */
export const ENGINE_PACKAGES: Record<ChartLibrary, string[]> = {
  echarts: ['echarts'],
  chartjs: [
    'chart.js',
    'chartjs-plugin-annotation',
    'chartjs-plugin-zoom',
    'chartjs-adapter-date-fns',
  ],
  apexcharts: ['apexcharts'],
}

export function loadChartEngine(library: ChartLibrary): Promise<ChartEngine> {
  return ENGINES[library]()
}

export type { ChartEngine, ChartEngineInstance, ChartEngineHandlers } from './types'
