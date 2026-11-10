# ADR 0000 — Nombre, prefijos y estructura del paquete

- **Estado**: Aceptada
- **Fecha**: 2026-10-17
- **Implementación**: tarea T0.3 del cronograma (`docs/cronograma-libreria-corporativa.pdf`)

## Contexto

`@vsadtajo/adasa-map-widgets` nació como librería de widgets de web mapping y va a ser la librería corporativa de todos los proyectos web de ADASA. Además de mapas, tendrá gráficas, tablas, componentes de detalle, layout y formularios.

Estado actual que condiciona la decisión:

- **Un único entry** (`src/index.ts`) que reexporta todo, compilado a un solo bundle (`dist/adasa-map-widgets.js`) y a un solo `dist/index.d.ts` (`rollupTypes`).
- **Carpetas por tipo de archivo** (`components/`, `types/`, `composables/`...), no por dominio.
- Las dependencias de mapas (Leaflet, MapLibre, georaster...) son `peerDependencies` opcionales cargadas con **`import()` dinámico** y marcadas `external` en `vite.config.ts`. Por eso hoy no rompen a quien no use mapas.
- Una librería de gráficas como ECharts se usa con **imports estáticos** (`echarts/core` + `use([...])`). En un bundle único, ese `import` estático hace fallar el build de cualquier proyecto que no tenga ECharts instalado, aunque no use ninguna gráfica.
- `src/composables/useLayerManager.ts` importa tipos de `leaflet` y `maplibre-gl`. Con un `.d.ts` único, todo consumidor necesita esos tipos, use mapas o no.
- `src/types/playground.ts` (tipos internos del playground) se publica como API pública, y `MapLibraryOption`, que usa `ASMap`, vive ahí.
- Las variables CSS usan `--amw-*`, las clases `amw-*` y la clave de inyección del tema es `'amw-theme'` ("adasa map widgets").
- **Ningún proyecto consume todavía el paquete**, así que cualquier cambio de nombre o de API cuesta ahora lo mínimo.

## Decisión

### 1. Nombre: `@vsadtajo/adasa-ui`

- El scope `@vsadtajo` se mantiene: lo fija la organización de GitHub en GitHub Packages, así que el `.npmrc` de los proyectos no cambia.
- El repositorio **no** se renombra: sigue siendo `VSADTajo/adasa-map-widgets`. El nombre del paquete no tiene por qué coincidir con el del repo, y GitHub Packages vincula el paquete al repo por `repository.url` de package.json, que sigue apuntando a la URL actual.
- No hay migración, porque no hay consumidores. Si la 0.1.0 llegó a publicarse con el nombre antiguo, se borra ese paquete en GitHub → Packages de la organización.
- La primera publicación con el nombre nuevo crea un paquete nuevo en GitHub Packages con permisos propios. Hay que verificar que hereda el acceso del repositorio para que los proyectos lo lean con `read:packages`.
- La numeración continúa: la primera versión publicada como `adasa-ui` es la 0.2.0, que cierra la fase F0.

### 2. Prefijos

| Qué                                                              | Convención                                    | Ejemplo                                     |
| ---------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------- |
| Componente que depende del mapa (va sobre él o necesita su estado) | `ASMap*`                                    | `ASMap`, `ASMapLegend`, `ASMapTimeControls` |
| Resto de componentes                                             | `AS*`                                         | `ASLineChart`, `ASTable`, `ASAppHeader`     |
| Composables                                                      | `use*` / `provide*`, sin prefijo              | `useTheme`, `useResolvedTheme`              |
| Tipos                                                            | Sin prefijo; `<Nombre>Props` / `<Nombre>Emits` | `ScaleProps`, `ScaleEmits`                  |
| Variables CSS                                                    | `--as-*`                                      | `--as-color-primary`                        |
| Clases CSS                                                       | `as-<componente>__<elemento>--<modificador>`  | `as-scale--dark`                            |
| Clave de inyección del tema                                      | `'as-theme'`                                  |                                             |

