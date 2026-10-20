import type { CodeExample } from '../registry'

/**
 * Ejemplos de uso completos de `ASMap` para la galería: el snippet generado
 * a partir de las props no enseña cómo pasar capas ni cómo colocar widgets.
 */
export const mapCodeExamples: CodeExample[] = [
  {
    title: 'ASMap con capas',
    description:
      'Las capas van en la prop `layers`: un array de `LayerConfig` ({ id, name, type, visible, options }). Las de GeoJSON, WFS y MVT son vectoriales (sus features emiten feature-selected); WMS, teselas, WMTS y COG son imágenes. Para GeoServer, `geoServerLayer()` arma la URL y el nombre de la capa. El detalle de cada tipo está en la categoría "Capas".',
    code: `<script setup lang="ts">
import { ref } from 'vue'
import {
  ASMap,
  geoServerLayer,
  type FeatureSelectedEvent,
  type LayerConfig,
} from '@vsadtajo/adasa-ui/map'
import '@vsadtajo/adasa-ui/style.css'

const center = ref<[number, number]>([40.4168, -3.7038])
const zoom = ref(7)

const layers = ref<LayerConfig[]>([
  // GeoJSON: los datos en línea o la URL de un .geojson.
  {
    id: 'estaciones',
    name: 'Estaciones SAIH',
    type: 'geojson',
    visible: true,
    options: { data: '/datos/estaciones.geojson' },
  },
  // WMS de cualquier servidor OGC (aquí, la ortofoto del IGN).
  {
    id: 'ortofoto',
    name: 'Ortofoto PNOA',
    type: 'wms',
    visible: true,
    opacity: 0.7,
    zIndex: 1,
    options: {
      url: 'https://www.ign.es/wms-inspire/pnoa-ma',
      layers: 'OI.OrthoimageCoverage',
      transparent: true,
    },
  },
  // GeoServer: el helper arma la URL de /wms (o /wfs) y "workspace:capa".
  geoServerLayer({
    id: 'cuencas',
    name: 'Cuencas',
    visible: true,
    zIndex: 2,
    options: {
      url: 'https://mi-servidor/geoserver',
      workspace: 'saih',
      layer: 'cuencas',
      mode: 'wms',
    },
  }),
])

function onFeatureSelected(event: FeatureSelectedEvent) {
  console.log(event.layerId, event.properties)
}

// Mostrar u ocultar una capa: se cambia su \`visible\` (el array es reactivo).
function toggle(id: string) {
  const layer = layers.value.find((l) => l.id === id)
  if (layer) layer.visible = !layer.visible
}
</script>

<template>
  <button type="button" @click="toggle('ortofoto')">Mostrar u ocultar la ortofoto</button>
  <!-- ASMap ocupa el alto de su contenedor: dale uno. -->
  <ASMap
    v-model:center="center"
    v-model:zoom="zoom"
    :layers="layers"
    style="height: 500px"
    @feature-selected="onFeatureSelected"
  />
</template>`,
  },
  {
    title: 'ASMap con widgets',
    description:
      'Los widgets ASMap* van en el slot por defecto de ASMap y se colocan sobre él con `position` (y `offset`). Son controlados: cada uno recibe su estado por props y lo devuelve con v-model, así que se enlazan entre sí a través del componente padre (p. ej. la escala usa el mismo center/zoom que el mapa).',
    code: `<script setup lang="ts">
import { ref } from 'vue'
import {
  ASMap,
  ASMapBasemapsSelector,
  ASMapLegend,
  ASMapScale,
  ASMapTimeControls,
  type BasemapOption,
  type LayerConfig,
} from '@vsadtajo/adasa-ui/map'
import '@vsadtajo/adasa-ui/style.css'

const center = ref<[number, number]>([40.4168, -3.7038])
const zoom = ref(6)

const basemaps: BasemapOption[] = [
  {
    id: 'osm',
    name: 'OpenStreetMap',
    tileLayer: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
  {
    id: 'positron',
    name: 'CARTO Positron',
    tileLayer: 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
  },
]
const basemap = ref('osm')

const layers = ref<LayerConfig[]>([
  {
    id: 'precipitacion',
    name: 'Precipitación prevista',
    type: 'wms',
    visible: true,
    options: { url: 'https://mi-servidor/wms', layers: 'precipitacion', transparent: true },
  },
])

// Pasos horarios de las próximas 24 h.
const timeline = Array.from({ length: 24 }, (_, h) => new Date(Date.now() + h * 3_600_000))
const timeIndex = ref(0)
const playing = ref(false)
</script>

<template>
  <ASMap
    v-model:center="center"
    v-model:zoom="zoom"
    v-model:basemap="basemap"
    :basemaps="basemaps"
    :layers="layers"
    style="height: 500px"
  >
    <ASMapBasemapsSelector v-model:basemap="basemap" :basemaps="basemaps" position="top-right" />
    <ASMapLegend :layers="layers" position="bottom-right" />
    <ASMapScale :center="center" :zoom="zoom" position="bottom-left" />
    <ASMapTimeControls
      v-model:current-time-index="timeIndex"
      v-model:is-playing="playing"
      :timeline="timeline"
      position="top"
    />
  </ASMap>
</template>`,
  },
]
