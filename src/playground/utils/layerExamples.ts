import type { GeoJsonFeatureCollection, LayerConfig, LayerType } from '@/types/layers'

/** Etiqueta legible por tipo de capa, para los controles del compositor. */
export const LAYER_TYPE_LABELS: Record<LayerType, string> = {
  geojson: 'GeoJSON',
  wms: 'WMS',
  wfs: 'WFS',
  tiles: 'Teselas',
  geoserver: 'GeoServer',
}

export interface LayerExample {
  config: LayerConfig
  /** Explicación corta de qué demuestra este ejemplo, para mostrar en el panel. */
  description: string
}

/** GeoJSON local (sin red): un punto, una línea y un polígono cerca de Madrid. */
const madridGeoJson: GeoJsonFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Puerta del Sol', kind: 'punto de interés' },
      geometry: { type: 'Point', coordinates: [-3.7038, 40.4168] },
    },
    {
      type: 'Feature',
      properties: { name: 'Gran Vía (tramo)', kind: 'vía' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-3.7038, 40.4168],
          [-3.7058, 40.4204],
          [-3.7085, 40.4231],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Zona de ejemplo', kind: 'área' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-3.71, 40.41],
            [-3.7, 40.41],
            [-3.7, 40.42],
            [-3.71, 40.42],
            [-3.71, 40.41],
          ],
        ],
      },
    },
  ],
}

/**
 * Un ejemplo por cada {@link LayerType}. Los de GeoJSON funcionan sin red;
 * WMS/WFS/GeoServer apuntan a servidores de demostración **públicos** de
 * terceros (los mismos que usan los ejemplos oficiales de Leaflet/OpenLayers),
 * así que pueden fallar si ese servicio está caído — el propio sistema de
 * capas lo refleja como un `layer-error` en vez de romper el playground.
 */
export const layerExamples: LayerExample[] = [
  {
    description: 'Datos locales (sin red): un punto, una línea y un polígono cerca de Madrid.',
    config: {
      id: 'demo-geojson-madrid',
      name: 'GeoJSON: Madrid centro',
      type: 'geojson',
      visible: true,
      options: { data: madridGeoJson },
    },
  },
  {
    description: 'Teselas ráster de un servidor XYZ público distinto del mapa base (OpenTopoMap).',
    config: {
      id: 'demo-tiles-opentopo',
      name: 'Tiles: OpenTopoMap',
      type: 'tiles',
      visible: true,
      opacity: 0.85,
      options: {
        url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
        attribution: '© OpenTopoMap (CC-BY-SA)',
        maxZoom: 17,
      },
    },
  },
  {
    description: 'WMS público de demostración (terrestris.de) sirviendo el propio OpenStreetMap.',
    config: {
      id: 'demo-wms-osm',
      name: 'WMS: OSM (terrestris)',
      type: 'wms',
      visible: true,
      opacity: 0.85,
      options: {
        url: 'https://ows.terrestris.de/osm/service',
        layers: 'OSM-WMS',
        format: 'image/png',
        transparent: true,
        version: '1.3.0',
      },
    },
  },
  {
    description:
      'WFS público de demostración (GeoServer de ahocevar.com): polígonos de estados de EE. UU.',
    config: {
      id: 'demo-wfs-states',
      name: 'WFS: topp:states',
      type: 'wfs',
      visible: true,
      options: {
        url: 'https://ahocevar.com/geoserver/wfs',
        typeName: 'topp:states',
        maxFeatures: 50,
      },
    },
  },
  {
    description:
      'GeoServer (mismo servidor que el ejemplo WFS): demuestra el atajo workspace + layer + mode.',
    config: {
      id: 'demo-geoserver-states',
      name: 'GeoServer: topp:states (wfs)',
      type: 'geoserver',
      visible: true,
      options: {
        url: 'https://ahocevar.com/geoserver',
        workspace: 'topp',
        layer: 'states',
        mode: 'wfs',
      },
    },
  },
]

export function getLayerExample(id: string): LayerExample | undefined {
  return layerExamples.find((example) => example.config.id === id)
}