- `--amw-*` y `amw-*` se sustituyen sin alias de compatibilidad, porque no hay consumidores con temas personalizados.
- Si un componente `ASMap*` resulta útil fuera del mapa, se crea un `AS*` nuevo y genérico y el `ASMap*` pasa a usarlo por dentro. No se renombra el de mapa.

### 3. Estructura de carpetas por dominio

```
src/
├── index.ts            # Entry raíz: solo core
├── core/               # Tema, tokens, utilidades comunes. No depende de ningún dominio
│   ├── index.ts
│   ├── composables/    # useTheme (provideTheme, useResolvedTheme), useClickOutside
│   ├── styles/tokens.css
│   ├── types/          # theme.ts, common.ts
│   └── utils/          # resolveNamespace.ts
├── map/                # Entry /map
│   ├── index.ts
│   ├── components/     # ASMap y widgets ASMap* (se fusionan mapping/ y controls/)
│   ├── composables/    # useMapAdapter, useLayerManager
│   ├── layers/
│   ├── legend/
│   ├── types/          # map, layers, legend, <Nombre>Props.ts, MapLibraryOption
│   └── utils/          # mapScale.ts
├── charts/  table/  forms/  detail/  layout/   # Mismo esqueleto; cada uno se crea con su primer componente
└── playground/         # App de documentación; sus tipos pasan a playground/types.ts y dejan de ser públicos
```

Cada dominio tiene su `index.ts` como **única API pública** y sus tipos junto al código (`<dominio>/types/`), no en un `src/types/` global.

**Reglas de dependencia entre dominios**, impuestas con `no-restricted-imports` por carpeta en `eslint.config.js`:

| Dominio                          | Puede importar de                |
| -------------------------------- | -------------------------------- |
| `core`                           | nada (solo `vue` y `date-fns`)   |
| `table`, `forms`                 | `core`                           |
| `charts`                         | `core`, `forms`                  |
| `map`                            | `core`, `forms`                  |
| `detail`                         | `core`, `forms`, `charts`        |
| `layout`                         | `core`, `forms`                  |

- `map` puede usar las primitivas de `forms` (T3.3: los botones de los controles de tiempo son `ASIconButton`). `forms` no tiene dependencias externas, así que `/map` sigue sin arrastrar ningún paquete que no sea de mapas.
- `charts` puede usar las primitivas de `forms` (la barra de herramientas usa `ASIconButton` y `ASMenu`). Como `forms` no tiene dependencias externas, `/charts` no arrastra nada que no sea de gráficas.
- Ningún dominio importa de `map`. La integración con el mapa se hace en el proyecto, a través de props y eventos.
- Todo lo que `detail` use de `charts` tiene que funcionar sin el motor de gráficas (p. ej. `ASSparkline` en SVG propio, tarea T1.7). Si no, importar `/detail` arrastraría ECharts.

### 4. Entry points por subpath

En `package.json` solo se declaran los subpaths que ya tienen contenido: en T0.3, `.` y `./map`; `./charts` se añade en T1.2, y así sucesivamente.

```json
"exports": {
  ".":     { "types": "./dist/index.d.ts", "import": "./dist/index.js", "require": "./dist/index.cjs" },
  "./map": { "types": "./dist/map.d.ts",   "import": "./dist/map.js",   "require": "./dist/map.cjs" },
  "./style.css": "./dist/style.css"
},
"typesVersions": { "*": { "map": ["./dist/map.d.ts"] } }
```

- `typesVersions` es un respaldo para proyectos con `moduleResolution: "node"`, que no leen `exports`.
- `vite.config.ts`:
  - `build.lib.entry` es un objeto (`{ index: 'src/index.ts', map: 'src/map/index.ts', ... }`) con `fileName: (format, name) => \`${name}.${format === 'es' ? 'js' : 'cjs'}\``. El código compartido sale en chunks automáticos.
  - `rollupOptions.external` se **deriva de `peerDependencies`** de `package.json` (`id === dep || id.startsWith(dep + '/')`) en vez de mantener una lista a mano. Añadir una dependencia pesada como peer opcional basta para que no se empaquete.
  - `vite-plugin-dts` genera un `.d.ts` por entry. Si el `rollupTypes` multi-entry da problemas, se emiten los `.d.ts` sin agrupar y `exports.*.types` apunta a ellos.
