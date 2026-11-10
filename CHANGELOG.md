# @vsadtajo/adasa-ui

## 0.6.0

### Minor Changes

- 0dc1946: El panel de detalle de `ASAppShell` puede tener un ancho (`v-model:detail-width`) y cambiarse arrastrando su borde izquierdo o con el teclado (`detail-resizable`, `detail-min-width`). Por defecto sigue ocupándolo todo. `ASAppDetailPanel` gana lo mismo como `v-model:width`, `resizable` y `min-width`.
- 87b9a73: `ASAppShell` gana `drawerMode` (`'push' | 'overlay'`, por defecto `'push'`): con `'overlay'`, el panel de sección entra encima del mapa y el mapa no se mueve ni cambia de tamaño. `ASAppDrawer` gana la misma opción como `mode`, y se exporta el tipo `AppDrawerMode`.
- 7ce2509: `ASAppShell` dividido en piezas públicas y documentadas, al estilo del `MainLayout` de los visores SAIH. La API de `ASAppShell` no cambia.

  - **Piezas extraídas**: `ASAppDrawer` (panel de sección que empuja el contenido), `ASAppDetailPanel` (detalle por la derecha), `ASAppBottomSheet` (panel móvil con asa) y `ASAppMobileMenu` (secciones encima de la barra móvil). Se pueden usar sueltas para montar un layout propio.
  - **Piezas nuevas de la barra**:
    - `ASAppBrand`: logos, nombre y subtítulo; se reduce sola en móvil.
    - `ASAppSearch`: el buscador de la barra, sobre `ASSearchInput`.
    - `ASAppUserMenu`: avatar, nombre y correo, tema oscuro e idioma (con `provideTheme`/`provideLocale` o `v-model`) y "Cerrar sesión" (evento `logout`).
  - **`useAppShellContext()`**: las piezas de los slots saben si el shell está en móvil.
  - **`ASSearchInput`**:
    - por sugerencia: `tags` (con el color de texto que contrasta), `actions` (evento `suggestion-action`; Mayús + Intro ejecuta la primera) y `unavailable` con `unavailableReason`;
    - slot `#suggestion` y `hide-label` (también en `ASFormField`).
  - **`ASMenu`**: slots `#trigger` (contenido del botón) y `#header` (cabecera fija del menú).

- 79c73e8: Barra de herramientas de las gráficas, a partir de la que un visor de embalses montaba a mano sobre ApexCharts:

  - **Cambia el aspecto** de la barra de `ASChart` y `ASHydrographChart`: "Restablecer zoom" y pantalla completa son iconos (con su nombre accesible y tooltip), y las descargas PNG, SVG y CSV van en un menú "Descargar". `toolbar: { downloadMenu: false }` vuelve a un botón por formato.
  - **Elementos propios** (`toolbar.items`): `button`, `select` (casillas con "Todas" y contador, o radios), `menu`, `chip` e `info`. Son controlados, con los eventos `toolbar-action` y `toolbar-change`. Slots `#toolbar-start` y `#toolbar-end`.
  - **Acciones propias de `ASHydrographChart`**, activas con `toolbar`:
    - enfocar umbral (`threshold-focus`);
    - selector de previsiones (`v-model:visible-forecasts`; ocultar una no cambia el color de las demás);
    - mostrar u ocultar percentiles (`v-model:bands`).
  - **`ASMenu`** en `/forms`: botón que despliega un menú de acciones, casillas y radios (patrón "menu button" de WAI-ARIA).
  - `charts` puede usar las primitivas de `forms` (ADR 0000).

- a6c93af: Nuevo dominio de detalle, `@vsadtajo/adasa-ui/detail`: las piezas de la ficha de una estación, a partir del panel de estación de TAJO. Reciben los datos ya preparados (`MeasureSeries`, `AlertThresholds`), así que cada proyecto solo escribe un adaptador de su API.

  - **`ASDetailHeader`**: cabecera de la ficha (título, subtítulo, etiquetas, cerrar), fija arriba y con el color corporativo.
  - **`ASCard`**: tarjeta con título, acciones, esqueleto de carga y texto sin datos.
  - **`ASStatusBadge`**: píldora de un nivel de aviso, siempre con texto.
  - **`ASAlertStatus`**: nivel de aviso actual (último valor observado) o previsto (máximo de las previsiones).
  - **`ASObservedSummary`**: último valor y máximo con su fecha y su nivel; selector entre series (entrada, salida, volumen).
  - **`ASThresholdSummary`**: superaciones de umbral por serie y nivel, con el último tramo.
  - **`ASValueMatrix`**: tabla de valores por intervalo (mínimo, media o máximo), con las celdas teñidas por nivel y la columna de series fija.
  - **`ASThresholdLegend`**: umbrales con su valor, con `v-model:selected` para resaltar uno (p. ej. en el hidrograma).
  - **Funciones puras**: `alertLevelOf`, `worstLevel`, `summarizeSeries`, `exceedanceSegments`, `aggregateByInterval` e `intervalStart`.

