/**
 * Circunferencia de la Tierra en el ecuador, en metros, dividida entre el
 * tamaño de tesela estándar (256px). Leaflet y MapLibre usan ambos la misma
 * proyección esférica Web Mercator (EPSG:3857) con teselas de 256px, así que
 * esta fórmula (y el resto de este módulo) es agnóstica del motor de mapas.
 */
const EQUATOR_METERS_PER_PIXEL_AT_ZOOM_0 = 156543.03392804097

/** Metros por píxel de pantalla a una latitud y zoom dados (Web Mercator, teselas de 256px). */
export function metersPerPixel(latitude: number, zoom: number): number {
  return (EQUATOR_METERS_PER_PIXEL_AT_ZOOM_0 * Math.cos((latitude * Math.PI) / 180)) / 2 ** zoom
}

/** Redondea `value` hacia abajo al "número bonito" (1/2/3/5 × una potencia de 10) más cercano, para las divisiones de una escala gráfica. */
function roundScaleNumber(value: number): number {
  const pow10 = 10 ** Math.floor(Math.log10(value))
  const fraction = value / pow10
  const niceFraction = fraction >= 5 ? 5 : fraction >= 3 ? 3 : fraction >= 2 ? 2 : 1
  return niceFraction * pow10
}

/**
 * Ancho, distancia total y unidad de una escala gráfica, p. ej.
 * `{ widthPx: 84, distance: 500, unit: 'm' }`. Se expone `distance`/`unit`
 * por separado (en vez de una etiqueta ya formateada) para poder etiquetar
 * también las marcas intermedias de una regla graduada (a `distance * i/n`
 * de cada una), no solo el extremo final.
 */
export interface ScaleBar {
  widthPx: number
  distance: number
  unit: string
}

/** Escala gráfica en metros/kilómetros, con un ancho que no supera `widthPx`. */
export function computeMetricScaleBar(metersPerPx: number, widthPx: number): ScaleBar {
  const maxMeters = metersPerPx * widthPx
  if (maxMeters >= 1000) {
    const niceKm = roundScaleNumber(maxMeters / 1000)
    return { widthPx: (niceKm * 1000) / metersPerPx, distance: niceKm, unit: 'km' }
  }
  const niceMeters = roundScaleNumber(maxMeters)
  return { widthPx: niceMeters / metersPerPx, distance: niceMeters, unit: 'm' }
}

const FEET_PER_METER = 3.28084
const FEET_PER_MILE = 5280

/** Como {@link computeMetricScaleBar}, pero en pies/millas. */
export function computeImperialScaleBar(metersPerPx: number, widthPx: number): ScaleBar {
  const feetPerPx = metersPerPx * FEET_PER_METER
  const maxFeet = feetPerPx * widthPx
  if (maxFeet >= FEET_PER_MILE) {
    const niceMiles = roundScaleNumber(maxFeet / FEET_PER_MILE)
    return { widthPx: (niceMiles * FEET_PER_MILE) / feetPerPx, distance: niceMiles, unit: 'mi' }
  }
  const niceFeet = roundScaleNumber(maxFeet)
  return { widthPx: niceFeet / feetPerPx, distance: niceFeet, unit: 'ft' }
}

/** 1 pulgada = 0.0254m, asumiendo pantallas a 96dpi (la misma aproximación estándar que usan OpenLayers/ArcGIS para una escala numérica web). */
const METERS_PER_SCREEN_PIXEL_AT_96DPI = 0.0254 / 96

/** Denominador `N` de una escala numérica `1:N`. */
export function computeScaleRatio(metersPerPx: number): number {
  return Math.round(metersPerPx / METERS_PER_SCREEN_PIXEL_AT_96DPI)
}
