/** Tipo de control de formulario a renderizar en el editor de props en vivo. */
export type PropFieldType = 'string' | 'number' | 'boolean' | 'select' | 'color'

/** Describe un campo editable en el editor de props del playground. */
export interface PropField {
  /** Nombre de la prop (camelCase, como en el componente Vue). */
  key: string
  /** Etiqueta legible mostrada en el formulario. */
  label: string
  type: PropFieldType
  /** Valor inicial con el que se precarga el editor. */
  default: string | number | boolean
  /** Opciones disponibles, solo para `type: 'select'`. */
  options?: string[]
  min?: number
  max?: number
  step?: number
  /** Explicación corta de qué hace la prop (se muestra como ayuda inline). */
  description?: string
  /**
   * Tipo de la prop tal como lo declara el componente (`'[number, number]'`,
   * `'Date | null'`...), para la tabla de documentación, cuando el control
   * del editor no lo refleja (p. ej. un texto "lat, lng" para `center`). Sin
   * él, un select muestra sus opciones (`'a' | 'b'`) y el resto, su `type`.
   */
  docType?: string
  /**
   * Control que solo existe en el playground (p. ej. "número de ejes"): lo
   * convierte `toProps` en props reales, así que no se lista como prop del componente.
   */
  playgroundOnly?: boolean
}

/** Documentación de un evento emitido por el componente. */
export interface EventDoc {
  name: string
  description: string
  payload?: string
}

/**
 * Documenta un campo de `options` de un {@link LayerType} (ver
 * `src/map/types/layers.ts`). A diferencia de {@link PropField}, no es editable
 * desde un formulario genérico: `options` varía por tipo de capa y admite
 * formas complejas (objetos, funciones...) que no encajan en el editor de
 * props. Solo se usa para la tabla de documentación de la categoría 'layers'.
 */
export interface LayerOptionField {
  key: string
  /** Tipo, como texto libre (p. ej. `'string'`, `'GeoJsonFeatureCollection | string'`). */
  type: string
  required?: boolean
  description: string
}

/** Categoría del catálogo: una por dominio de la librería (los de mapa, divididos en tres). */
export type ComponentCategory =
  'mapping' | 'controls' | 'layers' | 'charts' | 'tables' | 'detail' | 'layout' | 'forms'

export interface CategoryInfo {
  key: ComponentCategory
  /** Título en la barra lateral. */
  label: string
  /**
   * Cómo se previsualizan sus componentes: `'map'`, en el escenario de los
   * widgets de mapa (se anclan con position absolute); `'canvas'`, en un
   * lienzo neutro redimensionable para probar el responsive.
   */
  preview: 'map' | 'canvas'
}

/** Categorías del catálogo, en el orden de la barra lateral. */
export const COMPONENT_CATEGORIES: CategoryInfo[] = [
  { key: 'mapping', label: 'Mapa', preview: 'map' },
  { key: 'controls', label: 'Controles de mapa', preview: 'map' },
  { key: 'layers', label: 'Capas', preview: 'map' },
  { key: 'charts', label: 'Gráficas', preview: 'canvas' },
  { key: 'tables', label: 'Tablas', preview: 'canvas' },
  { key: 'detail', label: 'Detalle', preview: 'canvas' },
  { key: 'layout', label: 'Layout', preview: 'canvas' },
  { key: 'forms', label: 'Formularios', preview: 'canvas' },
]

export function getCategory(key: ComponentCategory): CategoryInfo {
  return COMPONENT_CATEGORIES.find((category) => category.key === key)!
}

export interface ComponentDoc {
  id: string
  name: string
  category: ComponentCategory
  description: string
  propsSchema: PropField[]
  events: EventDoc[]
  /** Contenido de slot por defecto (texto), si el componente admite slot. */
  slotDefault?: string
  notes?: string
}

function kebabCase(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

/** Construye un snippet de plantilla Vue a partir del esquema de props y sus valores actuales. */
export function buildSnippet(
  tag: string,
  schema: PropField[],
  values: Record<string, unknown>,
  slotContent?: string,
): string {
  const attrs = schema
    .map((field) => {
      const value = values[field.key]
      if (value === undefined || value === '') return null
      const attrName = kebabCase(field.key)
      if (field.type === 'boolean') {
        return value ? attrName : null
      }
      if (field.type === 'number') {
        return `:${attrName}="${value}"`
      }
      return `${attrName}="${value}"`
    })
    .filter((line): line is string => Boolean(line))

  const attrsBlock = attrs.length ? `\n  ${attrs.join('\n  ')}\n` : ' '

  if (slotContent !== undefined) {
    return `<${tag}${attrsBlock}>${slotContent}</${tag}>`
  }
  return attrs.length ? `<${tag}${attrsBlock}/>` : `<${tag} />`
}