- 3d25d5f: `ASHydrographChart` admite caudal de entrada y de salida, volumen y nivel en la misma gráfica.

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

- 0800ffd: Iconos de cualquier librería y secciones más completas en el layout.

  - Toda prop de icono acepta un `IconValue`: un trazado SVG (`@mdi/js`), un componente de cualquier librería (Lucide, Font Awesome...) o `{ component, props }`, o un nombre (`'mdi:layers'`, `'mdi-layers'`) que traduce el resolvedor registrado con `provideIcons` (nuevo en la raíz, junto a `useIconResolver` e `isSvgPath`). Compatible: un trazado sigue funcionando igual.
  - `ASIcon` gana la prop `icon` (cualquier `IconValue`); `path` queda obsoleta, pero sigue funcionando.
  - `AppSection` gana `badge` (contador sobre el icono, incluido en el nombre accesible), `disabled` y `disabledReason` (visible y enfocable, con `aria-disabled`, pero no se abre) y `tooltip`. Las pintan `ASAppRail` y `ASAppMobileMenu`.
  - `ASAppMobileMenu` ordena las secciones de abajo (`position: 'bottom'`) al final, como la barra de iconos.
  - `ASAppRail` se desplaza si las secciones no caben en vertical.

- 7ceeb7c: Añadir `ASPrecipitationChart` y el relleno en degradado de las áreas de `ASChart`.

  - `ASPrecipitationChart`: precipitación observada y prevista en intensidad (mm/h) o mm por intervalo (`rate`). Cada serie dice cómo llegan sus valores (`input: 'depth' | 'intensity'`, con `intervalMinutes` opcional) y la gráfica los convierte en los dos sentidos.
  - Acumulado opcional por serie (`cumulative`), en el eje derecho (mm) y en su propia línea de la leyenda; la previsión continúa por defecto el acumulado observado (`continueFrom`). Botón de la barra y `v-model:show-cumulative` para mostrarlos u ocultarlos.
  - Por defecto, un hietograma: columnas separadas, cada una del intervalo que termina en su instante, así que cada serie mantiene su ancho aunque se mezclen intervalos (10 min, 1 h, 3 h); observadas casi opacas y previstas semitransparentes (`opacity`).
  - Intervalo común opcional (`interval`, en minutos): las series más finas suman sus mm a él (alineado a la medianoche local) y sus columnas miden igual; función pura `aggregateDepth`. Varias observadas y varias previstas a la vez. `display: 'line' | 'area'` (con degradado en el área prevista).
  - Por defecto, tooltip con solo la fecha y valores en la leyenda. Umbrales de intensidad o de acumulado.
  - `ASChart`: en una serie escalonada, el tooltip y los valores de la leyenda dan el valor del escalón bajo el cursor; en ApexCharts, `step: 'start'` usa `linestep` (antes siempre `stepline`).
  - Funciones puras exportadas: `toIntensity`, `toDepth`, `convertPrecipitation`, `toCumulative`, `cumulativeAt`, `intervalHours` y `sortByTime`.
  - `ASChart`: `gradient` en las series `area` (`ChartGradient`: `from`, `to`), en ECharts, Chart.js y ApexCharts.
  - `ASChart`: `columns` en las series `area` (columnas separadas de su intervalo, como un hietograma; `gap` y `width`), solo de dibujo: tooltip, leyenda, tabla y CSV usan los puntos reales.

