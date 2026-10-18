# @vsadtajo/adasa-ui

Librería corporativa **ADASA** de componentes **Vue 3 + TypeScript**: el punto de entrada común de los proyectos web de la corporación. Hoy incluye el dominio de **mapas** (agnóstico del motor: Leaflet o MapLibre), y crecerá por dominios con gráficas, tablas, detalle, layout y formularios (ver [`docs/adr/0000-estructura-paquete.md`](docs/adr/0000-estructura-paquete.md)). Estándar interno de [VSADTajo](https://github.com/VSADTajo): paquete privado, distribuido vía GitHub Packages (no está en el registro público de npm).

## Dominios y entry points

Cada dominio se importa desde su propio subpath, así que un proyecto solo carga lo que usa:

| Import                         | Contenido                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------------ |
| `@vsadtajo/adasa-ui`           | `core`: tema (`provideTheme`, `useTheme`, `useResolvedTheme`), `useClickOutside`, tipos de tema   |
| `@vsadtajo/adasa-ui/map`       | `ASMap`, widgets `ASMap*`, capas (`useLayerManager`, `geoServerLayer`...), leyendas y sus tipos   |
| `@vsadtajo/adasa-ui/style.css` | Tokens de tema y estilos de todos los componentes                                                 |

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

Todos los componentes se estilizan con variables CSS (`--as-*`) definidas en [`src/core/styles/tokens.css`](src/core/styles/tokens.css), con valores de respaldo inline en cada componente, así que funcionan aunque no importes el CSS. Para personalizar, sobreescribe las variables en tu propio CSS:

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

Cada widget acepta además una prop `theme` (`'dark' | 'light'`) que tiene prioridad sobre el tema global. Si no hay `provideTheme` ni prop, se usa `'dark'`. Los que lo admiten aceptan también `accentColor`, para tintar el widget con un color puntual (p. ej. el resultado de tu propia escala de color).

## Scripts

| Script                    | Descripción                                                        |
| -------------------------- | ------------------------------------------------------------------ |
| `npm run dev`              | Playground interactivo en modo desarrollo (importa el código fuente). |
| `npm run build`            | Type-check + build de la librería (ESM + CJS + `.d.ts`, un entry por dominio) en `dist/`. |
| `npm run check:entries`    | Tras el build: comprueba que cada entry solo alcanza sus dominios y paquetes permitidos, e imprime su tamaño. |
| `npm run build:playground` | Build estático del playground en `dist-playground/`.               |
| `npm run lint`             | ESLint sobre todo el proyecto.                                     |
| `npm run lint:fix`         | ESLint con auto-fix.                                                |
| `npm run format`           | Formatea con Prettier.                                              |
| `npm run type-check`       | Chequeo de tipos con `vue-tsc` (sin emitir).                        |

## Playground

`npm run dev` levanta una app en `http://localhost:5173` con dos modos, conmutables desde la barra superior:

**Galería de componentes** (modo por defecto): todos los componentes y tipos de capa, cada uno con:

- **Selector de componentes** agrupado por categoría (barra lateral).
- **Editor de props en vivo**: cambia valores y ve el widget actualizarse al instante.
- **Documentación inline**: tabla de props (tipo/default) y eventos emitidos.
- **Log de eventos**: observa en tiempo real los eventos que emite el widget.
- **Código copiable**: snippet de plantilla Vue generado a partir del estado actual del editor.
- **Selector de tema** (claro/oscuro/auto) para probar ambos temas sin salir del playground.

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

Cada push/PR a `main`/`develop` corre [`.github/workflows/ci.yml`](.github/workflows/ci.yml): `lint` → `type-check` → `build` → `check:entries` → `build:playground`. Puedes exigir que ese workflow pase antes de mergear desde Settings → Branches del repo.

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
