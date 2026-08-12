import type { LegendItem, LegendSymbol } from '@/types/legend'

/** Color por defecto de las capas vectoriales de esta librería (mismo que usan `renderGeoJsonFeatureCollection`/`addGeoJsonLayers` cuando no se indica `style`). */
const DEFAULT_VECTOR_COLOR = '#2563eb'

/**
 * Leyenda de un único símbolo genérico, para tipos vectoriales de los que no
 * se puede derivar automáticamente un desglose por categoría (GeoJSON/WFS/MVT
 * sin pedir/inspeccionar sus features): un color de referencia y una etiqueta.
 */
export function buildGenericSymbolLegend(
  label: string,
  symbolType: LegendSymbol['type'] = 'polygon',
): LegendItem[] {
  return [
    {
      id: 'default',
      label,
      type: 'symbol',
      color: DEFAULT_VECTOR_COLOR,
      symbol: { type: symbolType, color: DEFAULT_VECTOR_COLOR, size: 8, opacity: 1 },
    },
  ]
}
