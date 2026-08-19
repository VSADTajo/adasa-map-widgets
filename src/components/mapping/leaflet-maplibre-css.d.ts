// Declaraciones ambiente para los imports dinámicos de CSS de las
// dependencias opcionales de ASMap.vue. Se declaran explícitamente (en vez de
// depender del `declare module '*.css'` genérico de `vite/client`) para que
// el programa de TypeScript aislado que usa `vite-plugin-dts` al generar los
// `.d.ts` de la librería (ver `tsconfig.build.json`) las reconozca igual.
declare module 'leaflet/dist/leaflet.css'
declare module 'maplibre-gl/dist/maplibre-gl.css'

/**
 * MapLibre procesa las capas GeoJSON/vectoriales en un Web Worker. Con Vite,
 * su URL hay que resolverla vía el sufijo `?worker&url` (no `?url` a secas:
 * el worker importa un fichero hermano, `maplibre-gl-shared.mjs`, que solo
 * `?worker&url` empaqueta junto a él) y pasársela a `setWorkerUrl` antes de
 * crear el mapa — si no, el worker falla en silencio nada más arrancar y
 * ninguna capa vectorial llega a cargar (ver `createMaplibreMap` en ASMap.vue).
 */
declare module 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url' {
  const workerUrl: string
  export default workerUrl
}
