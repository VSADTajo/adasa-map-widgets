/**
 * Dominio `layout` (`@vsadtajo/adasa-ui/layout`): la estructura de las
 * aplicaciones de mapa (barra corporativa, barra de iconos, paneles de
 * sección y de detalle), con diseño de escritorio y móvil.
 */

export { default as ASAppShell } from './components/ASAppShell.vue'
export { default as ASAppTopBar } from './components/ASAppTopBar.vue'
export { default as ASAppRail } from './components/ASAppRail.vue'
export { default as ASAppPanelHeader } from './components/ASAppPanelHeader.vue'

export type {
  AppSection,
  AppShellProps,
  AppShellEmits,
  AppShellSectionSlotProps,
} from './types/AppShellProps'
export type { AppTopBarProps } from './types/AppTopBarProps'
export type { AppRailProps, AppRailEmits } from './types/AppRailProps'
export type { AppPanelHeaderProps, AppPanelHeaderEmits } from './types/AppPanelHeaderProps'
