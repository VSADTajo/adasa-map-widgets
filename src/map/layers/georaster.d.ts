// `georaster` no distribuye tipos propios (ni existe un paquete `@types/georaster`):
// se declara aquí la forma mínima que se usa (`renderCOG` en `leaflet.ts`),
// reutilizando `GeoRaster` de `georaster-layer-for-leaflet` (que sí lo tipa,
// porque es la forma que espera su propio constructor).
declare module 'georaster' {
  import type { GeoRaster } from 'georaster-layer-for-leaflet'

  export default function parseGeoraster(input: string | ArrayBuffer): Promise<GeoRaster>
}
