import type { TypeDoc } from './propTypes'

/*
 * Tipos auxiliares que se documentan en la sección "Tipos" de cada entrada
 * (los de las props complejas: arrays de secciones, logos, usuario...). Se
 * copian a mano del JSDoc de `src/<dominio>/types/`: si cambias un tipo, cámbialo aquí.
 */

export const ICON_VALUE_DOC: TypeDoc = {
  name: 'IconValue',
  union: true,
  description:
    'Lo que acepta cualquier prop de icono de la librería: un trazado SVG, un componente de cualquier librería o un nombre que traduce el resolvedor de provideIcons.',
  fields: [
    {
      key: 'string (trazado)',
      type: 'string',
      description: "Atributo d de un <path> de 24 × 24, p. ej. mdiLayers de '@mdi/js'.",
    },
    {
      key: 'string (nombre)',
      type: 'string',
      description:
        "Cualquier otro texto ('mdi:layers', 'tabler:map', 'mdi-layers'): lo traduce provideIcons a un trazado, un componente o las clases de una fuente.",
    },
    {
      key: 'Component',
      type: 'Component',
      description:
        'Un componente de icono (Lucide, Font Awesome, Heroicons...): recibe width y height.',
    },
    {
      key: '{ component, props }',
      type: 'IconComponentValue',
      description:
        "Un componente con sus props, p. ej. { component: Icon, props: { icon: 'mdi:map' } } de Iconify.",
    },
  ],
}

export const APP_SECTION_DOC: TypeDoc = {
  name: 'AppSection',
  description:
    'Una sección de la aplicación: un icono en la barra lateral (y una línea del menú en móvil) que abre su panel. Las define cada proyecto: cuántas, cuáles y en qué orden.',
  fields: [
    {
      key: 'id',
      type: 'string',
      required: true,
      description: 'Id estable. Es el valor de v-model:active-section.',
    },
    {
      key: 'label',
      type: 'string',
      required: true,
      description: 'Nombre accesible, tooltip y texto del menú en móvil.',
    },
    {
      key: 'icon',
      type: 'IconValue',
      required: true,
      description: 'Trazado, componente o nombre (ver IconValue).',
    },
    {
      key: 'position',
      type: "'top' | 'bottom'",
      default: "'top'",
      description:
        'Grupo de la barra: arriba o abajo del todo. En el menú móvil, las de abajo van al final.',
    },
    {
      key: 'hidden',
      type: 'boolean',
      default: 'false',
      description: 'Oculta la sección (p. ej. según el rol).',
    },
    {
      key: 'badge',
      type: 'number | string',
      description: 'Contador sobre el icono (p. ej. avisos activos). 0 o vacío no se muestra.',
    },
    {
      key: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Se ve pero no se puede abrir (sigue enfocable, con aria-disabled).',
    },
    {
      key: 'disabledReason',
      type: 'string',
      description: 'Por qué está deshabilitada: va al tooltip y al nombre accesible.',
    },
    { key: 'tooltip', type: 'string', default: 'label', description: 'Tooltip propio.' },
  ],
}

export const APP_LOGO_DOC: TypeDoc = {
  name: 'AppLogo',
  description: 'Un logo de la barra.',
  fields: [
    { key: 'src', type: 'string', required: true, description: 'URL de la imagen.' },
    {
      key: 'alt',
      type: 'string',
      required: true,
      description: "Texto alternativo; '' si es decorativo.",
    },
    { key: 'href', type: 'string', description: 'Enlace al pulsarlo (p. ej. la portada).' },
    {
      key: 'height',
      type: 'number',
      default: '40',
      description: 'Alto en px; el ancho sigue la proporción.',
    },
    { key: 'mobileHeight', type: 'number', default: '32', description: 'Alto en móvil.' },
    { key: 'hideOnMobile', type: 'boolean', default: 'false', description: 'Se oculta en móvil.' },
  ],
}

export const APP_USER_DOC: TypeDoc = {
  name: 'AppUser',
  description: 'Usuario de la sesión.',
  fields: [
    { key: 'name', type: 'string', description: 'Nombre completo.' },
    { key: 'email', type: 'string', description: 'Correo.' },
    { key: 'avatar', type: 'string', description: 'URL de la foto. Sin ella, las iniciales.' },
  ],
}

export const APP_LANGUAGE_DOC: TypeDoc = {
  name: 'AppLanguage',
  description: 'Idioma que ofrece el menú de usuario.',
  fields: [
    {
      key: 'code',
      type: 'string',
      required: true,
      description: "Código de provideLocale ('es', 'en', 'ca'...).",
    },
    {
      key: 'label',
      type: 'string',
      required: true,
      description: 'Nombre en su propio idioma ("Català").',
    },
  ],
}

