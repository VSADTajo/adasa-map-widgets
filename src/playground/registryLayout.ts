import LayoutPieceDemo from './components/LayoutPieceDemo.vue'
import type { PropField } from './propTypes'
import type { RegistryEntry } from './registry'
import { DEMO_SECTIONS } from './utils/appShellExample'
import { formsToSnippet } from './utils/formsExample'
import { appSearchSuggestions, DEMO_LOGOS, DEMO_USER } from './utils/layoutExample'

/**
 * Entradas de las piezas del layout (las que coordina `ASAppShell`, y las
 * de su barra). Cada una se ve en su sitio con `LayoutPieceDemo`.
 */

type Values = Record<string, unknown>

/** Valores del editor → props: `''` es "sin prop"; `piece` elige la pieza a mostrar. */
const withoutEmpty = (values: Values): Values =>
  Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ''))

const SECTION_FIELD: PropField = {
  key: 'activeSection',
  label: 'Sección abierta',
  type: 'select',
  options: ['', ...DEMO_SECTIONS.map((section) => section.id)],
  default: 'capas',
}

/** Nombre del listener de Vue para un evento: `update:x` → `onUpdate:x`; `a-b` → `onAB`. */
function handlerName(event: string): string {
  if (event.startsWith('update:')) return `onUpdate:${event.slice('update:'.length)}`
  return `on${event
    .split('-')
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join('')}`
}

/** Listeners que registran en el log y, si se indica, sincronizan el valor en el editor (v-model). */
function logBindings(
  events: string[],
  sync: Record<string, string> = {},
): RegistryEntry['bindings'] {
  return (values, log) =>
    Object.fromEntries(
      events.map((event) => [
        handlerName(event),
        (payload: unknown) => {
          const key = sync[event]
          if (key) values[key] = payload ?? ''
          log(event, payload)
        },
      ]),
    )
}

const BRAND_SCHEMA: PropField[] = [
  { key: 'title', label: 'Nombre de la app', type: 'string', default: 'Visor' },
  { key: 'subtitle', label: 'Subtítulo', type: 'string', default: 'Preproducción' },
  {
    key: 'compact',
    label: 'Reducido (móvil)',
    type: 'boolean',
    default: false,
    description: 'Dentro de ASAppShell se activa solo en móvil.',
  },
]

const SEARCH_SCHEMA: PropField[] = [
  {
    key: 'placeholder',
    label: 'Placeholder',
    type: 'string',
    default: 'Estación, municipio o código',
  },
  { key: 'minChars', label: 'Caracteres mínimos', type: 'number', default: 2, min: 1, max: 5 },
  {
    key: 'debounce',
    label: 'Debounce (ms)',
    type: 'number',
    default: 300,
    min: 0,
    max: 2000,
    step: 50,
  },
]

const USER_MENU_SCHEMA: PropField[] = [
  {
    key: 'userName',
    label: 'Nombre del usuario',
    type: 'string',
    default: DEMO_USER.name!,
    playgroundOnly: true,
  },
  {
    key: 'userEmail',
    label: 'Correo del usuario',
    type: 'string',
    default: DEMO_USER.email!,
    playgroundOnly: true,
  },
  {
    key: 'showTheme',
    label: 'Interruptor de tema',
    type: 'boolean',
    default: true,
    description: 'Sin v-model:theme, cambia el tema del playground (provideTheme).',
  },
  {
    key: 'showLocale',
    label: 'Selector de idioma',
    type: 'boolean',
    default: true,
    description: 'Sin v-model:locale, cambia el idioma del playground (provideLocale).',
  },
  { key: 'showLogout', label: '"Cerrar sesión"', type: 'boolean', default: true },
  { key: 'label', label: 'Nombre accesible', type: 'string', default: '' },
]

