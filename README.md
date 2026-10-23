# @vsadtajo/adasa-ui

Librería corporativa **ADASA** de componentes **Vue 3 + TypeScript**: el punto de entrada común de los proyectos web de la corporación. Hoy incluye los dominios de **mapas** (agnóstico del motor: Leaflet o MapLibre), **gráficas** (ECharts, Chart.js o ApexCharts), **layout**, **formularios** y **detalle** (fichas de estación), y crecerá con tablas (ver [`docs/adr/0000-estructura-paquete.md`](docs/adr/0000-estructura-paquete.md)). Estándar interno de [VSADTajo](https://github.com/VSADTajo): paquete privado, distribuido vía GitHub Packages (no está en el registro público de npm).

## Dominios y entry points

Cada dominio se importa desde su propio subpath, así que un proyecto solo carga lo que usa:

| Import                         | Contenido                                                                                       |
| ------------------------------ | ----------------------------------------------------------------------------------------------- |
| `@vsadtajo/adasa-ui`           | `core`: tema y tokens (`provideTheme`, `readTokens`...), idioma (`provideLocale`, `useLocale`), formateadores (`formatNumber`, `formatDate`, `formatDuration`, `formatUnit`) y `ASIcon` |
| `@vsadtajo/adasa-ui/map`       | `ASMap`, widgets `ASMap*`, capas (`useLayerManager`, `geoServerLayer`...), leyendas y sus tipos |
| `@vsadtajo/adasa-ui/charts`    | `ASChart`, `ASHydrographChart` y `ASPrecipitationChart`, con ECharts, Chart.js o ApexCharts (a elegir) |
| `@vsadtajo/adasa-ui/layout`    | `ASAppShell` y sus piezas `ASApp*` (barra, marca, buscador, menú de usuario, barra de iconos, paneles): la estructura de las aplicaciones de mapa |
| `@vsadtajo/adasa-ui/forms`     | Primitivas de formulario: `ASButton`, `ASIconButton`, `ASInput`, `ASSelect`, `ASCheckbox`, `ASSwitch`, `ASRadioGroup`, `ASDatePicker`, `ASDateRangePicker`, `ASSearchInput`, `ASSlider`, `ASFormField`, y para paneles `ASCollapsible` y `ASTreeList` |
| `@vsadtajo/adasa-ui/detail`    | Ficha de una estación: `ASDetailHeader`, `ASCard`, `ASStatusBadge` y tarjetas hidrológicas (`ASAlertStatus`, `ASObservedSummary`, `ASThresholdSummary`, `ASValueMatrix`, `ASThresholdLegend`) |
| `@vsadtajo/adasa-ui/style.css` | Tokens de tema y estilos de todos los componentes                                               |

Importar solo la raíz no carga nada de mapas: ni código ni tipos de Leaflet o MapLibre. Medido en un proyecto de prueba, añade ~1 kB al bundle frente a una app que solo usa Vue.

## Componentes

| Componente                                                              | Import    | Qué es                                                                       | Depende de                          |
| ----------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------- | ----------------------------------- |
| [`ASMap`](src/map/components/ASMap.vue)                                 | `/map`    | Contenedor de mapa con capas y mapas base                                    | `leaflet` o `maplibre-gl` (a elegir) |
| [`ASMapTimeControls`](src/map/components/ASMapTimeControls.vue)         | `/map`    | Reproducción de una línea de tiempo (play/pause, paso a paso, slider)        | —                                   |
| [`ASMapTimeRangeControls`](src/map/components/ASMapTimeRangeControls.vue) | `/map`  | Selección de un rango de tiempo con dos manejadores                          | —                                   |
| [`ASMapDayIntervalControls`](src/map/components/ASMapDayIntervalControls.vue) | `/map` | Intervalos horarios por día, coloreados por aviso                         | —                                   |
| [`ASMapBasemapsSelector`](src/map/components/ASMapBasemapsSelector.vue) | `/map`    | Selector de mapa base con miniaturas                                         | —                                   |
| [`ASMapScale`](src/map/components/ASMapScale.vue)                       | `/map`    | Escala del mapa (regla graduada o razón numérica)                            | —                                   |
| [`ASMapLegend`](src/map/components/ASMapLegend.vue)                     | `/map`    | Leyenda de las capas dinámicas                                               | —                                   |
| [`ASMapButtonToggle`](src/map/components/ASMapButtonToggle.vue)         | `/map`    | Grupo de botones de selección única                                          | —                                   |
| [`ASChart`](src/charts/components/ASChart.vue)                          | `/charts` | Gráfica cartesiana: líneas, barras, áreas, bandas y dispersión; 1–4 ejes Y, paneles | `echarts`, `chart.js` o `apexcharts` (a elegir) |
| [`ASHydrographChart`](src/charts/components/ASHydrographChart.vue)      | `/charts` | Hidrograma: precipitación, caudal (y entrada/salida), volumen y nivel, observado y previsto, umbrales | el motor de `ASChart`               |
| [`ASPrecipitationChart`](src/charts/components/ASPrecipitationChart.vue) | `/charts` | Precipitación observada y prevista en mm/h o mm, con el acumulado de cada serie | el motor de `ASChart`               |
| [`ASAppShell`](src/layout/components/ASAppShell.vue)                    | `/layout` | Layout de aplicación de mapa: barra, iconos, panel de sección y de detalle; escritorio y móvil | —                  |
| [`ASAppTopBar`](src/layout/components/ASAppTopBar.vue)                  | `/layout` | Barra superior corporativa (marca, buscador, acciones)                       | —                                   |
| [`ASAppRail`](src/layout/components/ASAppRail.vue)                      | `/layout` | Barra vertical de iconos de sección                                          | —                                   |
| [`ASAppPanelHeader`](src/layout/components/ASAppPanelHeader.vue)        | `/layout` | Cabecera de panel: título y botón de cerrar con flecha                       | —                                   |
| [`ASAppBrand`](src/layout/components/ASAppBrand.vue)                    | `/layout` | Logos, nombre y subtítulo de la aplicación en la barra                       | —                                   |
| [`ASAppSearch`](src/layout/components/ASAppSearch.vue)                  | `/layout` | Buscador de la barra (sobre `ASSearchInput`)                                 | —                                   |
| [`ASAppUserMenu`](src/layout/components/ASAppUserMenu.vue)              | `/layout` | Avatar con el menú del usuario: tema, idioma y cerrar sesión                 | —                                   |
| [`ASAppDrawer`](src/layout/components/ASAppDrawer.vue)                  | `/layout` | Panel de sección de escritorio que empuja el contenido                       | —                                   |
| [`ASAppDetailPanel`](src/layout/components/ASAppDetailPanel.vue)        | `/layout` | Panel de detalle que entra por la derecha                                    | —                                   |
| [`ASAppBottomSheet`](src/layout/components/ASAppBottomSheet.vue)        | `/layout` | Panel móvil que sube desde abajo, con asa para ampliarlo                     | —                                   |
| [`ASAppMobileMenu`](src/layout/components/ASAppMobileMenu.vue)          | `/layout` | Menú de secciones del móvil, encima de la barra                              | —                                   |
| [`ASMenu`](src/forms/components/ASMenu.vue)                             | `/forms`  | Botón que despliega un menú de acciones, casillas y radios                   | —                                   |
| [`ASButton`](src/forms/components/ASButton.vue)                         | `/forms`  | Botón primary / secondary / ghost / danger, con icono y estado de carga      | —                                   |
| [`ASIconButton`](src/forms/components/ASIconButton.vue)                 | `/forms`  | Botón cuadrado solo con icono; opcionalmente interruptor (`v-model:pressed`) | —                                   |
| [`ASInput`](src/forms/components/ASInput.vue)                           | `/forms`  | Campo de texto o número: iconos, unidad, borrar, coma decimal                | —                                   |
| [`ASSelect`](src/forms/components/ASSelect.vue)                         | `/forms`  | Desplegable con búsqueda, selección múltiple con chips y grupos              | —                                   |
| [`ASCheckbox`](src/forms/components/ASCheckbox.vue)                     | `/forms`  | Casilla booleana o de grupo, con estado indeterminado                        | —                                   |
| [`ASSwitch`](src/forms/components/ASSwitch.vue)                         | `/forms`  | Interruptor de encendido y apagado                                           | —                                   |
| [`ASRadioGroup`](src/forms/components/ASRadioGroup.vue)                 | `/forms`  | Opciones de selección única                                                  | —                                   |
| [`ASDatePicker`](src/forms/components/ASDatePicker.vue)                 | `/forms`  | Fecha (y hora opcional): se escribe o se elige en un calendario              | —                                   |
| [`ASDateRangePicker`](src/forms/components/ASDateRangePicker.vue)       | `/forms`  | Periodo con atajos (últimas 24 h, año hidrológico...) y calendario           | —                                   |
| [`ASSearchInput`](src/forms/components/ASSearchInput.vue)               | `/forms`  | Buscador con sugerencias asíncronas (`fetchSuggestions`)                     | —                                   |
| [`ASSlider`](src/forms/components/ASSlider.vue)                         | `/forms`  | Slider (range nativo) con el valor formateado (`format`)                     | —                                   |
| [`ASCollapsible`](src/forms/components/ASCollapsible.vue)               | `/forms`  | Sección plegable con título, contador y acciones (`v-model:open`)            | —                                   |
| [`ASTreeList`](src/forms/components/ASTreeList.vue)                     | `/forms`  | Árbol con selección (capas, estaciones, escenarios), opacidad y acciones     | —                                   |
| [`ASFormField`](src/forms/components/ASFormField.vue)                   | `/forms`  | Etiqueta, ayuda y error enlazados a cualquier control                        | —                                   |
| [`ASDetailHeader`](src/detail/components/ASDetailHeader.vue)            | `/detail` | Cabecera de una ficha: título, etiquetas y cerrar, fija arriba               | —                                   |
| [`ASCard`](src/detail/components/ASCard.vue)                            | `/detail` | Tarjeta con título, acciones, esqueleto de carga y texto sin datos           | —                                   |
| [`ASStatusBadge`](src/detail/components/ASStatusBadge.vue)              | `/detail` | Píldora de un nivel de aviso (normal, amarillo, naranja, rojo)               | —                                   |
| [`ASAlertStatus`](src/detail/components/ASAlertStatus.vue)              | `/detail` | Nivel de aviso actual (observado) o previsto (máximo de las previsiones)     | —                                   |
| [`ASObservedSummary`](src/detail/components/ASObservedSummary.vue)      | `/detail` | Último valor y máximo observados, con su fecha y su nivel                    | —                                   |
| [`ASThresholdSummary`](src/detail/components/ASThresholdSummary.vue)    | `/detail` | Superaciones de umbral por serie y nivel                                     | —                                   |
| [`ASValueMatrix`](src/detail/components/ASValueMatrix.vue)              | `/detail` | Tabla de valores por intervalo (mín./media/máx.) teñida por nivel            | —                                   |
| [`ASThresholdLegend`](src/detail/components/ASThresholdLegend.vue)      | `/detail` | Umbrales con su valor; resalta uno (p. ej. en el hidrograma)                 | —                                   |
| [`ASIcon`](src/core/components/ASIcon.vue)                              | raíz      | Icono de cualquier librería: trazado (`@mdi/js`), componente o nombre (`provideIcons`) | —                                   |

Los widgets de control `ASMap*` no dependen de ninguna librería de mapas; las dependencias de la última columna son `peerDependencies` opcionales que se instalan solo si se usa ese motor.

## Componentes del dominio `map`

- **[`ASMap`](src/map/components/ASMap.vue)**: contenedor de mapa. Instancia Leaflet o MapLibre GL JS (a elección) y muestra un mapa base de OpenStreetMap por defecto. Su slot por defecto aloja los widgets posicionados sobre el mapa.
- **[`ASMapTimeControls`](src/map/components/ASMapTimeControls.vue)**: reproducción de una línea de tiempo (play/pause, paso a paso y slider).
- **[`ASMapTimeRangeControls`](src/map/components/ASMapTimeRangeControls.vue)**: selección de un **rango** de tiempo con dos manejadores sobre un slider doble.
- **[`ASMapDayIntervalControls`](src/map/components/ASMapDayIntervalControls.vue)**: selector de intervalos horarios agrupados por día (p. ej. bloques de 6h × 3 días), coloreados según avisos/severidad.
- **[`ASMapBasemapsSelector`](src/map/components/ASMapBasemapsSelector.vue)**: selector de mapa base con miniaturas.
- **[`ASMapScale`](src/map/components/ASMapScale.vue)**: escala del mapa (regla graduada o razón numérica).
- **[`ASMapLegend`](src/map/components/ASMapLegend.vue)**: leyenda de las capas dinámicas, generada por tipo de capa.
- **[`ASMapButtonToggle`](src/map/components/ASMapButtonToggle.vue)**: grupo de botones de selección única.

### Por qué es agnóstica del mapa

Ningún widget de control importa una librería de mapas: solo `ASMap` y el sistema de capas lo hacen, y de forma opcional (ver más abajo). El resto son componentes **controlados**: reciben sus datos (línea de tiempo, rango, avisos...) como props ya resueltas y emiten eventos (`update:*`, `*-changed`). El proyecto consumidor decide qué hacer con ellos (p. ej. actualizar los parámetros de una capa temporal en su propio store). Ninguno depende de Pinia, Vuex ni ningún store.

## Gráficas (`@vsadtajo/adasa-ui/charts`)

- **[`ASChart`](src/charts/components/ASChart.vue)**: gráfica cartesiana genérica (líneas, barras, áreas, bandas y dispersión sobre un eje temporal, numérico o de categorías).
- **[`ASHydrographChart`](src/charts/components/ASHydrographChart.vue)**: hidrograma, con la precipitación arriba (barras, eje invertido) y el caudal o nivel abajo. La precipitación puede ir alineada en su propio panel (`precipitation-layout="panel"`, por defecto) o superpuesta al caudal con su eje a la derecha (`"overlay"`), colgando desde arriba o no (`precipitation-inverted`). Nombre y estilo de cada serie (observada o prevista) con su `name` y su `style` (ver abajo). Cualquier serie generada (eje, estilo, leyenda…) se retoca con `seriesOverrides` por su id, y los ejes con `yAxisOverrides`. Distingue observado y previsto, admite varias fuentes de previsión con bandas de percentiles p10–p90 y p25–p75, y marca los umbrales de aviso y la línea "ahora".

**Tres motores con los mismos props**, igual que `ASMap` con Leaflet y MapLibre. Se elige con `chart-library` y se instala solo el que se use:

```bash
npm install echarts                     # chart-library="echarts" (por defecto)
npm install chart.js chartjs-plugin-annotation chartjs-plugin-zoom chartjs-adapter-date-fns   # "chartjs"
npm install apexcharts                  # "apexcharts" ⚠️ requiere licencia comercial (ver abajo)
```

Todo se ajusta por props:
- de 1 a 4 ejes Y (`yAxes`), con unidad, lado, eje invertido o logarítmico;
- paneles apilados con el eje X compartido (`panels`);
- umbrales e intervalos como anotaciones (`annotations`), coloreados por nivel de aviso;
- línea "ahora" (`now`);
- nombre y color de cada serie (`series[i].name` / `.color`; también `'var(--as-data-cat-N)'`) y en qué eje va (`series[i].yAxis`);
- barra de herramientas (`toolbar`), igual en los tres motores: restablecer zoom, descargas (PNG, SVG, CSV) y pantalla completa, más elementos propios del proyecto;
- tramas en los rellenos (`patterns`) para no depender del color;
- leyenda arriba, abajo o a un lado (`legend="bottom"`), con los valores bajo el cursor si se activa `legend-values` (con `:tooltip="false"`, en vez del tooltip);
- `tooltip`, `legend`, `zoom`, `height` y `animation`;
- `nativeOptions`, como vía de escape a las opciones propias del motor.

Colores, textos y formatos salen de los tokens y del idioma activo: claro/oscuro y español de España por defecto.

```vue
<ASChart
  :series="[{ id: 'q', name: 'Caudal', type: 'line', data: caudal }]"
  :y-axes="[{ id: 'q', label: 'Caudal', unit: 'm³/s' }]"
  :annotations="{ y: [{ value: 120, level: 'rojo', label: 'Umbral rojo' }] }"
  now
/>

<ASHydrographChart
  :discharge="{
    observed: [{ id: 'saih', name: 'Observado', values: caudal }],
    forecasts: [{ id: 'eps', name: 'EPS', values: mediana, percentiles }],
  }"
  :precipitation="{ observed: [{ id: 'saih', name: 'Lluvia', values: lluvia }] }"
  :thresholds="[{ value: 90, level: 'amarillo' }, { value: 130, level: 'naranja' }]"
/>
```

**Forma de cada variable.** `discharge`, `inflow`, `outflow`, `volume`, `level` y `precipitation` tienen la misma forma (`HydroVariable`): una lista de **observados** y otra de **previsiones**, y cada serie lleva su `id`, su `name` y su `style`:

```ts
{
  observed: [
    { id: 'saih', name: 'SAIH', values: caudal, style: { color: '#2a78d6' } },
    { id: 'aforos', name: 'Aforos manuales', values: aforos, style: { color: '#6250d6', type: 'dotted' } },
  ],
  forecasts: [
    { id: 'harmonie', name: 'Harmonie', values: harmonie, style: { color: '#eb6834' } },
    { id: 'eps', name: 'EPS', values: mediana, percentiles, style: { type: 'dashdot' }, bandStyle: { 'p10-p90': { opacity: 0.1 } } },
  ],
  unit: 'm³/s',
}
```

Puede haber varios observados por variable (p. ej. la estación SAIH y los aforos manuales del mismo punto). El primero lleva el color de la variable y los siguientes, otros de la paleta: con varios, conviene darles `color`.

**Leyenda del hidrograma.** La precipitación va en su propia línea de la leyenda, con su título ("Precipitación", o su `label`), debajo de las series del caudal. Sus series se llaman "Precipitación · <nombre>" en el tooltip, la tabla y el CSV, así que una lluvia "Observado" no se confunde con el caudal "Observado" y cada una se oculta por separado. Con `legend-values`, los valores de la lluvia salen también en esa segunda línea.

**Embalses y otras magnitudes en la misma gráfica.** Además de `discharge`, el panel principal admite:

| Prop      | Qué es             | Eje                                  | Unidad por defecto            |
| --------- | ------------------ | ------------------------------------ | ----------------------------- |
| `inflow`  | Caudal de entrada  | el del caudal (compartido)           | `m³/s`                        |
| `outflow` | Caudal de salida   | el del caudal (compartido)           | `m³/s`                        |
| `volume`  | Volumen embalsado  | propio                               | `hm³`                         |
| `level`   | Nivel o cota       | propio                               | `m` (`unit: 'msnm'` para cotas) |

Todas son `HydroVariable` (observado y previsiones con percentiles, como `discharge`), y `discharge` es opcional: una gráfica de embalse puede llevar solo entrada, salida, volumen y nivel. Volumen y nivel colocan su eje en el lado con menos ejes, sin forzar el 0; cada variable tiene un color fijo (que no cambia al ocultar previsiones) y sus previsiones se llaman "Variable · Fuente". Los umbrales van al eje de su `variable`:

```vue
<ASHydrographChart
  :inflow="{
    observed: [{ id: 'saih', name: 'Entrada', values: entrada }],
    forecasts: [{ id: 'eps', name: 'EPS', values: entradaEps }],
  }"
  :outflow="{ observed: [{ id: 'saih', name: 'Salida', values: salida }] }"
  :volume="{ observed: [{ id: 'saih', name: 'Volumen', values: volumen }] }"
  :level="{ observed: [{ id: 'saih', name: 'Cota', values: cota }], unit: 'msnm' }"
  :thresholds="[
    { value: 826, level: 'amarillo', variable: 'volume', label: 'Resguardo' },
    { value: 649.9, level: 'rojo', variable: 'level', label: 'Cota máxima' },
  ]"
/>
```

**Estilo de cada serie.** Cada observado y cada previsión lleva su `style` (`HydroLineStyle`), con `color`, `width` (px) y `type`, que puede ser `'solid'` (continua), `'dashed'` (discontinua), `'dotted'` (puntos) o `'dashdot'` (punto y raya). Por defecto, el observado es continuo y las previsiones discontinuas, de 2 px. El color de una previsión tiñe también sus bandas de percentiles y sus barras de lluvia; en la precipitación (barras) solo cuenta el color.

```vue
<ASHydrographChart
  :discharge="{
    observed: [{ id: 'saih', name: 'Observado', values: caudal, style: { color: '#2a78d6', width: 3 } }],
    forecasts: [
      { id: 'harmonie', name: 'Harmonie', values: harmonie, style: { color: '#eb6834', type: 'dashed' } },
      { id: 'eps', name: 'EPS', values: eps, percentiles, style: { color: '#05a873', width: 2, type: 'dashdot' } },
    ],
  }"
/>
```

**Percentiles (bandas de incertidumbre).** Una previsión por conjuntos (p. ej. EPS) puede traer, además de su mediana en `values`, cuatro percentiles en `percentiles`. Se dibujan como dos bandas sombreadas debajo de la línea:

| Banda       | Entre                 | Qué indica                              | Opacidad por defecto |
| ----------- | --------------------- | --------------------------------------- | -------------------- |
| `'p10-p90'` | `p10` y `p90`         | el 80 % de los miembros (más ancha)     | 0,15                 |
| `'p25-p75'` | `p25` y `p75`         | el 50 % central (más estrecha y marcada) | 0,3                  |

- **Datos**: cada percentil es una serie `[instante, valor]` como `values`, y cada par (p10 con p90, p25 con p75) tiene que ir en los mismos instantes. Si falta uno del par, esa banda no se dibuja.
- **Cuáles se ven**: la prop `bands` (`['p10-p90', 'p25-p75']` por defecto; `[]` las oculta), que el botón "Percentiles" de la barra cambia con `v-model:bands`.
- **Aspecto**: `bandStyle` de la previsión, por banda (`HydroBandStyle`): `color` (por defecto, el de la línea de la previsión), `opacity`, `name` y `legend`.
- **Leyenda**: cada banda tiene su entrada ("EPS p10–p90"), con su color y su opacidad; al pulsarla se oculta. `legend: false` la quita de la leyenda.
- **Tooltip, tabla y CSV**: cada banda sale con su inferior y su superior.

```vue
<ASHydrographChart
  :discharge="{
    observed: [{ id: 'saih', name: 'Observado', values: caudal }],
    forecasts: [
      {
        id: 'eps',
        name: 'EPS',
        values: mediana,
        percentiles: { p10, p25, p75, p90 },
        style: { color: '#05a873', type: 'dashdot' },
        bandStyle: {
          'p10-p90': { opacity: 0.1, name: 'EPS (80 % de los miembros)' },
          'p25-p75': { color: '#047857', opacity: 0.35 },
        },
      },
    ],
  }"
/>
```

**Unidades.** Cada variable lleva su `unit`, que sale en el título del eje, el tooltip, la tabla y el CSV. La precipitación usa `mm` por defecto (acumulada en cada intervalo); para intensidad, `unit: 'mm/h'`. En un panel bajo, si el título completo ("Precipitación (mm/h)") no cabe, el eje muestra solo la unidad ("mm/h").

Con precipitación, caudal, volumen y nivel se llega a los 4 ejes Y que admite `ASChart`. Los ids de las series siguen el patrón `<variable>-observed-<id>`, `<variable>-<fuente>` y `<variable>-<fuente>-p10-p90` (para `seriesOverrides`), y los ejes son `'precipitation'`, `'discharge'`, `'volume'` y `'level'` (para `yAxisOverrides`).

### Precipitación: `ASPrecipitationChart`

Precipitación observada (telemetría, precipitación areal...) y prevista (WRF, ECMWF...) en el eje izquierdo, y el **acumulado** de cada serie que lo pida en el derecho (mm). Por defecto, el tooltip solo da la fecha y los valores van en la leyenda, con los acumulados en su propia línea.

```vue
<ASPrecipitationChart
  v-model:show-cumulative="verAcumulados"
  toolbar
  :series="[
    { id: 'tr', name: 'P. TR', values: telemetria, input: 'intensity', intervalMinutes: 10, cumulative: true },
    { id: 'areal', name: 'P. Areal', values: areal },
    { id: 'wrf', name: 'WRF', kind: 'forecast', values: wrf, cumulative: { name: 'Acumulat', style: { color: '#14b554' } } },
  ]"
/>
```

**mm o mm/h: `input` y `rate`.** Cada serie dice cómo llegan sus valores y la gráfica qué muestra; la librería convierte en los dos sentidos:

| `input` de la serie | `rate` de la gráfica       | Qué se hace                                              |
| ------------------- | -------------------------- | -------------------------------------------------------- |
| `'depth'` (defecto) | `'intensity'` (defecto)    | mm del intervalo ÷ horas del intervalo → mm/h            |
| `'intensity'`       | `'depth'`                  | mm/h × horas del intervalo → mm                          |
| igual               | igual                      | se ordena y los negativos pasan a 0                      |

- `'depth'` son los mm caídos en el intervalo que **termina** en cada instante (lo habitual en SAIH y en las salidas de los modelos).
- La duración del intervalo es la distancia al punto anterior; el primer punto usa el intervalo típico de la serie (la mediana), así que no hay una caída falsa a 0 al principio. Con huecos, fija la duración con `intervalMinutes`.
- El acumulado se calcula siempre en mm, aunque la serie llegue en mm/h.
- Las conversiones se exportan como funciones puras: `toIntensity`, `toDepth`, `convertPrecipitation`, `toCumulative`, `cumulativeAt`, `intervalHours` y `sortByTime`.

**Acumulados** (`cumulative: true` o `PrecipitationCumulative`): uno por serie, del color de su serie (o el de su `style`), en el eje derecho.

- **La previsión continúa el observado**: arranca donde acaba el acumulado del primer observado que lo tenga, enlazada con su último punto (el total del episodio en una sola curva). `continueFrom: '<id>'` elige otra serie y `continueFrom: false` empieza en 0.
- `from` empieza a sumar en un instante; `name` y `style` los personalizan.
- Con `toolbar`, un botón muestra u oculta todos (`v-model:show-cumulative`); cada uno también se oculta desde la leyenda.

**Dibujo por defecto**: una serie observada, en línea continua; una prevista, en área discontinua con **degradado** (`gradient`), que se cambian con `display` (`'line'`, `'area'`, `'bar'`), `style` y `gradient`. Umbrales de intensidad o de acumulado con `thresholds` (`axis: 'rate' | 'cumulative'`).

**Selector de modelo** (como en los visores con WRF y ECMWF): un `select` propio de la barra; la gráfica no pide datos, el proyecto cambia la serie al recibir `toolbar-change`:

```vue
<ASPrecipitationChart
  :series="series"
  :toolbar="{ items: [{ type: 'select', id: 'modelo', label: 'Modelo', value: modelo, showCount: true,
    options: [{ value: 'WRF', label: 'WRF (3 días)' }, { value: 'ECMWF', label: 'ECMWF (7 días)' }] }] }"
  @toolbar-change="({ value }) => (modelo = value)"
/>
```

### Props, eventos y métodos

Las dos gráficas comparten nombres, tipos y valores por defecto: `ASHydrographChart` es una configuración de `ASChart`, y todo lo que no es propio del hidrograma se le pasa tal cual.

| Prop                         | `ASChart`                     | `ASHydrographChart`        | Para qué                                                    |
| ---------------------------- | ----------------------------- | -------------------------- | ----------------------------------------------------------- |
| `chart-library`              | `'echarts'`                   | `'echarts'`                | Motor: `'echarts'`, `'chartjs'` o `'apexcharts'`            |
| `series` / `discharge`, `precipitation` | obligatoria        | `discharge` obligatoria    | Datos                                                       |
| `x-axis`                     | `{ type: 'time' }`            | siempre temporal           | Título, formato de fechas y límites del eje X               |
| `y-axes` / `extra-y-axes`    | un eje automático             | los del hidrograma         | De 1 a 4 ejes Y                                             |
| `annotations`                | —                             | —                          | Umbrales e intervalos (en el hidrograma, además de `thresholds`) |
| `now`                        | `false`                       | **`true`**                 | Línea "Ahora" (`true` = la hora actual, o una fecha)        |
| `current-time`               | —                             | —                          | Línea del instante seleccionado (`v-model:current-time`)    |
| `sync-group`                 | —                             | —                          | Comparte cursor, tooltip y zoom con otras gráficas          |
| `tooltip`                    | `true`                        | `true`                     | Tooltip: `true` (fecha y valores), `'time'` (solo la fecha), `false` o `{ mode: 'shared' \| 'item', content: 'values' \| 'time' }` |
| `legend`, `legend-values`    | automática, `false`           | automática, `false`        | Leyenda y valores bajo el cursor                            |
| `zoom`                       | `false`                       | `false`                    | Zoom horizontal (y barra en ECharts)                        |
| `toolbar`, `file-name`       | solo "Restablecer zoom" con zoom, `'grafica'` | igual      | descargas, pantalla completa, elementos propios y, en el hidrograma, sus acciones |
| `patterns`                   | `false`                       | `false`                    | Tramas para daltonismo                                      |
| `aria-label`, `description`  | generadas                     | generadas                  | Nombre y descripción accesibles                             |
| `data-table`                 | `true`                        | `true`                     | Tabla oculta para lectores de pantalla                      |
| `height`                     | `320`                         | **`420`** (dos paneles)    | Alto en px o CSS                                            |
| `animation`, `loading`, `empty-text`, `error`, `theme`, `native-options` | iguales | iguales | Estados, tema y vía de escape al motor               |

**Eventos** (los mismos en las dos): `point-click` `{ seriesId, x, y }`, `x-click` `{ x }`, `time-select` `{ time }`, `update:current-time`, `range-change` `{ start, end }` y `ready` `{ library, instance }`.

**Métodos** (con `ref`, tipo `ChartExposed`, los mismos en las dos): `exportImage(format?)`, `exportData(options?)`, `download(format)`, `toggleFullscreen()`, `resetZoom()`, `getInstance()` y `refresh()`.

### Rendimiento

Probado con **5 series de 100 000 puntos** ([resultados completos](docs/rendimiento-graficas.md), `npm run perf:charts`):

| 5 × 100 000 puntos       | ECharts | Chart.js | ApexCharts |
| ------------------------ | ------: | -------: | ---------: |
| Montar y primer dibujo   |  0,9 s  |   0,9 s  |     1,7 s  |
| Mover el cursor (paso)   |  33 ms  |   33 ms  |    542 ms  |
| Exportar CSV (5 MB)      |  1,1 s  |   1,4 s  |     1,4 s  |

Para series grandes, usa ECharts (el motor por defecto) o Chart.js, y pasa los datos en un `shallowRef`: con `ref`, montar tarda el doble.

### Barra de herramientas

Con `toolbar`, la gráfica muestra a la derecha, como iconos con su nombre accesible y tooltip:
- "Restablecer zoom" (si hay `zoom`);
- un menú "Descargar" con PNG, SVG y CSV;
- pantalla completa.

Un objeto elige cuáles: `:toolbar="{ svg: false, fullscreen: false }"`. Con `downloadMenu: false`, las descargas son un botón por formato. Los archivos se llaman como diga `file-name` (por defecto, `grafica`).

**Elementos propios** (`toolbar.items`), a la izquierda, para lo que cada visor necesite. Son controlados: la barra emite `toolbar-action` y `toolbar-change`, y el proyecto actualiza su estado y los items.

| `type`   | Qué es                                                                 | Evento                                   |
| -------- | ---------------------------------------------------------------------- | ---------------------------------------- |
| `button` | Botón (solo icono si lleva `icon`); con `pressed`, interruptor          | `toolbar-action` `{ id }`                |
| `select` | Menú de casillas (`multiple`, con `selectAll` y `showCount`) o de radios | `toolbar-change` `{ id, value }`         |
| `menu`   | Menú de acciones; las opciones con `pressed` se ven marcadas            | `toolbar-action` `{ id, itemId }`        |
| `chip`   | Etiqueta (p. ej. la fecha de la simulación), `tone: 'primary'` la destaca | —                                      |
| `info`   | Datos destacados: pares etiqueta / valor con unidad, con el formato del idioma | —                                 |

Todo elemento admite `disabled` y `disabledReason` (el tooltip que explica por qué). Para lo que no encaje, los slots `#toolbar-start` y `#toolbar-end`.

```vue
<ASHydrographChart
  :discharge="caudal"
  :toolbar="{
    items: [
      { type: 'chip', id: 'simulacion', label: '20 oct, 06:00', tone: 'primary' },
      { type: 'select', id: 'lluvia', label: 'Lluvia', icon: mdiCloudOutline, value: lluvia, showCount: true,
        options: [{ value: 'harmonie', label: 'Harmonie' }, { value: 'eps', label: 'EPS' }] },
    ],
  }"
  @toolbar-change="({ id, value }) => id === 'lluvia' && (lluvia = value)"
/>
```

**Acciones propias del hidrograma.** Con `toolbar`, `ASHydrographChart` añade tres, que solo aparecen si tienen sentido con los datos y se desactivan una a una (`focusThreshold`, `forecastSelector` y `bandsToggle`, a `false`):
- **Enfocar umbral**: cada pulsación deja solo un umbral, de menor a mayor, y el eje se ajusta a los datos y a ese umbral. Tras el último, vuelve a todos (evento `threshold-focus`).
- **Previsiones**: casillas para elegir las fuentes que se ven, en los dos paneles (`v-model:visible-forecasts`). Ocultar una no cambia el color de las demás.
- **Percentiles**: muestra u oculta las bandas (`v-model:bands`).

Funcionan sin escribir nada; con `v-model`, el proyecto conoce y controla su estado. El ejemplo completo está en el playground, en "ASHydrographChart: barra a medida".

### Exportar

Las descargas de la barra también se pueden hacer desde fuera, con una `ref` (tipo `ChartExposed`). Sirve igual para `ASChart` y para `ASHydrographChart`:

```ts
const chart = ref<ChartExposed>()
const png = await chart.value!.exportImage() // data URL; también 'svg'
const csv = chart.value!.exportData() // texto CSV
await chart.value!.download('csv') // descarga el archivo
await chart.value!.toggleFullscreen()
```

- Las imágenes llevan la leyenda encima y respetan las series ocultas desde ella. El SVG es vectorial en ECharts y ApexCharts. Chart.js solo dibuja en canvas, así que su SVG contiene la imagen de cada panel.
- El CSV trae todas las series: una columna por serie, o dos en las bandas (inferior y superior), con la unidad en la cabecera. Usa los separadores del idioma, para que Excel lo abra con doble clic: en español, `;` entre columnas y coma decimal.
  - Las fechas van en hora local, como `2026-10-18 06:00`.
  - Al descargarlo se añade el BOM UTF-8, para que Excel no estropee las tildes ni `m³/s`.
  - Un texto que empiece por `=`, `+`, `-` o `@` se escapa, para que Excel no lo ejecute como fórmula.
  - `exportData({ separator, decimalSeparator })` cambia los separadores.

### Accesibilidad

Sin configurar nada:

- **Nombre y descripción generados**. El nombre recoge el tipo y las series: "Gráfica de líneas y barras: Caudal, Lluvia". La descripción da el rango del eje X, el mínimo y el máximo de cada serie (con el instante del máximo) y los umbrales con nombre. `aria-label` y `description` los sustituyen.
- **Teclado**. El área de datos recibe el foco con Tab:
  - Las flechas ← → recorren los valores, Re Pág / Av Pág saltan de 10 en 10 e Inicio / Fin van al primero y al último.
  - Intro elige ese instante (emite `time-select`, como un clic) y Esc quita el cursor.
  - Cada paso se anuncia al lector de pantalla ("18/10/2026, 06:00: Caudal 69,2 m³/s, Lluvia 0,8 mm") y mueve también el cursor de las gráficas de su `sync-group`.
- **Tabla de datos alternativa**: oculta a la vista, pero accesible a los lectores de pantalla. Con más de 500 filas se recorta (el CSV las lleva todas). Se desactiva con `:data-table="false"`.
- **Grupos en la leyenda** (`legendGroup` en cada serie): las series de un grupo van en su propia línea, con el nombre del grupo como título; las que no tienen grupo, primero. `legendLabel` es el texto en la leyenda si debe ser más corto que `name` (el nombre completo se sigue anunciando y sale en el tooltip y el CSV).
- **Áreas con degradado** (`gradient` en una serie `area`): de la opacidad `from` junto a la línea a `to` en la base (por defecto 0,5 → 0,05), igual en los tres motores; con `patterns`, manda la trama.
- **Tooltip con solo la fecha** (`tooltip="time"`): útil con `legend-values`, que ya muestra los valores en la leyenda.
- **Tramas para daltonismo** (`patterns`, opcional): cada relleno (barras, áreas y bandas) lleva una trama distinta además del color, y la misma trama aparece en la leyenda y en las imágenes exportadas. Las líneas se distinguen por la leyenda y por `lineStyle` (`'solid'`, `'dashed'`, `'dotted'` o `'dashdot'`). Con barras muy estrechas (p. ej. lluvia horaria de varios días) la trama apenas se ve: ahí ayuda más el zoom.

El contraste se comprueba en los dos temas: las tramas, contra su relleno (`patterns.spec.ts`), y los textos de la barra, contra la superficie y el fondo de los botones al pasar el ratón (`tokens.spec.ts`).

### Enlazar gráficas, mapa y controles de tiempo

Las gráficas temporales se integran con el resto de la librería con tres piezas:

- **`current-time`**: dibuja una línea vertical en ese instante. Al hacer clic en la gráfica se emite **`time-select`** (`{ time: Date }`) y `update:current-time`, así que admite `v-model:current-time`.
- **`sync-group`**: las gráficas con el mismo nombre de grupo comparten cursor, tooltip y zoom, aunque usen motores distintos. Vale para varias `ASChart` o `ASHydrographChart` sueltas en un panel.
- **`nearestTimeIndex(timeline, time)`** (en el paquete raíz): convierte una fecha en el índice del instante más cercano. `ASMapTimeControls` trabaja con índices y las gráficas con fechas.

El patrón completo: al seleccionar una feature del mapa se muestra su serie, y la gráfica y el slider de tiempo van a la par.

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { nearestTimeIndex } from '@vsadtajo/adasa-ui'
import { ASMap, ASMapTimeControls, type FeatureSelectedEvent } from '@vsadtajo/adasa-ui/map'
import { ASChart } from '@vsadtajo/adasa-ui/charts'

const timeline: Date[] = /* instantes de la capa temporal */ []
const index = ref(0)
const playing = ref(false)
const selected = ref<FeatureSelectedEvent | null>(null)
const currentTime = computed(() => timeline[index.value])

/** Clic en la gráfica: mover el slider al instante más cercano. */
const onTimeSelect = ({ time }: { time: Date }) => (index.value = nearestTimeIndex(timeline, time))
</script>

<template>
  <ASMap :layers="layers" @feature-selected="selected = $event">
    <ASMapTimeControls
      :timeline="timeline"
      v-model:current-time-index="index"
      v-model:is-playing="playing"
    />
  </ASMap>

  <template v-if="selected">
    <ASChart
      :series="[{ id: 'q', name: 'Caudal', type: 'line', data: caudalDe(selected) }]"
      :current-time="currentTime"
      sync-group="estacion"
      @time-select="onTimeSelect"
    />
    <ASChart
      :series="[{ id: 'p', name: 'Precipitación', type: 'bar', data: lluviaDe(selected) }]"
      :current-time="currentTime"
      sync-group="estacion"
      @time-select="onTimeSelect"
    />
  </template>
</template>
```

Para verlo funcionando, abre el compositor del playground (`#composer`). Activa la capa GeoJSON de ejemplo, coloca unos "Controles de tiempo" y pulsa una feature.

> ⚠️ **ApexCharts** (v4 en adelante) tiene licencia dual. Es gratis solo para organizaciones de menos de 2 M$, y su licencia comercial estándar no permite redistribuirlo dentro de otro producto. Un proyecto que use `chart-library="apexcharts"` necesita su propia licencia. ECharts (Apache-2.0) y Chart.js (MIT) no tienen restricciones. Decisión, arquitectura y diferencias entre motores: [ADR 0001](docs/adr/0001-motores-graficas.md).

## Layout (`@vsadtajo/adasa-ui/layout`)

**`ASAppShell`** da la estructura de los visores de mapa: el contenido principal (el mapa) ocupa todo, con una **barra corporativa** arriba, una **barra de iconos** a la izquierda que abre el **panel de cada sección**, y un **panel de detalle** que entra por la derecha. Abre y cierra igual que los visores SAIH:

- **Panel de sección** (escritorio): junto a la barra de iconos, de 320 px, y **empuja** el mapa (no lo tapa; `ASMap` se reajusta solo). Pulsar la sección abierta lo cierra; pulsar otra lo cierra y lo **vuelve a abrir con la nueva a los 280 ms** (`switch-delay`).
- **Detalle**: entra por la derecha y tapa el mapa **desde el borde de los menús**; si el panel de sección se abre o se cierra, se ajusta sin cerrarse. Siempre tiene botón de cerrar (`detail-close-button`), y por ahora su contenido es un slot vacío.
- **Móvil** (por debajo de `breakpoint`, 960 px, medido sobre el propio layout y no sobre la ventana):
  - la barra va abajo, al alcance del pulgar, respetando la zona segura del iPhone;
  - su botón ☰ despliega las secciones encima de ella;
  - cada sección sube desde abajo, al 60 % de alto, con un asa para ampliarla a pantalla completa;
  - el detalle ocupa toda la pantalla;
  - el buscador se abre con un botón de la barra.
- **Teclado**: Escape cierra lo que esté encima (menú o buscador, luego el detalle y por último el panel). Los paneles cerrados son inertes.

```vue
<ASAppShell :sections="secciones" v-model:active-section="seccion" v-model:detail-open="detalle">
  <template #brand><ASAppBrand :logos="logos" title="Visor" /></template>
  <template #search>
    <ASAppSearch :fetch-suggestions="buscar" @select="abrirFicha" @suggestion-action="centrar" />
  </template>
  <template #actions><ASAppUserMenu :user="usuario" @logout="cerrarSesion" /></template>

  <template #section="{ section, close, mobile }">
    <ASAppPanelHeader :title="section.label" :direction="mobile ? 'down' : 'left'" @close="close" />
    <PanelCapas v-if="section.id === 'capas'" />
    <PanelMapasBase v-else-if="section.id === 'mapasbase'" />
  </template>

  <template #detail><!-- ficha de estación, gráficas... --></template>

  <ASMap :layers="capas" @feature-selected="detalle = true" />
</ASAppShell>
```

Las secciones las decide cada proyecto (`AppSection[]`): cuántas, en qué orden y si van arriba o abajo de la barra (`position`). Cada una puede llevar un contador (`badge`), estar oculta (`hidden`) o deshabilitada con su motivo (`disabled`, `disabledReason`), y un tooltip propio (`tooltip`). El icono es cualquier [`IconValue`](#iconos):

```ts
import { mdiLayers } from '@mdi/js'
import { Map } from 'lucide-vue-next'

const secciones = computed<AppSection[]>(() => [
  { id: 'capas', label: 'Capas', icon: mdiLayers },
  { id: 'avisos', label: 'Avisos', icon: 'mdi:alert', badge: avisosActivos.value },
  {
    id: 'simulaciones',
    label: 'Simulaciones',
    icon: 'tabler:chart-dots',
    disabled: !esAdmin,
    disabledReason: 'Solo para administradores',
  },
  { id: 'mapasbase', label: 'Mapas base', icon: Map, position: 'bottom' },
])
```

Una sección deshabilitada sigue enfocable (con `aria-disabled`) y anuncia el motivo, pero no se abre. El contador forma parte de su nombre accesible ("Avisos (3)").

**Enlazarlo con la URL** (como en los visores SAIH): la sección va en la ruta y el detalle en un parámetro. Al cambiar de sección se conserva la query, para que no se cierre el detalle.

```ts
const route = useRoute()
const router = useRouter()
const seccion = computed({
  get: () => (route.path === '/' ? null : route.path.slice(1)),
  set: (id) => router.push({ path: id ? `/${id}` : '/', query: route.query }),
})
const detalle = computed({
  get: () => Boolean(route.query.station),
  set: (abierto) => {
    if (abierto) return
    const { station: _station, ...query } = route.query
    router.replace({ query })
  },
})
```

### Piezas

`ASAppShell` coordina piezas que también son componentes públicos, cada una con su entrada en el playground. Las equivalencias con el `MainLayout.vue` de los visores SAIH:

| Pieza | En los visores SAIH | Qué hace |
| --- | --- | --- |
| `ASAppTopBar` | `TopBar.vue` | Marco de la barra, con los slots `brand`, `search` y `actions` |
| `ASAppBrand` | logos de `TopBar.vue` | Logos (`{ src, alt, href?, hideOnMobile? }`), nombre y subtítulo; dentro del shell en móvil se reduce sola |
| `ASAppSearch` | autocompletado de `TopBar.vue` | `ASSearchInput` en forma de píldora, con etiquetas, acciones ("Centrar en el mapa") y avisos de no disponible por sugerencia |
| `ASAppUserMenu` | `UserMenu.vue` | Avatar con nombre y correo, tema oscuro, idioma, opciones propias y "Cerrar sesión" (solo emite `logout`) |
| `ASAppRail` | `DesktopRail.vue` | Barra de iconos de sección |
| `ASAppDrawer` | `SecondaryDrawer.vue` | Panel de sección que empuja el contenido |
| `ASAppDetailPanel` | `RightNavigation.vue` | Panel de detalle por la derecha, desde `offset` |
| `ASAppBottomSheet` | `MobileBottomDrawer.vue` | Panel móvil que sube desde abajo, con asa para ampliarlo |
| `ASAppMobileMenu` | menú móvil de `TopBar.vue` | Secciones encima de la barra móvil |
| `ASAppPanelHeader` | — | Cabecera de un panel de sección |

`ASAppUserMenu` cambia el tema y el idioma de `provideTheme` y `provideLocale`. Con `v-model:theme` y `v-model:locale`, los controla el proyecto (p. ej. para guardarlos). Las piezas de la barra saben si el shell está en móvil con `useAppShellContext()`.

Si un proyecto necesita otra estructura, las mismas piezas se montan a mano: el ejemplo "Layout montado pieza a pieza" de la entrada `ASAppShell` del playground reproduce el `MainLayout.vue` de TAJO. Lo habitual, de todas formas, es usar `ASAppShell`, que ya coordina la reapertura al cambiar de sección, Escape y el móvil.

**Color corporativo de cada proyecto**: la barra y la barra de iconos usan `--as-app-chrome` (por defecto, el azul marino `#1d283a` de los visores SAIH) y los paneles, `--as-app-panel-*`. Cada proyecto pone el suyo:

```css
:root {
  --as-app-chrome: #00594f; /* el color de la marca */
}
```

Los textos e iconos de la barra tienen que seguir contrastando con el color nuevo: el test de `tokens.css` comprueba los valores por defecto.

## Formularios (`@vsadtajo/adasa-ui/forms`)

Primitivas de formulario sin framework de UI, todas **controladas** (`v-model`) y accesibles: etiqueta asociada, ayuda y error en `aria-describedby`, `aria-invalid`, foco visible y manejo completo con teclado. Toman los colores de los tokens, así que siguen el tema y la marca del proyecto.

```vue
<script setup lang="ts">
import { mdiFilter } from '@mdi/js'
import { ASButton, ASInput, ASSelect, ASCheckbox } from '@vsadtajo/adasa-ui/forms'
</script>

<template>
  <form @submit.prevent="aplicar">
    <ASSelect v-model="cuenca" label="Cuenca" :options="cuencas" searchable required :error="errores.cuenca" />
    <ASSelect v-model="estaciones" label="Estaciones" :options="porRio" multiple searchable clearable />
    <ASInput v-model="umbral" type="number" label="Umbral" unit="m³/s" :min="0" :step="10" />
    <ASCheckbox v-model="soloAvisos" label="Solo estaciones con aviso activo" />
    <ASButton type="submit" variant="primary" :icon="mdiFilter">Aplicar filtro</ASButton>
  </form>
</template>
```

- **Props comunes de los campos**: `label`, `hint`, `error` (texto, o `true` para marcarlo sin mensaje), `required`, `disabled`, `size` (`sm`/`md`/`lg`: 28, 36 y 44 px, tokens `--as-control-height-*`), `id` (si no, se genera) y `theme`.
- **`ASInput` con `type="number"`** emite `number | null`, admite coma o punto decimal al escribir (no depende del idioma del navegador) y muestra el valor con el separador del idioma activo. ↑/↓ suman o restan `step` dentro de `min`/`max`.
- **`ASSelect`** sigue el patrón combobox de WAI-ARIA:
  - opciones sueltas o en grupos (`{ label, options }`);
  - `multiple` con chips (`max-chips` resume el resto en "+N");
  - `searchable` sin mayúsculas ni tildes, o con `filter` propio, y el evento `search` para pedir opciones al servidor;
  - teclado: ↑/↓, Inicio/Fin, RePág/AvPág, Intro, Escape (no cierra el panel que lo contiene), Tab y Retroceso. Sin búsqueda, escribir salta a la opción que empieza por esas letras.
- **`ASDatePicker`** se escribe con el formato corto del idioma (`dd/mm/aaaa`, o `dd/mm/aaaa hh:mm` con `with-time`) o se elige en un calendario (patrón "date picker dialog" de WAI-ARIA):
  - en la rejilla: flechas, Inicio/Fin, RePág/AvPág (con Mayús, año), Intro y Escape;
  - `min`/`max` deshabilitan los días de fuera;
  - lo escrito que no es fecha, o queda fuera de rango, no se emite y se marca como error.
- **`ASDateRangePicker`** emite `{ start, end }`:
  - periodos predefinidos que se aplican al pulsarlos (`presets`: `'today'`, `'last24h'`, `'last7d'`, `'last30d'`, `'hydroYear'` o propios `{ id, label, range: (now) => ({ start, end }) }`);
  - o inicio y fin en el calendario, con "Aplicar";
  - el año hidrológico empieza el 1 de octubre (`hydrologicalYearStart`);
  - sin hora, el periodo va de las 00:00 del primer día al final del último.
- **`ASSearchInput`** pide sugerencias a `fetchSuggestions(query, signal)`, la función que aporta el proyecto:
  - tras `debounce` ms y con `minChars` caracteres;
  - aborta la petición anterior con la `signal`, y una respuesta tardía nunca pisa a la nueva;
  - agrupa por `group`, resalta lo buscado y anuncia "Buscando…" y el número de resultados;
  - Intro sin sugerencia activa emite `submit` (búsqueda libre, p. ej. de direcciones);
  - cada sugerencia puede traer `tags` (texto y color; el texto se pone blanco u oscuro según el fondo), `actions` (botones de icono que emiten `suggestion-action`; Mayús + Intro ejecuta la primera) y `unavailable` con su motivo. Para un diseño libre, el slot `#suggestion`;
  - `hide-label` oculta la etiqueta a la vista sin quitarla como nombre accesible.

  ```ts
  const buscar: FetchSuggestions = async (q, signal) =>
    (await (await fetch(`/api/buscar?q=${encodeURIComponent(q)}`, { signal })).json()).map((r) => ({
      id: r.codigo, label: r.nombre, description: r.tipo, group: r.grupo, data: r,
    }))
  ```
- **`ASSlider`** es un `<input type="range">` nativo: `format` da el texto del valor, a la vista y en `aria-valuetext`; emite `update:modelValue` al moverlo y `change` al soltarlo.
- **Tema**: sin prop `theme` ni `provideTheme`, no fuerzan ninguno y heredan el del contenedor (un formulario en un panel oscuro se ve oscuro).
- **Controles propios**: `ASFormField` da a cualquier control la misma etiqueta, ayuda y error, y le pasa por el slot el `id` y el `aria-describedby`.

### Paneles de capas: `ASCollapsible` + `ASTreeList`

Para los paneles laterales (una sección de `ASAppShell`, un `ASAppDrawer`) o cualquier lista jerárquica con selección. Es lo que en TAJO hace `ItemsLayersGroup`, pero sin stores:

```vue
<ASCollapsible title="Estaciones" :badge="visibles.length">
  <ASTreeList
    v-model="visibles"
    v-model:opacities="opacidades"
    :items="estaciones"
    label="Capas de estaciones"
    @node-action="onAccion"
  />
</ASCollapsible>
```

```ts
const estaciones: TreeNode[] = [
  {
    id: 'saih',
    label: 'Estaciones SAIH',
    children: [
      { id: 'AR', label: 'Aforo en río', swatch: '#2a78d6', badge: 42, opacity: true },
      { id: 'E', label: 'Embalses', icon: mdiWater, opacity: true },
      { id: 'piezo', label: 'Piezómetros', disabled: true, disabledReason: 'Sin datos' },
    ],
  },
  { id: 'eventos', label: 'Eventos pasados', children: [], emptyText: 'No hay eventos guardados' },
]
```

- **`v-model`** son los ids de las **hojas** seleccionadas; el estado de cada grupo (marcado, desmarcado o a medias) sale de ellas. `v-model:expanded` y `v-model:opacities` (de 0 a 1) son opcionales.
- **`selection`**: `'multiple'` (casillas; la de un grupo marca o desmarca sus hojas seleccionables), `'single'` (una hoja a la vez; pulsarla otra vez la quita, salvo `:deselectable="false"`) o `'none'` (solo lista: `node-click`).
- **Cada `TreeNode`** puede llevar `description`, `icon`, `swatch` (muestra de color), `badge`, `disabled` con `disabledReason`, `loading` (indicador en lugar de la casilla), `opacity` (slider bajo la hoja seleccionada) y `actions` (botones que emiten `node-action`). El evento `expand` sirve para cargar los hijos de un grupo al desplegarlo.
- **Teclado** (patrón *tree* de WAI-ARIA): ↑/↓ entre filas, → despliega o entra, ← pliega o sube al grupo, Inicio/Fin, Espacio selecciona e Intro despliega. Tab pasa al slider y los botones de la fila enfocada.
- **La lógica del proyecto** (stores, capas excluyentes entre grupos) va en el `get`/`set` de un `computed` que se pasa como `v-model`. Para calcular lo mismo fuera del componente, `leafIds`, `checkState`, `toggleNode`, `findNode` e `isGroup` se exportan.
- `ASCollapsible` sigue el patrón *disclosure* (botón con `aria-expanded` dentro de un encabezado `headingLevel`); cerrada, el contenido sigue montado pero inerte. Slot `#actions` para botones en la cabecera.

**Iconos.** Las props de icono aceptan cualquier [`IconValue`](#iconos). Para logos o SVG multicolor, los componentes tienen slots (`#icon`, `#prefix`, `#suffix`).

## Iconos

La librería no depende de ninguna librería de iconos: el proyecto elige la suya. Todas las props de icono (`icon`, `prefixIcon`, `AppSection.icon`, `SelectOption.icon`...) aceptan un `IconValue`, que puede ser:

- **Un trazado SVG** de 24 × 24 (`@mdi/js`). Funciona sin configurar nada, y el bundle solo lleva los iconos que se importan: `:icon="mdiLayers"`.
- **Un componente** de cualquier librería (Lucide, Font Awesome, Heroicons...), que recibe `width` y `height`: `:icon="Map"`. Si necesita props, se pasa como `{ component, props }`.
- **Un nombre** (`icon="mdi:layers"`), que traduce el resolvedor registrado con `provideIcons` en la raíz de la app:

```ts
// App.vue
import { Icon } from '@iconify/vue'
import { provideIcons } from '@vsadtajo/adasa-ui'

provideIcons((name) => {
  if (name.startsWith('mdi-')) return { class: `mdi ${name}` } // fuente @mdi/font (como en Vuetify)
  if (name.includes(':')) return { component: Icon, props: { icon: name } } // Iconify: 'mdi:…', 'tabler:…'
})
```

El resolvedor devuelve `{ path }`, `{ component, props? }` o `{ class }`. Si no conoce un nombre, `ASIcon` deja un hueco del mismo tamaño y avisa una vez en consola. Para pintar un icono suelto: `<ASIcon icon="tabler:map" :size="20" label="Mapa" />` (sin `label`, es decorativo).

En el playground, la entrada **ASIcon** muestra la misma barra con `@mdi/js`, Lucide, Iconify y `@mdi/font`, y los ejemplos de `provideIcons` para cada caso.

## Detalle (`@vsadtajo/adasa-ui/detail`)

Piezas para la ficha de una estación, a partir del panel de estación de TAJO. Las tarjetas **no leen la API de ningún proyecto**: reciben las series y los umbrales ya preparados, y cada proyecto escribe un adaptador pequeño de su API a estos tipos.

```ts
import type { AlertThresholds, MeasureSeries } from '@vsadtajo/adasa-ui/detail'

const observado: MeasureSeries = {
  id: 'observado',
  label: 'Observado',
  unit: 'm³/s',
  data: api.historico.results.map((r) => [new Date(r.date), Number(r.value)]),
}
const umbrales: AlertThresholds = { amarillo: 90, naranja: 130, rojo: 180 }
```

```vue
<ASDetailHeader :title="estacion.codigo" :subtitle="estacion.nombre" :tags="etiquetas" @close="cerrar" />
<ASAlertStatus :series="[observado]" :thresholds="umbrales" />
<ASAlertStatus :series="[harmonie, eps]" :thresholds="umbrales" mode="max" />
<ASObservedSummary :series="[entrada, salida, volumen]" :thresholds="umbrales" v-model:active="vista" />
<ASThresholdSummary :series="[harmonie, eps]" :thresholds="umbrales" mode="forecast" />
<ASThresholdLegend :thresholds="umbrales" unit="m³/s" v-model:selected="umbral" />
<ASValueMatrix :series="[observado, harmonie, eps]" :thresholds="umbrales" v-model:aggregate="agregado" />
```

- **Niveles**: un valor está en el nivel más alto cuyo umbral alcanza, con el umbral incluido (`alertLevelOf`). Con varias series, manda la más grave. Una serie puede traer sus propios umbrales (p. ej. el volumen de un embalse), que mandan sobre los del componente.
- **Funciones puras** que también usan las tarjetas:
  - `summarizeSeries`: último valor, máximo y mínimo;
  - `exceedanceSegments`: tramos seguidos en un mismo nivel;
  - `aggregateByInterval`: mínimo, media y máximo por intervalo (si el intervalo divide el día, desde las 00:00 locales).
- **Colores de aviso** de los tokens `--as-alert-*`, siempre con texto: el nivel nunca depende solo del color.
- **Matriz**:
  - cada celda anuncia su nivel a los lectores de pantalla;
  - debajo, una leyenda con los umbrales;
  - la zona de la tabla se enfoca para desplazarla con el teclado.
- **Enlace con el hidrograma**: `ASThresholdLegend` emite el umbral resaltado; el proyecto se lo pasa a `ASHydrographChart` (en el playground, la "Ficha de estación de ejemplo").

## Estructura

```
src/
├── index.ts          # Entry raíz: reexporta core
├── core/             # Tema, tokens (styles/tokens.css) y utilidades comunes. No depende de ningún dominio
├── map/              # Entry /map: components/, composables/, layers/, legend/, types/, utils/
├── charts/  layout/  forms/  detail/   # Entries /charts, /layout, /forms y /detail, con la misma forma interna
└── playground/       # App interactiva: galería de componentes + compositor de widgets sobre un mapa
    ├── registry.ts              # Registro único de componentes (galería + compositor)
    └── utils/widgetRegistry.ts  # Lista del compositor, derivada de registry.ts
scripts/check-entries.mjs        # Guardarraíl: cada entry solo alcanza sus dominios y paquetes permitidos
```

Cada dominio solo puede importar de los dominios que le permite el ADR (p. ej. `core` de ninguno, `map` de `core` y `forms`). ESLint lo comprueba en el código fuente y `npm run check:entries`, en el build.

## Uso

Requiere autenticación contra GitHub Packages (ver [Publicación](#publicación-y-versionado) más abajo). Una vez configurado el `.npmrc` del proyecto consumidor:

```bash
npm install @vsadtajo/adasa-ui
```

```ts
// main.ts
import '@vsadtajo/adasa-ui/style.css' // tokens de tema y estilos de los componentes
```

```vue
<script setup lang="ts">
import { provideTheme } from '@vsadtajo/adasa-ui'
import { ASMap, ASMapTimeControls } from '@vsadtajo/adasa-ui/map'
import { ref } from 'vue'

provideTheme('auto')

const timeline = [/* ... Date[] ... */]
const index = ref(0)
const playing = ref(false)
</script>

<template>
  <ASMap map-library="leaflet" :center="[40.4168, -3.7038]" :zoom="6">
    <ASMapTimeControls
      :timeline="timeline"
      v-model:current-time-index="index"
      v-model:is-playing="playing"
    />
  </ASMap>
</template>
```

## Sistema de temas

Todos los componentes se estilizan con variables CSS (`--as-*`) definidas en [`src/core/styles/tokens.css`](src/core/styles/tokens.css), con valores de respaldo inline en cada componente, así que funcionan aunque no importes el CSS. La página **Tokens de diseño** del playground (`npm run dev` → `#tokens`) los muestra todos en ambos temas, con su contraste.

| Grupo | Tokens |
| --- | --- |
| Interfaz | `--as-color-{primary,surface,surface-muted,text,text-muted,border,danger}` |
| Tipografía | `--as-font-family`, `--as-font-family-mono`, `--as-font-size-{xs…3xl}`, `--as-font-weight-*`, `--as-line-height-*` |
| Espaciado y forma | `--as-space-{1…16}` (múltiplos de `--as-spacing-unit`), `--as-radius-{sm,md,lg,full}`, `--as-shadow-{sm,md,lg}` |
| Capas | `--as-z-{base,map-control,dropdown,sticky,drawer,modal,toast,tooltip}` |
| Overlays sobre el mapa | `--as-overlay-{bg,text,text-muted,surface-muted,border}`: paneles de los widgets `ASMap*` |
| Datos | `--as-data-cat-{1…8}` (series), `--as-data-seq-{100…700}` (magnitud), `--as-data-div-*` (polaridad), `--as-data-grid`, `--as-data-axis` |
| Avisos | `--as-alert-{normal,amarillo,naranja,rojo}` y sus variantes `-text` / `-strong` |

Todos los colores cumplen WCAG AA contra la superficie en claro y en oscuro (textos ≥ 4.5:1, marcas ≥ 3:1), y la paleta categórica está validada para daltonismo. Hay un test que lo comprueba.

Para personalizar, sobreescribe las variables en tu propio CSS:

```css
:root {
  --as-color-primary: #16a34a;
  --as-radius: 4px;
}
```

Para cambiar entre claro y oscuro, llama a `provideTheme` una vez en la raíz de tu app. Todos los widgets lo heredan:

```ts
import { provideTheme } from '@vsadtajo/adasa-ui'

const { setMode } = provideTheme('auto') // 'light' | 'dark' | 'auto' (sigue al sistema)
```

Las librerías que no entienden `var(--x)` (motores de gráficas, canvas) reciben los valores ya resueltos con `readTokens()`, o con `useTokens()` para que se actualicen al cambiar el tema:

```ts
import { useTokens } from '@vsadtajo/adasa-ui'

const container = ref<HTMLElement | null>(null)
const { tokens } = useTokens(container)
watch(tokens, (t) => t && chart.setOption({ color: t.data.categorical }))
```

Cada widget acepta además una prop `theme` (`'dark' | 'light'`) que tiene prioridad sobre el tema global. Si no hay `provideTheme` ni prop, se usa `'dark'`. Los que lo admiten aceptan también `accentColor`, para tintar el widget con un color puntual (p. ej. el resultado de tu propia escala de color).

## Idioma y formatos

Los textos de los componentes (incluidas las etiquetas para lectores de pantalla) y el formato de números, fechas y unidades siguen el idioma de `provideLocale`. Por defecto es español; también se incluye inglés:

```ts
import { provideLocale } from '@vsadtajo/adasa-ui'

const { setLocale } = provideLocale('es') // 'es' | 'en'
```

Para otro idioma (catalán, euskera, gallego...), defínelo al proveerlo. Las claves que no traduzcas se muestran en español:

```ts
import { ca } from 'date-fns/locale'

provideLocale('ca', {
  locales: { ca: { intl: 'ca-ES', dateFns: ca, messages: { 'legend.title': 'Llegenda' } } },
})
```

Los mismos formateadores están disponibles para tu propio código, ligados al idioma activo con `useLocale()` o como funciones puras:

```ts
import { formatUnit, formatDate, formatDuration, formatNumber } from '@vsadtajo/adasa-ui'

formatUnit(12.4, 'm³/s') // "12,4 m³/s"  (también 'mm', 'hm³', 'm', '%', '°C')
formatDate(fecha, 'datetime') // "18/10/2026, 06:00"  (presets, opciones de Intl o { pattern })
formatDuration(5_400_000) // "1 h 30 min"
formatNumber(12345.6) // "12.345,6"
```

## Scripts

| Script                     | Descripción                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `npm run dev`              | Playground interactivo en modo desarrollo (importa el código fuente).                                         |
| `npm run build`            | Type-check + build de la librería (ESM + CJS + `.d.ts`, un entry por dominio) en `dist/`. Corre con 4 GB de memoria para Node: juntar los `.d.ts` de los seis entries no cabe en los ~2 GB por defecto. |
| `npm run check:entries`    | Tras el build: comprueba que cada entry solo alcanza sus dominios y paquetes permitidos, e imprime su tamaño. |
| `npm run build:playground` | Build estático del playground en `dist-playground/`.                                                          |
| `npm run lint`             | ESLint sobre todo el proyecto.                                                                                |
| `npm run lint:fix`         | ESLint con auto-fix.                                                                                          |
| `npm run format`           | Formatea con Prettier.                                                                                        |
| `npm run type-check`       | Chequeo de tipos con `vue-tsc` (sin emitir), de la app (`tsconfig.app.json`) y de las configs (`tsconfig.node.json`). |
| `npm run test`             | Tests (Vitest + @vue/test-utils + jsdom), co-locados como `*.spec.ts`.                                        |
| `npm run test:watch`       | Tests en modo vigilancia.                                                                                     |
| `npm run test:coverage`    | Tests con informe de cobertura en `coverage/`. Falla si `src/charts` baja del 80 %.                          |
| `npm run perf:charts`      | Prueba de rendimiento de las gráficas en el navegador ([resultados](docs/rendimiento-graficas.md)).          |

## Playground

`npm run dev` levanta una app en `http://localhost:5173` con dos modos, conmutables desde la barra superior:

**Galería de componentes** (modo por defecto): todos los componentes y tipos de capa, agrupados por dominio (Mapa, Controles de mapa, Capas, Gráficas, Tablas, Detalle, Layout, Formularios), cada uno con:

- **Selector de componentes** agrupado por categoría (barra lateral).
- **Editor de props en vivo**: cambia valores y ve el widget actualizarse al instante.
- **Documentación inline**: tabla de props (tipo/default) y eventos emitidos.
- **Log de eventos**: observa en tiempo real los eventos que emite el widget.
- **Código copiable**: snippet de plantilla Vue generado a partir del estado actual del editor.
- **Vista previa adaptada al tipo de componente**: los widgets de mapa, en su escenario; el resto, en un lienzo neutro redimensionable (Móvil 375 px, Tableta 768 px, Escritorio 1280 px o arrastrando la esquina) que muestra el ancho real, para probar el responsive.
- **Selector global de tema** (claro/oscuro/auto) **e idioma** (ES/EN) en la barra superior, que aplica a todas las vistas.

**Compositor sobre mapa** (`WidgetPlayground.vue`):

- **Panel izquierdo**: elige el motor de mapas (Leaflet/MapLibre, vía `ASMap`) y añade instancias de cualquier widget `ASMap*` registrado con `composer` en una esquina o borde central (`top-left`/`top-center`/`top-right`/`bottom-left`/`bottom-center`/`bottom-right`).
- **Centro** (`MapCanvas.vue`): el mapa con todos los widgets colocados, cada uno seleccionable con un click.
- **Panel derecho** (`WidgetPanel.vue`): lista de widgets colocados (seleccionar/eliminar), editor de props en vivo del seleccionado, código generado y monitor de eventos emitidos.
- Pensado para probar composiciones reales, p. ej. `ASMapTimeControls` + `ASMapDayIntervalControls` a la vez sobre el mismo mapa.

### `ASMap` y las dependencias de mapas

`ASMap` instancia Leaflet o MapLibre GL JS y muestra, por defecto, un mapa base de **OpenStreetMap** (teselas ráster) en cualquiera de los dos motores — en MapLibre se construye un `style` mínimo con una fuente `raster` apuntando a `tileLayer`, ya que OSM no publica un estilo vectorial propio.

Ninguna de las dos librerías es una dependencia obligatoria del paquete: son `peerDependencies` **opcionales** (`peerDependenciesMeta.optional`), cargadas con `import()` dinámico solo cuando se usa `<ASMap>`, y explícitamente excluidas (`external`) del bundle de la librería — así un proyecto que no use `ASMap` no arrastra ninguna de las dos. Para usarlo, instala la que necesites:

```bash
npm install leaflet      # si usas mapLibrary="leaflet"
npm install maplibre-gl  # si usas mapLibrary="maplibre"
```

Si la librería elegida no está instalada, `ASMap` muestra un mensaje de error legible en su lugar en vez de fallar en silencio.

## Publicación y versionado

El paquete se distribuye de forma privada vía **GitHub Packages**, bajo el scope de la organización (`@vsadtajo`). No está publicado en el registro público de npm.

### Consumirlo desde otro proyecto

Cada proyecto que instale este paquete necesita un `.npmrc` (en su raíz, o en `~/.npmrc`) indicando dónde resolver el scope `@vsadtajo` y con qué token autenticarse:

```
@vsadtajo:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

`GITHUB_TOKEN` debe ser un [Personal Access Token](https://github.com/settings/tokens) (classic) con permiso `read:packages`, exportado como variable de entorno (nunca lo escribas literal en el `.npmrc`).

### Versionado (Changesets)

Este repo usa [Changesets](https://github.com/changesets/changesets) para versionado semántico y generación automática de `CHANGELOG.md`:

```bash
npx changeset          # tras un cambio: describe el impacto (patch/minor/major)
npx changeset version  # sube la versión en package.json y actualiza CHANGELOG.md
git push && git push --tags
npm publish            # publica en GitHub Packages (usa publishConfig del package.json)
```

- **patch**: fix que no cambia la API pública.
- **minor**: prop/evento/widget nuevo, compatible con lo existente.
- **major**: cambio incompatible (renombrar/quitar un prop o evento existente).

### CI

Cada push/PR a `main`/`develop` corre [`.github/workflows/ci.yml`](.github/workflows/ci.yml): `lint` → `type-check` → `test:coverage` → `build` → `check:entries` → `build:playground`. Puedes exigir que ese workflow pase antes de mergear desde Settings → Branches del repo.

## Convenciones para nuevos widgets

- Prefijo `ASMap*` para componentes que dependen del mapa (se colocan sobre él o necesitan su estado) y `AS*` para el resto (gráficas, tablas, layout...).
- Cada componente vive en su dominio (`src/<dominio>/components/`), con las props tipadas en una interfaz de `src/<dominio>/types/` (p. ej. `TimelineProps`), reutilizada por `defineProps<T>()` en el propio `.vue`.
- Eventos declarados con `defineEmits<T>()` (tipo exportado junto a las props) y documentados con JSDoc.
- JSDoc en la interfaz de props y en el bloque `<script setup>` explicando el propósito del widget y, si aplica, un `@example`.
- Estilos `scoped` y **autocontenidos** (sin componentes base compartidos): iconos como SVG inline, botones como `<button>` nativo estilizado con `var(--as-*, <fallback>)` para heredar el tema sin depender de que se importe `tokens.css`.
- Sin dependencias externas pesadas. La única excepción es `ASMap`, que carga Leaflet/MapLibre como `peerDependencies` opcionales vía `import()` dinámico — nunca como dependencia obligatoria del bundle (ver `vite.config.ts` → `rollupOptions.external`).
- Accesibilidad: roles/aria correctos, soporte de teclado y foco visible.
- Controlado y agnóstico de cualquier store: recibe datos ya resueltos por props y emite eventos `update:*`/`*-changed`, nunca lee un store directamente.
- Tema: prop `theme` opcional resuelta con `useResolvedTheme(() => props.theme)`, para heredar `provideTheme` cuando no se pasa.
- Añade el componente al `index.ts` de su dominio y regístralo en `src/playground/registry.ts`. Si se puede colocar sobre el mapa, añade además `composer` a su entrada para que aparezca en el compositor (`utils/widgetRegistry.ts` se deriva de ahí).
