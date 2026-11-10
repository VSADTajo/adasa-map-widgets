import ASDetailHeader from '@/detail/components/ASDetailHeader.vue'
import ASCard from '@/detail/components/ASCard.vue'
import ASStatusBadge from '@/detail/components/ASStatusBadge.vue'
import ASAlertStatus from '@/detail/components/ASAlertStatus.vue'
import ASObservedSummary from '@/detail/components/ASObservedSummary.vue'
import ASThresholdSummary from '@/detail/components/ASThresholdSummary.vue'
import ASValueMatrix from '@/detail/components/ASValueMatrix.vue'
import ASThresholdLegend from '@/detail/components/ASThresholdLegend.vue'
import StationDetailDemo from './components/StationDetailDemo.vue'
import type { AlertThresholds } from '@/detail/types/hydro'
import type { PropField } from './propTypes'
import type { RegistryEntry } from './registry'
import { DATASETS, DEMO_TAGS, DEMO_THRESHOLDS } from './utils/detailExample'
import { formsToSnippet } from './utils/formsExample'

/**
 * Entradas de la categoría "Detalle" (dominio `detail`). Van aparte de
 * `registry.ts` por tamaño; `registry` las incluye al final.
 */

const THEME_FIELD: PropField = {
  key: 'theme',
  label: 'Tema',
  type: 'select',
  options: ['', 'dark', 'light'],
  default: '',
  description: 'Vacío: hereda el tema global (provideTheme) o, sin él, el del contenedor.',
}

const LOADING_FIELD: PropField = {
  key: 'loading',
  label: 'Cargando',
  type: 'boolean',
  default: false,
}

const TITLE_FIELD: PropField = {
  key: 'title',
  label: 'Título',
  type: 'string',
  default: '',
  description: 'Vacío: el título por defecto del componente.',
}

function datasetField(initial: string): PropField {
  return {
    key: 'dataset',
    label: 'Datos de ejemplo',
    type: 'select',
    options: Object.keys(DATASETS),
    default: initial,
    playgroundOnly: true,
    description: 'Series y umbrales sintéticos (los del hidrograma del playground).',
  }
}

type Values = Record<string, unknown>

/** Valores del editor → props: `''` es "sin prop" y `dataset` se convierte en series y umbrales. */
function cardProps(values: Values): Values {
  const props: Values = {}
  for (const [key, value] of Object.entries(values)) {
    if (value !== '' && key !== 'dataset' && key !== 'thresholdSet') props[key] = value
  }
  const dataset = DATASETS[values.dataset as string]
  if (dataset) {
    props.series = dataset.series
    props.thresholds = dataset.thresholds
  }
  props.style = 'max-width: 420px'
  return props
}

const SERIES_SNIPPET = [':series="series"', ':thresholds="umbrales"']

const ALERT_SCHEMA: PropField[] = [
  datasetField('observado (con aviso)'),
  {
    key: 'mode',
    label: 'Modo',
    type: 'select',
    options: ['latest', 'max'],
    default: 'latest',
    description: 'latest: último valor (observado). max: máximo (previsiones).',
  },
  { key: 'showValue', label: 'Mostrar el valor', type: 'boolean', default: true },
  TITLE_FIELD,
  LOADING_FIELD,
  THEME_FIELD,
]

const OBSERVED_SCHEMA: PropField[] = [
  datasetField('embalse (entrada, salida, volumen)'),
  TITLE_FIELD,
  LOADING_FIELD,
  THEME_FIELD,
]

const THRESHOLD_SUMMARY_SCHEMA: PropField[] = [
  datasetField('previsiones'),
  {
    key: 'mode',
    label: 'Modo',
    type: 'select',
    options: ['observed', 'forecast'],
    default: 'forecast',
    description: 'Cambia los textos sin datos y sin superaciones.',
  },
  TITLE_FIELD,
  LOADING_FIELD,
  THEME_FIELD,
]

