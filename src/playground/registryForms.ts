import ASButton from '@/forms/components/ASButton.vue'
import ASIconButton from '@/forms/components/ASIconButton.vue'
import ASInput from '@/forms/components/ASInput.vue'
import ASSelect from '@/forms/components/ASSelect.vue'
import ASCheckbox from '@/forms/components/ASCheckbox.vue'
import ASSwitch from '@/forms/components/ASSwitch.vue'
import ASRadioGroup from '@/forms/components/ASRadioGroup.vue'
import FormFieldDemo from './components/FormFieldDemo.vue'
import FormsDemo from './components/FormsDemo.vue'
import type { PropField } from './propTypes'
import type { RegistryEntry } from './registry'
import {
  DEMO_SOURCES,
  DEMO_STATIONS,
  formsToProps,
  formsToSnippet,
  iconField,
} from './utils/formsExample'

/**
 * Entradas de la categoría "Formularios" (dominio `forms`). Van aparte de
 * `registry.ts` por tamaño; `registry` las incluye al final.
 */

/** Tema de las primitivas: sin prop ni provideTheme heredan el del contenedor. */
const THEME_FIELD: PropField = {
  key: 'theme',
  label: 'Tema',
  type: 'select',
  options: ['', 'dark', 'light'],
  default: '',
  description: 'Vacío: hereda el tema global (provideTheme) o, sin él, el del contenedor.',
}

const SIZE_FIELD: PropField = {
  key: 'size',
  label: 'Tamaño',
  type: 'select',
  options: ['sm', 'md', 'lg'],
  default: 'md',
  description: 'Alto de 28, 36 o 44 px (--as-control-height-*).',
}

const VARIANT_OPTIONS = ['primary', 'secondary', 'ghost', 'danger']

/** Etiqueta, ayuda, error, obligatorio, deshabilitado, tamaño y tema: comunes a los campos. */
function fieldFields(label: string): PropField[] {
  return [
    { key: 'label', label: 'Etiqueta', type: 'string', default: label },
    { key: 'hint', label: 'Ayuda', type: 'string', default: '' },
    {
      key: 'error',
      label: 'Error',
      type: 'string',
      default: '',
      description: 'Texto bajo el campo y aria-invalid.',
    },
    { key: 'required', label: 'Obligatorio', type: 'boolean', default: false },
    { key: 'disabled', label: 'Deshabilitado', type: 'boolean', default: false },
    SIZE_FIELD,
    THEME_FIELD,
  ]
}

const MODEL_EVENT = (payload: string, description = 'Nuevo valor (para v-model).') => ({
  name: 'update:modelValue',
  payload,
  description,
})

/** Bindings que devuelven el valor emitido al estado del preview (v-model) y lo registran. */
function modelBindings(eventName = 'update:modelValue', key = 'modelValue') {
  const handler = `on${eventName[0]!.toUpperCase()}${eventName.slice(1)}`
  return (values: Record<string, unknown>, log: (name: string, payload?: unknown) => void) => ({
    [handler]: (value: unknown) => {
      values[key] = value
      log(eventName, value)
    },
  })
}

const BUTTON_SCHEMA: PropField[] = [
  {
    key: 'variant',
    label: 'Variante',
    type: 'select',
    options: VARIANT_OPTIONS,
    default: 'primary',
  },
  SIZE_FIELD,
  iconField('icon', 'Icono', 'guardar'),
  {
    key: 'iconPosition',
    label: 'Lado del icono',
    type: 'select',
    options: ['start', 'end'],
    default: 'start',
  },
  {
    key: 'loading',
    label: 'Cargando',
    type: 'boolean',
    default: false,
    description: 'Indicador de carga, aria-busy y no emite click.',
  },
  { key: 'disabled', label: 'Deshabilitado', type: 'boolean', default: false },
  { key: 'block', label: 'Ancho completo', type: 'boolean', default: false },
  {
    key: 'type',
    label: 'Tipo nativo',
    type: 'select',
    options: ['button', 'submit', 'reset'],
    default: 'button',
  },
  THEME_FIELD,
]

