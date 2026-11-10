/**
 * @vsadtajo/adasa-ui
 *
 * Librería corporativa ADASA de componentes Vue 3 + TypeScript. El entry
 * raíz solo expone `core` (tema, tokens y utilidades comunes); cada dominio
 * tiene su propio subpath para que un proyecto solo cargue lo que usa
 * (ver docs/adr/0000-estructura-paquete.md):
 *
 * ```ts
 * import { provideTheme } from '@vsadtajo/adasa-ui'
 * import { ASMap, ASMapLegend } from '@vsadtajo/adasa-ui/map'
 * import '@vsadtajo/adasa-ui/style.css'
 * ```
 */

export * from './core'
