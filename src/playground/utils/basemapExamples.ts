import type { BasemapOption } from '@/components/mapping/ASMap.vue'

/**
 * Basemaps de ejemplo reales (proveedores públicos, sin API key) para
 * demostrar `ASMap`/`ASMapBasemapsSelector` en el playground. La miniatura
 * de cada uno es una tesela real del propio proveedor (mismo zoom/posición
 * en todos, centrada en Europa occidental) para que sea representativa de
 * verdad, no un color de relleno.
 */
export const basemapExamples: BasemapOption[] = [
  {
    id: 'osm',
    name: 'OpenStreetMap',
    tileLayer: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    thumbnail: 'https://tile.openstreetmap.org/5/15/12.png',
  },
  {
    id: 'topo',
    name: 'OpenTopoMap',
    tileLayer: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap (CC-BY-SA)',
    thumbnail: 'https://tile.opentopomap.org/5/15/12.png',
  },
  {
    id: 'positron',
    name: 'CARTO Positron',
    tileLayer: 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; OpenStreetMap contributors',
    thumbnail: 'https://basemaps.cartocdn.com/light_all/5/15/12.png',
  },
  {
    id: 'dark-matter',
    name: 'CARTO Dark Matter',
    tileLayer: 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; OpenStreetMap contributors',
    thumbnail: 'https://basemaps.cartocdn.com/dark_all/5/15/12.png',
  },
  {
    id: 'satellite',
    name: 'Esri World Imagery',
    // El servicio de Esri usa el orden z/y/x en la ruta (al revés que el resto).
    tileLayer:
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    thumbnail:
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/12/15',
  },
]
