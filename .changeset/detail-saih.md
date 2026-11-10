---
'@vsadtajo/adasa-ui': minor
---

Nuevo dominio de detalle, `@vsadtajo/adasa-ui/detail`: las piezas de la ficha de una estación, a partir del panel de estación de TAJO. Reciben los datos ya preparados (`MeasureSeries`, `AlertThresholds`), así que cada proyecto solo escribe un adaptador de su API.

- **`ASDetailHeader`**: cabecera de la ficha (título, subtítulo, etiquetas, cerrar), fija arriba y con el color corporativo.
- **`ASCard`**: tarjeta con título, acciones, esqueleto de carga y texto sin datos.
- **`ASStatusBadge`**: píldora de un nivel de aviso, siempre con texto.
- **`ASAlertStatus`**: nivel de aviso actual (último valor observado) o previsto (máximo de las previsiones).
- **`ASObservedSummary`**: último valor y máximo con su fecha y su nivel; selector entre series (entrada, salida, volumen).
- **`ASThresholdSummary`**: superaciones de umbral por serie y nivel, con el último tramo.
- **`ASValueMatrix`**: tabla de valores por intervalo (mínimo, media o máximo), con las celdas teñidas por nivel y la columna de series fija.
- **`ASThresholdLegend`**: umbrales con su valor, con `v-model:selected` para resaltar uno (p. ej. en el hidrograma).
- **Funciones puras**: `alertLevelOf`, `worstLevel`, `summarizeSeries`, `exceedanceSegments`, `aggregateByInterval` e `intervalStart`.