- df07c53: Añadir `ASTreeList`, `ASCollapsible` y `ASSlider` en `/forms` (piezas para paneles de capas, como el `ItemsLayersGroup` de TAJO).

  - `ASTreeList`: árbol con selección `'multiple'` (casillas con estado intermedio en los grupos), `'single'` o `'none'`. `v-model` son los ids de las hojas seleccionadas; `v-model:expanded` y `v-model:opacities` son opcionales. Cada `TreeNode` puede llevar descripción, icono, muestra de color, contador, estado deshabilitado con su motivo, carga, slider de opacidad y acciones (`node-action`). Teclado según el patrón _tree_ de WAI-ARIA. Exporta también las funciones puras `leafIds`, `checkState`, `toggleNode`, `findNode` e `isGroup`.
  - `ASCollapsible`: sección plegable (patrón _disclosure_) con título, contador, slot `#actions` y `v-model:open` opcional.
  - `ASSlider`: `<input type="range">` nativo con estilo propio, `format` para el valor (también en `aria-valuetext`) y los eventos `update:modelValue` y `change`.
  - Corrige la opacidad de las capas GeoJSON, TopoJSON, KML y WFS en Leaflet: ahora multiplica la del estilo (como en MapLibre) en vez de sustituirla, así que un relleno translúcido ya no se vuelve opaco.

### Patch Changes

- ae1c68c: `ASMap`: un `center` o `zoom` cambiado desde el proyecto (`v-model`) ya no se vuelve a emitir. Leaflet ajusta el centro a la rejilla de píxeles, y el `update:center` que salía pisaba el valor recién puesto con otro ligeramente distinto. Ahora ese movimiento se aplica sin animación y solo se emiten los movimientos del usuario.

  `/map` exporta además el tipo `BasemapOption` (el de la prop `basemaps` de `ASMap` y de `ASMapBasemapsSelector`), que antes no se podía importar.

- ec07028: `ASDateRangePicker` sin periodo abre el calendario en el mes de `now` (sin pasar de `max`), no en el de hoy.

## 0.5.0

### Minor Changes

- 9292e38: Fechas y búsqueda en `@vsadtajo/adasa-ui/forms`:

  - **`ASDatePicker`**: fecha (y hora con `with-time`) que se escribe con el formato corto del idioma o se elige en un calendario accesible (patrón "date picker dialog" de WAI-ARIA, manejo completo con teclado). Admite `min` y `max`, y marca como error lo que no es una fecha válida.
  - **`ASDateRangePicker`**: periodo `{ start, end }` con periodos predefinidos configurables (`today`, `last24h`, `last7d`, `last30d`, `hydroYear` o propios) y calendario de inicio y fin, con hora opcional. Emite además `preset-selected`.
  - **`ASSearchInput`**: buscador con sugerencias asíncronas de `fetchSuggestions(query, signal)`, con `debounce`, `min-chars`, cancelación de la petición anterior, grupos, resaltado de lo buscado y anuncio del estado para lectores de pantalla. Emite `select` y `submit`.
  - **`hydrologicalYearStart(date)`**: inicio del año hidrológico (1 de octubre).
  - **`useLocale()`** expone además `dateFnsLocale`, el locale de date-fns del idioma activo.

- a6823e8: Nuevo dominio de formularios, `@vsadtajo/adasa-ui/forms`, con las primitivas de formulario sin framework de UI. Todas son controladas (`v-model`), accesibles (etiqueta asociada, ayuda y error en `aria-describedby`, foco visible y teclado) y toman los colores de los tokens.

  - **`ASButton`**: variantes `primary`, `secondary`, `ghost` y `danger`, tamaños `sm`/`md`/`lg`, icono y `loading` (mantiene el foco y el ancho, `aria-busy`).
  - **`ASIconButton`**: botón solo con icono, con `label` obligatorio; con `pressed`, interruptor (`v-model:pressed`).
  - **`ASInput`**: etiqueta, ayuda, error, iconos o slots a los lados, unidad, botón de borrar y `type="number"` con coma decimal.
  - **`ASSelect`**: combobox WAI-ARIA con búsqueda, selección múltiple con chips, opciones agrupadas y teclado completo.
  - **`ASCheckbox`** (booleano o grupo, indeterminado), **`ASSwitch`** y **`ASRadioGroup`**.
  - **`ASFormField`**: etiqueta, ayuda y error para controles propios del proyecto.

  En la raíz:

  - **`ASIcon`**: los iconos son trazados SVG en el formato de `@mdi/js`, sin depender de él (ver "Iconos" en el README).
  - Tokens `--as-color-danger-contrast` y `--as-control-height-sm/md/lg`, también en `readTokens()`.