const ICON_BUTTON_SCHEMA: PropField[] = [
  iconField('icon', 'Icono', 'filtro'),
  {
    key: 'label',
    label: 'Nombre accesible',
    type: 'string',
    default: 'Filtros',
    description: 'Obligatorio: aria-label y tooltip.',
  },
  { key: 'variant', label: 'Variante', type: 'select', options: VARIANT_OPTIONS, default: 'ghost' },
  SIZE_FIELD,
  {
    key: 'pressed',
    label: 'Interruptor (v-model:pressed)',
    type: 'select',
    options: ['', 'false', 'true'],
    default: 'false',
    description: 'Vacío: botón normal, sin aria-pressed.',
  },
  { key: 'loading', label: 'Cargando', type: 'boolean', default: false },
  { key: 'disabled', label: 'Deshabilitado', type: 'boolean', default: false },
  THEME_FIELD,
]

const INPUT_SCHEMA: PropField[] = [
  {
    key: 'modelValue',
    label: 'Valor (v-model)',
    type: 'string',
    default: '',
    description: 'Con type="number" se emite un número.',
  },
  {
    key: 'type',
    label: 'Tipo',
    type: 'select',
    options: ['text', 'number', 'email', 'password', 'tel', 'url', 'search'],
    default: 'text',
  },
  ...fieldFields('Nombre de la estación'),
  { key: 'placeholder', label: 'Placeholder', type: 'string', default: 'p. ej. Aranjuez' },
  {
    key: 'unit',
    label: 'Unidad',
    type: 'string',
    default: '',
    description: 'Texto a la derecha, anunciado con el campo (m³/s, mm...).',
  },
  iconField('prefixIcon', 'Icono a la izquierda', 'estacion'),
  iconField('suffixIcon', 'Icono a la derecha'),
  { key: 'clearable', label: 'Botón de borrar', type: 'boolean', default: true },
  { key: 'readonly', label: 'Solo lectura', type: 'boolean', default: false },
  {
    key: 'step',
    label: 'Paso de ↑/↓ (number)',
    type: 'number',
    default: 1,
    min: 0.01,
    step: 0.5,
  },
]

const SELECT_SCHEMA: PropField[] = [
  ...fieldFields('Estación'),
  { key: 'multiple', label: 'Selección múltiple', type: 'boolean', default: false },
  {
    key: 'searchable',
    label: 'Búsqueda',
    type: 'boolean',
    default: true,
    description: 'Sin ella, escribir salta a la opción que empieza por esas letras.',
  },
  { key: 'clearable', label: 'Botón de borrar', type: 'boolean', default: true },
  { key: 'placeholder', label: 'Placeholder', type: 'string', default: '' },
  {
    key: 'maxChips',
    label: 'Chips visibles (múltiple)',
    type: 'number',
    default: 0,
    min: 0,
    max: 10,
    description: '0: todos.',
  },
  { key: 'noOptionsText', label: 'Texto sin resultados', type: 'string', default: '' },
]

const CHECKBOX_SCHEMA: PropField[] = [
  { key: 'modelValue', label: 'Marcado (v-model)', type: 'boolean', default: true },
  { key: 'indeterminate', label: 'Indeterminado', type: 'boolean', default: false },
  ...fieldFields('Solo estaciones con aviso activo'),
]

const SWITCH_SCHEMA: PropField[] = [
  { key: 'modelValue', label: 'Encendido (v-model)', type: 'boolean', default: true },
  { key: 'label', label: 'Etiqueta', type: 'string', default: 'Actualizar cada 5 minutos' },
  { key: 'hint', label: 'Ayuda', type: 'string', default: '' },
  {
    key: 'labelPosition',
    label: 'Lado de la etiqueta',
    type: 'select',
    options: ['end', 'start'],
    default: 'end',
  },
  { key: 'disabled', label: 'Deshabilitado', type: 'boolean', default: false },
  SIZE_FIELD,
  THEME_FIELD,
]

