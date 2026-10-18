# @vsadtajo/adasa-ui

Librería corporativa **ADASA** de componentes **Vue 3 + TypeScript**: el punto de entrada común de los proyectos web de la corporación. Hoy incluye el dominio de **mapas** (agnóstico del motor: Leaflet o MapLibre), y crecerá por dominios con gráficas, tablas, detalle, layout y formularios (ver [`docs/adr/0000-estructura-paquete.md`](docs/adr/0000-estructura-paquete.md)). Estándar interno de [VSADTajo](https://github.com/VSADTajo): paquete privado, distribuido vía GitHub Packages (no está en el registro público de npm).

## Dominios y entry points

Cada dominio se importa desde su propio subpath, así que un proyecto solo carga lo que usa:

| Import                         | Contenido                                                                                       |
| ------------------------------ | ----------------------------------------------------------------------------------------------- |
| `@vsadtajo/adasa-ui`           | `core`: tema y tokens (`provideTheme`, `readTokens`...), idioma (`provideLocale`, `useLocale`), formateadores (`formatNumber`, `formatDate`, `formatDuration`, `formatUnit`) |
| `@vsadtajo/adasa-ui/map`       | `ASMap`, widgets `ASMap*`, capas (`useLayerManager`, `geoServerLayer`...), leyendas y sus tipos |
| `@vsadtajo/adasa-ui/charts`    | `ASChart` y `ASHydrographChart`, con ECharts, Chart.js o ApexCharts (a elegir) |
| `@vsadtajo/adasa-ui/style.css` | Tokens de tema y estilos de todos los componentes                                               |

Importar solo la raíz no carga nada de mapas: ni código ni tipos de Leaflet o MapLibre. Medido en un proyecto de prueba, añade ~1 kB al bundle frente a una app que solo usa Vue.

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
- **[`ASHydrographChart`](src/charts/components/ASHydrographChart.vue)**: hidrograma, con la precipitación arriba (barras, eje invertido) y el caudal o nivel abajo. La precipitación puede ir alineada en su propio panel (`precipitation-layout="panel"`, por defecto) o superpuesta al caudal con su eje a la derecha (`"overlay"`), colgando desde arriba o no (`precipitation-inverted`). Nombre y color del observado con `observedName`/`observedColor` (y `name`/`color` de cada previsión). Cualquier serie generada (eje, estilo, leyenda…) se retoca con `seriesOverrides` por su id, y los ejes con `yAxisOverrides`. Distingue observado y previsto, admite varias fuentes de previsión con bandas de percentiles p10–p90 y p25–p75, y marca los umbrales de aviso y la línea "ahora".

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
- barra de herramientas (`toolbar`): descargar PNG y restablecer zoom, igual en los tres motores;
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
  :discharge="{ observed: caudal, forecasts: [{ id: 'eps', name: 'EPS', values: mediana, percentiles }] }"
  :precipitation="{ observed: lluvia }"
  :thresholds="[{ value: 90, level: 'amarillo' }, { value: 130, level: 'naranja' }]"
/>
```

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

## Estructura

```
src/
├── index.ts          # Entry raíz: reexporta core
├── core/             # Tema, tokens (styles/tokens.css) y utilidades comunes. No depende de ningún dominio
├── map/              # Entry /map: components/, composables/, layers/, legend/, types/, utils/
└── playground/       # App interactiva: galería de componentes + compositor de widgets sobre un mapa
    ├── registry.ts              # Registro único de componentes (galería + compositor)
    └── utils/widgetRegistry.ts  # Lista del compositor, derivada de registry.ts
scripts/check-entries.mjs        # Guardarraíl: cada entry solo alcanza sus dominios y paquetes permitidos
```

Cada dominio solo puede importar de los dominios que le permite el ADR (p. ej. `core` de ninguno, `map` solo de `core`). ESLint lo comprueba en el código fuente y `npm run check:entries`, en el build.

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
| `npm run build`            | Type-check + build de la librería (ESM + CJS + `.d.ts`, un entry por dominio) en `dist/`.                     |
| `npm run check:entries`    | Tras el build: comprueba que cada entry solo alcanza sus dominios y paquetes permitidos, e imprime su tamaño. |
| `npm run build:playground` | Build estático del playground en `dist-playground/`.                                                          |
| `npm run lint`             | ESLint sobre todo el proyecto.                                                                                |
| `npm run lint:fix`         | ESLint con auto-fix.                                                                                          |
| `npm run format`           | Formatea con Prettier.                                                                                        |
| `npm run type-check`       | Chequeo de tipos con `vue-tsc` (sin emitir).                                                                  |
| `npm run test`             | Tests (Vitest + @vue/test-utils + jsdom), co-locados como `*.spec.ts`.                                        |
| `npm run test:watch`       | Tests en modo vigilancia.                                                                                     |
| `npm run test:coverage`    | Tests con informe de cobertura en `coverage/`.                                                                |

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
