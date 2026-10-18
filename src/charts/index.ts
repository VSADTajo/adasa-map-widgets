/**
 * Dominio `charts` (`@vsadtajo/adasa-ui/charts`): gráficas con el mismo API
 * para tres motores (ECharts por defecto, Chart.js y ApexCharts), todos
 * `peerDependencies` opcionales cargadas bajo demanda: instala solo el que uses.
 */

export { default as ASChart } from './components/ASChart.vue'
export { default as ASHydrographChart } from './components/ASHydrographChart.vue'
export { buildHydrograph } from './core/hydrograph'

export type {
  ChartLibrary,
  ChartX,
  ChartPoint,
  ChartRangePoint,
  ChartLineStyle,
  ChartYAxis,
  ChartPanel,
  ChartSeriesType,
  ChartSeries,
  ChartXAnnotation,
  ChartYAnnotation,
  ChartAnnotations,
  ChartXAxisConfig,
  ChartTooltipConfig,
  ChartLegendConfig,
  ChartLegendPosition,
  ChartToolbarConfig,
  ChartImageFormat,
  ChartCsvOptions,
  ChartExposed,
  ChartZoomConfig,
  ChartProps,
  ChartPointClickEvent,
  ChartRangeChangeEvent,
  ChartEmits,
} from './types/chart'
export type {
  HydroPoint,
  HydroForecast,
  HydroVariable,
  HydroThreshold,
  HydroBand,
  HydrographProps,
} from './types/HydrographProps'
