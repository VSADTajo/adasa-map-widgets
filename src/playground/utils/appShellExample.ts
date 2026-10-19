import type { AppSection } from '@/layout/types/AppShellProps'

/**
 * Secciones de ejemplo de `ASAppShell` (las de un visor SAIH), con iconos de
 * Material Design Icons (los mismos trazados que exporta `@mdi/js`).
 */
export const DEMO_SECTIONS: AppSection[] = [
  {
    id: 'capas',
    label: 'Capas',
    icon: 'M12,16L19.36,10.27L21,9L12,2L3,9L4.63,10.27M12,18.54L4.62,12.81L3,14.07L12,21.07L21,14.07L19.37,12.8L12,18.54Z',
  },
  { id: 'avisos', label: 'Avisos', icon: 'M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z' },
  {
    id: 'informes',
    label: 'Informes',
    icon: 'M13,9H18.5L13,3.5V9M6,2H14L20,8V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V4C4,2.89 4.89,2 6,2M15,18V16H6V18H15M18,14V12H6V14H18Z',
  },
  {
    id: 'mapasbase',
    label: 'Mapas base',
    position: 'bottom',
    icon: 'M15,19L9,16.89V5L15,7.11M20.5,3C20.44,3 20.39,3 20.34,3L15,5.1L9,3L3.36,4.9C3.15,4.97 3,5.15 3,5.38V20.5A0.5,0.5 0 0,0 3.5,21C3.55,21 3.61,21 3.66,20.97L9,18.9L15,21L20.64,19.1C20.85,19 21,18.85 21,18.62V3.5A0.5,0.5 0 0,0 20.5,3Z',
  },
  {
    id: 'ajustes',
    label: 'Ajustes',
    position: 'bottom',
    icon: 'M3,17V19H9V17H3M3,5V7H13V5H3M13,21V19H21V17H13V15H11V21H13M7,9V11H3V13H7V15H9V9H7M21,13V11H11V13H21M15,9H17V7H21V5H17V3H15V9Z',
  },
]

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
