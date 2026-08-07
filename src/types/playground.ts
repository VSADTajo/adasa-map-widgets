import type { Component } from 'vue'
import type { WidgetPosition } from './common'

/** Motores de mapa que el compositor del playground sabe instanciar vía `ASMap`. */
export type MapLibraryOption = 'leaflet' | 'maplibre'

/** Tipo de control de formulario usado para editar una prop de un widget registrado. */
export type WidgetPropFieldType = 'string' | 'number' | 'boolean' | 'select' | 'color'

/** Describe un campo editable en el editor de props del compositor de widgets. */
export interface WidgetPropField {
  /** Nombre de la prop (camelCase, como en el componente Vue). */
  key: string
  /** Etiqueta legible mostrada en el formulario. */
  label: string
  type: WidgetPropFieldType
  /** Valor inicial con el que se precarga el editor al colocar el widget. */
  default: string | number | boolean
  /** Opciones disponibles, solo para `type: 'select'`. */
  options?: string[]
  min?: number
  max?: number
  step?: number
}

/**
 * Entrada del registro de widgets disponibles para componer sobre el mapa
 * (ver `src/playground/utils/widgetRegistry.ts`).
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
