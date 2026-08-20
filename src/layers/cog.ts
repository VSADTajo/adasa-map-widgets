import type { COGColorScale } from '@/types/layers'

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '')
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ]
}

/**
 * Interpola el valor de un píxel (banda única) sobre una rampa de color
 * lineal de N paradas, devolviendo `[r, g, b, a]`. Compartida entre el
 * `pixelValuesToColorFn` de Leaflet (`georaster-layer-for-leaflet`) y el
 * `setColorFunction` de MapLibre (`@geomatico/maplibre-cog-protocol`), para
 * que ambos motores pinten el mismo GeoTIFF de una banda con los mismos
 * colores en vez de cada uno con su propia lógica.
 */
export function interpolateColorScale(
  value: number,
  scale: COGColorScale,
): [number, number, number, number] {
  const stops = (
    scale.colors && scale.colors.length >= 2 ? scale.colors : ['#000000', '#ffffff']
  ).map(hexToRgb)
  const t = Math.min(1, Math.max(0, (value - scale.min) / (scale.max - scale.min)))
  const segment = t * (stops.length - 1)
  const index = Math.min(stops.length - 2, Math.floor(segment))
  const localT = segment - index
  const [r1, g1, b1] = stops[index]!
  const [r2, g2, b2] = stops[index + 1]!

  return [
    Math.round(r1 + (r2 - r1) * localT),
    Math.round(g1 + (g2 - g1) * localT),
    Math.round(b1 + (b2 - b1) * localT),
    255,
  ]
}
