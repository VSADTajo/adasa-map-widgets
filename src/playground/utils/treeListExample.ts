import type { TreeNode } from '@/forms/types/TreeListProps'
import type { GeoJsonFeatureCollection, LayerConfig } from '@/map/types/layers'
import type { CodeExample } from '../registry'

/*
 * Datos de ejemplo de `ASTreeList` (los grupos de capas de un visor SAIH,
 * como el ItemsLayersGroup de TAJO) y las capas sintéticas del ejemplo
 * "Panel de capas", que se encienden y apagan desde el árbol. Todo local:
 * sin servicios externos.
 */

/** Colores de la paleta categórica (claro): las capas del mapa no leen variables CSS. */
const CAT = ['#2a78d6', '#eb6834', '#05a873', '#c68609', '#dc709a', '#008300', '#6250d6', '#e34948']

/** Árbol de la entrada de `ASTreeList`: JSON puro para editarlo en el playground. */
export const DEMO_TREE: TreeNode[] = [
  {
    id: 'saih',
    label: 'Estaciones SAIH',
    defaultExpanded: true,
    children: [
      { id: 'AR', label: 'Aforo en río', swatch: CAT[0], badge: 42 },
      { id: 'AC', label: 'Aforo en canal', swatch: CAT[1], badge: 18 },
      { id: 'E', label: 'Embalses', swatch: CAT[2], opacity: true, badge: 27 },
      {
        id: 'pluvio',
        label: 'Pluviómetros',
        children: [
          { id: 'P-saih', label: 'SAIH', swatch: CAT[3] },
          {
            id: 'P-aemet',
            label: 'AEMET',
            swatch: CAT[4],
            description: 'Datos con 1 h de retraso',
          },
        ],
      },
      {
        id: 'piezo',
        label: 'Piezómetros',
        icon: 'mdi:water-well',
        disabled: true,
        disabledReason: 'Sin datos desde el 12/03',
      },
    ],
  },
  {
    id: 'meteo',
    label: 'Mapas meteorológicos',
    children: [
      { id: 'radar', label: 'Radar AEMET', icon: 'mdi:radar', opacity: true },
      {
        id: 'harmonie',
        label: 'Precipitación Harmonie',
        icon: 'mdi:weather-pouring',
        opacity: true,
      },
    ],
  },
  { id: 'eventos', label: 'Eventos pasados', children: [], emptyText: 'No hay eventos guardados' },
]

/** Zona rectangular [oeste, sur, este, norte] como polígono. */
function box(west: number, south: number, east: number, north: number) {
  return {
    type: 'Polygon',
    coordinates: [
      [
        [west, south],
        [east, south],
        [east, north],
        [west, north],
        [west, south],
      ],
    ],
  }
}

/** Marca de estación: un polígono pequeño (rombo, cuadrado...) alrededor del punto. */
function mark([lon, lat]: [number, number], sides: number, radius = 0.07) {
  const ring = Array.from({ length: sides + 1 }, (_, i) => {
    const angle = (i / sides) * 2 * Math.PI + Math.PI / 4
    return [lon + radius * Math.cos(angle), lat + radius * 0.78 * Math.sin(angle)]
  })
  return { type: 'Polygon', coordinates: [ring] }
}

function collection(geometries: object[], name: string): GeoJsonFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: geometries.map((geometry, index) => ({
      type: 'Feature',
      properties: { name: `${name} ${index + 1}` },
      geometry: geometry as GeoJsonFeatureCollection['features'][number]['geometry'],
    })),
  }
}

/** Puntos pseudoaleatorios (siempre los mismos) dentro de la cuenca del Tajo. */
function points(count: number, seed: number): [number, number][] {
  let state = seed
  const next = () => (state = (state * 9301 + 49297) % 233280) / 233280
  return Array.from({ length: count }, () => [-6.6 + next() * 5, 39.2 + next() * 1.8])
}

/** Una hoja del panel de capas con su capa del mapa. */
interface PanelLayer {
  node: TreeNode
  data: GeoJsonFeatureCollection
  color: string
  fill: number
}

const zone = (id: string, label: string, color: string, boxes: number[][]): PanelLayer => ({
  node: { id, label, swatch: color },
  data: collection(
    boxes.map((b) => box(b[0]!, b[1]!, b[2]!, b[3]!)),
    label,
  ),
  color,
  fill: 0.25,
})

const stations = (
  id: string,
  label: string,
  color: string,
  sides: number,
  count: number,
  seed: number,
): PanelLayer => ({
  node: { id, label, swatch: color, badge: count, opacity: true },
  data: collection(
    points(count, seed).map((point) => mark(point, sides)),
    label,
  ),
  color,
  fill: 0.85,
})

