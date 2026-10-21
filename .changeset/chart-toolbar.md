---
'@vsadtajo/adasa-ui': minor
---

Barra de herramientas de las gráficas, a partir de la que un visor de embalses montaba a mano sobre ApexCharts:

- **Cambia el aspecto** de la barra de `ASChart` y `ASHydrographChart`: "Restablecer zoom" y pantalla completa son iconos (con su nombre accesible y tooltip), y las descargas PNG, SVG y CSV van en un menú "Descargar". `toolbar: { downloadMenu: false }` vuelve a un botón por formato.
- **Elementos propios** (`toolbar.items`): `button`, `select` (casillas con "Todas" y contador, o radios), `menu`, `chip` e `info`. Son controlados, con los eventos `toolbar-action` y `toolbar-change`. Slots `#toolbar-start` y `#toolbar-end`.
- **Acciones propias de `ASHydrographChart`**, activas con `toolbar`:
  - enfocar umbral (`threshold-focus`);
  - selector de previsiones (`v-model:visible-forecasts`; ocultar una no cambia el color de las demás);
  - mostrar u ocultar percentiles (`v-model:bands`).
- **`ASMenu`** en `/forms`: botón que despliega un menú de acciones, casillas y radios (patrón "menu button" de WAI-ARIA).
- `charts` puede usar las primitivas de `forms` (ADR 0000).
