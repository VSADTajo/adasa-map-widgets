import type { AppSection } from '@/layout/types/AppShellProps'
import type { PropField } from '../propTypes'

/**
 * Secciones de ejemplo de `ASAppShell` (las de un visor SAIH). Los iconos van
 * por nombre: los traduce el `provideIcons` del playground (`utils/icons.ts`),
 * `mdi:` con `@mdi/js` y `tabler:` con Iconify. Son JSON puro para que se
 * puedan editar en el playground.
 */
export const DEMO_SECTIONS: AppSection[] = [
  { id: 'capas', label: 'Capas', icon: 'mdi:layers' },
  { id: 'avisos', label: 'Avisos', icon: 'mdi:alert', badge: 3, tooltip: 'Avisos activos' },
  { id: 'informes', label: 'Informes', icon: 'mdi:file-document' },
  {
    id: 'simulaciones',
    label: 'Simulaciones',
    icon: 'tabler:chart-dots',
    disabled: true,
    disabledReason: 'Solo para administradores',
  },
  { id: 'mapasbase', label: 'Mapas base', icon: 'mdi:map', position: 'bottom' },
  { id: 'ajustes', label: 'Ajustes', icon: 'mdi:tune', position: 'bottom' },
]

/** Campo JSON de `sections` (el array lo decide cada proyecto: cuántas, cuáles y dónde). */
export const SECTIONS_FIELD: PropField = {
  key: 'sections',
  label: 'Secciones (JSON)',
  type: 'json',
  default: DEMO_SECTIONS,
  docType: 'AppSection[]',
  snippetVar: 'secciones',
  description:
    "Edítalas: añade o quita, position 'top' | 'bottom', badge, disabled... Iconos: trazado o nombre ('mdi:…', 'tabler:…').",
}

/** Ids de las secciones visibles que haya en el editor, para elegir la abierta. */
export function sectionOptions(values: Record<string, unknown>): string[] {
  const sections = Array.isArray(values.sections) ? (values.sections as AppSection[]) : []
  return [
    '',
    ...sections
      .filter((section) => section && typeof section.id === 'string' && !section.hidden)
      .map((section) => section.id),
  ]
}

type Values = Record<string, unknown>

/** El formulario usa `''` para "ninguna sección": el shell espera `null`. */
export function appShellToProps(values: Values): Values {
  return { ...values, activeSection: values.activeSection || null }
}

export function appShellToSnippet(values: Values): string {
  const attributes = [
    ':sections="secciones"',
    'v-model:active-section="seccion"',
    'v-model:detail-open="detalle"',
  ]
  if (values.breakpoint !== 960) attributes.push(`:breakpoint="${values.breakpoint}"`)
  if (values.railWidth !== 56) attributes.push(`:rail-width="${values.railWidth}"`)
  if (values.drawerWidth !== 320) attributes.push(`:drawer-width="${values.drawerWidth}"`)
  if (values.switchDelay !== 280) attributes.push(`:switch-delay="${values.switchDelay}"`)
  if (values.detailCloseButton === false) attributes.push(':detail-close-button="false"')
  if (values.theme) attributes.push(`theme="${values.theme}"`)
  return [
    '<ASAppShell',
    ...attributes.map((attribute) => `  ${attribute}`),
    '>',
    '  <template #brand><img src="/logo.svg" alt="Mi visor" /></template>',
    '  <template #search><MiBuscador /></template>',
    '  <template #actions><MiMenuUsuario /></template>',
    '',
    '  <template #section="{ section, close, mobile }">',
    `    <ASAppPanelHeader :title="section.label" :direction="mobile ? 'down' : 'left'" @close="close" />`,
    `    <PanelCapas v-if="section.id === 'capas'" />`,
    '  </template>',
    '',
    '  <template #detail><!-- ficha de la estación, gráficas... --></template>',
    '',
    '  <ASMap :layers="capas" @map-click="detalle = true" />',
    '</ASAppShell>',
  ].join('\n')
}
