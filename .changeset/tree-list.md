---
'@vsadtajo/adasa-ui': minor
---

Añadir `ASTreeList`, `ASCollapsible` y `ASSlider` en `/forms` (piezas para paneles de capas, como el `ItemsLayersGroup` de TAJO).

- `ASTreeList`: árbol con selección `'multiple'` (casillas con estado intermedio en los grupos), `'single'` o `'none'`. `v-model` son los ids de las hojas seleccionadas; `v-model:expanded` y `v-model:opacities` son opcionales. Cada `TreeNode` puede llevar descripción, icono, muestra de color, contador, estado deshabilitado con su motivo, carga, slider de opacidad y acciones (`node-action`). Teclado según el patrón *tree* de WAI-ARIA. Exporta también las funciones puras `leafIds`, `checkState`, `toggleNode`, `findNode` e `isGroup`.
- `ASCollapsible`: sección plegable (patrón *disclosure*) con título, contador, slot `#actions` y `v-model:open` opcional.
- `ASSlider`: `<input type="range">` nativo con estilo propio, `format` para el valor (también en `aria-valuetext`) y los eventos `update:modelValue` y `change`.
- Corrige la opacidad de las capas GeoJSON, TopoJSON, KML y WFS en Leaflet: ahora multiplica la del estilo (como en MapLibre) en vez de sustituirla, así que un relleno translúcido ya no se vuelve opaco.
