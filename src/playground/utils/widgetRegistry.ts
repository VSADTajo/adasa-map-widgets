import type { WidgetRegistryEntry } from '@/types/playground'
import { registry, type RegistryEntry } from '../registry'

const DEFAULT_OMITTED_PROPS = ['position', 'offset']

function toWidgetEntry(entry: RegistryEntry): WidgetRegistryEntry {
  const composer = entry.composer!
  const omitted = composer.omitProps ?? DEFAULT_OMITTED_PROPS
  return {
    id: entry.id,
    label: composer.label,
    componentName: entry.name,
    component: entry.component,
    propsSchema: entry.propsSchema.filter((field) => !omitted.includes(field.key)),
    staticProps: composer.staticProps ?? (() => ({ ...entry.staticProps })),
    bindings: entry.bindings,
  }
}

/**
 * Widgets disponibles para componer sobre el mapa en el playground. No se
 * registran aquí: se derivan de las entradas de `registry.ts` que declaran
 * `composer`, para que un widget nuevo se registre en un único sitio y la
 * galería y el compositor no se desincronicen.
 */
export const widgetRegistry: WidgetRegistryEntry[] = registry
  .filter((entry) => entry.composer)
  .map(toWidgetEntry)

export function getWidgetEntry(id: string): WidgetRegistryEntry | undefined {
  return widgetRegistry.find((entry) => entry.id === id)
}
