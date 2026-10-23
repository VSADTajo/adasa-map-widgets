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
