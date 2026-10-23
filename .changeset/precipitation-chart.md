---
'@vsadtajo/adasa-ui': minor
---

Añadir `ASPrecipitationChart` y el relleno en degradado de las áreas de `ASChart`.

- `ASPrecipitationChart`: precipitación observada y prevista en intensidad (mm/h) o mm por intervalo (`rate`). Cada serie dice cómo llegan sus valores (`input: 'depth' | 'intensity'`, con `intervalMinutes` opcional) y la gráfica los convierte en los dos sentidos.
- Acumulado opcional por serie (`cumulative`), en el eje derecho (mm) y en su propia línea de la leyenda; la previsión continúa por defecto el acumulado observado (`continueFrom`). Botón de la barra y `v-model:show-cumulative` para mostrarlos u ocultarlos.
- En columnas por defecto: cada una ocupa el intervalo que termina en su instante, así que cada serie mantiene su ancho aunque se mezclen intervalos (10 min, 1 h, 3 h); observadas casi opacas y previstas semitransparentes (`opacity`). Varias observadas y varias previstas a la vez. `display: 'line' | 'area'` (con degradado en el área prevista).
- Por defecto, tooltip con solo la fecha y valores en la leyenda. Umbrales de intensidad o de acumulado.
- `ASChart`: en una serie escalonada, el tooltip y los valores de la leyenda dan el valor del escalón bajo el cursor; en ApexCharts, `step: 'start'` usa `linestep` (antes siempre `stepline`).
- Funciones puras exportadas: `toIntensity`, `toDepth`, `convertPrecipitation`, `toCumulative`, `cumulativeAt`, `intervalHours` y `sortByTime`.
- `ASChart`: `gradient` en las series `area` (`ChartGradient`: `from`, `to`), en ECharts, Chart.js y ApexCharts.
