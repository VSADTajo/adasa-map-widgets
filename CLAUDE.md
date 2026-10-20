# CLAUDE.md

Librería corporativa ADASA de componentes **Vue 3 + TypeScript** (`@vsadtajo/adasa-ui`), privada en GitHub Packages. Nació para web mapping y va a crecer con gráficas, tablas, paneles de detalle, layout y formularios. Todo el código, JSDoc, README y commits van **en español**.

## Arquitectura

- **Componentes controlados**: reciben datos ya resueltos por props y emiten eventos (`update:*` para `v-model`, `*-changed`/`*-selected` para lo demás). Nunca leen ni escriben un store (ni Pinia ni Vuex) ni hacen peticiones por su cuenta, salvo funciones que aporte el proyecto por prop.
- **Sin framework de UI** (nada de Vuetify ni similares): `<button>` nativos estilizados, iconos como SVG inline, estilos `scoped` y autocontenidos.
- **Dependencias pesadas como `peerDependencies` opcionales** (`peerDependenciesMeta.optional`). `vite.config.ts` deriva `external` de `dependencies` + `peerDependencies`: nunca se empaquetan. Las de mapas se cargan con `import()` dinámico. La única dependencia directa es `date-fns`.
- **Agnóstica del motor**: solo `ASMap` y `src/map/layers/` tocan Leaflet o MapLibre. El resto de widgets nunca importan una librería de mapas.
- **Prefijos**: `ASMap*` para componentes que dependen del mapa (se colocan sobre él o necesitan su estado: `ASMap`, `ASMapLegend`...) y `AS*` para el resto (`ASLineChart`, `ASTable`, `ASAppHeader`...). Clases CSS `as-*` y variables `--as-*`. Decisiones de nombre, prefijos, dominios y entry points en [ADR 0000](docs/adr/0000-estructura-paquete.md).
- Alias `@/` = `src/`.

### Estructura

```
src/
├── index.ts          # Entry raíz `@vsadtajo/adasa-ui`: solo reexporta core
├── core/             # Tema (useTheme), styles/tokens.css, i18n, icons/ + ASIcon, useClickOutside, utils/
├── charts/           # Entry `/charts`: components/, core/ (resolveSpec, tooltip, hydrograph, useChart, sync, data, describe, patterns), engines/ (echarts, chartjs, apexcharts), types/
├── forms/            # Entry `/forms`: primitivas (ASButton, ASInput, ASSelect...), fechas (ASDatePicker, ASDateRangePicker) y ASSearchInput; styles/ con los CSS compartidos (control-box, listbox, popover)
├── detail/           # Entry `/detail`: ficha de estación (ASDetailHeader, ASCard, ASStatusBadge) y tarjetas hidrológicas; utils/hydro.ts (alertLevelOf, summarizeSeries...)
├── layout/           # Entry `/layout`: ASAppShell (layout de aplicación de mapa) y sus piezas ASAppTopBar, ASAppRail, ASAppPanelHeader
├── map/              # Entry `/map`
│   ├── index.ts      # Única API pública del dominio (componentes, composables, layers, legend y tipos)
│   ├── components/   # ASMap + widgets ASMap*
│   ├── composables/  # useMapAdapter, useLayerManager
│   ├── layers/  legend/   # Adapters por tipo de capa / de leyenda
│   ├── types/        # <Nombre>Props.ts + map, layers, legend
│   └── utils/        # mapScale.ts
├── playground/       # App de documentación interactiva (no se publica). Sus tipos en playground/types.ts
└── vite-env.d.ts
```

Cada dominio (`core`, `map`, `charts` y los futuros `table`, `forms`, `detail`, `layout`) tiene la misma forma interna y un `index.ts` como única API pública.

**Fronteras entre dominios**:

- Los imports entre dominios van siempre por `@/<dominio>/...`.
- Qué dominio puede importar de cuál está en `DOMAIN_DEPENDENCIES` de `eslint.config.js` (`core` de ninguno; `map` y `charts` de `core` y `forms`...), y ESLint falla si se cruza.
- Tras el build, `npm run check:entries` (`scripts/check-entries.mjs`) comprueba lo mismo en `dist/`, más los paquetes externos permitidos a cada entry.