const DRAWER_SCHEMA: PropField[] = [
  { key: 'open', label: 'Abierto', type: 'boolean', default: true },
  { key: 'width', label: 'Ancho (px)', type: 'number', default: 320, min: 200, max: 480, step: 20 },
  { key: 'label', label: 'Nombre accesible', type: 'string', default: 'Capas' },
]

const DETAIL_SCHEMA: PropField[] = [
  { key: 'open', label: 'Abierto', type: 'boolean', default: true },
  {
    key: 'offset',
    label: 'Desde la izquierda (px)',
    type: 'number',
    default: 120,
    min: 0,
    max: 600,
    step: 20,
    description: 'En ASAppShell, el borde de los menús.',
  },
  { key: 'closeButton', label: 'Botón de cerrar', type: 'boolean', default: true },
  { key: 'label', label: 'Nombre accesible', type: 'string', default: '' },
  { key: 'closeLabel', label: 'Nombre del botón de cerrar', type: 'string', default: '' },
]

const SHEET_SCHEMA: PropField[] = [
  { key: 'open', label: 'Abierto', type: 'boolean', default: true },
  { key: 'expanded', label: 'Ampliado (v-model)', type: 'boolean', default: false },
  { key: 'height', label: 'Altura sin ampliar', type: 'string', default: '60%' },
  { key: 'label', label: 'Nombre accesible', type: 'string', default: 'Capas' },
]

const MOBILE_MENU_SCHEMA: PropField[] = [
  { key: 'open', label: 'Desplegado (v-model)', type: 'boolean', default: true },
  SECTION_FIELD,
]

const TOP_BAR_SCHEMA: PropField[] = [
  {
    key: 'position',
    label: 'Posición',
    type: 'select',
    options: ['top', 'bottom'],
    default: 'top',
  },
  { key: 'height', label: 'Alto (px)', type: 'number', default: 64, min: 48, max: 96, step: 4 },
]

const RAIL_SCHEMA: PropField[] = [
  SECTION_FIELD,
  { key: 'width', label: 'Ancho (px)', type: 'number', default: 56, min: 40, max: 96, step: 4 },
]

const PANEL_HEADER_SCHEMA: PropField[] = [
  { key: 'title', label: 'Título', type: 'string', default: 'Capas' },
  {
    key: 'direction',
    label: 'Flecha',
    type: 'select',
    options: ['left', 'down'],
    default: 'left',
    description: 'left en escritorio (el panel sale por la izquierda), down en móvil.',
  },
  { key: 'closeLabel', label: 'Nombre del botón', type: 'string', default: '' },
]

/**
 * Entrada de una pieza: se muestra con `LayoutPieceDemo` (`piece`), y
 * `map` adapta los valores del editor a props si hace falta.
 */
function pieceEntry(
  entry: Omit<RegistryEntry, 'category' | 'component' | 'toProps'> & {
    piece: string
    map?: (values: Values) => Values
  },
): RegistryEntry {
  const { piece, map, ...rest } = entry
  return {
    ...rest,
    category: 'layout',
    component: LayoutPieceDemo,
    toProps: (values) => {
      const props = withoutEmpty(values)
      return { ...(map ? map(props) : props), piece }
    },
  }
}