export const RESOLVED_ICON_DOC: TypeDoc = {
  name: 'ResolvedIcon',
  description:
    'Lo que devuelve el resolvedor de provideIcons para un nombre (o undefined si no lo conoce: se pinta un hueco y avisa una vez en consola).',
  union: true,
  fields: [
    { key: '{ path }', type: '{ path: string }', description: 'Un trazado SVG de 24 × 24.' },
    {
      key: '{ component, props? }',
      type: '{ component: Component; props?: object }',
      description: 'Un componente, p. ej. { component: Icon, props: { icon: name } } de Iconify.',
    },
    {
      key: '{ class }',
      type: '{ class: string }',
      description:
        "Clases de una fuente de iconos, p. ej. { class: 'mdi mdi-layers' } de @mdi/font.",
    },
  ],
}

export const TREE_NODE_DOC: TypeDoc = {
  name: 'TreeNode',
  description:
    'Un nodo de ASTreeList: una hoja (lo que se selecciona: una capa, una estación...) o un grupo, si tiene children.',
  fields: [
    {
      key: 'id',
      type: 'string',
      required: true,
      description: 'Único en todo el árbol. En las hojas, es lo que va en v-model.',
    },
    {
      key: 'label',
      type: 'string',
      required: true,
      description: 'Texto de la fila y su nombre accesible.',
    },
    { key: 'description', type: 'string', description: 'Segunda línea, más pequeña.' },
    { key: 'icon', type: 'IconValue', description: 'Icono delante del texto.' },
    { key: 'swatch', type: 'string', description: 'Muestra de color (CSS), como en una leyenda.' },
    {
      key: 'children',
      type: 'TreeNode[]',
      description: 'Lo convierte en grupo. [] = grupo vacío.',
    },
    { key: 'emptyText', type: 'string', description: 'Texto de un grupo vacío al desplegarlo.' },
    {
      key: 'defaultExpanded',
      type: 'boolean',
      default: 'false',
      description: 'Desplegado al montar (si expanded no se controla).',
    },
    {
      key: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Se ve y se enfoca, pero no se selecciona.',
    },
    {
      key: 'disabledReason',
      type: 'string',
      description: 'Motivo: tooltip, segunda línea y se anuncia.',
    },
    {
      key: 'badge',
      type: 'number | string',
      description: 'Contador al final de la fila. 0 o vacío no se muestra.',
    },
    {
      key: 'loading',
      type: 'boolean',
      default: 'false',
      description: 'Indicador de carga en lugar de la casilla; no se selecciona.',
    },
    {
      key: 'opacity',
      type: 'boolean',
      default: 'false',
      description: 'Slider de opacidad bajo la hoja mientras está seleccionada.',
    },
    {
      key: 'actions',
      type: 'TreeNodeAction[]',
      description: 'Botones de la fila: emiten node-action.',
    },
  ],
}

export const TREE_NODE_ACTION_DOC: TypeDoc = {
  name: 'TreeNodeAction',
  description: 'Botón de una fila de ASTreeList (borrar, zoom a la capa, descargar...).',
  fields: [
    { key: 'id', type: 'string', required: true, description: 'Llega en node-action.' },
    { key: 'label', type: 'string', required: true, description: 'Nombre accesible y tooltip.' },
    { key: 'icon', type: 'IconValue', required: true, description: 'Icono del botón.' },
    {
      key: 'danger',
      type: 'boolean',
      default: 'false',
      description: 'Acción destructiva: color de peligro.',
    },
  ],
}

export const TREE_SELECTION_DOC: TypeDoc = {
  name: 'TreeSelection',
  description: 'Modo de selección de ASTreeList.',
  union: true,
  fields: [
    {
      key: "'multiple'",
      type: 'string',
      description:
        'Casillas. La de un grupo marca o desmarca sus hojas y queda a medias (mixed) si solo hay algunas.',
    },
    {
      key: "'single'",
      type: 'string',
      description: 'Una hoja a la vez (radios). Los grupos solo se despliegan.',
    },
    { key: "'none'", type: 'string', description: 'Solo lista: las hojas emiten node-click.' },
  ],
}

export const TREE_SLOT_DOC: TypeDoc = {
  name: 'TreeNodeSlotProps',
  description: 'Props del slot #node de ASTreeList (el texto de cada fila).',
  fields: [
    { key: 'node', type: 'TreeNode', required: true, description: 'El nodo.' },
    { key: 'level', type: 'number', required: true, description: 'Profundidad, desde 1.' },
    {
      key: 'state',
      type: "'checked' | 'unchecked' | 'mixed'",
      required: true,
      description: 'Estado de su casilla.',
    },
    { key: 'expanded', type: 'boolean', required: true, description: 'Si es un grupo desplegado.' },
  ],
}

