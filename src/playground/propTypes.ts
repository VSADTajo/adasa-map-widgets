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
}

/** Documentación de un evento emitido por el componente. */
export interface EventDoc {
  name: string
  description: string
  payload?: string
}

/**
 * Documenta un campo de `options` de un {@link LayerType} (ver
 * `src/types/layers.ts`). A diferencia de {@link PropField}, no es editable
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

export interface ComponentDoc {
  id: string
  name: string
  category: 'controls' | 'mapping' | 'layers'
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
