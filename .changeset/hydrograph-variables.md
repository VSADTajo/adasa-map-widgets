---
'@vsadtajo/adasa-ui': minor
---

`ASHydrographChart` admite caudal de entrada y de salida, volumen y nivel en la misma gráfica.

- Props nuevas `inflow` y `outflow` (en el eje del caudal, m³/s), `volume` (eje propio, hm³) y `level` (eje propio, m; `unit: 'msnm'` para cotas). Volumen y nivel van al lado con menos ejes y no fuerzan el 0. Cada variable tiene un color fijo y sus previsiones se llaman "Variable · Fuente"; el selector de previsiones y el botón de percentiles las incluyen.
- `discharge` pasa a ser opcional (una gráfica de embalse puede tener solo entrada, salida, volumen y nivel).
- `HydroThreshold.variable` (`'discharge' | 'volume' | 'level'`, por defecto `'discharge'`): el eje de cada umbral.
- `seriesOverrides` y `yAxisOverrides` aceptan los ids de las nuevas series (`'level-observed'`, `'volume-eps'`...) y ejes (`'volume'`, `'level'`).
- Corrige el rango de los ejes con umbrales en ECharts y ApexCharts: el redondeo sale del rango de los datos y no de su magnitud (una cota de 651,3–651,6 msnm ya no se amplía a 650–700). En ECharts, el intervalo de las marcas divide el rango justo, así que el máximo cae en una marca.
- Estilo de cada serie con `style` (`HydroLineStyle`: `color`, `width` y `type`): el de cada variable es el de su observado y cada previsión tiene el suyo. Sustituye a `observedColor` y `color`, que siguen funcionando pero quedan obsoletas.
- Las bandas de percentiles salen en la leyenda (cada una con su opacidad) y se configuran con `bandStyle` en cada previsión (`HydroBandStyle`: `color`, `opacity`, `name` y `legend`).
- La precipitación admite `unit: 'mm/h'` (intensidad); `formatUnit` conoce `'mm/h'`.
- En un panel bajo donde no cabe el título del eje, los tres motores muestran al menos la unidad (antes no mostraban nada).
- `ASChart`: nuevo trazo `'dashdot'` (punto y raya) en `lineStyle`, en los tres motores, la leyenda y las imágenes exportadas.
