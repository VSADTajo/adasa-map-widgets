---
'@vsadtajo/adasa-ui': minor
---

Nuevo dominio de layout, `@vsadtajo/adasa-ui/layout`, con la estructura de los visores de mapa. Abre y cierra como los visores SAIH, sin Vuetify.

- **`ASAppShell`**:
  - barra corporativa arriba;
  - barra de iconos a la izquierda;
  - panel de sección de 320 px, que empuja el contenido y, al cambiar de sección, se cierra y se reabre a los 280 ms;
  - panel de detalle que entra por la derecha y tapa el contenido desde el borde de los menús (por ahora, un slot vacío con su botón de cerrar).

  La sección abierta y el detalle van por `v-model:active-section` y `v-model:detail-open`.
- **Diseño móvil** (por debajo de `breakpoint`, medido sobre el propio layout):
  - la barra va abajo;
  - el menú de secciones se abre encima de ella;
  - cada sección sube desde abajo, con un asa para ampliarla;
  - el detalle ocupa toda la pantalla;
  - el buscador se abre con un botón de la barra.
- **Piezas sueltas**: `ASAppTopBar`, `ASAppRail` y `ASAppPanelHeader`.
- **Tokens del color corporativo de cada proyecto**: `--as-app-chrome`, `--as-app-chrome-text`, `--as-app-chrome-text-muted` y `--as-app-chrome-active`, y para los paneles `--as-app-panel-bg`, `--as-app-panel-text` y `--as-app-panel-surface`. Por defecto, los de los visores SAIH; también están en `readTokens()` (`app`).

Además, `ASMap` se reajusta cuando cambia el tamaño de su contenedor (antes, solo al cambiar la ventana): un panel que empuja el mapa ya no lo deja descuadrado.
