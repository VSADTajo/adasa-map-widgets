# @vsadtajo/adasa-ui

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
