import type { PropField } from '../propTypes'
import type { SelectGroup, SelectOption } from '@/forms/types/common'
import type { DateRangePreset } from '@/forms/types/DateRangePickerProps'
import type { SearchSuggestion } from '@/forms/types/SearchInputProps'

/**
 * Datos y adaptadores del playground para las primitivas de formulario.
 * Los iconos son trazados de Material Design Icons, los mismos que exporta
 * `@mdi/js` (el playground no lo instala: la librería tampoco depende de él).
 */
export const DEMO_ICONS: Record<string, { path: string; mdi: string }> = {
  filtro: {
    mdi: 'mdiFilter',
    path: 'M14,12V19.88C14.04,20.18 13.94,20.5 13.71,20.71C13.32,21.1 12.69,21.1 12.3,20.71L10.29,18.7C10.06,18.47 9.96,18.16 10,17.87V12H9.97L4.21,4.62C3.87,4.19 3.95,3.56 4.38,3.22C4.57,3.08 4.78,3 5,3V3H19V3C19.22,3 19.43,3.08 19.62,3.22C20.05,3.56 20.13,4.19 19.79,4.62L14.03,12H14Z',
  },
  guardar: {
    mdi: 'mdiContentSave',
    path: 'M15,9H5V5H15M12,19A3,3 0 0,1 9,16A3,3 0 0,1 12,13A3,3 0 0,1 15,16A3,3 0 0,1 12,19M17,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V7L17,3Z',
  },
  borrar: {
    mdi: 'mdiDelete',
    path: 'M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z',
  },
  buscar: {
    mdi: 'mdiMagnify',
    path: 'M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z',
  },
  estacion: {
    mdi: 'mdiMapMarker',
    path: 'M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z',
  },
  agua: {
    mdi: 'mdiWater',
    path: 'M12,20A6,6 0 0,1 6,14C6,10 12,3.25 12,3.25C12,3.25 18,10 18,14A6,6 0 0,1 12,20Z',
  },
  descargar: {
    mdi: 'mdiDownload',
    path: 'M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z',
  },
}

/** Campo de icono del editor de props: vacío = sin icono. */
export function iconField(key: string, label: string, initial = ''): PropField {
  return {
    key,
    label,
    type: 'select',
    options: ['', ...Object.keys(DEMO_ICONS)],
    default: initial,
    description: 'Trazado SVG de 24 × 24, p. ej. de @mdi/js.',
  }
}

/** Opciones de ejemplo de `ASSelect`: estaciones SAIH agrupadas por río. */
export const DEMO_STATIONS: (SelectOption | SelectGroup)[] = [
  {
    label: 'Tajo',
    options: [
      { value: 'E01', label: 'Aranjuez', description: 'Aforo · 3E01' },
      { value: 'E02', label: 'Toledo', description: 'Aforo · 3E02' },
      { value: 'E03', label: 'Talavera de la Reina', description: 'Aforo · 3E03' },
      { value: 'E04', label: 'Trillo', description: 'Fuera de servicio', disabled: true },
    ],
  },
  {
    label: 'Jarama',
    options: [
      { value: 'E10', label: 'Mejorada del Campo', description: 'Aforo · 3E10' },
      { value: 'E11', label: 'Algete', description: 'Aforo · 3E11' },
    ],
  },
  {
    label: 'Alberche',
    options: [
      { value: 'R01', label: 'Embalse de Burguillo', description: 'Embalse · 3R01' },
      { value: 'R02', label: 'Embalse de San Juan', description: 'Embalse · 3R02' },
    ],
  },
]

/** Opciones de ejemplo de `ASRadioGroup`. */
export const DEMO_SOURCES: SelectOption[] = [
  { value: 'observado', label: 'Observado', description: 'Red SAIH en tiempo real' },
  { value: 'harmonie', label: 'Harmonie', description: 'Previsión determinista AEMET' },
  { value: 'eps', label: 'EPS', description: 'Previsión por conjuntos' },
]

type Values = Record<string, unknown>