- 621aa78: Nuevo dominio de layout, `@vsadtajo/adasa-ui/layout`, con la estructura de los visores de mapa. Abre y cierra como los visores SAIH, sin Vuetify.

  - **`ASAppShell`**:
    - barra corporativa arriba;
    - barra de iconos a la izquierda;
    - panel de sección de 320 px, que empuja el contenido y, al cambiar de sección, se cierra y se reabre a los 280 ms;
    - panel de detalle que entra por la derecha y tapa el contenido desde el borde de los menús (por ahora, un slot vacío con su botón de cerrar).

    La sección abierta y el detalle van por `v-model:active-section` y `v-model:detail-open`.

  - **Diseño móvil** (por debajo de `breakpoint`, medido sobre el propio layout):
    - la barra va abajo;
    - el menú de secciones se abre encima de ella;
    - cada sección sube desde abajo, con un asa para ampliarla;
    - el detalle ocupa toda la pantalla;
    - el buscador se abre con un botón de la barra.
  - **Piezas sueltas**: `ASAppTopBar`, `ASAppRail` y `ASAppPanelHeader`.
  - **Tokens del color corporativo de cada proyecto**: `--as-app-chrome`, `--as-app-chrome-text`, `--as-app-chrome-text-muted` y `--as-app-chrome-active`, y para los paneles `--as-app-panel-bg`, `--as-app-panel-text` y `--as-app-panel-surface`. Por defecto, los de los visores SAIH; también están en `readTokens()` (`app`).

  Además, `ASMap` se reajusta cuando cambia el tamaño de su contenedor (antes, solo al cambiar la ventana): un panel que empuja el mapa ya no lo deja descuadrado.

- 292e736: Cierre de la fase de primitivas y formularios: los widgets del mapa reutilizan las primitivas donde encajan, sin cambiar su API ni su aspecto.

  - **`ASMapTimeControls` y `ASMapTimeRangeControls`**: sus botones (anterior, reproducir/pausar, siguiente y los de mover el inicio y el fin del rango) son ahora `ASIconButton`. Se ven igual: mismos iconos, tamaño, hover y anillo de foco.
  - **`ASIconButton`**: nuevo slot `icon` para un SVG propio (p. ej. un icono de trazo), con lo que la prop `icon` pasa a ser opcional.
  - **Fronteras entre dominios**: `map` puede importar de `forms` (ADR 0000). `forms` no tiene dependencias externas, así que `/map` sigue sin arrastrar ningún paquete ajeno a los mapas.

  No se migran, porque las primitivas no les aportan nada sin cambiar su aspecto:
  - `ASMapButtonToggle`: grupo segmentado con color de acento.
  - `ASMapBasemapsSelector`: menú de miniaturas.
  - `ASMapDayIntervalControls`: pastillas coloreadas por nivel de aviso.
  - `ASMapLegend`: botón de plegar con flecha de texto.

## 0.3.0

### Minor Changes

- b8221a8: Cierre del bloque de gráficas.

  **API coherente entre `ASChart` y `ASHydrographChart`:**

  - `ASHydrographChart` acepta `xAxis` (título, formato y límites del eje de tiempo) y `annotations`, como `ASChart`. Las anotaciones Y van por defecto sobre el eje de caudal.
  - `now` acepta los mismos valores en las dos (`Date | boolean`). En el hidrograma se muestra por defecto (`true`), porque separa observado de previsto.
  - El JSDoc de `height` del hidrograma indica su valor real (420).
  - Nuevo tipo `HydrographEmits` (igual que `ChartEmits`).

  **Rendimiento** (prueba con 5 series de 100 000 puntos, en `docs/rendimiento-graficas.md`):

  - Corregido: con cientos de miles de puntos la gráfica no se dibujaba, porque `Math.min(...valores)` desbordaba la pila. Ahora se usa `extent()`.
  - Los formateadores de `core` (`formatNumber`, `formatDate`, `formatUnit`) reutilizan sus `Intl.*Format`. Exportar el CSV con 5 × 50 000 puntos tardaba 5,4 s; ahora, con el doble de puntos, ~1 s.
  - El cursor ya no copia las series en cada movimiento. En ECharts, cada paso pasa de ~150 ms a 33 ms con 500 000 puntos.
  - ECharts dibuja una muestra LTTB cuando hay más puntos que píxeles.

  **Calidad:**

  - La cobertura de `src/charts` supera el 90 % (statements), con un mínimo del 80 % en el CI.
  - `build:playground` comprueba los tipos de verdad.

