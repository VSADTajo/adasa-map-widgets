// Declaraciones ambiente para los imports dinámicos de CSS de las
// dependencias opcionales de ASMap.vue. Se declaran explícitamente (en vez de
// depender del `declare module '*.css'` genérico de `vite/client`) para que
// el programa de TypeScript aislado que usa `vite-plugin-dts` al generar los
// `.d.ts` de la librería (ver `tsconfig.build.json`) las reconozca igual.
declare module 'leaflet/dist/leaflet.css'
declare module 'maplibre-gl/dist/maplibre-gl.css'
