---
'@vsadtajo/adasa-ui': minor
---

Añadir `ASPrecipitationChart` y el relleno en degradado de las áreas de `ASChart`.

- `ASPrecipitationChart`: precipitación observada y prevista en intensidad (mm/h) o mm por intervalo (`rate`). Cada serie dice cómo llegan sus valores (`input: 'depth' | 'intensity'`, con `intervalMinutes` opcional) y la gráfica los convierte en los dos sentidos.
- Acumulado opcional por serie (`cumulative`), en el eje derecho (mm) y en su propia línea de la leyenda; la previsión continúa por defecto el acumulado observado (`continueFrom`). Botón de la barra y `v-model:show-cumulative` para mostrarlos u ocultarlos.
- Por defecto, tooltip con solo la fecha y valores en la leyenda; observado en línea y previsto en área con degradado. Umbrales de intensidad o de acumulado.
- Funciones puras exportadas: `toIntensity`, `toDepth`, `convertPrecipitation`, `toCumulative`, `cumulativeAt`, `intervalHours` y `sortByTime`.
- `ASChart`: `gradient` en las series `area` (`ChartGradient`: `from`, `to`), en ECharts, Chart.js y ApexCharts.