- c524c7a: Exportación y accesibilidad en todas las gráficas (`ASChart` y `ASHydrographChart`, con los tres motores):

  - **Barra de herramientas** (`toolbar`):
    - descargar PNG, SVG y CSV;
    - restablecer zoom;
    - pantalla completa.

    `fileName` da nombre a los archivos.

  - **Métodos expuestos** (tipo `ChartExposed`): `exportImage(format?)`, `exportData(options?)`, `download(format)`, `toggleFullscreen()`, además de los que ya había.
    - Las imágenes incluyen la leyenda.
    - El CSV usa los separadores del idioma (en español, `;` y coma decimal).
  - **Accesibilidad**:
    - `aria-label` y descripción generadas: tipo, series, rango del eje X, extremos y umbrales. Se pueden sustituir con `ariaLabel` y `description`.
    - Recorrido con el teclado: flechas, Inicio/Fin, Re Pág/Av Pág, Intro para elegir el instante y Esc, con anuncios al lector de pantalla.
    - Tabla de datos alternativa oculta (`dataTable`).
    - Tramas opcionales para daltonismo (`patterns`).

  Aviso: en `toolbar`, la opción `download` pasa a ser obsoleta y la sustituye `png`. Sigue funcionando: `download: false` oculta el PNG.

  Además, la barra de herramientas pasa de `role="toolbar"` a `role="group"`, porque no implementa la navegación con flechas que exige `toolbar`. El nombre accesible por defecto cambia de "Gráfica: …" a "Gráfica de líneas: …".

- 43c9464: Nuevo dominio de gráficas, `@vsadtajo/adasa-ui/charts`:

  - **`ASChart`**: gráfica cartesiana con el mismo API para tres motores, que se eligen con `chart-library`:
    - ECharts, por defecto;
    - Chart.js;
    - ApexCharts, que requiere licencia comercial (ver `docs/adr/0001-motores-graficas.md`).

    Todos son `peerDependencies` opcionales y se cargan bajo demanda. Por props se configura:
    - de 1 a 4 ejes Y y paneles apilados con el eje X compartido;
    - umbrales e intervalos como anotaciones, coloreados por nivel de aviso;
    - nombre, color y eje de cada serie;
    - línea "ahora", tooltip y zoom;
    - barra de herramientas común (`toolbar`): descargar PNG y restablecer zoom;
    - leyenda HTML común a los tres motores, colocable con `legend="top|bottom|left|right"` y con los valores bajo el cursor (`legend-values`) como alternativa al tooltip;
    - `nativeOptions` como vía de escape.

    Usa los tokens del tema y el idioma activo (es-ES por defecto).

  - **`ASHydrographChart`**: hidrograma para visores hidrológicos:
    - precipitación con el eje invertido arriba, y caudal o nivel abajo;
    - observado frente a previsto;
    - varias fuentes de previsión con bandas p10–p90 y p25–p75;
    - umbrales del punto de control;
    - nombre y color del observado (`observedName`/`observedColor`) y de cada previsión, y retoques de cualquier serie o eje generado (`seriesOverrides`, `yAxisOverrides`);
    - precipitación alineada en su propio panel o superpuesta al caudal (`precipitation-layout`), colgando desde arriba o no (`precipitation-inverted`).

  Además:

  - `useResolvedTheme` acepta `fallback: null` para no forzar tema y heredar el de la página.
  - Textos nuevos `chart.*` y `hydrograph.*` en es y en.

- 2c550ab: Las gráficas se integran con el resto de la librería:

  - **`currentTime`** en `ASChart` y `ASHydrographChart`: línea vertical en el instante actual (p. ej. el de `ASMapTimeControls`). Un clic en la gráfica emite **`time-select`** (`{ time }`) y `update:currentTime`, así que admite `v-model:current-time`.
  - **`syncGroup`**: las gráficas del mismo grupo comparten cursor, tooltip y zoom, también entre motores distintos.
  - **`nearestTimeIndex(timeline, time)`** en el paquete raíz: pasa de una fecha al índice del instante más cercano, para enlazar las gráficas con `ASMapTimeControls`.
  - Corregido: un clic en una gráfica de ECharts no devolvía el instante bajo el cursor.

## 0.2.0

### Minor Changes

