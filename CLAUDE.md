# CLAUDE.md

Librería corporativa ADASA de componentes **Vue 3 + TypeScript** (`@vsadtajo/adasa-map-widgets`), privada en GitHub Packages. Nació para web mapping y va a crecer con gráficas, tablas, paneles de detalle, layout y formularios. Todo el código, JSDoc, README y commits van **en español**.

## Arquitectura

- **Componentes controlados**: reciben datos ya resueltos por props y emiten eventos (`update:*` para `v-model`, `*-changed`/`*-selected` para lo demás). Nunca leen ni escriben un store (ni Pinia ni Vuex) ni hacen peticiones por su cuenta, salvo funciones que aporte el proyecto por prop.
- **Sin framework de UI** (nada de Vuetify ni similares): `<button>` nativos estilizados, iconos como SVG inline, estilos `scoped` y autocontenidos.
- **Dependencias pesadas como `peerDependencies` opcionales** (`peerDependenciesMeta.optional`), cargadas con `import()` dinámico y declaradas `external` en `vite.config.ts`. Hoy solo `ASMap` las usa (Leaflet, MapLibre...). La única dependencia directa es `date-fns`.
- **Agnóstica del motor**: solo `ASMap` y `src/layers/` tocan Leaflet o MapLibre. El resto de widgets nunca importan una librería de mapas.
- **Prefijos**: `ASMap*` para componentes que dependen del mapa (se colocan sobre él o necesitan su estado: `ASMap`, `ASMapLegend`...) y `AS*` para el resto (`ASLineChart`, `ASTable`, `ASAppHeader`...). Clases CSS siempre `amw-*`. El nombre del paquete se decide en T0.2 (`docs/cronograma-libreria-corporativa.pdf`).
- Alias `@/` = `src/`.

### Estructura

```
src/
├── components/<categoría>/   # mapping/ (ASMap), controls/ (ASMap*). Cada carpeta con su index.ts
├── types/                    # <Nombre>Props.ts por componente + tipos de dominio (layers, legend, map, theme...)
├── composables/              # useTheme, useMapAdapter, useLayerManager, useClickOutside
├── layers/  legend/          # Adapters por tipo de capa / de leyenda
├── utils/                    # Funciones puras (p. ej. mapScale.ts)
├── styles/tokens.css         # Variables --amw-*
├── playground/               # App de documentación interactiva (no se publica)
└── index.ts                  # Punto de entrada: re-exporta components, composables, layers, legend y types
```

### Anatomía de un componente

1. **Tipos** en `src/types/<Nombre>Props.ts`: `interface <Nombre>Props` + `interface <Nombre>Emits` (sintaxis de tuplas: `'update:modelValue': [value: string]`) y los tipos auxiliares (`<Nombre>Position`, `<Nombre>Option`...).
   - JSDoc en español en la interfaz y en **cada** prop/evento. Usa `@default` en toda prop opcional con valor por defecto.
   - Cada prop tiene que ser coherente con `withDefaults`.
2. **Componente** en `src/components/<categoría>/<Nombre>.vue` con `<script setup lang="ts">`:
   - `withDefaults(defineProps<XProps>(), {...})` y `defineEmits<XEmits>()`.
   - Un bloque JSDoc tras los imports que explique qué hace, que es controlado y un `@example` con el uso en plantilla.
   - Clases CSS con prefijo `amw-` en estilo BEM (`amw-button-toggle--top-left`).
3. **Exports**: en el `index.ts` de su categoría (`export { default as X } from './X.vue'`) y sus tipos en `src/types/index.ts` (`export type {...}`).
4. Accesibilidad: roles y `aria-*` correctos, manejo con teclado y foco visible (`--amw-focus-ring`).

Los widgets flotantes sobre el mapa comparten las props `position`, `offset` (number = px, string tal cual), `theme` y, si aplica, `accentColor`.

## Theming

- Tokens como variables CSS `--amw-*` en `src/styles/tokens.css` (`:root` = claro; `.amw-dark` y `.amw-theme-auto` = oscuro). Su import es opcional: **todo `var()` lleva fallback inline**, p. ej. `var(--amw-radius, 10px)`, para que el componente funcione sin `tokens.css`.
- El tipo `ThemeTokens` (`src/types/theme.ts`) documenta los tokens. Si añades un token, actualiza los dos.
- **`provideTheme(mode)`** (`src/composables/useTheme.ts`): el proyecto lo llama una vez en la raíz (`light | dark | auto`) y todos los widgets lo heredan.
- **Prop `theme`** (`'dark' | 'light'`, opcional, **sin default en `withDefaults`**): tiene prioridad sobre el tema global. Todo componente la resuelve con `const resolvedTheme = useResolvedTheme(() => props.theme)`, que aplica la prop, luego `provideTheme` y por último `'dark'`. Se aplica como clase modificadora (`amw-<widget>--${resolvedTheme}`). En el JSDoc del tipo, documenta la herencia en vez de `@default 'dark'`.
- `useTheme()` es para quien necesite leer o cambiar el contexto. Si no lo hay, crea uno local en `auto`, así que los widgets no lo usan para resolver su tema.
- `accentColor`: color CSS libre para tintar el elemento activo de un widget.

## Playground

`npm run dev` (http://localhost:5173). **Todo componente, prop o evento nuevo debe verse en el playground, no basta con el código fuente:**

- **Registro único**: `src/playground/registry.ts` (`RegistryEntry`), con `id`, `name`, `category`, `description`, `propsSchema` (props editables, tipos en `propTypes.ts`) y `events` (`EventDoc`). Si hace falta, también `staticProps` (datos complejos de ejemplo) y `bindings` (listeners que sincronizan el estado y registran en el log de eventos).
- **Compositor sobre mapa**: si el widget se puede colocar sobre el mapa, añade `composer: { label, omitProps?, staticProps? }` a su entrada. `utils/widgetRegistry.ts` se deriva de ahí: no lo edites a mano.
- Usa `THEME_FIELD` (en `registry.ts`) para la prop `theme`. Su opción vacía significa "sin prop": el widget hereda el tema global del playground.
- Una categoría nueva se añade a `ComponentDoc['category']` en `propTypes.ts` y al Sidebar.
- Los datos de ejemplo son sintéticos y autónomos (sin backend), en `src/playground/utils/`.

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

- [ ] `npm run lint`, `npm run type-check`, `npm run build` y `npm run build:playground` en verde (y `npm run test` cuando exista).
- [ ] Tipos en `src/types/` con JSDoc en español, `@default` y `@example`.
- [ ] Export público en el `index.ts` de su categoría y en `src/types/index.ts` (llega a `src/index.ts`).
- [ ] Entrada en `src/playground/registry.ts` (con `composer` si va sobre el mapa) con todas sus props y eventos nuevos.
- [ ] Funciona en tema claro y oscuro (por prop y heredado de `provideTheme`) y se puede manejar con teclado.
- [ ] README actualizado (lista de componentes y la sección que corresponda).
- [ ] Changeset creado (`npx changeset`) con el tipo de bump correcto.
