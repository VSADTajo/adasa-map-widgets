import type { LayerConfig, LayerType } from './layers'

/** Forma de una entrada de leyenda: un símbolo puntual/lineal/de área, un degradado, una imagen ya renderizada por el servidor, o texto libre. */
export type LegendType = 'symbol' | 'ramp' | 'image' | 'text'

/** De dónde viene la leyenda de una capa: pedida al servidor, calculada en el cliente a partir de sus datos/estilo, fijada a mano en `LayerConfig`, o detectada automáticamente (lo que decida el adapter). */
export type LegendSource = 'server' | 'client' | 'config' | 'auto'

/** Símbolo visual de un {@link LegendItem} de tipo `'symbol'`. */
export interface LegendSymbol {
  type: 'circle' | 'square' | 'line' | 'polygon'
  color: string
  size: number
  opacity: number
  strokeColor?: string
  strokeWidth?: number
}

/** Una entrada de leyenda (una fila): un valor/categoría y cómo se representa. */
export interface LegendItem {
  id: string
  label: string
  type: LegendType
  value?: string | number
  color?: string
  opacity?: number
  /** Tamaño fijo, o `[min, max]` si varía según el valor (p. ej. círculos proporcionales). */
  size?: number | [number, number]
  symbol?: LegendSymbol
  /** URL a una imagen ya renderizada (p. ej. un icono de WMS `GetLegendGraphic`). Solo con `type: 'image'`. */
  image?: string
}

/** Leyenda de degradado continuo (p. ej. una capa COG de una sola banda con `colorScale`), en vez de una lista de {@link LegendItem} discretos. */
export interface LegendRamp {
  type: 'ramp'
  min: number
  max: number
  /** Nombre de una rampa conocida, o un mapa `valor → color` ya resuelto. */
  colormap: string | Record<string, string>
  /** Muestras discretas del degradado, para pintar las marcas/etiquetas de la leyenda. */
  steps: LegendItem[]
}

/** Qué puede ofrecer la leyenda de una capa concreta, análogo a `LayerCapabilities` (`src/types/layers.ts`) pero para `ASMapLegend`. */
export interface LegendCapabilities {
  canGenerateLegend: boolean
  source: LegendSource
  /** La capa admite editar sus propios símbolos/rampa desde la leyenda (p. ej. un estilo definido en `LayerConfig`, no impuesto por un servidor). */
  isEditable: boolean
  /** La leyenda puede agrupar sus entradas (p. ej. por sub-capa de un MVT). */
  supportsGroups: boolean
}

/**
 * Adapter de leyenda: sabe cómo generar la leyenda de un {@link LayerType}
 * concreto (`supports`). `ASMapLegend` no conoce los detalles de cada
 * protocolo/formato de capa — delega en el adapter correspondiente, igual
 * que `src/layers/` delega el renderizado de cada tipo en su propio
 * `render*` por motor.
 */
export interface LegendAdapter {
  name: string
  /** El `LayerType` que sabe manejar este adapter, p. ej. `'wms'`. */
  supports: LayerType
  canHandle(layer: LayerConfig): boolean
  generateLegend(layer: LayerConfig): Promise<LegendItem[] | LegendRamp>
  getCapabilities(layer: LayerConfig): LegendCapabilities
}