**Dominio nuevo**:

1. Crear `src/<dominio>/index.ts`.
2. Añadir el entry en `entries` de `vite.config.ts` y en `include` de `dts` y `tsconfig.build.json`.
3. Añadir el subpath en `exports` y `typesVersions` de package.json.
4. Añadir la regla en `RULES` de `check-entries.mjs` y en `DOMAIN_DEPENDENCIES`.

### Anatomía de un componente

1. **Tipos** en `src/<dominio>/types/<Nombre>Props.ts`: `interface <Nombre>Props` + `interface <Nombre>Emits` (sintaxis de tuplas: `'update:modelValue': [value: string]`) y los tipos auxiliares (`<Nombre>Position`, `<Nombre>Option`...).
   - JSDoc en español en la interfaz y en **cada** prop/evento. Usa `@default` en toda prop opcional con valor por defecto.
   - Cada prop tiene que ser coherente con `withDefaults`.
2. **Componente** en `src/<dominio>/components/<Nombre>.vue` con `<script setup lang="ts">`:
   - `withDefaults(defineProps<XProps>(), {...})` y `defineEmits<XEmits>()`.
   - Un bloque JSDoc tras los imports que explique qué hace, que es controlado y un `@example` con el uso en plantilla.
   - Clases CSS con prefijo `as-` en estilo BEM (`as-button-toggle--top-left`).
3. **Exports**: en `src/<dominio>/index.ts`, tanto el componente (`export { default as X } from './components/X.vue'`) como sus tipos (`export type {...} from './types/XProps'`).
4. Accesibilidad: roles y `aria-*` correctos, manejo con teclado y foco visible (`--as-focus-ring`).

### Iconos

- **Un icono es un trazado SVG**: el atributo `d` de un `<path>` en una caja de 24 × 24, el formato de `@mdi/js`. Toda prop de icono (`icon`, `prefixIcon`, `AppSection.icon`...) es un `string` con ese trazado, y se pinta con `ASIcon` (`@/core/components/ASIcon.vue`), que usa `currentColor`.
- **La librería no depende de `@mdi/js`** ni de ninguna fuente o sprite de iconos: cada proyecto importa solo los que usa (`import { mdiFilter } from '@mdi/js'`) y no hay peticiones extra ni problemas de CSP.
- **Set interno mínimo** en `src/core/icons/icons.ts` (`ICONS`, de Material Design Icons): solo entra un icono si lo usa un componente de la librería. No se exporta.
- **Slot como vía de escape** (`#icon`, `#prefix`, `#suffix`...) para lo que no sea un trazado de un color: logos, SVG multicolor, imágenes.
- Decorativo por defecto (`aria-hidden`): el nombre accesible lo pone el control que lo contiene. Un botón solo con icono exige `label` (`ASIconButton`).

Los widgets flotantes sobre el mapa comparten las props `position`, `offset` (number = px, string tal cual), `theme` y, si aplica, `accentColor`.

## Theming

- Los tokens son variables CSS `--as-*` en `src/core/styles/tokens.css`.
  - Cada color se declara una vez con `light-dark(claro, oscuro)`, y el modo lo decide el `color-scheme`: sin clase o `.as-light` es claro, `.as-dark` oscuro y `.as-theme-auto` sigue al sistema.
  - Grupos: color de interfaz, tipografía, espaciado (`--as-space-N`), radios, sombras, z-index (`--as-z-*`), datos (`--as-data-*`) y avisos (`--as-alert-*`).
  - Su import es opcional: **todo `var()` lleva fallback inline**, p. ej. `var(--as-radius, 10px)`, para que el componente funcione sin `tokens.css`.
- **Usa los tokens, no valores sueltos**: espaciados, tamaños de letra, radios y z-index salen de la escala. Los controles flotantes sobre el mapa usan `var(--as-z-map-control, 1000)`.
- **Colores de datos** (para gráficas, leyendas, mapas temáticos):
  - `--as-data-cat-1..8` para identidad de series, en orden y sin ciclar; una 9.ª serie va a "Otros".
  - `--as-data-seq-100..700` para magnitud.
  - `--as-data-div-*` para polaridad.
  - `--as-alert-<nivel>` (`normal`/`amarillo`/`naranja`/`rojo`) está **reservado** a niveles de aviso: nunca como "serie 4" y siempre con texto o icono.
  - Variantes de aviso: `-text` para el texto sobre el relleno y `-strong` para líneas o iconos sobre la superficie.