export const HYDRO_VARIABLE_DOC: TypeDoc = {
  name: 'HydroVariable',
  description:
    'Una variable del hidrograma: discharge, inflow, outflow, volume, level o precipitation. Observado y previsiones.',
  fields: [
    {
      key: 'observed',
      type: 'HydroPoint[]',
      description:
        'Serie observada ([Date, number | null]; null deja un hueco): línea sólida o barras.',
    },
    {
      key: 'observedName',
      type: 'string',
      default: "'Observado' o el nombre de la variable",
      description: 'Nombre en la leyenda y el tooltip.',
    },
    {
      key: 'observedStyle',
      type: 'HydroLineStyle',
      default: "{ width: 2, type: 'solid' }",
      description:
        'Color, grosor y trazo del observado. Color por defecto: el 1.º de la paleta en caudal y lluvia; uno fijo por variable en el resto. En la lluvia (barras), solo el color.',
    },
    { key: 'observedColor', type: 'string', description: 'Obsoleta: usa observedStyle.color.' },
    {
      key: 'forecasts',
      type: 'HydroForecast[]',
      description: 'Previsiones: discontinuas, con bandas de percentiles.',
    },
    {
      key: 'unit',
      type: 'string',
      default: "'m³/s', 'hm³', 'm', 'mm'",
      description: "Unidad del eje ('msnm' para cotas). Entrada y salida usan la del caudal.",
    },
    { key: 'label', type: 'string', description: 'Título del eje y nombre de la variable.' },
  ],
}

export const HYDRO_FORECAST_DOC: TypeDoc = {
  name: 'HydroForecast',
  description:
    'Una fuente de previsión (Harmonie, EPS...). El mismo id en varias variables es la misma fuente (selector de previsiones).',
  fields: [
    { key: 'id', type: 'string', required: true, description: 'Id estable de la fuente.' },
    {
      key: 'name',
      type: 'string',
      required: true,
      description: 'Nombre visible. Fuera del caudal, "Variable · Fuente".',
    },
    {
      key: 'style',
      type: 'HydroLineStyle',
      default: "{ width: 2, type: 'dashed' }",
      description:
        'Color, grosor y trazo de su línea; el color también tiñe sus bandas y sus barras de lluvia. Color por defecto: en caudal y lluvia, por fuente; en el resto, el de la variable.',
    },
    { key: 'color', type: 'string', description: 'Obsoleta: usa style.color.' },
    { key: 'values', type: 'HydroPoint[]', description: 'Serie determinista o mediana (p50).' },
    {
      key: 'percentiles',
      type: '{ p10?, p25?, p75?, p90?: HydroPoint[] }',
      description: 'Bandas de incertidumbre (p10–p90 y p25–p75).',
    },
  ],
}

export const HYDRO_THRESHOLD_DOC: TypeDoc = {
  name: 'HydroThreshold',
  description: 'Umbral de aviso: una línea horizontal en el eje de su variable.',
  fields: [
    { key: 'value', type: 'number', required: true, description: 'Valor, en la unidad de su eje.' },
    {
      key: 'level',
      type: "'normal' | 'amarillo' | 'naranja' | 'rojo' | string",
      required: true,
      description: 'Nivel de aviso: da el color.',
    },
    { key: 'label', type: 'string', default: "'Umbral <nivel>'", description: 'Etiqueta.' },
    {
      key: 'variable',
      type: "'discharge' | 'volume' | 'level'",
      default: "'discharge'",
      description: 'Eje del umbral. Si esa variable no está, va al eje principal.',
    },
  ],
}

export const HYDROGRAPH_TOOLBAR_DOC: TypeDoc = {
  name: 'HydrographToolbarConfig',
  description: 'La barra de ASChart (png, svg, csv, items...) más tres acciones propias.',
  fields: [
    {
      key: 'forecastSelector',
      type: 'boolean',
      default: 'true',
      description: 'Selector de previsiones visibles (todas las variables).',
    },
    {
      key: 'bandsToggle',
      type: 'boolean',
      default: 'true',
      description: 'Muestra u oculta los percentiles.',
    },
    {
      key: 'focusThreshold',
      type: 'boolean',
      default: 'true',
      description: 'Enfoca los umbrales uno a uno.',
    },
  ],
}

export const HYDRO_LINE_STYLE_DOC: TypeDoc = {
  name: 'HydroLineStyle',
  description:
    'Estilo de una serie del hidrograma (observedStyle de cada variable y style de cada previsión).',
  fields: [
    {
      key: 'color',
      type: 'string',
      description:
        "Color CSS, o 'var(--as-data-cat-N)' para un color del tema que respete claro y oscuro.",
    },
    {
      key: 'width',
      type: 'number',
      default: '2',
      description: 'Grosor de la línea en px (no se usa en las barras de lluvia).',
    },
    {
      key: 'type',
      type: "'solid' | 'dashed' | 'dotted' | 'dashdot'",
      default: "'solid' / 'dashed'",
      description:
        'Trazo: continua, discontinua, puntos o punto y raya. Por defecto, continua en el observado y discontinua en las previsiones.',
    },
  ],
}