/** Zonas: excluyentes entre sí (selección única), como en TAJO. */
export const PANEL_ZONES: PanelLayer[] = [
  zone('subcuencas', 'Subcuencas', CAT[6]!, [
    [-6.6, 39.2, -5.2, 40.1],
    [-5.2, 39.2, -3.8, 40.1],
    [-3.8, 39.2, -1.6, 40.1],
    [-6.6, 40.1, -4.4, 41],
    [-4.4, 40.1, -1.6, 41],
  ]),
  zone('sistemas', 'Sistemas SAIH', CAT[4]!, [
    [-6.6, 39.2, -4.2, 41],
    [-4.2, 39.2, -1.6, 41],
  ]),
  zone('explotacion', 'Zonas de explotación', CAT[3]!, [
    [-6.6, 39.2, -5, 41],
    [-5, 39.2, -3.4, 41],
    [-3.4, 39.2, -1.6, 41],
  ]),
]

/** Estaciones: varias a la vez (selección múltiple), con opacidad. */
export const PANEL_STATIONS: PanelLayer[] = [
  stations('AR', 'Aforo en río', CAT[0]!, 4, 14, 3),
  stations('E', 'Embalses', CAT[2]!, 6, 9, 11),
  stations('P', 'Pluviómetros', CAT[1]!, 3, 18, 23),
]

export const PANEL_ZONE_TREE: TreeNode[] = PANEL_ZONES.map((layer) => layer.node)
export const PANEL_STATION_TREE: TreeNode[] = [
  {
    id: 'saih',
    label: 'Estaciones SAIH',
    defaultExpanded: true,
    children: PANEL_STATIONS.map((layer) => layer.node),
  },
]

/** Capas de `ASMap` según lo elegido en los árboles: visibles y con su opacidad. */
export function panelLayers(
  visible: readonly string[],
  opacities: Record<string, number>,
): LayerConfig[] {
  return [...PANEL_ZONES, ...PANEL_STATIONS].map(({ node, data, color, fill }) => ({
    id: node.id,
    name: node.label,
    type: 'geojson',
    visible: visible.includes(node.id),
    opacity: opacities[node.id] ?? 1,
    options: {
      data,
      style: () => ({ color, weight: 1.5, fillColor: color, fillOpacity: fill }),
    },
  }))
}

/** Cómo se conecta el árbol con `ASMap` (y con un store) en un proyecto. */
export const layersPanelExample: CodeExample = {
  title: 'Panel de capas con ASMap',
  description:
    'El árbol no sabe nada del mapa: v-model son los ids de las capas visibles y v-model:opacities sus opacidades. Las LayerConfig se derivan de ahí. Con un store (Pinia), el v-model va en el get/set de un computed, y ahí va también la lógica propia (p. ej. que zonas y avisos se excluyan entre sí).',
  code: `<script setup lang="ts">
import { computed, ref } from 'vue'
import { ASCollapsible, ASTreeList, leafIds, type TreeNode } from '@vsadtajo/adasa-ui/forms'
import { ASMap, type LayerConfig } from '@vsadtajo/adasa-ui/map'

const estaciones: TreeNode[] = [
  {
    id: 'saih',
    label: 'Estaciones SAIH',
    children: [
      { id: 'AR', label: 'Aforo en río', swatch: '#2a78d6', opacity: true },
      { id: 'E', label: 'Embalses', swatch: '#05a873', opacity: true },
    ],
  },
]

const visibles = ref<string[]>(['AR'])
const opacidades = ref<Record<string, number>>({})

// Con un store: el árbol escribe y lee del store, sin conocerlo.
const store = useLayersStore()
const visiblesStore = computed({
  get: () => leafIds(estaciones).filter((id) => store.layers[id]?.visible),
  set: (ids: string[]) => store.setVisibleLayers(ids),
})

const capas = computed<LayerConfig[]>(() =>
  CAPAS.map((capa) => ({
    ...capa,
    visible: visibles.value.includes(capa.id),
    opacity: opacidades.value[capa.id] ?? 1,
  })),
)
</script>

<template>
  <ASCollapsible title="Estaciones" :badge="visibles.length">
    <ASTreeList
      v-model="visibles"
      v-model:opacities="opacidades"
      :items="estaciones"
      label="Capas de estaciones"
    />
  </ASCollapsible>
  <ASMap :layers="capas" />
</template>`,
}
