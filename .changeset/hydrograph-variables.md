---
'@vsadtajo/adasa-ui': minor
---

`ASHydrographChart` admite caudal de entrada y de salida, volumen y nivel en la misma gráfica.

- Props nuevas `inflow` y `outflow` (en el eje del caudal, m³/s), `volume` (eje propio, hm³) y `level` (eje propio, m; `unit: 'msnm'` para cotas). Volumen y nivel van al lado con menos ejes y no fuerzan el 0. Cada variable tiene un color fijo y sus previsiones se llaman "Variable · Fuente"; el selector de previsiones y el botón de percentiles las incluyen.
- `discharge` pasa a ser opcional (una gráfica de embalse puede tener solo entrada, salida, volumen y nivel).
- `HydroThreshold.variable` (`'discharge' | 'volume' | 'level'`, por defecto `'discharge'`): el eje de cada umbral.
- `seriesOverrides` y `yAxisOverrides` aceptan los ids de las nuevas series (`'level-observed'`, `'volume-eps'`...) y ejes (`'volume'`, `'level'`).
- Corrige el rango de los ejes con umbrales en ECharts y ApexCharts: el redondeo sale del rango de los datos y no de su magnitud (una cota de 651,3–651,6 msnm ya no se amplía a 650–700). En ECharts, el intervalo de las marcas divide el rango justo, así que el máximo cae en una marca.
- **Cambio incompatible:** `observed` pasa a ser una lista de series (`HydroObserved`: `id`, `name`, `values` y `style`), como `forecasts`; una variable puede tener varios observados (p. ej. SAIH y aforos manuales). Se quitan `observedName` y `observedColor`. Su serie es `'<variable>-observed-<id>'`.
- Estilo de cada serie con `style` (`HydroLineStyle`: `color`, `width` y `type`), en cada observado y en cada previsión. **Cambio incompatible:** se quita el `color` suelto de las previsiones (ahora `style.color`).
- La precipitación va en su propia línea de la leyenda, con su título; sus series se llaman "Precipitación · <nombre>" en el tooltip, la tabla y el CSV.
- `ASChart`: `legendGroup` y `legendLabel` en cada serie (grupos en su propia línea de la leyenda, y en las imágenes exportadas), y `tooltip: 'time'` (o `{ content: 'time' }`) para un tooltip con solo la fecha.
- Las bandas de percentiles salen en la leyenda (cada una con su opacidad) y se configuran con `bandStyle` en cada previsión (`HydroBandStyle`: `color`, `opacity`, `name` y `legend`).
- La precipitación admite `unit: 'mm/h'` (intensidad); `formatUnit` conoce `'mm/h'`.
- En un panel bajo donde no cabe el título del eje, los tres motores muestran al menos la unidad (antes no mostraban nada).
- `ASChart`: nuevo trazo `'dashdot'` (punto y raya) en `lineStyle`, en los tres motores, la leyenda y las imágenes exportadas.
