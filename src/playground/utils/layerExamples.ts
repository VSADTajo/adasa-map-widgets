import type { GeoJsonFeatureCollection, LayerConfig, LayerType } from '@/types/layers'
import { geoServerLayer } from '@/layers'

/** Etiqueta legible por tipo de capa, para los controles del compositor. */
export const LAYER_TYPE_LABELS: Record<LayerType, string> = {
  geojson: 'GeoJSON',
  topojson: 'TopoJSON',
  kml: 'KML',
  wms: 'WMS',
  wfs: 'WFS',
  tiles: 'Teselas',
  wmts: 'WMTS',
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

/** KML local (sin red): un punto y un polígono cerca de Madrid, mismo espíritu que `madridGeoJson`. */
const madridKml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Parque del Retiro</name>
      <ExtendedData>
        <Data name="kind"><value>punto de interés</value></Data>
      </ExtendedData>
      <Point>
        <coordinates>-3.6835,40.4153,0</coordinates>
      </Point>
    </Placemark>
    <Placemark>
      <name>Zona de ejemplo (KML)</name>
      <ExtendedData>
        <Data name="kind"><value>área</value></Data>
      </ExtendedData>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>-3.70,40.40 -3.69,40.40 -3.69,40.41 -3.70,40.41 -3.70,40.40</coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  </Document>
</kml>`

/**
 * Un ejemplo por cada {@link LayerType}, más uno extra de GeoServer (que no
 * es un `LayerType` propio: `geoServerLayer()` lo resuelve a `'wfs'`, ver
 * `src/layers/geoserver.ts`). GeoJSON y KML funcionan sin red (datos locales);
 * TopoJSON usa un CDN público estable (jsdelivr); WMS/WFS/GeoServer/WMTS
 * apuntan a servidores de demostración **públicos** de terceros (los mismos
 * que usan los ejemplos oficiales de Leaflet/OpenLayers, más el WMTS del IGN
 * español), así que pueden fallar si ese servicio está caído — el propio
 * sistema de capas lo refleja como un `layer-error` en vez de romper el
 * playground.
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
    description:
      'Topología pública (jsdelivr/world-atlas): las masas de tierra del mundo, convertidas a GeoJSON con `topojson-client` al vuelo.',
    config: {
      id: 'demo-topojson-land',
      name: 'TopoJSON: masas de tierra',
      type: 'topojson',
      visible: true,
      opacity: 0.6,
      options: {
        data: 'https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json',
        object: 'land',
      },
    },
  },
  {
    description:
      'Datos locales (sin red), mismo contenido que el ejemplo GeoJSON pero en formato KML.',
    config: {
      id: 'demo-kml-madrid',
      name: 'KML: Madrid centro',
      type: 'kml',
      visible: true,
      options: { data: madridKml },
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
      'WMTS público (IGN España): Mapa Topográfico Nacional servido como teselas OGC. `url` es solo el endpoint base — `buildWmtsTileUrl` (en `src/layers/wmts.ts`) construye la petición `GetTile` (KVP) con `layer`/`tileMatrixSet`/`format`.',
    config: {
      id: 'demo-wmts-ign-mtn',
      name: 'WMTS: IGN Mapa Topográfico Nacional',
      type: 'wmts',
      visible: true,
      options: {
        url: 'https://www.ign.es/wmts/mapa-raster',
        layer: 'MTN',
        tileMatrixSet: 'GoogleMapsCompatible',
        format: 'image/jpeg',
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
      'Mismo servidor que el ejemplo WFS, pero construido con el helper `geoServerLayer()` (workspace + layer + mode) en vez de la URL/typeName completos.',
    config: geoServerLayer({
      id: 'demo-geoserver-states',
      name: 'GeoServer: topp:states (vía geoServerLayer)',
      visible: true,
      options: {
        url: 'https://ahocevar.com/geoserver',
        workspace: 'topp',
        layer: 'states',
        mode: 'wfs',
      },
    }),
  },
]

export function getLayerExample(id: string): LayerExample | undefined {
  return layerExamples.find((example) => example.config.id === id)
}