/**
 * Valores del editor → props: `''` es "sin prop" e `iconKeys` pasan del
 * nombre del ejemplo a su trazado. Los campos (no los botones) se limitan de
 * ancho para que no ocupen todo el lienzo.
 */
export function formsToProps(iconKeys: string[] = [], field = true, room = 0) {
  return (values: Values): Values => {
    const props: Values = {}
    for (const [key, value] of Object.entries(values)) {
      if (value === '') continue
      props[key] = iconKeys.includes(key) ? DEMO_ICONS[value as string]?.path : value
    }
    // `room`: hueco bajo el campo para que su desplegable quepa en el lienzo sin scroll.
    if (field) props.style = `max-width: 360px; margin-bottom: ${room}px`
    return props
  }
}

/**
 * Snippet del ejemplo: como `buildSnippet`, pero con los iconos como
 * imports de `@mdi/js` y los atributos fijos de `extra` (`v-model`...) delante.
 */
export function formsToSnippet(
  tag: string,
  schema: PropField[],
  options: { iconKeys?: string[]; extra?: string[]; slot?: (values: Values) => string } = {},
) {
  const { iconKeys = [], extra = [], slot } = options
  return (values: Values): string => {
    const attributes = [...extra]
    for (const field of schema) {
      const value = values[field.key]
      if (
        field.key === 'modelValue' ||
        field.playgroundOnly ||
        value === undefined ||
        value === ''
      ) {
        continue
      }
      const name = kebab(field.key)
      if (iconKeys.includes(field.key)) {
        attributes.push(`:${name}="${DEMO_ICONS[value as string]!.mdi}"`)
      } else if (field.type === 'boolean') {
        if (value) attributes.push(name)
      } else if (field.type === 'number') {
        attributes.push(`:${name}="${value}"`)
      } else if (field.type === 'json') {
        attributes.push(`:${name}="${field.snippetVar ?? field.key}"`)
      } else {
        attributes.push(`${name}="${value}"`)
      }
    }
    const block = attributes.length ? `\n  ${attributes.join('\n  ')}\n` : ' '
    if (slot) return `<${tag}${block}>${slot(values)}</${tag}>`
    return attributes.length ? `<${tag}${block}/>` : `<${tag} />`
  }
}

function kebab(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

/** Índice de ejemplo de `ASSearchInput`: estaciones (de `DEMO_STATIONS`) y municipios. */
const SEARCH_INDEX: SearchSuggestion[] = [
  ...DEMO_STATIONS.flatMap((item) => ('options' in item ? item.options : [item])).map((option) => ({
    id: option.value,
    label: option.label,
    description: option.description,
    group: 'Estaciones',
    icon: DEMO_ICONS.estacion!.path,
  })),
  ...[
    'Aranjuez',
    'Toledo',
    'Talavera de la Reina',
    'Alcalá de Henares',
    'Ávila',
    'Guadalajara',
  ].map((name, index) => ({
    id: `M${index}`,
    label: name,
    description: 'Municipio',
    group: 'Municipios',
  })),
]

/**
 * `fetchSuggestions` de ejemplo: busca en el índice sin mayúsculas ni tildes,
 * con una latencia simulada que respeta la cancelación (como haría `fetch`).
 */
export function demoFetchSuggestions(latency: number, fail: boolean) {
  const normalize = (text: string) =>
    text
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
  return (query: string, signal: AbortSignal) =>
    new Promise<SearchSuggestion[]>((resolve, reject) => {
      const timer = setTimeout(() => {
        if (fail) reject(new Error('Servidor de ejemplo caído'))
        else
          resolve(SEARCH_INDEX.filter((item) => normalize(item.label).includes(normalize(query))))
      }, latency)
      signal.addEventListener('abort', () => {
        clearTimeout(timer)
        reject(new DOMException('Cancelada', 'AbortError'))
      })
    })
}

/** Periodo propio de ejemplo para `ASDateRangePicker`. */
export const DEMO_CUSTOM_PRESET: DateRangePreset = {
  id: 'avenida2025',
  label: 'Avenida de marzo de 2025',
  range: () => ({ start: new Date(2025, 2, 3), end: new Date(2025, 2, 12, 23, 59) }),
}
