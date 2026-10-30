/**
 * Dominio `charts` (`@vsadtajo/adasa-ui/charts`): gráficas con el mismo API
 * para tres motores (ECharts por defecto, Chart.js y ApexCharts), todos
 * `peerDependencies` opcionales cargadas bajo demanda: instala solo el que uses.
 */

export { default as ASChart } from './components/ASChart.vue'
export { default as ASHydrographChart } from './components/ASHydrographChart.vue'
export { buildHydrograph } from './core/hydrograph'
export { columnGeometry } from './core/resolveSpec'
export { default as ASPrecipitationChart } from './components/ASPrecipitationChart.vue'
export { buildPrecipitation } from './core/precipitationChart'
export {
  aggregateDepth,
  convertPrecipitation,
  cumulativeAt,
  intervalHours,
  sortByTime,
  toCumulative,
  toDepth,
  toIntensity,
  typicalIntervalMinutes,
} from './core/precipitation'
export type {
  CumulativeOptions,
  PrecipitationIntervalOptions,
  PrecipitationUnit,
} from './core/precipitation'

export type {
  ChartLibrary,
  ChartX,
  ChartPoint,
  ChartRangePoint,
  ChartGradient,
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
  ChartToolbarActionEvent,
  ChartToolbarButton,
  ChartToolbarChangeEvent,
  ChartToolbarChip,
  ChartToolbarConfig,
  ChartToolbarInfo,
  ChartToolbarItem,
  ChartToolbarMenu,
  ChartToolbarMenuItem,
  ChartToolbarOption,
  ChartToolbarSelect,
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
  HydroBandStyle,
  HydroLineStyle,
  HydroObserved,
  HydroThreshold,
  HydroThresholdVariable,
  HydroBand,
  HydrographProps,
  HydrographEmits,
} from './types/HydrographProps'
export type {
  PrecipitationCumulative,
  PrecipitationEmits,
  PrecipitationProps,
  PrecipitationSeries,
  PrecipitationThreshold,
  PrecipitationToolbarConfig,
} from './types/PrecipitationProps'