- **Contraste**: `src/core/styles/tokens.spec.ts` comprueba WCAG AA de todos los tokens en ambos modos (textos ≥ 4.5:1, marcas ≥ 3:1). Un color nuevo o cambiado tiene que pasarlo; para la paleta categórica, valida además la separación para daltonismo.
- **Desde JS** (motores de gráficas, canvas): `readTokens(el)` devuelve los valores resueltos para el tema de `el`, y `useTokens(target)` los mantiene al día cuando cambia el tema. El tipo `ThemeTokens` (`src/core/types/theme.ts`) refleja los tokens: si añades uno, actualiza el CSS, el tipo y `readTokens`.
- **`provideTheme(mode)`** (`src/core/composables/useTheme.ts`): el proyecto lo llama una vez en la raíz (`light | dark | auto`) y todos los widgets lo heredan.
- **Prop `theme`** (`'dark' | 'light'`, opcional, **sin default en `withDefaults`**): tiene prioridad sobre el tema global. Todo componente la resuelve con `const resolvedTheme = useResolvedTheme(() => props.theme)`, que aplica la prop, luego `provideTheme` y por último `'dark'`. Se aplica como clase modificadora (`as-<widget>--${resolvedTheme}`). En el JSDoc del tipo, documenta la herencia en vez de `@default 'dark'`.
- **Las clases `--dark`/`--light` de un widget solo fijan `color-scheme`**, nunca valores. Los colores van en la regla raíz del widget, desde tokens con fallback `light-dark()`. Por ejemplo, en los overlays sobre el mapa: `--as-color-text: var(--as-overlay-text, light-dark(#0f172a, #ffffff))`. Así el proyecto los personaliza vía tokens y el widget funciona sin `tokens.css`. Si un widget necesita un valor propio distinto del token (p. ej. `ASMapScale`, más transparente), lo declara con `light-dark()` y un comentario que explique por qué.
- `useTheme()` es para quien necesite leer o cambiar el contexto. Si no lo hay, crea uno local en `auto`, así que los widgets no lo usan para resolver su tema.
- `accentColor`: color CSS libre para tintar el elemento activo de un widget.

## Textos e idiomas

- **Idioma principal: español de España (`es` → `es-ES`)**. Es el idioma de referencia de los textos (`es` en `messages.ts` define todas las claves) y el valor por defecto en todas partes: sin `provideLocale`, en `provideLocale()`, como respaldo de claves e idiomas que falten y en los formateadores puros. Formato de España: coma decimal, `dd/mm/aaaa` y reloj de 24 h. El inglés y el resto de idiomas son secundarios.
- **Ningún texto visible ni `aria-label` va escrito a mano en un componente**:
  - Se pide con `const { t } = useLocale()` y `t('<componente>.<texto>', { param })`.
  - Las claves viven en `src/core/i18n/messages.ts`: añade la clave en `es` (la referencia) **y** en `en`.
  - Los textos que vienen de una prop (p. ej. `title`) se resuelven como `props.title ?? t('...')`, sin default en `withDefaults`.
- **Ningún número, fecha o unidad se formatea a mano**: nada de `toLocaleString`, `Intl.*('es-ES')` ni `format()` de date-fns sin locale. Usa los formateadores de `useLocale()`:
  - `formatNumber`.
  - `formatDate(fecha, preset | opcionesIntl | { pattern })`.
  - `formatDuration`.
  - `formatUnit(valor, 'm³/s' | 'mm' | 'hm³' | 'm' | '%' | '°C')`.

  Ya van ligados al idioma activo, y fuera de un componente se usan las versiones puras de `src/core/utils/format.ts`.
- **Idiomas**:
  - `provideLocale(code)` en la raíz de la app. Sin él, español.
  - `es` y `en` (en-GB) vienen incluidos.
  - ca/eu/gl los define el proyecto con `provideLocale(code, { locales: { ca: { intl, messages, dateFns } } })`. Las claves que falten caen al español.
