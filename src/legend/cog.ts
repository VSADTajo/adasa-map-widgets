import type { COGOptions } from '@/types/layers'
import type { LegendAdapter, LegendItem, LegendRamp } from '@/types/legend'
import { interpolateColorScale } from '@/layers'

/** Número de muestras discretas del degradado, para las marcas/etiquetas de la leyenda. */
const RAMP_STEPS = 5

function toHexChannel(channel: number): string {
  return channel.toString(16).padStart(2, '0')
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${toHexChannel(r)}${toHexChannel(g)}${toHexChannel(b)}`
}

/**
 * Solo los COG de una sola banda con `colorScale` tienen una leyenda con
 * sentido: un degradado continuo, no una lista discreta de valores (los COG
 * RGB/escala de grises son imagen pura, como Tiles/WMTS — sin `colorScale`,
 * `canGenerateLegend` es `false`). Reutiliza `interpolateColorScale`, la
 * misma función con la que se pinta la propia capa (`src/layers/cog.ts`),
 * para que la leyenda muestre exactamente los mismos colores que el mapa.
 */
export const cogLegendAdapter: LegendAdapter = {
  name: 'COG',
  supports: 'cog',
  canHandle: (layer) => layer.type === 'cog',
  generateLegend: (layer) => {
    const options = layer.options as COGOptions
    const colorScale = options.colorScale
    if (!colorScale) return Promise.resolve([])

    const { min, max } = colorScale
    const steps: LegendItem[] = Array.from({ length: RAMP_STEPS }, (_, index) => {
      const value = min + ((max - min) * index) / (RAMP_STEPS - 1)
      const [r, g, b] = interpolateColorScale(value, colorScale)
      return {
        id: `step-${index}`,
        label: `${Math.round(value * 100) / 100}`,
        type: 'ramp',
        value,
        color: rgbToHex(r, g, b),
      }
    })

    const ramp: LegendRamp = {
      type: 'ramp',
      min,
      max,
      colormap: Object.fromEntries(steps.map((step) => [String(step.value), step.color!])),
      steps,
    }
    return Promise.resolve(ramp)
  },
  getCapabilities: (layer) => {
    const options = layer.options as COGOptions
    return {
      canGenerateLegend: Boolean(options.colorScale),
      source: 'client',
      // `colorScale` es parte de LayerConfig: quien controla la capa puede cambiarla.
      isEditable: Boolean(options.colorScale),
      supportsGroups: false,
    }
  },
}
