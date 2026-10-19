# @vsadtajo/adasa-ui

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
