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
    'Una variable del hidrograma (discharge, inflow, outflow, volume, level o precipitation): sus series observadas y sus previsiones, cada una con su nombre y su estilo.',
  fields: [
    {
      key: 'observed',
      type: 'HydroObserved[]',
      description:
        'Series observadas (una o varias, p. ej. SAIH y aforos manuales), cada una con su id, nombre, valores y estilo.',
    },
    {
      key: 'forecasts',
      type: 'HydroForecast[]',
      description: 'Previsiones: discontinuas por defecto, con bandas de percentiles.',
    },
    {
      key: 'unit',
      type: 'string',
      default: "'m³/s', 'hm³', 'm', 'mm'",
      description:
        "Unidad del eje ('msnm' para cotas; 'mm/h' para intensidad de lluvia). Entrada y salida usan la del caudal.",
    },
    { key: 'label', type: 'string', description: 'Título del eje y nombre de la variable.' },
  ],
}

export const HYDRO_OBSERVED_DOC: TypeDoc = {
  name: 'HydroObserved',
  description:
    'Una serie observada de una variable. Su serie es <variable>-observed-<id> (para seriesOverrides).',
  fields: [
    {
      key: 'id',
      type: 'string',
      required: true,
      description: "Id estable dentro de la variable (p. ej. 'saih').",
    },
    {
      key: 'name',
      type: 'string',
      required: true,
      description: 'Nombre en la leyenda, el tooltip, la tabla y el CSV.',
    },
    {
      key: 'values',
      type: 'HydroPoint[]',
      required: true,
      description: 'Puntos [instante, valor]; null deja un hueco.',
    },
    {
      key: 'style',
      type: 'HydroLineStyle',
      default: "{ width: 2, type: 'solid' }",
      description:
        'Color, grosor y trazo. El 1.º observado lleva el color de la variable; los siguientes, otros de la paleta (mejor darles color). En la lluvia, solo el color.',
    },
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
    { key: 'values', type: 'HydroPoint[]', description: 'Serie determinista o mediana (p50).' },
    {
      key: 'percentiles',
      type: '{ p10?, p25?, p75?, p90?: HydroPoint[] }',
      description:
        'Datos de las bandas de incertidumbre: p10 y p90 forman la banda p10–p90; p25 y p75, la p25–p75. Cada par en los mismos instantes. Cuáles se dibujan lo decide la prop bands (o su botón de la barra).',
    },
    {
      key: 'bandStyle',
      type: "Partial<Record<'p10-p90' | 'p25-p75', HydroBandStyle>>",
      description:
        'Aspecto de cada banda: color, opacidad, nombre y si sale en la leyenda. Por defecto, el color de la previsión, opacidad 0,15 / 0,3 y en la leyenda.',
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
    'Estilo de una serie del hidrograma: el style de cada observado y el de cada previsión.',
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

export const HYDRO_BAND_STYLE_DOC: TypeDoc = {
  name: 'HydroBandStyle',
  description:
    "Aspecto de una banda de percentiles, en bandStyle de la previsión: { 'p10-p90': {...}, 'p25-p75': {...} }.",
  fields: [
    {
      key: 'color',
      type: 'string',
      default: 'el de la previsión',
      description: 'Color del relleno.',
    },
    {
      key: 'opacity',
      type: 'number',
      default: '0.15 / 0.3',
      description: 'Opacidad del relleno (0–1): 0,15 en p10–p90 y 0,3 en p25–p75.',
    },
    {
      key: 'name',
      type: 'string',
      default: "'<previsión> p10–p90'",
      description: 'Nombre en la leyenda, el tooltip, la tabla y el CSV.',
    },
    { key: 'legend', type: 'boolean', default: 'true', description: 'Aparece en la leyenda.' },
  ],
}

export const PRECIPITATION_SERIES_DOC: TypeDoc = {
  name: 'PrecipitationSeries',
  description:
    'Una serie de precipitación: observada (telemetría, P. areal...) o prevista (WRF, ECMWF...).',
  fields: [
    {
      key: 'id',
      type: 'string',
      required: true,
      description: "Id estable: sus series son 'precipitation-<id>' y 'cumulative-<id>'.",
    },
    {
      key: 'name',
      type: 'string',
      required: true,
      description: 'Nombre en la leyenda, el tooltip, la tabla y el CSV.',
    },
    {
      key: 'values',
      type: 'HydroPoint[]',
      required: true,
      description: 'Puntos [instante, valor]; null deja un hueco. Se ordenan por fecha.',
    },
    {
      key: 'input',
      type: "'depth' | 'intensity'",
      default: "'depth'",
      description:
        "Cómo llegan: mm caídos en el intervalo que termina en cada instante ('depth') o mm/h ('intensity'). Se convierten a lo que muestra rate.",
    },
    {
      key: 'intervalMinutes',
      type: 'number',
      description:
        'Duración fija de cada intervalo (sin ella, la distancia al punto anterior; el primero, la mediana).',
    },
    {
      key: 'kind',
      type: "'observed' | 'forecast'",
      default: "'observed'",
      description: 'Cambia el dibujo por defecto y de qué serie continúa el acumulado.',
    },
    {
      key: 'display',
      type: "'line' | 'area' | 'bar'",
      default: "'line' / 'area'",
      description: 'Línea en observado y área en previsto, por defecto.',
    },
    {
      key: 'style',
      type: 'HydroLineStyle',
      default: "{ width: 2, type: 'solid' / 'dashed' }",
      description: 'Color, grosor y trazo.',
    },
    {
      key: 'gradient',
      type: 'boolean | ChartGradient',
      default: 'true en previsto',
      description: 'Relleno en degradado (solo en área).',
    },
    {
      key: 'cumulative',
      type: 'boolean | PrecipitationCumulative',
      description: 'Su acumulado en el eje derecho (mm). Sin él, no tiene.',
    },
  ],
}

export const PRECIPITATION_CUMULATIVE_DOC: TypeDoc = {
  name: 'PrecipitationCumulative',
  description:
    'Acumulado de una serie: una línea en el eje derecho (mm), en la línea "Acumulado" de la leyenda.',
  fields: [
    {
      key: 'name',
      type: 'string',
      default: "'<serie> (acumulado)'",
      description: 'Nombre en el tooltip, la tabla y el CSV.',
    },
    {
      key: 'style',
      type: 'HydroLineStyle',
      default: 'color de su serie, 3 px',
      description: 'Continuo en observado y discontinuo en previsto, por defecto.',
    },
    {
      key: 'from',
      type: 'Date',
      default: 'el primer punto',
      description: 'Empieza a sumar en este instante.',
    },
    {
      key: 'continueFrom',
      type: 'string | false',
      default: 'en previsto, el primer observado con acumulado',
      description:
        'Id de la serie cuyo total continúa (el total del episodio en una sola curva); false, desde 0.',
    },
  ],
}

export const PRECIPITATION_THRESHOLD_DOC: TypeDoc = {
  name: 'PrecipitationThreshold',
  description: 'Umbral de intensidad (eje izquierdo) o de acumulado (derecho).',
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
      key: 'axis',
      type: "'rate' | 'cumulative'",
      default: "'rate'",
      description: 'Eje del umbral (el de acumulado, solo si hay acumulados).',
    },
  ],
}

export const CHART_GRADIENT_DOC: TypeDoc = {
  name: 'ChartGradient',
  description: 'Degradado vertical del relleno de un área (gradient), igual en los tres motores.',
  fields: [
    {
      key: 'from',
      type: 'number',
      default: 'la opacidad de la serie o 0,5',
      description: 'Opacidad junto a la línea.',
    },
    { key: 'to', type: 'number', default: '0.05', description: 'Opacidad en la base del área.' },
  ],
}

export const PRECIPITATION_TOOLBAR_DOC: TypeDoc = {
  name: 'PrecipitationToolbarConfig',
  description: 'La barra de ASChart (png, svg, csv, items...) más el botón de los acumulados.',
  fields: [
    {
      key: 'cumulativeToggle',
      type: 'boolean',
      default: 'true',
      description: 'Muestra u oculta todos los acumulados (solo si alguna serie lo tiene).',
    },
  ],
}
