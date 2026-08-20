import type { GeoJsonFeatureCollection, WFSOptions } from '@/types/layers'

/** Construye la URL GetFeature de un servidor WFS a partir de sus opciones. */
export function buildWfsGetFeatureUrl(options: WFSOptions): string {
  const url = new URL(options.url)
  url.searchParams.set('service', 'WFS')
  url.searchParams.set('version', '2.0.0')
  url.searchParams.set('request', 'GetFeature')
  url.searchParams.set('typeName', options.typeName)
  url.searchParams.set('outputFormat', options.outputFormat ?? 'application/json')
  url.searchParams.set('srsName', 'EPSG:4326')

  if (options.maxFeatures !== undefined) {
    url.searchParams.set('count', String(options.maxFeatures))
  }
  if (options.cql_filter) {
    url.searchParams.set('cql_filter', options.cql_filter)
  }

  return url.toString()
}

/** Pide los features de un servidor WFS y los devuelve como una colección GeoJSON. */
export async function fetchWfsFeatures(options: WFSOptions): Promise<GeoJsonFeatureCollection> {
  const response = await fetch(buildWfsGetFeatureUrl(options))
  if (!response.ok) {
    throw new Error(
      `WFS GetFeature falló (${response.status} ${response.statusText}): ${options.url}`,
    )
  }
  return (await response.json()) as GeoJsonFeatureCollection
}
