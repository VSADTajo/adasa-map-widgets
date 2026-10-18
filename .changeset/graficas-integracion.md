---
'@vsadtajo/adasa-ui': minor
---

Las gráficas se integran con el resto de la librería:

- **`currentTime`** en `ASChart` y `ASHydrographChart`: línea vertical en el instante actual (p. ej. el de `ASMapTimeControls`). Un clic en la gráfica emite **`time-select`** (`{ time }`) y `update:currentTime`, así que admite `v-model:current-time`.
- **`syncGroup`**: las gráficas del mismo grupo comparten cursor, tooltip y zoom, también entre motores distintos.
- **`nearestTimeIndex(timeline, time)`** en el paquete raíz: pasa de una fecha al índice del instante más cercano, para enlazar las gráficas con `ASMapTimeControls`.
- Corregido: un clic en una gráfica de ECharts no devolvía el instante bajo el cursor.
