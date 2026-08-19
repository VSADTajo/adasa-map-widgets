import type { GeoJsonFeatureCollection, KMLOptions } from '@/types/layers'
import { resolveNamespace } from '@/utils/resolveNamespace'

/** `@tmcw/togeojson` es una dependencia opcional: solo se carga si de verdad se usa una capa `'kml'`. */
interface TogeojsonNamespace {
  kml: (doc: Document) => GeoJsonFeatureCollection
}

/** `fflate` es otra dependencia opcional, solo necesaria para `.kmz` (un `.kml` comprimido en zip). */
interface FflateNamespace {
  unzipSync: (data: Uint8Array) => Record<string, Uint8Array>
}

function isRawKml(data: string): boolean {
  return data.trimStart().startsWith('<')
}

/** Descarga y descomprime un `.kmz`, devolviendo el texto del primer `.kml` que contenga. */
async function fetchKmzText(url: string): Promise<string> {
  const buffer = await (await fetch(url)).arrayBuffer()
  const fflate = resolveNamespace<FflateNamespace>(await import('fflate'))
  const files = fflate.unzipSync(new Uint8Array(buffer))
  const kmlEntryName = Object.keys(files).find((name) => name.toLowerCase().endsWith('.kml'))
  if (!kmlEntryName) throw new Error('El .kmz no contiene ningún fichero .kml.')
  return new TextDecoder('utf-8').decode(files[kmlEntryName]!)
}

async function resolveKmlText(data: string): Promise<string> {
  if (isRawKml(data)) return data
  if (data.toLowerCase().endsWith('.kmz')) return fetchKmzText(data)
  return await (await fetch(data)).text()
}

/** Resuelve una capa KML/KMZ (`data`: URL o contenido KML/XML ya cargado) a una `FeatureCollection` GeoJSON. */
export async function resolveKmlData(options: KMLOptions): Promise<GeoJsonFeatureCollection> {
  const text = await resolveKmlText(options.data)
  const xml = new DOMParser().parseFromString(text, 'text/xml')
  const togeojson = resolveNamespace<TogeojsonNamespace>(await import('@tmcw/togeojson'))
  return togeojson.kml(xml)
}
