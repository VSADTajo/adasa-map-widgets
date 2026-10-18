import type { ChartSeries, ChartYAxis } from '@/charts/types/chart'
import type { HydroVariable } from '@/charts/types/HydrographProps'
import type { PropField } from '../propTypes'
import {
  EXAMPLE_NOW,
  exampleChartAnnotations,
  exampleDischarge,
  examplePrecipitation,
  exampleThresholds,
} from './chartExamples'

/**
 * Controles del playground para personalizar series y ejes de las gráficas
 * (nombre y color de cada serie, número de ejes y eje de cada serie), y su
 * conversión en los props reales (`series`, `yAxes`...) y en código de ejemplo.
 */

type Values = Record<string, unknown>

/** Ejes disponibles en el ejemplo de `ASChart`: con N ejes se usan los N primeros. */
const AXES: ChartYAxis[] = [
  { id: 'y1', label: 'Caudal', unit: 'm³/s' },
  { id: 'y2', label: 'Nivel', unit: 'm' },
  { id: 'y3', label: 'Precipitación', unit: 'mm', inverse: true },
  { id: 'y4', label: 'Eje 4' },
]

const DEMO_SERIES = [
  {
    key: 's1',
    name: 'Caudal',
    color: '#2a78d6',
    axis: '1',
    type: 'line' as const,
    data: exampleDischarge.observed!,
    dataName: 'caudal',
  },
  {
    key: 's2',
    name: 'Nivel',
    color: '#eb6834',
    axis: '2',
    type: 'line' as const,
    data: exampleDischarge.observed!.map(([date, value]): [Date, number | null] => [
      date,
      value === null ? null : Math.round((0.8 + value / 60) * 100) / 100,
    ]),
    dataName: 'nivel',
  },
  {
    key: 's3',
    name: 'Lluvia',
    color: '#05a873',
    axis: '3',
    type: 'bar' as const,
    data: examplePrecipitation.observed!,
    dataName: 'lluvia',
  },
]

/** Campos del formulario para `ASChart`: número de ejes y, por serie, nombre, color y eje. */
export const CHART_SERIES_FIELDS: PropField[] = [
  {
    key: 'axisCount',
    label: 'Número de ejes Y',
    type: 'number',
    default: 3,
    min: 1,
    max: 4,
    step: 1,
    playgroundOnly: true,
    description: 'De 1 a 4. Con menos ejes que los pedidos por una serie, la serie va al último.',
  },
  ...DEMO_SERIES.flatMap((series, index): PropField[] => [
    {
      key: `${series.key}Name`,
      label: `Serie ${index + 1}: nombre`,
      type: 'string',
      default: series.name,
      playgroundOnly: true,
    },
    {
      key: `${series.key}Color`,
      label: `Serie ${index + 1}: color`,
      type: 'color',
      default: series.color,
      playgroundOnly: true,
    },
    {
      key: `${series.key}Axis`,
      label: `Serie ${index + 1}: eje`,
      type: 'select',
      options: ['1', '2', '3', '4'],
      default: series.axis,
      playgroundOnly: true,
    },
  ]),
]

const PLAYGROUND_ONLY = new Set(CHART_SERIES_FIELDS.map((field) => field.key))

/** Textos que, vacíos en el formulario, significan "sin prop" (se usa el valor generado). */
const OPTIONAL_TEXTS = new Set(['fileName', 'ariaLabel', 'description'])

/** Quita los controles que solo existen en el playground y los textos opcionales vacíos. */
function componentProps(values: Values, playgroundOnly: Set<string> = PLAYGROUND_ONLY): Values {
  return Object.fromEntries(
    Object.entries(values).filter(
      ([key, value]) => !playgroundOnly.has(key) && !(OPTIONAL_TEXTS.has(key) && value === ''),
    ),
  )
}

function chartModel(values: Values): { series: ChartSeries[]; yAxes: ChartYAxis[] } {
  const axisCount = Math.min(Math.max(Number(values.axisCount) || 1, 1), 4)
  const yAxes = AXES.slice(0, axisCount)
  const series = DEMO_SERIES.map((demo): ChartSeries => {
    const axis = Math.min(Number(values[`${demo.key}Axis`]) || 1, axisCount)
    return {
      id: demo.key,
      name: String(values[`${demo.key}Name`] || demo.name),
      type: demo.type,
      data: demo.data,
      color: String(values[`${demo.key}Color`] || demo.color),
      yAxis: `y${axis}`,
      lineStyle: demo.key === 's2' ? 'dashed' : undefined,
    }
  })
  return { series, yAxes }
}

export function chartToProps(values: Values): Values {
  return { ...componentProps(values), ...chartModel(values), annotations: exampleChartAnnotations }
}