- fba4acd: **Cambio incompatible.** El paquete se renombra de `@vsadtajo/adasa-map-widgets` a `@vsadtajo/adasa-ui` y se organiza por dominios con un subpath por dominio (ver `docs/adr/0000-estructura-paquete.md`):

  - `@vsadtajo/adasa-ui`: solo `core` (`provideTheme`, `useTheme`, `useResolvedTheme`, `useClickOutside`, tipos de tema).
  - `@vsadtajo/adasa-ui/map`: `ASMap`, los widgets `ASMap*`, capas, leyendas y sus tipos. Ya no se exportan desde la raíz.
  - Las variables CSS pasan de `--amw-*` a `--as-*`, y las clases de `amw-*` a `as-*` (la clase de tema oscuro es ahora `as-dark`).
  - Los tipos internos del playground (`WidgetRegistryEntry`, `WidgetPlacement`...) dejan de ser API pública. `MapLibraryOption` se exporta desde `/map`.

- 2c393a4: Idioma y formateo compartidos (sin vue-i18n):

  - `provideLocale` / `useLocale`: textos de interfaz de la librería en español (por defecto) e inglés. Otros idiomas (ca, eu, gl...) los define el proyecto, y las claves que no traduzca caen al español.
  - Formateadores `formatNumber`, `formatDate` (presets de Intl, opciones de Intl o patrones de date-fns), `formatDuration` y `formatUnit` (`m³/s`, `mm`, `hm³`, `m`, `%`, `°C`). Se pueden usar como funciones puras o ligados al idioma activo desde `useLocale()`.
  - Todos los widgets toman sus textos y etiquetas accesibles de las claves de idioma. Por defecto muestran los mismos textos que antes.

  **Cambio visible:** los controles de tiempo mostraban los meses en inglés ("18 Oct 2026") porque date-fns se usaba sin locale. Ahora siguen el idioma activo: "18 oct 2026" en español.

  Los props `title` de `ASMapDayIntervalControls` y `ASMapLegend` pasan a no tener valor por defecto: si no se pasan, usan el texto traducido ("Avisos" / "Leyenda" en español).

- 354fa20: Tokens de diseño corporativos. Se mantienen los tokens existentes y se añaden:

  - Escala tipográfica, espaciados (`--as-space-*`), radios, sombras y capas (`--as-z-*`).
  - Paletas de datos: categórica de 8 colores validada para daltonismo, secuencial, divergente, rejilla y eje.
  - Niveles de aviso (`--as-alert-normal|amarillo|naranja|rojo`, con variantes `-text` y `-strong`).
  - Todo en claro y oscuro con `light-dark()` (requiere Chrome/Edge 123, Firefox 120 o Safari 17.5) y con contraste WCAG AA verificado por test.
  - Nuevos `readTokens()` y `useTokens()` para leer los valores resueltos desde JS (p. ej. para motores de gráficas).
  - Clase nueva `.as-light` para forzar el tema claro en un subárbol.

  `ASMapDayIntervalControls` usa ahora los tokens de aviso por defecto. Dos cambios visibles, para cumplir contraste AA del texto:

  - El texto sobre naranja pasa de blanco a casi negro.
  - El rojo pasa de `#e53935` a `#d32f2f`.

  Los widgets `ASMap*` usan `--as-z-map-control` (mismo valor, 1000).

  Los widgets `ASMap*` dejan de fijar colores propios en sus clases `--dark`/`--light`. Ahora leen los tokens nuevos `--as-overlay-{bg,text,text-muted,surface-muted,border}`, así que un proyecto puede personalizarlos desde CSS. La API no cambia y el aspecto es el mismo salvo dos detalles:

  - El texto secundario en claro pasa a `#5a6a81` para llegar a 4.5:1 incluso sobre un mapa oscuro.
  - Los widgets en oscuro usan la sombra del tema oscuro.

- ea3dff9: Los widgets `ASMap*` heredan el tema de `provideTheme` cuando no reciben la prop `theme`. Sin `provideTheme` ni prop siguen siendo `'dark'`, como hasta ahora. Nuevo composable `useResolvedTheme` para resolver el tema de un componente.

### Patch Changes

- e7c04c7: `ASMapScale` (modo `bar`), dos arreglos:

  - **La regla mide exactamente la distancia que indica.** Antes el ancho calculado se aplicaba al recuadro, y su relleno y bordes acortaban la regla unos 14 px, así que la escala mostrada era incorrecta.
  - **Las etiquetas ya no se solapan** (p. ej. "0255075100 km" con reglas cortas). Cada etiqueta se coloca en su marca y solo se muestran las que caben: todas, una de cada dos, solo los extremos o, en el caso más estrecho, solo la final con la unidad.
