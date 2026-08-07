# @adasa/map-widgets

Librería de componentes **Vue 3 + TypeScript** con widgets para aplicaciones de web mapping, **agnóstica del motor de mapas** subyacente. Todos los componentes públicos llevan el prefijo **`ASMap*`**.

## Componentes

- **[`ASMap`](src/components/mapping/ASMap.vue)** — contenedor de mapa: instancia Leaflet o MapLibre GL JS (a elección) y muestra un mapa base de OpenStreetMap por defecto. Su slot por defecto aloja los widgets posicionados sobre el mapa.
- **[`ASMapTimeControls`](src/components/controls/ASMapTimeControls.vue)** — reproducción de una línea de tiempo: play/pause, paso a paso y slider.
- **[`ASMapTimeRangeControls`](src/components/controls/ASMapTimeRangeControls.vue)** — selección de un **rango** de tiempo con dos manejadores sobre un slider doble.
- **[`ASMapDayIntervalControls`](src/components/controls/ASMapDayIntervalControls.vue)** — selector de intervalos horarios agrupados por día (p. ej. bloques de 6h × 3 días), coloreados según avisos/severidad.

## Por qué es agnóstica del mapa

Ningún widget de control importa una librería de mapas — solo `ASMap` lo hace, y de forma opcional (ver más abajo). El resto son componentes **controlados**: reciben sus datos (línea de tiempo, rango, avisos...) como props ya resueltas y emiten eventos (`update:*`, `*-changed`); el proyecto consumidor decide qué hacer con ellos (p. ej. actualizar los parámetros de una capa temporal en su propio store). Ninguno depende de Pinia, Vuex ni ningún store.

## Estructura

```
src/
├── components/
│   ├── mapping/      # ASMap
│   └── controls/      # ASMapTimeControls, ASMapTimeRangeControls, ASMapDayIntervalControls
├── types/            # Interfaces y tipos (MapAdapter, TimelineProps, TimeRangeProps, DayIntervalProps, playground...)
├── composables/      # Hooks reutilizables (useTheme, useMapAdapter, useClickOutside...)
├── styles/           # tokens.css: variables de tema por defecto
├── playground/       # App interactiva: galería de componentes + compositor de widgets sobre un mapa
│   └── utils/widgetRegistry.ts  # Registro tipo → componente usado por el compositor
└── index.ts          # Punto de entrada de la librería
```

## Uso

```bash
npm install @adasa/map-widgets
```

```ts
// main.ts
import '@adasa/map-widgets/style.css' // opcional: tokens de tema por defecto
```

```vue
<script setup lang="ts">
import { ASMap, ASMapTimeControls } from '@adasa/map-widgets'
import { ref } from 'vue'

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

Todos los widgets se estilizan con variables CSS (`--amw-*`) definidas en [`src/styles/tokens.css`](src/styles/tokens.css), con valores de respaldo inline en cada componente (funcionan aunque no importes el CSS). Para personalizar, sobreescribe las variables en tu propio CSS:

```css
:root {
  --amw-color-primary: #16a34a;
  --amw-radius: 4px;
}
```

Los tres widgets `ASMap*Controls` además aceptan una prop `theme` (`'dark' | 'light'`) y `accentColor` (para tintar el widget con un color puntual, p. ej. el resultado de tu propia escala de color).

## Scripts

| Script                    | Descripción                                                        |
| -------------------------- | ------------------------------------------------------------------ |
| `npm run dev`              | Playground interactivo en modo desarrollo (importa el código fuente). |
| `npm run build`            | Type-check + build de la librería (ESM + CJS + `.d.ts`) en `dist/`.  |
| `npm run build:playground` | Build estático del playground en `dist-playground/`.               |
| `npm run lint`             | ESLint sobre todo el proyecto.                                     |
| `npm run lint:fix`         | ESLint con auto-fix.                                                |
| `npm run format`           | Formatea con Prettier.                                              |
| `npm run type-check`       | Chequeo de tipos con `vue-tsc` (sin emitir).                        |

## Playground

`npm run dev` levanta una app en `http://localhost:5173` con dos modos, conmutables desde la barra superior:

**Galería de componentes** (modo por defecto): `ASMap` + los tres `ASMap*Controls`, cada uno con:

- **Selector de componentes** agrupado por categoría (barra lateral).
- **Editor de props en vivo**: cambia valores y ve el widget actualizarse al instante.
- **Documentación inline**: tabla de props (tipo/default) y eventos emitidos.
- **Log de eventos**: observa en tiempo real los eventos que emite el widget.
- **Código copiable**: snippet de plantilla Vue generado a partir del estado actual del editor.
- **Selector de tema** (claro/oscuro/auto) para probar ambos temas sin salir del playground.

**Compositor sobre mapa** (`WidgetPlayground.vue`):

- **Panel izquierdo**: elige el motor de mapas (Leaflet/MapLibre, vía `ASMap`) y añade instancias de cualquiera de los tres `ASMap*Controls` en una esquina o borde central (`top-left`/`top-center`/`top-right`/`bottom-left`/`bottom-center`/`bottom-right`).
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

## Convenciones para nuevos widgets

- Prefijo `ASMap*` en el nombre del componente.
- Props tipadas con una interfaz exportada desde `src/types/` (p. ej. `TimelineProps`, `TimeRangeProps`, `DayIntervalProps`), reutilizada por `defineProps<T>()` en el propio `.vue`.
- Eventos declarados con `defineEmits<T>()` (tipo exportado junto a las props) y documentados con JSDoc.
- JSDoc en la interfaz de props y en el bloque `<script setup>` explicando el propósito del widget y, si aplica, un `@example`.
- Estilos `scoped` y **autocontenidos** (sin componentes base compartidos): iconos como SVG inline, botones como `<button>` nativo estilizado con `var(--amw-*, <fallback>)` para heredar el tema sin depender de que se importe `tokens.css`.
- Sin dependencias externas pesadas. La única excepción es `ASMap`, que carga Leaflet/MapLibre como `peerDependencies` opcionales vía `import()` dinámico — nunca como dependencia obligatoria del bundle (ver `vite.config.ts` → `rollupOptions.external`).
- Accesibilidad: roles/aria correctos, soporte de teclado y foco visible.
- Controlado y agnóstico de cualquier store: recibe datos ya resueltos por props y emite eventos `update:*`/`*-changed`, nunca lee un store directamente.
- Añade el componente al `index.ts` de su categoría y, si quieres que sea explorable, a `src/playground/registry.ts` (galería) y/o `src/playground/utils/widgetRegistry.ts` (compositor).
