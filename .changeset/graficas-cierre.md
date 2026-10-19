---
'@vsadtajo/adasa-ui': minor
---

Cierre del bloque de gráficas.

**API coherente entre `ASChart` y `ASHydrographChart`:**

- `ASHydrographChart` acepta `xAxis` (título, formato y límites del eje de tiempo) y `annotations`, como `ASChart`. Las anotaciones Y van por defecto sobre el eje de caudal.
- `now` acepta los mismos valores en las dos (`Date | boolean`). En el hidrograma se muestra por defecto (`true`), porque separa observado de previsto.
- El JSDoc de `height` del hidrograma indica su valor real (420).
- Nuevo tipo `HydrographEmits` (igual que `ChartEmits`).

**Rendimiento** (prueba con 5 series de 100 000 puntos, en `docs/rendimiento-graficas.md`):

- Corregido: con cientos de miles de puntos la gráfica no se dibujaba, porque `Math.min(...valores)` desbordaba la pila. Ahora se usa `extent()`.
- Los formateadores de `core` (`formatNumber`, `formatDate`, `formatUnit`) reutilizan sus `Intl.*Format`. Exportar el CSV con 5 × 50 000 puntos bajaba de 5,4 s; ahora tarda ~1 s con el doble de puntos.
- El cursor ya no copia las series en cada movimiento. En ECharts, cada paso pasa de ~150 ms a 33 ms con 500 000 puntos.
- ECharts dibuja una muestra LTTB cuando hay más puntos que píxeles.

**Calidad:**

- La cobertura de `src/charts` supera el 90 % (statements), con un mínimo del 80 % en el CI.
- `build:playground` comprueba los tipos de verdad.