/** Atributos de plantilla comunes a las dos gráficas, a partir de los valores del formulario. */
function commonAttributes(values: Values): string[] {
  const attributes: string[] = [`chart-library="${values.chartLibrary}"`]
  if (values.legend && values.legend !== 'top') attributes.push(`legend="${values.legend}"`)
  if (values.legendValues) attributes.push('legend-values')
  if (values.tooltip === false) attributes.push(':tooltip="false"')
  if (values.zoom) attributes.push('zoom')
  if (values.toolbar) attributes.push('toolbar')
  if (values.fileName) attributes.push(`file-name="${values.fileName}"`)
  if (values.patterns) attributes.push('patterns')
  if (values.dataTable === false) attributes.push(':data-table="false"')
  if (values.ariaLabel) attributes.push(`aria-label="${values.ariaLabel}"`)
  if (values.description) attributes.push(`description="${values.description}"`)
  if (values.animation === false) attributes.push(':animation="false"')
  if (values.theme) attributes.push(`theme="${values.theme}"`)
  attributes.push(`:height="${values.height}"`)
  if (values.currentTime) attributes.push('v-model:current-time="instante"')
  return attributes
}

const indent = (lines: string[], spaces: number) => lines.map((line) => ' '.repeat(spaces) + line)

export function chartToSnippet(values: Values): string {
  const { series, yAxes } = chartModel(values)
  const seriesLines = series.map((s, index) => {
    const extra = s.lineStyle ? `, lineStyle: '${s.lineStyle}'` : ''
    return `{ id: '${s.id}', name: '${s.name}', type: '${s.type}', data: ${DEMO_SERIES[index]!.dataName}, color: '${s.color}', yAxis: '${s.yAxis}'${extra} },`
  })
  const axisLines = yAxes.map((axis) => {
    const extra = axis.inverse ? ', inverse: true' : ''
    const unit = axis.unit ? `, unit: '${axis.unit}'` : ''
    return `{ id: '${axis.id}', label: '${axis.label}'${unit}${extra} },`
  })
  return [
    '<ASChart',
    ...indent(commonAttributes(values), 2),
    '  :series="[',
    ...indent(seriesLines, 4),
    '  ]"',
    '  :y-axes="[',
    ...indent(axisLines, 4),
    '  ]"',
    ...(values.now ? ['  now'] : []),
    '/>',
  ].join('\n')
}

/** Campos del formulario para personalizar nombre y color de las series del hidrograma. */
export const HYDROGRAPH_SERIES_FIELDS: PropField[] = [
  {
    key: 'observedName',
    label: 'Observado: nombre',
    type: 'string',
    default: 'Observado',
    playgroundOnly: true,
  },
  {
    key: 'observedColor',
    label: 'Observado: color',
    type: 'color',
    default: '#2a78d6',
    playgroundOnly: true,
  },
  {
    key: 'harmonieName',
    label: 'Harmonie: nombre',
    type: 'string',
    default: 'Harmonie',
    playgroundOnly: true,
  },
  {
    key: 'harmonieColor',
    label: 'Harmonie: color',
    type: 'color',
    default: '#eb6834',
    playgroundOnly: true,
  },
  { key: 'epsName', label: 'EPS: nombre', type: 'string', default: 'EPS', playgroundOnly: true },
  { key: 'epsColor', label: 'EPS: color', type: 'color', default: '#05a873', playgroundOnly: true },
]

const HYDROGRAPH_ONLY = new Set(HYDROGRAPH_SERIES_FIELDS.map((field) => field.key))

/** Aplica nombres y colores del formulario a una variable del hidrograma. */
function customizeVariable(variable: HydroVariable, values: Values): HydroVariable {
  return {
    ...variable,
    observedName: String(values.observedName || 'Observado'),
    observedColor: String(values.observedColor || '#2a78d6'),
    forecasts: variable.forecasts?.map((forecast) => ({
      ...forecast,
      name: String(values[`${forecast.id}Name`] || forecast.name),
      color: String(values[`${forecast.id}Color`] || ''),
    })),
  }
}

export function hydrographToProps(values: Values): Values {
  const props = componentProps(values, HYDROGRAPH_ONLY)
  return {
    ...props,
    discharge: customizeVariable(exampleDischarge, values),
    precipitation: customizeVariable(examplePrecipitation, values),
    thresholds: exampleThresholds,
    now: EXAMPLE_NOW,
  }
}

export function hydrographToSnippet(values: Values): string {
  const forecasts = (['harmonie', 'eps'] as const).map(
    (id) =>
      `{ id: '${id}', name: '${values[`${id}Name`]}', color: '${values[`${id}Color`]}', values: ${id}${id === 'eps' ? ', percentiles' : ''} },`,
  )
  const attributes = commonAttributes(values)
  if (values.magnitude === 'level') attributes.push('magnitude="level"')
  if (values.precipitationLayout === 'overlay') attributes.push('precipitation-layout="overlay"')
  if (values.precipitationInverted === false) attributes.push(':precipitation-inverted="false"')
  return [
    '<ASHydrographChart',
    ...indent(attributes, 2),
    `  :discharge="{ observed: caudal, observedName: '${values.observedName}', observedColor: '${values.observedColor}', forecasts: [`,
    ...indent(forecasts, 4),
    '  ] }"',
    `  :precipitation="{ observed: lluvia, observedName: '${values.observedName}', observedColor: '${values.observedColor}' }"`,
    '  :thresholds="umbrales"',
    '/>',
  ].join('\n')
}