const RADIO_SCHEMA: PropField[] = [
  {
    key: 'modelValue',
    label: 'Valor (v-model)',
    type: 'select',
    options: ['', ...DEMO_SOURCES.map((option) => String(option.value))],
    default: 'observado',
  },
  ...fieldFields('Fuente de datos'),
  {
    key: 'orientation',
    label: 'Disposición',
    type: 'select',
    options: ['vertical', 'horizontal'],
    default: 'vertical',
  },
]

const FORM_FIELD_SCHEMA: PropField[] = [
  ...fieldFields('Opacidad de la capa'),
  {
    key: 'as',
    label: 'Elemento raíz',
    type: 'select',
    options: ['div', 'fieldset'],
    default: 'div',
    description: 'fieldset + legend para agrupar varios controles.',
  },
]

export const formsEntries: RegistryEntry[] = [
  {
    id: 'as-forms-demo',
    name: 'Formulario de ejemplo',
    category: 'forms',
    description:
      'Todas las primitivas juntas en un filtro de estaciones, para ver cómo casan en claro y oscuro y en cada tamaño. Al enviar, valida la cuenca y el umbral.',
    propsSchema: [
      SIZE_FIELD,
      { key: 'disabled', label: 'Todo deshabilitado', type: 'boolean', default: false },
      THEME_FIELD,
    ],
    events: [
      { name: 'submit', payload: 'filtro', description: 'El formulario es válido y se envió.' },
      { name: 'reset', description: 'Se pulsó "Restablecer".' },
    ],
    toProps: formsToProps([], false),
    toSnippet: () =>
      [
        '<form @submit.prevent="aplicar">',
        '  <ASSelect v-model="filtro.cuenca" label="Cuenca" :options="cuencas" searchable required :error="errores.cuenca" />',
        '  <ASSelect v-model="filtro.estaciones" label="Estaciones" :options="estaciones" multiple searchable clearable />',
        '  <ASInput v-model="filtro.umbral" type="number" label="Umbral de caudal" unit="m³/s" :min="0" :step="10" />',
        '  <ASRadioGroup v-model="filtro.fuente" label="Fuente de datos" :options="fuentes" />',
        '  <ASCheckbox v-model="filtro.soloAvisos" label="Solo estaciones con aviso activo" />',
        '  <ASSwitch v-model="autoRefresh" label="Actualizar cada 5 minutos" />',
        '  <ASButton type="submit" variant="primary" :icon="mdiFilter">Aplicar filtro</ASButton>',
        '</form>',
      ].join('\n'),
    notes:
      'Prueba a recorrerlo solo con el teclado: Tab entre campos, flechas en los selects y los radios, Espacio en el checkbox y el interruptor, Intro para enviar. Envía con la cuenca vacía para ver los errores.',
    component: FormsDemo,
    bindings: (_values, log) => ({
      onSubmit: (filter) => log('submit', filter),
      onReset: () => log('reset'),
    }),
  },
  {
    id: 'as-button',
    name: 'ASButton',
    category: 'forms',
    description:
      'Botón con variantes primary / secondary / ghost / danger, tres tamaños, icono y estado de carga. Colores desde los tokens.',
    propsSchema: BUTTON_SCHEMA,
    events: [
      {
        name: 'click',
        payload: 'MouseEvent',
        description: 'Pulsado. No se emite si está deshabilitado o cargando.',
      },
    ],
    slotDefault: 'Guardar',
    toProps: formsToProps(['icon'], false),
    toSnippet: formsToSnippet('ASButton', BUTTON_SCHEMA, {
      iconKeys: ['icon'],
      extra: ['@click="guardar"'],
      slot: () => 'Guardar',
    }),
    notes:
      'Una sola acción primary por vista. Mientras carga mantiene el foco y el ancho. Sin texto y con icono se vuelve cuadrado, pero para eso usa ASIconButton, que exige el nombre accesible.',
    component: ASButton,
    bindings: (_values, log) => ({ onClick: () => log('click') }),
  },
  {
    id: 'as-icon-button',
    name: 'ASIconButton',
    category: 'forms',
    description:
      'Botón cuadrado solo con icono. Su label es obligatorio (nombre accesible y tooltip). Con pressed actúa de interruptor.',
    propsSchema: ICON_BUTTON_SCHEMA,
    events: [
      { name: 'click', payload: 'MouseEvent', description: 'Pulsado.' },
      {
        name: 'update:pressed',
        payload: 'boolean',
        description: 'Nuevo estado, solo si se pasa pressed (para v-model:pressed).',
      },
    ],
    toProps: (values) => {
      const props = formsToProps(['icon'], false)(values)
      if (typeof props.pressed === 'string') props.pressed = props.pressed === 'true'
      return props
    },
    toSnippet: (values) =>
      formsToSnippet(
        'ASIconButton',
        ICON_BUTTON_SCHEMA.filter((field) => field.key !== 'pressed'),
        {
          iconKeys: ['icon'],
          extra:
            values.pressed === '' ? ['@click="filtrar"'] : ['v-model:pressed="filtrosVisibles"'],
        },
      )(values),
    component: ASIconButton,
    bindings: (values, log) => ({
      onClick: () => log('click'),
      'onUpdate:pressed': (pressed) => {
        values.pressed = String(pressed)
        log('update:pressed', pressed)
      },
    }),
  },
  {
    id: 'as-input',
    name: 'ASInput',
    category: 'forms',
    description:
      'Campo de texto con etiqueta, ayuda, error, iconos, unidad y botón de borrar. Con type="number" emite números y admite coma decimal.',
    propsSchema: INPUT_SCHEMA,
    events: [
      MODEL_EVENT('string | number | null', 'Al escribir. Con type="number", number o null.'),
      { name: 'focus', payload: 'FocusEvent', description: 'El campo recibe el foco.' },
      { name: 'blur', payload: 'FocusEvent', description: 'El campo pierde el foco.' },
      { name: 'clear', description: 'Se vació con el botón de borrar.' },
    ],
    toProps: formsToProps(['prefixIcon', 'suffixIcon']),
    toSnippet: formsToSnippet('ASInput', INPUT_SCHEMA, {
      iconKeys: ['prefixIcon', 'suffixIcon'],
      extra: ['v-model="valor"'],
    }),
    notes:
      'Pon type="number" y unit="m³/s", y escribe "12,5": se emite 12.5. Con ↑/↓ suma o resta el paso. Los atributos que no son props (name, maxlength...) van al <input>.',
    component: ASInput,
    bindings: (values, log) => ({
      ...modelBindings()(values, log),
      onFocus: () => log('focus'),
      onBlur: () => log('blur'),
      onClear: () => log('clear'),
    }),
  },
  {
    id: 'as-select',
    name: 'ASSelect',
    category: 'forms',
    description:
      'Desplegable con búsqueda, selección múltiple con chips, opciones agrupadas y teclado completo (patrón combobox de WAI-ARIA).',
    propsSchema: SELECT_SCHEMA,
    events: [
      MODEL_EVENT('SelectValue | SelectValue[] | null'),
      { name: 'search', payload: 'string', description: 'Texto de búsqueda al escribir.' },
      { name: 'open', description: 'Se abrió la lista.' },
      { name: 'close', description: 'Se cerró la lista.' },
    ],
    staticProps: { options: DEMO_STATIONS, modelValue: null },
    toProps: (values) => {
      const props = formsToProps()(values)
      // Al cambiar "múltiple" en el editor, el valor pasa de uno a array y al revés.
      const value = props.modelValue
      if (props.multiple && !Array.isArray(value)) props.modelValue = value == null ? [] : [value]
      if (!props.multiple && Array.isArray(value)) props.modelValue = value[0] ?? null
      if (!props.maxChips) delete props.maxChips
      return props
    },
    toSnippet: (values) =>
      formsToSnippet(
        'ASSelect',
        SELECT_SCHEMA.filter((field) => field.key !== 'maxChips' || values.maxChips),
        { extra: ['v-model="estacion"', ':options="estaciones"'] },
      )(values),
    notes:
      'Teclado: ↓/↑ abren y recorren (saltan Trillo, deshabilitada), Inicio/Fin, RePág/AvPág, Intro elige, Escape cierra, Retroceso quita el último chip. Sin búsqueda, escribe "to" para saltar a Toledo. La lista se abre hacia arriba si no cabe debajo.',
    component: ASSelect,
    bindings: (values, log) => ({
      ...modelBindings()(values, log),
      onSearch: (query) => log('search', query),
      onOpen: () => log('open'),
      onClose: () => log('close'),
    }),
  },
  {
    id: 'as-checkbox',
    name: 'ASCheckbox',
    category: 'forms',
    description:
      'Casilla de verificación: booleana o parte de un grupo (v-model con array y value), con estado indeterminado.',
    propsSchema: CHECKBOX_SCHEMA,
    events: [MODEL_EVENT('boolean | SelectValue[]')],
    toProps: formsToProps([], false),
    toSnippet: formsToSnippet('ASCheckbox', CHECKBOX_SCHEMA, { extra: ['v-model="soloAvisos"'] }),
    notes:
      'En grupo: <ASCheckbox v-model="tipos" value="aforo" label="Aforos" /> por cada opción, todas con el mismo array.',
    component: ASCheckbox,
    bindings: modelBindings(),
  },
  {
    id: 'as-switch',
    name: 'ASSwitch',
    category: 'forms',
    description:
      'Interruptor con efecto inmediato (role="switch"). Para opciones que se confirman al enviar un formulario, mejor ASCheckbox.',
    propsSchema: SWITCH_SCHEMA,
    events: [MODEL_EVENT('boolean')],
    toProps: formsToProps([], false),
    toSnippet: formsToSnippet('ASSwitch', SWITCH_SCHEMA, { extra: ['v-model="autoRefresh"'] }),
    component: ASSwitch,
    bindings: modelBindings(),
  },
  {
    id: 'as-radio-group',
    name: 'ASRadioGroup',
    category: 'forms',
    description:
      'Opciones de selección única: radios nativos en un fieldset. Un solo punto de tabulación; las flechas cambian la opción.',
    propsSchema: RADIO_SCHEMA,
    events: [MODEL_EVENT('SelectValue')],
    staticProps: { options: DEMO_SOURCES },
    toProps: (values) => ({ ...formsToProps()(values), modelValue: values.modelValue || null }),
    toSnippet: formsToSnippet('ASRadioGroup', RADIO_SCHEMA, {
      extra: ['v-model="fuente"', ':options="fuentes"'],
    }),
    component: ASRadioGroup,
    bindings: modelBindings(),
  },
  {
    id: 'as-form-field',
    name: 'ASFormField',
    category: 'forms',
    description:
      'Etiqueta, ayuda y error enlazados a un control propio del proyecto (aquí, un <input type="range"> nativo). Es la base de ASInput y ASSelect.',
    propsSchema: FORM_FIELD_SCHEMA,
    events: [],
    toProps: formsToProps(),
    toSnippet: (values) =>
      `${formsToSnippet('ASFormField', FORM_FIELD_SCHEMA, {
        extra: ['v-slot="{ id, describedBy, invalid }"'],
        slot: () =>
          '\n  <MiControl :id="id" :aria-describedby="describedBy" :aria-invalid="invalid" />\n',
      })(values)}`,
    component: FormFieldDemo,
  },
]
