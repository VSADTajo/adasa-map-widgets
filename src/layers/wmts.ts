import type { WMTSOptions } from '@/types/layers'

/**
 * Construye la URL de teselas WMTS (con `{z}`/`{x}`/`{y}`) que espera una
 * fuente ráster de teselas, sea el servicio RESTful o KVP (ver
 * {@link WMTSOptions}). Compartida entre `leaflet.ts` y `maplibre.ts`: ninguno
 * de los dos motores tiene soporte nativo de WMTS, así que ambos acaban
 * tratando el resultado como una capa de teselas XYZ corriente.
 */
export function buildWmtsTileUrl(options: WMTSOptions): string {
  if (/\{z\}|\{TileMatrix\}/i.test(options.url)) {
    return options.url
      .replace(/\{TileMatrix\}/gi, '{z}')
      .replace(/\{TileRow\}/gi, '{y}')
      .replace(/\{TileCol\}/gi, '{x}')
  }

  const params = new URLSearchParams({
    service: 'WMTS',
    request: 'GetTile',
    version: options.version ?? '1.0.0',
    layer: options.layer ?? '',
    style: options.style ?? 'default',
    tilematrixset: options.tileMatrixSet ?? 'EPSG:3857',
    format: options.format ?? 'image/png',
  })

  return `${options.url}?${params.toString()}&tilematrix={z}&tilerow={y}&tilecol={x}`
}
