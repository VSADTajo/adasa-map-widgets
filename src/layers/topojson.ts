import type {
  GeoJsonFeature,
  GeoJsonFeatureCollection,
  TopoJSONOptions,
  TopoJSONTopology,
} from '@/types/layers'
import { resolveNamespace } from '@/utils/resolveNamespace'

/**
 * `topojson-client` es una dependencia opcional (igual que Leaflet/MapLibre):
 * solo se carga si de verdad se usa una capa `'topojson'`.
 */
interface TopojsonClientNamespace {
  feature: (topology: TopoJSONTopology, object: string) => GeoJsonFeature | GeoJsonFeatureCollection
}

async function loadTopojsonClient(): Promise<TopojsonClientNamespace> {
  const mod = await import('topojson-client')
  return resolveNamespace<TopojsonClientNamespace>(mod)
}

/** Convierte uno o varios `objects` de una topología ya resuelta en una única `FeatureCollection`. */
function objectsToFeatureCollection(
  topojsonClient: TopojsonClientNamespace,
  topology: TopoJSONTopology,
  objectNames: string[],
): GeoJsonFeatureCollection {
  const features: GeoJsonFeature[] = []
  for (const name of objectNames) {
    const result = topojsonClient.feature(topology, name)
    if (result.type === 'FeatureCollection') {
      features.push(...result.features)
    } else {
      features.push(result)
    }
  }
  return { type: 'FeatureCollection', features }
}

/** Resuelve una capa TopoJSON (`data`: topología ya resuelta o una URL) a una `FeatureCollection` GeoJSON. */
export async function resolveTopoJsonData(
  options: TopoJSONOptions,
): Promise<GeoJsonFeatureCollection> {
  const topology: TopoJSONTopology =
    typeof options.data === 'string' ? await (await fetch(options.data)).json() : options.data
  const objectNames = options.object
    ? Array.isArray(options.object)
      ? options.object
      : [options.object]
    : Object.keys(topology.objects)

  const topojsonClient = await loadTopojsonClient()
  return objectsToFeatureCollection(topojsonClient, topology, objectNames)
}