- **CSS**: un único `dist/style.css` (`cssCodeSplit: false`) que el proyecto importa una vez. Se revisará si supera ~100 KB.
- **Dependencias pesadas**: siempre `peerDependencies` con `peerDependenciesMeta.optional`. Las de mapas se siguen cargando con `import()` dinámico. ECharts puede importarse de forma estática porque queda aislado en `/charts`.

### 5. Paquete único con subpaths, no monorepo

- **Tree-shaking**: un subpath es una frontera tan dura como un paquete separado. Lo que el proyecto no importa no se resuelve ni se empaqueta: un proyecto sin ECharts nunca carga `dist/charts.js`, y uno sin mapas no necesita los tipos de Leaflet.
- **Versionado (changesets)**: una versión y un CHANGELOG. En un monorepo, `core` (tokens, tema, i18n) sería dependencia de todos los demás paquetes, y cada cambio suyo obligaría a coordinar versiones y rangos de peer. Combinaciones `core@x` + `charts@y` en un proyecto darían errores de tema difíciles de diagnosticar. Con un paquete único el flujo actual de changesets no cambia.
- **CI**: el workflow actual (`lint` → `type-check` → `build` → `build:playground`) sirve sin cambios. Un monorepo necesitaría workspaces, orden de build (`core` primero) y publicación por paquete.
- **Guardarraíl**: un script `scripts/check-entries.mjs` en CI, tras el build, recorre el grafo de imports de cada entry de `dist/` y falla si `index` alcanza un peer opcional o el chunk de otro dominio, o si un dominio alcanza uno que sus reglas no permiten.

## Consecuencias

**Positivas**

- Un proyecto instala un solo paquete y solo paga lo que importa: `@vsadtajo/adasa-ui` (core), `@vsadtajo/adasa-ui/map`, `@vsadtajo/adasa-ui/charts`...
- Añadir un dominio nuevo es mecánico: carpeta `src/<dominio>/`, entry en `vite.config.ts`, subpath en `package.json` y regla en ESLint.
- Las reglas de dependencia y `check-entries` evitan que, con el tiempo, un dominio arrastre el motor de otro sin que nadie lo note.
- La estructura `src/<dominio>/` se convierte 1:1 en paquetes de workspace si algún día hace falta separar.

**Costes**

- T0.3 implica mover casi todos los archivos (con `git mv`) y renombrar las clases y variables CSS en todos los componentes y en el playground.
- Los imports cambian: `ASMap*` pasa a importarse desde `@vsadtajo/adasa-ui/map`, no desde la raíz.
- Un arreglo en un dominio sube la versión del paquete entero. Es inocuo, pero el CHANGELOG mezcla dominios (cada changeset indicará el suyo).
- Con un único `style.css`, un proyecto carga el CSS de todos los dominios aunque no los use. Es aceptable mientras sea pequeño.

## Alternativas descartadas

- **Monorepo con un paquete por dominio** (`@vsadtajo/adasa-ui-core`, `-map`, `-charts`...). Ofrece el mismo aislamiento que los subpaths, pero añade coordinación de versiones entre paquetes, workspaces y publicación múltiple, sin ninguna ventaja de bundle.
- **Mantener `@vsadtajo/adasa-map-widgets`**. Evita el renombrado, pero el nombre quedaría engañoso cuando la mayoría de los componentes no sean de mapas, y renombrar después, con consumidores, sería mucho más caro.
- **Mantener `--amw-*` / `amw-*`**. No tiene coste hoy, pero deja un prefijo sin significado en la API pública de theming de toda la corporación.
- **Bundle único con todo cargado por `import()` dinámico**. Evitaría los subpaths, pero obligaría a que todo componente con dependencias pesadas sea asíncrono, y seguiría exigiendo los tipos de todas las dependencias en un `.d.ts` único.

## Cuándo revisar esta decisión

- Si un dominio necesita su propio ritmo de releases o pasa a tener un equipo propietario distinto, se evalúa separarlo en un paquete de workspace.
- Si `dist/style.css` supera ~100 KB, se pasa a CSS por subpath (`cssCodeSplit: true`).