- No se usa vue-i18n: la librería necesita pocos textos con interpolación simple, y no debe obligar a cada proyecto a instalar y configurar un plugin.

## Gráficas

Decisión y diferencias entre motores en [ADR 0001](docs/adr/0001-motores-graficas.md).

- **Flujo**: `ASChart` (props) → `resolveSpec` (más tokens e idioma) → `ResolvedChartSpec` → una traducción pura por motor (`toEChartsOption`, `toChartJsConfigs`, `toApexOptions`). Los motores se cargan con `import()` dinámico; nunca se importan de forma estática.
- **Toda decisión común va en `resolveSpec`**, no en un motor: colores, ejes, formatos, rango X, valores que un eje debe incluir...
- **Una capacidad nueva se implementa en los tres motores**. Si uno no puede ofrecerla, se documenta en la tabla del ADR.
  - Los tests de `engines/engines.spec.ts` comprueban que los tres traducen lo mismo.
  - La comprobación visual se hace con capturas de los tres motores en claro y oscuro.
- **Componentes de dominio** (como `ASHydrographChart`) = una función pura `build*()` que devuelve props de `ASChart`, más un componente que la renderiza. Así funcionan con los tres motores sin código propio.
- **Colores de series**: por defecto, la paleta categórica en orden. Para fijar un color del tema que respete claro/oscuro, usa `'var(--as-data-cat-N)'`.
- **Exportación y accesibilidad son comunes**, no de cada motor:
  - El motor solo entrega sus paneles como imagen; `engines/exportImage.ts` los compone con la leyenda.
  - La tabla de datos y el CSV salen de `core/data.ts`; el nombre, la descripción y los anuncios del teclado, de `core/describe.ts`; las tramas, de `core/patterns.ts`.
  - Toda serie nueva tiene que salir en el CSV y en la tabla.
  - Un relleno nuevo tiene que admitir `pattern`.
- ApexCharts **nunca** es el motor por defecto, y cualquier mención a él recuerda que necesita licencia comercial.

## Playground

