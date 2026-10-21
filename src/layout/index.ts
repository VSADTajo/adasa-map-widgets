/**
 * Dominio `layout` (`@vsadtajo/adasa-ui/layout`): la estructura de las
 * aplicaciones de mapa (barra corporativa, barra de iconos, paneles de
 * sección y de detalle), con diseño de escritorio y móvil.
 */

export { default as ASAppShell } from './components/ASAppShell.vue'
export { default as ASAppTopBar } from './components/ASAppTopBar.vue'
export { default as ASAppRail } from './components/ASAppRail.vue'
export { default as ASAppPanelHeader } from './components/ASAppPanelHeader.vue'
export { default as ASAppDrawer } from './components/ASAppDrawer.vue'
export { default as ASAppDetailPanel } from './components/ASAppDetailPanel.vue'
export { default as ASAppBottomSheet } from './components/ASAppBottomSheet.vue'
export { default as ASAppMobileMenu } from './components/ASAppMobileMenu.vue'
export { default as ASAppBrand } from './components/ASAppBrand.vue'
export { default as ASAppSearch } from './components/ASAppSearch.vue'

export { useAppShellContext, type AppShellContext } from './composables/useAppShellContext'

export type {
  AppSection,
  AppShellProps,
  AppShellEmits,
  AppShellSectionSlotProps,
} from './types/AppShellProps'
export type { AppTopBarProps } from './types/AppTopBarProps'
export type { AppRailProps, AppRailEmits } from './types/AppRailProps'
export type { AppPanelHeaderProps, AppPanelHeaderEmits } from './types/AppPanelHeaderProps'
export type {
  AppBottomSheetEmits,
  AppBottomSheetProps,
  AppDetailPanelEmits,
  AppDetailPanelProps,
  AppDrawerProps,
  AppMobileMenuEmits,
  AppMobileMenuProps,
} from './types/AppPanelsProps'
export type { AppBrandProps, AppLogo } from './types/AppBrandProps'