export const layoutEntries: RegistryEntry[] = [
  pieceEntry({
    id: 'as-app-brand',
    name: 'ASAppBrand',
    piece: 'brand',
    description:
      'Logos, nombre y subtítulo de la aplicación en la barra (los logos de la TopBar de TAJO). Dentro de ASAppShell en móvil se reduce sola.',
    propsSchema: BRAND_SCHEMA,
    events: [],
    staticProps: { logos: DEMO_LOGOS },
    toSnippet: formsToSnippet('ASAppBrand', BRAND_SCHEMA, { extra: [':logos="logos"'] }),
    notes:
      'Cada logo: { src, alt, href?, height?, mobileHeight?, hideOnMobile? }. Con "Reducido" se ve como en móvil: sin el logo del ministerio (hideOnMobile) ni el subtítulo.',
  }),
  pieceEntry({
    id: 'as-app-search',
    name: 'ASAppSearch',
    piece: 'search',
    description:
      'Buscador de la barra (el autocompletado de la TopBar de TAJO): ASSearchInput en forma de píldora, con etiquetas, acciones y avisos de no disponible por sugerencia.',
    propsSchema: SEARCH_SCHEMA,
    events: [
      { name: 'update:modelValue', payload: 'string', description: 'Texto del campo.' },
      { name: 'select', payload: 'SearchSuggestion', description: 'Sugerencia elegida.' },
      {
        name: 'suggestion-action',
        payload: '{ actionId, suggestion }',
        description:
          'Acción de una sugerencia (aquí, "Centrar en el mapa"). Con el teclado, Mayús + Intro.',
      },
      { name: 'submit', payload: 'string', description: 'Intro sin sugerencia activa.' },
    ],
    staticProps: { fetchSuggestions: appSearchSuggestions() },
    toSnippet: formsToSnippet('ASAppSearch', SEARCH_SCHEMA, {
      extra: [
        ':fetch-suggestions="buscar"',
        '@select="abrirFicha"',
        '@suggestion-action="centrar"',
      ],
    }),
    notes:
      'Escribe "ara" o "emb": las estaciones traen su tipo (Aforo, Embalse) y su origen como etiquetas, un botón "Centrar en el mapa", y el Embalse de San Juan sale como no visible en el mapa.',
    bindings: logBindings(['update:modelValue', 'select', 'suggestion-action', 'submit']),
  }),
  pieceEntry({
    id: 'as-app-user-menu',
    name: 'ASAppUserMenu',
    piece: 'user-menu',
    map: ({ userName, userEmail, ...props }) => ({
      ...props,
      user: { name: userName, email: userEmail },
    }),
    description:
      'Avatar con el menú del usuario (el UserMenu de TAJO): nombre y correo, tema oscuro, idioma, opciones propias y cerrar sesión.',
    propsSchema: USER_MENU_SCHEMA,
    events: [
      { name: 'update:theme', payload: "'light' | 'dark'", description: 'Interruptor de tema.' },
      { name: 'update:locale', payload: 'string', description: 'Idioma elegido.' },
      { name: 'select', payload: 'MenuItem', description: 'Opción propia (items).' },
      { name: 'logout', description: 'Cerrar sesión: el proyecto borra la sesión y redirige.' },
    ],
    toSnippet: formsToSnippet('ASAppUserMenu', USER_MENU_SCHEMA, {
      extra: [':user="{ name, email }"', '@logout="cerrarSesion"'],
    }),
    notes:
      'Sin v-model, el tema y el idioma cambian los del playground: pruébalo. Se maneja con el teclado como ASMenu.',
    bindings: logBindings(['update:theme', 'update:locale', 'select', 'logout']),
  }),
  pieceEntry({
    id: 'as-app-top-bar',
    name: 'ASAppTopBar',
    piece: 'top-bar',
    description:
      'Barra corporativa: marco con los slots brand, search y actions (y start). ASAppShell la pone arriba en escritorio y abajo en móvil.',
    propsSchema: TOP_BAR_SCHEMA,
    events: [],
    toSnippet: formsToSnippet('ASAppTopBar', TOP_BAR_SCHEMA, {
      slot: () =>
        '\n  <template #brand><ASAppBrand :logos="logos" /></template>\n  <template #search><ASAppSearch :fetch-suggestions="buscar" /></template>\n  <template #actions><ASAppUserMenu :user="usuario" /></template>\n',
    }),
  }),
  pieceEntry({
    id: 'as-app-rail',
    name: 'ASAppRail',
    piece: 'rail',
    description: 'Barra vertical de iconos de sección (el DesktopRail de TAJO).',
    propsSchema: RAIL_SCHEMA,
    events: [{ name: 'toggle', payload: 'string', description: 'Sección pulsada.' }],
    staticProps: { sections: DEMO_SECTIONS },
    toSnippet: formsToSnippet('ASAppRail', RAIL_SCHEMA, {
      extra: [':sections="secciones"', '@toggle="alternar"'],
    }),
    bindings: (values, log) => ({
      onToggle: (id) => {
        values.activeSection = values.activeSection === id ? '' : id
        log('toggle', id)
      },
    }),
  }),
  pieceEntry({
    id: 'as-app-drawer',
    name: 'ASAppDrawer',
    piece: 'drawer',
    description:
      'Panel de sección de escritorio (el SecondaryDrawer de TAJO): se abre ensanchándose y empuja el contenido.',
    propsSchema: DRAWER_SCHEMA,
    events: [],
    toSnippet: formsToSnippet('ASAppDrawer', DRAWER_SCHEMA, { slot: () => '<PanelCapas />' }),
    notes: 'Cerrado mide 0 y es inerte, pero conserva su contenido mientras sale.',
  }),
  pieceEntry({
    id: 'as-app-detail-panel',
    name: 'ASAppDetailPanel',
    piece: 'detail',
    description:
      'Panel de detalle (el RightNavigation de TAJO): entra por la derecha y tapa el contenido desde offset.',
    propsSchema: DETAIL_SCHEMA,
    events: [{ name: 'close', description: 'Botón de cerrar.' }],
    toSnippet: formsToSnippet('ASAppDetailPanel', DETAIL_SCHEMA, {
      extra: ['@close="detalle = false"'],
      slot: () => '<FichaEstacion />',
    }),
    bindings: (values, log) => ({
      onClose: () => {
        values.open = false
        log('close')
      },
    }),
  }),
  pieceEntry({
    id: 'as-app-bottom-sheet',
    name: 'ASAppBottomSheet',
    piece: 'sheet',
    description:
      'Panel móvil que sube desde abajo (el MobileBottomDrawer de TAJO), con un asa para ampliarlo a toda la altura.',
    propsSchema: SHEET_SCHEMA,
    events: [
      {
        name: 'update:expanded',
        payload: 'boolean',
        description: 'Asa pulsada (v-model:expanded).',
      },
    ],
    toSnippet: formsToSnippet('ASAppBottomSheet', SHEET_SCHEMA, { slot: () => '<PanelCapas />' }),
    bindings: logBindings(['update:expanded'], { 'update:expanded': 'expanded' }),
  }),
  pieceEntry({
    id: 'as-app-mobile-menu',
    name: 'ASAppMobileMenu',
    piece: 'mobile-menu',
    description:
      'Menú de secciones del móvil: sube encima de la barra, con un fondo que lo cierra al tocar fuera.',
    propsSchema: MOBILE_MENU_SCHEMA,
    events: [
      { name: 'update:open', payload: 'boolean', description: 'Se cerró tocando fuera.' },
      { name: 'select', payload: 'string', description: 'Sección elegida.' },
    ],
    staticProps: { sections: DEMO_SECTIONS },
    toSnippet: formsToSnippet('ASAppMobileMenu', MOBILE_MENU_SCHEMA, {
      extra: [':sections="secciones"', 'v-model:open="menu"', '@select="abrir"'],
    }),
    bindings: logBindings(['update:open', 'select'], {
      'update:open': 'open',
      select: 'activeSection',
    }),
  }),
  pieceEntry({
    id: 'as-app-panel-header',
    name: 'ASAppPanelHeader',
    piece: 'panel-header',
    description: 'Cabecera de un panel de sección: título y botón de cerrar con flecha.',
    propsSchema: PANEL_HEADER_SCHEMA,
    events: [{ name: 'close', description: 'Botón de cerrar.' }],
    toSnippet: formsToSnippet('ASAppPanelHeader', PANEL_HEADER_SCHEMA, {
      extra: ['@close="cerrarPanel"'],
    }),
    bindings: logBindings(['close']),
  }),
]