const MATRIX_SCHEMA: PropField[] = [
  datasetField('previsiones + percentiles'),
  {
    key: 'aggregate',
    label: 'Agregado (v-model)',
    type: 'select',
    options: ['min', 'mean', 'max'],
    default: 'mean',
  },
  {
    key: 'intervalHours',
    label: 'Intervalo (h)',
    type: 'select',
    options: ['1', '3', '6', '12', '24'],
    default: '6',
    playgroundOnly: true,
    description: 'Prop interval, en ms.',
  },
  { key: 'days', label: 'Días', type: 'number', default: 3, min: 1, max: 7 },
  TITLE_FIELD,
  LOADING_FIELD,
  THEME_FIELD,
]

const THRESHOLD_SETS: Record<string, AlertThresholds | undefined> = {
  completos: DEMO_THRESHOLDS,
  'solo amarillo': { amarillo: DEMO_THRESHOLDS.amarillo },
  ninguno: undefined,
}

const LEGEND_SCHEMA: PropField[] = [
  {
    key: 'thresholdSet',
    label: 'Umbrales de ejemplo',
    type: 'select',
    options: Object.keys(THRESHOLD_SETS),
    default: 'completos',
    playgroundOnly: true,
  },
  {
    key: 'selected',
    label: 'Resaltado (v-model)',
    type: 'select',
    options: ['', 'amarillo', 'naranja', 'rojo'],
    default: '',
  },
  { key: 'unit', label: 'Unidad', type: 'string', default: 'm³/s' },
  TITLE_FIELD,
  LOADING_FIELD,
  THEME_FIELD,
]

const HEADER_SCHEMA: PropField[] = [
  { key: 'title', label: 'Título', type: 'string', default: '3E01' },
  { key: 'subtitle', label: 'Subtítulo', type: 'string', default: 'Tajo en Aranjuez' },
  LOADING_FIELD,
  { key: 'sticky', label: 'Fija arriba', type: 'boolean', default: true },
  { key: 'closable', label: 'Botón de cerrar', type: 'boolean', default: true },
  { key: 'closeLabel', label: 'Nombre del botón de cerrar', type: 'string', default: '' },
]

const CARD_SCHEMA: PropField[] = [
  { key: 'title', label: 'Título', type: 'string', default: 'Resumen de la estación' },
  {
    key: 'headingLevel',
    label: 'Nivel del título',
    type: 'select',
    options: ['2', '3', '4', '5', '6'],
    default: '3',
  },
  LOADING_FIELD,
  {
    key: 'skeletonLines',
    label: 'Líneas del esqueleto',
    type: 'number',
    default: 3,
    min: 1,
    max: 8,
  },
  { key: 'empty', label: 'Sin datos', type: 'boolean', default: false },
  { key: 'emptyText', label: 'Texto sin datos', type: 'string', default: '' },
  THEME_FIELD,
]

const BADGE_SCHEMA: PropField[] = [
  {
    key: 'level',
    label: 'Nivel',
    type: 'select',
    options: ['normal', 'amarillo', 'naranja', 'rojo'],
    default: 'naranja',
  },
  {
    key: 'label',
    label: 'Texto',
    type: 'string',
    default: '',
    description: 'Vacío: el nombre del nivel. Con otro texto, el nivel se anuncia oculto.',
  },
  { key: 'size', label: 'Tamaño', type: 'select', options: ['sm', 'md', 'lg'], default: 'md' },
]

