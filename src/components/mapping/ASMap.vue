<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import type * as L from 'leaflet'
import type { MapLibreMap, MapOptions as MapLibreMapOptions } from 'maplibre-gl'
import { resolveNamespace } from '@/utils/resolveNamespace'

/**
 * Contenedor de mapa agnóstico de la librería de mapas subyacente.
 *
 * Instancia Leaflet o MapLibre GL JS según `mapLibrary`, cargados de forma
 * perezosa vía `import()` dinámico — así ninguno de los dos es una
 * dependencia obligatoria del paquete (son `peerDependencies` opcionales):
 * solo se resuelven en tiempo de ejecución si el proyecto consumidor los
 * tiene instalados y usa `ASMap`. Por defecto muestra un mapa base de
 * OpenStreetMap (teselas ráster) para cualquiera de los dos motores.
 *
 * El resto de widgets de la librería nunca dependen de este componente ni
 * importan Leaflet/MapLibre directamente: se comunican con el mapa a través
 * de un `MapAdapter` (ver `src/types/map.ts`).
 *
 * El slot por defecto se renderiza en una capa superpuesta al mapa (mismo
 * tamaño, posicionada en absoluto), pensada para alojar los widgets de esta
 * librería posicionados sobre el mapa.
 *
 * @example
 * ```vue
 * <ASMap ref="mapRef" map-library="leaflet" :center="[40.4168, -3.7038]" :zoom="6">
 *   <ASMapTimeControls :timeline="timeline" v-model:current-time-index="index" v-model:is-playing="playing" />
 * </ASMap>
 * ```
 */
export interface ASMapProps {
  /** Motor de mapas a instanciar. @default 'leaflet' */
  mapLibrary?: 'leaflet' | 'maplibre'
  /** Centro del mapa, en `[lat, lng]`. */
  center: [number, number]
  /** Nivel de zoom. */
  zoom: number
  /**
   * Estilo de MapLibre GL JS (URL a un `style.json` o el objeto de estilo).
   * Ignorado con `mapLibrary="leaflet"`.
   * @default Estilo mínimo con teselas ráster de OpenStreetMap (usa `tileLayer`).
   */
  style?: string | Record<string, unknown>
  /**
   * URL de teselas (plantilla `{z}/{x}/{y}`), usada como capa base en Leaflet
   * y como fuente ráster del estilo por defecto en MapLibre.
   * @default 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
   */
  tileLayer?: string
}

/** Atribución obligatoria de OpenStreetMap. */
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

/** Construye un estilo mínimo de MapLibre que pinta teselas ráster (p. ej. de OpenStreetMap). */
function buildRasterStyle(tileUrl: string): Record<string, unknown> {
  return {
    version: 8,
    sources: {
      'raster-tiles': {
        type: 'raster',
        tiles: [tileUrl],
        tileSize: 256,
        attribution: OSM_ATTRIBUTION,
      },
    },
    layers: [{ id: 'raster-tiles', type: 'raster', source: 'raster-tiles' }],
  }
}

const props = withDefaults(defineProps<ASMapProps>(), {
  mapLibrary: 'leaflet',
  style: undefined,
  tileLayer: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
})

const containerEl = ref<HTMLDivElement | null>(null)
const mapInstance = shallowRef<L.Map | MapLibreMap | null>(null)
/** Mensaje de error legible cuando la librería de mapas elegida no está instalada. */
const loadError = ref<string | null>(null)

async function createLeafletMap(el: HTMLDivElement): Promise<L.Map> {
  const [leafletModule] = await Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')])
  const Leaflet = resolveNamespace<typeof L>(leafletModule)
  const map = Leaflet.map(el, { center: props.center, zoom: props.zoom })
  Leaflet.tileLayer(props.tileLayer, { attribution: OSM_ATTRIBUTION, maxZoom: 19 }).addTo(map)
  return map
}

async function createMaplibreMap(el: HTMLDivElement): Promise<MapLibreMap> {
  const [maplibreModule] = await Promise.all([
    import('maplibre-gl'),
    import('maplibre-gl/dist/maplibre-gl.css'),
  ])
  const maplibregl = resolveNamespace<{ Map: new (options: MapLibreMapOptions) => MapLibreMap }>(
    maplibreModule,
  )
  return new maplibregl.Map({
    container: el,
    center: [props.center[1], props.center[0]], // maplibre usa [lng, lat]
    zoom: props.zoom,
    style: props.style ?? buildRasterStyle(props.tileLayer),
  } as MapLibreMapOptions)
}

function destroyMap(): void {
  mapInstance.value?.remove()
  mapInstance.value = null
}

async function createMap(): Promise<void> {
  destroyMap()
  loadError.value = null
  const el = containerEl.value
  if (!el) return

  try {
    mapInstance.value =
      props.mapLibrary === 'leaflet' ? await createLeafletMap(el) : await createMaplibreMap(el)
  } catch (error) {
    loadError.value =
      props.mapLibrary === 'leaflet'
        ? 'No se pudo cargar Leaflet. Instala la dependencia opcional: npm i leaflet'
        : 'No se pudo cargar MapLibre GL JS. Instala la dependencia opcional: npm i maplibre-gl'
    console.error('[ASMap]', error)
  }
}

onMounted(createMap)
onBeforeUnmount(destroyMap)

watch(() => props.mapLibrary, createMap)

/**
 * Devuelve la instancia real del mapa (`L.Map` o `maplibregl.Map`), o `null`
 * si aún no se inicializó (o si la librería correspondiente no está instalada).
 * Para reaccionar cuando el mapa pasa a estar disponible (p. ej. desde
 * `useLayerManager`), usa el propio `mapInstanceRef` expuesto en vez de
 * sondear este método.
 */
function getMapInstance(): L.Map | MapLibreMap | null {
  return mapInstance.value
}

defineExpose({ getMapInstance, mapInstanceRef: mapInstance })
</script>

<template>
  <div class="as-map-container">
    <div ref="containerEl" class="as-map-container__surface" />
    <div v-if="loadError" class="as-map-container__error">{{ loadError }}</div>
    <div class="as-map-container__overlay">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.as-map-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--amw-color-surface-muted, #f1f5f9);
}

.as-map-container__surface {
  position: absolute;
  inset: 0;
  /*
   * Leaflet asigna z-index explícitos a sus panes internos (teselas,
   * marcadores, popups, controles nativos: 200-800). Sin un z-index propio
   * aquí, este contenedor no crea su propio contexto de apilamiento y esos
   * valores "se escapan", compitiendo directamente con `.as-map-container__overlay`
   * (nuestros widgets) y pintando por encima. Fijar z-index:0 contiene a
   * Leaflet dentro de este contexto; MapLibre (un único <canvas>, sin panes
   * con z-index) no lo necesita, pero no le afecta.
   */
  z-index: 0;
}

.as-map-container__error {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
  font-family: var(--amw-font-family, system-ui, sans-serif);
  font-size: 0.85rem;
  color: var(--amw-color-text-muted, #64748b);
  background-color: var(--amw-color-surface, #fff);
}

.as-map-container__overlay {
  position: absolute;
  inset: 0;
  /* Debe pintarse siempre por encima del contexto de apilamiento del mapa. */
  z-index: 1;
  pointer-events: none;
}

.as-map-container__overlay :deep(> *) {
  pointer-events: auto;
}
</style>
