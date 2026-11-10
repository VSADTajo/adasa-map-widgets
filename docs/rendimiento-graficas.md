# Rendimiento de las gráficas

Prueba de cierre del bloque de gráficas: **5 series de 100 000 puntos** (500 000 en total; una por minuto durante ~69 días) en una `ASChart` de 1200 × 400 px, con cada motor.

## Cómo se mide

- **Página**: [`perf.html`](../perf.html), con el código en [`src/playground/perf/chartsPerf.ts`](../src/playground/perf/chartsPerf.ts). Se abre con `npm run perf:charts`, o con `npm run dev` y `/perf.html?engine=echarts|chartjs|apexcharts`. Los parámetros `&series=5&points=100000` cambian el tamaño, y `&reactive=deep` pasa los datos en un `ref` en vez de en un `shallowRef`.
- **Datos**: paseo aleatorio con semilla fija (los mismos en cada ejecución y motor), sin animación y con zoom activado.
- **Qué se mide** (en ms):
  - `resolveSpec`: la parte común, sin motor.
  - Montar el componente hasta que el motor emite `ready` y el navegador pinta.
  - Sustituir los datos por otros y esperar el pintado.
  - Mover el cursor 20 veces con el teclado: el mismo camino que el ratón o un `syncGroup`, cada paso hasta el pintado.
  - Exportar el CSV y el PNG.
  - Memoria JS tras forzar la recogida de basura.
- **Equipo**: AMD Ryzen 5 5500U, 10 GB, Microsoft Edge 155 sin interfaz (`--js-flags=--expose-gc --enable-precise-memory-info`). Son cifras orientativas: en otra máquina cambian los valores absolutos, no las conclusiones.

## Resultados (5 × 100 000 puntos)

| Fase                         |  ECharts | Chart.js | ApexCharts |
| ---------------------------- | -------: | -------: | ---------: |
| `resolveSpec`                |    98 ms |    91 ms |      94 ms |
| Montar y primer dibujo       |   871 ms |   918 ms |   1 738 ms |
| Actualizar datos             | 1 026 ms |   802 ms |   1 724 ms |
| Mover el cursor (por paso)   |    33 ms |    33 ms |     542 ms |
| Exportar CSV (5 MB)          | 1 051 ms | 1 387 ms |   1 440 ms |
| Exportar PNG                 |    78 ms |    42 ms |   2 906 ms |
| Memoria JS                   |   291 MB |   342 MB |     228 MB |

Cada paso del cursor incluye esperar dos frames (~33 ms a 60 Hz): en ECharts y Chart.js, lo que cuesta mover el cursor es esperar al siguiente pintado.

### Con los datos en un `ref` (reactividad profunda)

| ECharts, 5 × 100 000     | `shallowRef` | `ref`    |
| ------------------------ | -----------: | -------: |
| Montar y primer dibujo   |       871 ms | 1 660 ms |
| Actualizar datos         |     1 026 ms | 2 288 ms |
| Memoria JS               |       291 MB |   478 MB |

Con `ref`, Vue envuelve cada punto en un proxy reactivo.

## Lo que se corrigió con esta prueba

Antes de la prueba, con 5 × 100 000 puntos **la gráfica no llegaba a dibujarse**. Esto es lo que se arregló:

1. **Desbordamiento de pila.** `resolveSpec` calculaba el rango X con `Math.min(...xs)`, que pasa cada punto como un argumento. Con ~500 000 puntos lanza `RangeError: Maximum call stack size exceeded`. Pasaba lo mismo en la descripción accesible, en el eje de la precipitación del hidrograma y en los ejes de ApexCharts. Ahora todos usan `extent()` (`core/extent.ts`), que recorre los valores una vez. Un test comprueba que aguanta un millón de valores.
2. **CSV.** Con 5 × 50 000 puntos tardaba 5,4 s; ahora, con el doble de puntos, ~1 s. `formatNumber`/`formatDate` creaban un `Intl.NumberFormat` por valor; ahora los formateadores de `core/utils/format.ts` se reutilizan por idioma y opciones. Esto beneficia a toda la librería.
3. **Cursor.** El tooltip copiaba las X de cada serie en cada movimiento para buscar el punto más cercano; ahora busca sobre los puntos tal cual. Además, `showCursor` de ECharts leía `chart.getOption()`, que copia la opción entera con todos los datos (~60 ms por paso). Con los dos cambios, el cursor de ECharts pasa de ~150 ms a 33 ms por paso.
4. **ECharts dibuja una muestra LTTB** de las líneas cuando hay más puntos que píxeles (`sampling: 'lttb'`). Conserva picos y forma, y aligera cada redibujado. El tooltip, el CSV y la tabla accesible siguen usando todos los datos.

## Conclusiones y recomendaciones

- **ECharts (por defecto) y Chart.js** manejan 500 000 puntos con soltura: menos de un segundo para dibujar y el cursor al ritmo del pintado.
- **ApexCharts no es adecuado para series tan grandes.** Dibuja en SVG con un nodo por elemento, así que cada movimiento del cursor repinta un SVG de 500 000 puntos (~0,5 s) y exportar a PNG tarda ~3 s. Para series largas, usa ECharts. ApexCharts, además, nunca es el motor por defecto ([ADR 0001](adr/0001-motores-graficas.md)).
- **Pasa los datos grandes en un `shallowRef`** (o `markRaw`), y actualízalos sustituyendo el array, no con `push`. Con `ref`, montar tarda el doble y la memoria crece un 64 %.
- **El CSV de 5 × 100 000 valores ocupa ~5 MB** y tarda ~1 s, lo bastante rápido para el botón de descarga. La tabla para lectores de pantalla se recorta a 500 filas.
- **El coste común (`resolveSpec`, ~100 ms) es pequeño** frente al del motor. Si hiciera falta bajar más, el siguiente paso sería no copiar los puntos al normalizarlos.