export const detailEntries: RegistryEntry[] = [
  {
    id: 'as-station-detail-demo',
    name: 'Ficha de estación de ejemplo',
    category: 'detail',
    description:
      'La cabecera, las tarjetas del dominio detail y el hidrograma juntos, como el panel de estación de TAJO. Pulsa un umbral para resaltarlo en el hidrograma.',
    propsSchema: [LOADING_FIELD, THEME_FIELD],
    events: [
      { name: 'close', description: 'Botón de cerrar de la cabecera.' },
      {
        name: 'update:selectedThreshold',
        payload: "'amarillo' | 'naranja' | 'rojo' | null",
        description: 'Umbral resaltado en la leyenda.',
      },
    ],
    toProps: (values) => Object.fromEntries(Object.entries(values).filter(([, v]) => v !== '')),
    toSnippet: () =>
      [
        '<ASDetailHeader :title="estacion.codigo" :subtitle="estacion.nombre" :tags="etiquetas" @close="cerrar" />',
        '<ASAlertStatus :series="[observado]" :thresholds="umbrales" />',
        '<ASAlertStatus :series="previsiones" :thresholds="umbrales" mode="max" />',
        '<ASObservedSummary :series="[observado]" :thresholds="umbrales" />',
        '<ASThresholdSummary :series="previsiones" :thresholds="umbrales" mode="forecast" />',
        '<ASThresholdLegend :thresholds="umbrales" unit="m³/s" v-model:selected="umbral" />',
        '<ASHydrographChart :discharge="caudal" :thresholds="umbralesDelGrafico(umbral)" />',
        '<ASValueMatrix :series="[observado, ...previsiones]" :thresholds="umbrales" />',
      ].join('\n'),
    notes:
      'Todas las tarjetas reciben MeasureSeries ({ id, label, unit, data: [fecha, valor][] }) y AlertThresholds ({ amarillo, naranja, rojo }): cada proyecto escribe un adaptador pequeño de su API a estos tipos (aquí, utils/detailExample.ts).',
    component: StationDetailDemo,
    bindings: (_values, log) => ({
      onClose: () => log('close'),
      'onUpdate:selectedThreshold': (level) => log('update:selectedThreshold', level),
    }),
  },
  {
    id: 'as-detail-header',
    name: 'ASDetailHeader',
    category: 'detail',
    description:
      'Cabecera de una ficha: título, subtítulo, etiquetas y botón de cerrar, con el color corporativo y fija arriba al desplazar.',
    propsSchema: HEADER_SCHEMA,
    events: [{ name: 'close', description: 'Se pulsó el botón de cerrar.' }],
    staticProps: { tags: DEMO_TAGS },
    toProps: (values) => Object.fromEntries(Object.entries(values).filter(([, v]) => v !== '')),
    toSnippet: formsToSnippet('ASDetailHeader', HEADER_SCHEMA, {
      extra: [':tags="etiquetas"', '@close="cerrar"'],
    }),
    component: ASDetailHeader,
    bindings: (_values, log) => ({ onClose: () => log('close') }),
  },
  {
    id: 'as-card',
    name: 'ASCard',
    category: 'detail',
    description:
      'Tarjeta de una ficha: título (recortado con tooltip), acciones, y el cuerpo con contenido, esqueleto de carga o texto sin datos.',
    propsSchema: CARD_SCHEMA,
    events: [],
    slotDefault: 'Contenido de la tarjeta',
    toProps: (values) => ({
      ...cardProps(values),
      headingLevel: Number(values.headingLevel),
    }),
    toSnippet: formsToSnippet('ASCard', CARD_SCHEMA, { slot: () => 'Contenido de la tarjeta' }),
    component: ASCard,
  },
  {
    id: 'as-status-badge',
    name: 'ASStatusBadge',
    category: 'detail',
    description:
      'Píldora de un nivel de aviso con los colores reservados (--as-alert-*). Siempre con texto: el nivel nunca depende solo del color.',
    propsSchema: BADGE_SCHEMA,
    events: [],
    toProps: (values) => Object.fromEntries(Object.entries(values).filter(([, v]) => v !== '')),
    toSnippet: formsToSnippet('ASStatusBadge', BADGE_SCHEMA),
    component: ASStatusBadge,
  },
  {
    id: 'as-alert-status',
    name: 'ASAlertStatus',
    category: 'detail',
    description:
      'Nivel de aviso de una estación: el último valor observado o el máximo de las previsiones, comparado con los umbrales.',
    propsSchema: ALERT_SCHEMA,
    events: [],
    toProps: cardProps,
    toSnippet: formsToSnippet('ASAlertStatus', ALERT_SCHEMA, { extra: SERIES_SNIPPET }),
    notes:
      'Con varias series manda la más grave, y entre paréntesis se ve cuál lo decide. Una serie puede traer sus propios umbrales (p. ej. el volumen de un embalse).',
    component: ASAlertStatus,
  },
  {
    id: 'as-observed-summary',
    name: 'ASObservedSummary',
    category: 'detail',
    description:
      'Último valor y máximo observados, con su fecha y su nivel. Con varias series (entrada, salida, volumen), un selector elige cuál se ve.',
    propsSchema: OBSERVED_SCHEMA,
    events: [
      { name: 'update:active', payload: 'string', description: 'Serie elegida (v-model:active).' },
    ],
    staticProps: { active: undefined },
    toProps: cardProps,
    toSnippet: formsToSnippet('ASObservedSummary', OBSERVED_SCHEMA, {
      extra: [...SERIES_SNIPPET, 'v-model:active="vista"'],
    }),
    component: ASObservedSummary,
    bindings: (values, log) => ({
      'onUpdate:active': (id) => {
        values.active = id
        log('update:active', id)
      },
    }),
  },
  {
    id: 'as-threshold-summary',
    name: 'ASThresholdSummary',
    category: 'detail',
    description:
      'Cuántas veces supera cada serie cada umbral y cuándo fue la última, o que no hay superaciones.',
    propsSchema: THRESHOLD_SUMMARY_SCHEMA,
    events: [],
    toProps: cardProps,
    toSnippet: formsToSnippet('ASThresholdSummary', THRESHOLD_SUMMARY_SCHEMA, {
      extra: SERIES_SNIPPET,
    }),
    component: ASThresholdSummary,
  },
  {
    id: 'as-value-matrix',
    name: 'ASValueMatrix',
    category: 'detail',
    description:
      'Tabla de valores por intervalo y serie (mínimo, media o máximo), con las celdas teñidas por nivel de aviso.',
    propsSchema: MATRIX_SCHEMA,
    events: [
      {
        name: 'update:aggregate',
        payload: "'min' | 'mean' | 'max'",
        description: 'Agregado elegido en el selector (v-model:aggregate).',
      },
    ],
    toProps: (values) => {
      const props = cardProps(values)
      props.interval = Number(values.intervalHours) * 3_600_000
      delete props.intervalHours
      props.style = 'max-width: 100%'
      return props
    },
    toSnippet: (values) =>
      formsToSnippet('ASValueMatrix', MATRIX_SCHEMA, {
        extra: [
          ...SERIES_SNIPPET,
          'v-model:aggregate="agregado"',
          ...(values.intervalHours === '6'
            ? []
            : [`:interval="${values.intervalHours} * 3600000"`]),
        ],
      })(values),
    notes:
      'La primera columna queda fija al desplazar. Enfoca la tabla (Tab) y usa las flechas para desplazarla. Cada celda anuncia su nivel a los lectores de pantalla.',
    component: ASValueMatrix,
    bindings: (values, log) => ({
      'onUpdate:aggregate': (kind) => {
        values.aggregate = kind
        log('update:aggregate', kind)
      },
    }),
  },
  {
    id: 'as-threshold-legend',
    name: 'ASThresholdLegend',
    category: 'detail',
    description:
      'Umbrales de aviso con su valor. Pulsar uno lo resalta (v-model:selected), p. ej. para destacarlo en el hidrograma.',
    propsSchema: LEGEND_SCHEMA,
    events: [
      {
        name: 'update:selected',
        payload: "'amarillo' | 'naranja' | 'rojo' | null",
        description: 'Umbral pulsado, o null si ya estaba resaltado.',
      },
    ],
    toProps: (values) => ({
      ...cardProps(values),
      thresholds: THRESHOLD_SETS[values.thresholdSet as string],
      selected: values.selected || null,
    }),
    toSnippet: formsToSnippet(
      'ASThresholdLegend',
      LEGEND_SCHEMA.filter((f) => f.key !== 'selected'),
      {
        extra: [':thresholds="umbrales"', 'v-model:selected="umbral"'],
      },
    ),
    component: ASThresholdLegend,
    bindings: (values, log) => ({
      'onUpdate:selected': (level) => {
        values.selected = level ?? ''
        log('update:selected', level)
      },
    }),
  },
]