`npm run dev` (http://localhost:5173). **Todo componente, prop o evento nuevo debe verse en el playground, no basta con el código fuente:**

- **Registro único**: `src/playground/registry.ts` (`RegistryEntry`), con `id`, `name`, `category`, `description`, `propsSchema` (props editables, tipos en `propTypes.ts`) y `events` (`EventDoc`). Si hace falta, también `staticProps` (datos complejos de ejemplo) y `bindings` (listeners que sincronizan el estado y registran en el log de eventos).
- **Compositor sobre mapa**: si el widget se puede colocar sobre el mapa, añade `composer: { label, omitProps?, staticProps? }` a su entrada. `utils/widgetRegistry.ts` se deriva de ahí: no lo edites a mano.
- Usa `THEME_FIELD` (en `registry.ts`) para la prop `theme`. Su opción vacía significa "sin prop": el widget hereda el tema global del playground.
- **Categorías**: están en `COMPONENT_CATEGORIES` (`propTypes.ts`), una por dominio: `mapping`, `controls`, `layers`, `charts`, `tables`, `detail`, `layout` y `forms`. Cada una tiene su título y su tipo de vista previa. El Sidebar las lista todas; las vacías muestran "Próximamente".
  - `preview: 'map'`: escenario de los widgets de mapa.
  - `preview: 'canvas'`: lienzo neutro a todo el ancho, redimensionable y con presets Móvil/Tableta/Escritorio, para comprobar el responsive de gráficas, tablas, etc.
- **Tema e idioma del playground** son globales, en la barra superior: `provideTheme` y `provideLocale` en `App.vue`.
- Los datos de ejemplo son sintéticos y autónomos (sin backend), en `src/playground/utils/`.

## Tests

Vitest + `@vue/test-utils` + jsdom (`vitest.config.ts`).

- `npm run test`: una pasada.
- `npm run test:watch`: modo vigilancia.
- `npm run test:coverage`: con cobertura, que es lo que corre el CI. El informe HTML queda en `coverage/`.

**Co-locados**: cada test va junto a lo que prueba, `X.spec.ts` al lado de `X.ts` o `X.vue` (p. ej. `src/map/utils/mapScale.spec.ts`). Motivos:

- La librería se organiza por dominios con fronteras estrictas. Un test vive dentro de su dominio, se mueve con él (`git mv` de la carpeta) y le aplican las mismas reglas de ESLint.
- Un componente sin `.spec.ts` al lado salta a la vista en el explorador. Una carpeta `tests/` aparte se desincroniza del código sin que nadie lo note.
- Los imports del test son relativos y cortos (`./ASMapButtonToggle.vue`).

Los `*.spec.ts` se excluyen del build (`tsconfig.build.json` y `dts` en `vite.config.ts`), pero sí pasan por `npm run type-check` y ESLint. Lo mismo vale para los datos compartidos entre tests, que van en `*.fixtures.ts` (p. ej. `src/charts/core/chart.fixtures.ts`).

**Plantillas** a copiar:

- [mapScale.spec.ts](src/map/utils/mapScale.spec.ts) para funciones puras: valores conocidos, fronteras (p. ej. el paso de m a km) e invariantes con `it.each`.
- [ASMapButtonToggle.spec.ts](src/map/components/ASMapButtonToggle.spec.ts) para componentes: render y ARIA, `v-model` (emitido y con el padre devolviendo la prop), estados disabled, valores por defecto y herencia del tema con `provideTheme`.

**Convenciones**:

- `describe` por componente o función, con subgrupos por comportamiento.
- Nombres de test en español que describen el comportamiento ("emite update:modelValue con el value del botón pulsado").
- Importa `describe`/`it`/`expect` de `'vitest'` (sin globals).
- Prueba la API pública (props, eventos, DOM, ARIA), no detalles internos.
- Comprueba que el test falla si rompes el código que cubre.

## Estilo de código

- Prettier: sin `;`, comillas simples, `printWidth` 100, trailing commas. ESLint `--max-warnings 0`.
- Variables sin usar con prefijo `_`.
- Comentarios y JSDoc en español, explicando el **porqué** y no lo obvio.

## Commits y ramas

- Mensajes en **español, en imperativo, con la primera letra en mayúscula y sin punto final**. El paréntesis aclara qué es el componente: `Añadir widget ASMapScale (escala del mapa: regla graduada o razón numérica)`, `Corregir crash de Leaflet al destruir el mapa`, `Quitar baseUrl obsoleto de la config de TypeScript`.
- Un commit por unidad lógica; si incluye un arreglo colateral, se añade con "y": `Añadir tipo de capa WMTS y arreglar pane inexistente en WMS/Tiles de Leaflet`.
- Ramas `feature/*`, `chore/*`, `refactor/*`, `docs/*`. PR contra `main`. El CI (`.github/workflows/ci.yml`) corre en push/PR a `main` y `develop`.

## Versionado

Changesets (`npx changeset`):

- **patch**: arreglo sin cambio de API.
- **minor**: prop, evento o componente nuevo compatible.
- **major**: renombrar o quitar una prop, un evento o un export.

Mientras sea 0.x, los cambios incompatibles se avisan igualmente en el changeset.

## Definition of Done

Una tarea no está terminada hasta que se cumple todo esto:

- [ ] `npm run lint`, `npm run type-check`, `npm run test`, `npm run build`, `npm run check:entries` y `npm run build:playground` en verde.
- [ ] Tests co-locados (`*.spec.ts`) del comportamiento nuevo o cambiado: lógica pura con valores y fronteras; componentes con render, props, eventos/`v-model` y estados (disabled, vacío, tema).
- [ ] Tipos en `src/<dominio>/types/` con JSDoc en español, `@default` y `@example`.
- [ ] Export público en `src/<dominio>/index.ts` (componente y tipos).
- [ ] Entrada en `src/playground/registry.ts` (con `composer` si va sobre el mapa) con todas sus props y eventos nuevos.
- [ ] Funciona en tema claro y oscuro (por prop y heredado de `provideTheme`) y se puede manejar con teclado.
- [ ] Sin textos ni formatos escritos a mano: `t()` con la clave en `es` y `en`, y los formateadores de `useLocale()`.
- [ ] README actualizado (lista de componentes y la sección que corresponda).
- [ ] Changeset creado (`npx changeset`) con el tipo de bump correcto.
