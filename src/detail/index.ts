/**
 * Dominio `detail` (`@vsadtajo/adasa-ui/detail`): piezas para la ficha de
 * una entidad (estación, embalse...) y tarjetas hidrológicas que reciben los
 * datos ya preparados. Puede importar de `core`, `forms` y `charts` (ver
 * docs/adr/0000-estructura-paquete.md).
 */

export { default as ASDetailHeader } from './components/ASDetailHeader.vue'
export { default as ASCard } from './components/ASCard.vue'
export { default as ASStatusBadge } from './components/ASStatusBadge.vue'
export { default as ASAlertStatus } from './components/ASAlertStatus.vue'
export { default as ASObservedSummary } from './components/ASObservedSummary.vue'
export { default as ASThresholdSummary } from './components/ASThresholdSummary.vue'
export { default as ASValueMatrix } from './components/ASValueMatrix.vue'
export { default as ASThresholdLegend } from './components/ASThresholdLegend.vue'

export {
  aggregateByInterval,
  alertLevelOf,
  exceedanceSegments,
  intervalStart,
  summarizeSeries,
  worstLevel,
} from './utils/hydro'

export type {
  AggregateKind,
  AlertThresholds,
  ExceedanceSegment,
  ExceededLevel,
  IntervalAggregate,
  MeasureSeries,
  SeriesSummary,
  TimePoint,
} from './types/hydro'
export type { CardProps } from './types/CardProps'
export type { StatusBadgeProps } from './types/StatusBadgeProps'
export type { DetailHeaderEmits, DetailHeaderProps, DetailTag } from './types/DetailHeaderProps'
export type {
  AlertStatusProps,
  ObservedSummaryEmits,
  ObservedSummaryProps,
  ThresholdLegendEmits,
  ThresholdLegendProps,
  ThresholdSummaryProps,
  ValueMatrixEmits,
  ValueMatrixProps,
} from './types/HydroCardsProps'
