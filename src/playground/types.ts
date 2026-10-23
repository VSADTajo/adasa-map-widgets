import type { Component } from 'vue'
import type { WidgetPosition } from '@/core/types/common'
import type { MapLibraryOption } from '@/map/types/map'
import type { PropField } from './propTypes'

export type { MapLibraryOption }

/**
 * Campo editable del compositor de widgets: el mismo de la galería
 * (`PropField`), porque el compositor deriva sus campos de `registry.ts`.
 */
export type WidgetPropField = PropField

/**
 * Entrada del registro de widgets disponibles para componer sobre el mapa
 * (ver `utils/widgetRegistry.ts`).
 */
export interface WidgetRegistryEntry {
  /** Id estable del tipo de widget, usado en `WidgetPlacement.widgetType`. */
  id: string
  /** Nombre legible mostrado en el selector de widgets. */
  label: string
  /** Nombre del componente tal como se importaría (usado al generar el snippet de código). */
  componentName: string
  /** Componente Vue a instanciar sobre el mapa. */
  component: Component
  /** Props editables desde el panel del compositor. */
  propsSchema: WidgetPropField[]
  /**
   * Props adicionales no editables (p. ej. arrays complejos como una línea de
   * tiempo o una lista de items de leyenda) necesarias para que el widget
   * funcione con datos de ejemplo.
   */
  staticProps?: () => Record<string, unknown>
  /**
   * Construye los listeners a aplicar sobre la instancia colocada, con acceso
   * de lectura/escritura a sus props actuales (para widgets con `v-model`,
   * como `ASMapTimeControls` o `ASMapTimeRangeControls`) y a un logger para
   * reportar eventos al monitor de eventos del compositor.
   */
  bindings?: (
    props: Record<string, unknown>,
    log: (name: string, payload?: unknown) => void,
  ) => Record<string, (...args: unknown[]) => void>
}

/**
 * Una instancia de widget colocada sobre el mapa en el compositor del
 * playground, con su posición y el estado actual de sus props editables.
 */
export interface WidgetPlacement {
  /** Identificador único de esta instancia colocada (no del tipo de widget). */
  instanceId: string
  /** Id del widget en el registro (`WidgetRegistryEntry.id`). */
  widgetType: string
  /** Esquina del mapa donde se ancla el widget. */
  position: WidgetPosition
  /** Valores de props editables actuales, mutados en vivo desde `WidgetPanel`. */
  props: Record<string, unknown>
}
