# ADR 0001: motores de gráficas

- **Estado**: Aceptada
- **Fecha**: 2026-10-18

## Contexto

El dominio `charts` (`@vsadtajo/adasa-ui/charts`) debe servir a todos los proyectos de la corporación. Cada equipo tiene que poder ajustar sus gráficas por props (de 1 a 4 ejes Y, umbrales e instantes como anotaciones, línea "ahora", tooltip, leyenda, zoom) y **elegir el motor** que la dibuja, igual que `ASMap` permite elegir entre Leaflet y MapLibre sin cambiar sus props.

Licencias de los candidatos (consultadas en sus paquetes npm, octubre de 2026):

| Motor          | Versión | Licencia                                                                                                                                                                                                          |
| -------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Apache ECharts | 6.1     | Apache-2.0                                                                                                                                                                                                        |
| Chart.js       | 4.5     | MIT (y sus plugins `annotation`, `zoom` y `adapter-date-fns`, también MIT)                                                                                                                                        |
| ApexCharts     | 8.3     | **Dual**: gratis solo para organizaciones de menos de 2 M$ de ingresos o presupuesto. La licencia comercial (Pro/Premium) **prohíbe redistribuirlo dentro de toolkits, SDK o plataformas**; eso exige la licencia OEM. |

## Decisión

1. **Una API común (`ASChart`) y tres motores intercambiables** con la prop `chart-library`: `'echarts'` (por defecto), `'chartjs'` y `'apexcharts'`.
2. **ECharts es el motor por defecto**: trae de serie todo lo que piden los visores (paneles con eje X compartido en un solo lienzo, ejes invertidos, bandas, anotaciones, zoom con barra, miles de puntos) con licencia libre.
3. **Los tres son `peerDependencies` opcionales**, cargados con `import()` dinámico: un proyecto instala solo el que use, y la librería no empaqueta el código de ninguno.
4. **ApexCharts se ofrece porque lo piden los equipos, pero nunca es el motor por defecto**. Cualquier proyecto que lo elija necesita su propia licencia comercial. Para redistribuirlo dentro de otro producto hace falta la OEM. Lo advierten el JSDoc de `ChartLibrary`, el README y el playground. Sus funciones básicas (las que usamos) no piden clave en tiempo de ejecución; la clave solo desbloquea las funciones premium.

## Arquitectura

```
props de ASChart ──resolveSpec()──▶ ResolvedChartSpec ──toEChartsOption()   ──▶ ECharts
  + tokens del tema (readTokens)      (colores, ejes, formatos,   ──toChartJsConfigs()  ──▶ Chart.js
  + idioma (useLocale)                anotaciones ya resueltos)   ──toApexOptions()     ──▶ ApexCharts
```

- `resolveSpec` decide **todo lo común**: colores (tokens), posición de los ejes, formatos (es-ES por defecto), rango X compartido, valores que cada eje debe incluir (umbrales), "ahora"…
- Cada motor solo **traduce** la especificación con una función pura, testeada sin navegador (`engines.spec.ts` comprueba que los tres producen lo mismo).
- El tooltip se construye desde la especificación (`core/tooltip.ts`), así que muestra las mismas filas en los tres motores.
- La leyenda es HTML y común a los tres (`engines/panels.ts`): misma apariencia, misma posición (`legend="top|bottom|left|right"`), un clic oculta la serie en todos los paneles y, con `legendValues`, muestra los valores bajo el cursor.
- Componentes de dominio como `ASHydrographChart` son configuración de `ASChart` (`buildHydrograph`), así que funcionan con los tres motores sin código propio.

## Diferencias entre motores

Lo que no se puede igualar del todo, por cómo funciona cada librería:

| Aspecto            | ECharts                                     | Chart.js                                                          | ApexCharts                                                   |
| ------------------ | ------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------ |
| Varios paneles     | Un lienzo con varios `grid`                 | Un lienzo por panel, alineados y con la cruceta sincronizada      | Un gráfico por panel, sincronizados con `chart.group`        |
| Tooltip compartido | Uno, con las series de todos los paneles    | Uno (HTML propio), con las series de todos los paneles            | Uno por panel, con las series de ese panel                   |
| Leyenda            | HTML común (igual en los tres)              | HTML común (igual en los tres)                                    | HTML común (igual en los tres)                               |
| Zoom               | Rueda, arrastre y barra (`zoom.slider`)     | Rueda / pellizco, Mayús + arrastre para desplazar y botón "Restablecer zoom"; **sin barra** | Selección con el ratón y barra de herramientas; **sin barra de zoom** |
| Barra de herramientas | Común (ASChart, HTML de la librería): iconos, menú de descargas, elementos propios y acciones del hidrograma | Común (ASChart) | Común (ASChart); el zoom por arrastre sigue activo sin el toolbar nativo |
| `x-click`          | Instante exacto bajo el cursor              | Instante exacto bajo el cursor                                    | Calculado a partir de la posición del ratón                  |
| Exportar PNG       | Nativo, con la leyenda HTML compuesta encima | Se componen los paneles, con la leyenda encima                   | Se componen los paneles, con la leyenda encima               |
| Series grandes (5 × 100 000 puntos) | Fluido: dibuja una muestra LTTB (`sampling`) | Fluido | **Lento**: un SVG de 500 000 puntos; cada movimiento del cursor ~0,5 s ([pruebas](../rendimiento-graficas.md)) |
| Exportar SVG       | **Vectorial**: la misma opción se redibuja con el renderizador SVG (modo SSR) | **Raster**: Chart.js solo dibuja en canvas, así que el SVG contiene la imagen de cada panel | **Vectorial**: el SVG nativo de cada panel |
| Tramas (`patterns`) | Tesela común como patrón de imagen         | Tesela común como `CanvasPattern`                                 | Tesela común como relleno `image`                             |
| Cursor desde el teclado | Cruceta y tooltip                      | Cruceta y tooltip                                                 | Cruceta y valores de la leyenda (el tooltip no se puede abrir desde código); el anuncio al lector de pantalla es el mismo |
| `syncGroup` (cursor remoto) | Cruceta y tooltip                  | Cruceta y tooltip                                                 | Cruceta y valores de la leyenda; **el tooltip no se puede abrir desde código** |
| Trazos (`lineStyle`) | `'dashdot'` con el patrón `[8, 3, 2, 3]` | `borderDash` `[8, 3, 2, 3]` | `strokeDashArray` en texto (`'8 3 2 3'`), que Apex pasa tal cual al `stroke-dasharray` del SVG |
| Alineación entre gráficas sueltas | Exacta (`containShape: false`) | Exacta                                                        | Con barras, Apex añade margen al eje X: queda algo desplazado respecto a una de líneas |

`syncGroup` (`core/sync.ts`) no depende de ningún motor: cada gráfica avisa al grupo de su cursor y su zoom con valores de X normalizados (ms en ejes temporales), y aplica los que le llegan con `showCursor`/`zoomTo` de su motor. Lo que llega del grupo no se reenvía, y un fallo en una gráfica no rompe a las demás.

## Consecuencias

- Cada capacidad nueva de `ASChart` se implementa **tres veces** (una por motor), con su test de equivalencia. Es el coste de dejar elegir el motor.
- Si un motor no puede ofrecer algo, la diferencia se documenta en la tabla de arriba. No se inventa una aproximación que se comporte distinto sin avisar.
- La vía de escape `nativeOptions` permite usar lo específico de un motor, a costa de atar ese código a él.
- Si ApexCharts cambia de licencia o los equipos dejan de pedirlo, se puede retirar su adaptador sin tocar la API.

## Varios ejes Y

Se admiten de 1 a 4 porque lo piden los visores. Aun así, varias magnitudes sobre la misma área de dibujo invitan a comparar escalas que no se pueden comparar. **La recomendación es usar paneles (`panels`) para magnitudes distintas.** El hidrograma ya lo hace así: lluvia arriba y caudal abajo.
