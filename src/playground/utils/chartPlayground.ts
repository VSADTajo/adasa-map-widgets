import type { ChartSeries, ChartYAxis } from '@/charts/types/chart'
import type {
  HydroBand,
  HydroBandStyle,
  HydroLineStyle,
  HydroObserved,
  HydroVariable,
} from '@/charts/types/HydrographProps'
import type { PropField } from '../propTypes'
import {
  EXAMPLE_NOW,
  exampleChartAnnotations,
  exampleDischarge,
  exampleFlowPoints,
  exampleGaugings,
  exampleInflow,
  exampleLevel,
  exampleOutflow,
  exampleReservoirThresholds,
  exampleVolume,
  examplePrecipitation,
  exampleRainPoints,
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
    data: exampleFlowPoints,
    dataName: 'caudal',
  },
  {
    key: 's2',
    name: 'Nivel',
    color: '#eb6834',
    axis: '2',
    type: 'line' as const,
    data: exampleFlowPoints.map(([date, value]): [Date, number | null] => [
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
    data: exampleRainPoints,
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

/** El selector del tooltip ('true' | 'time' | 'false') como el valor de la prop. */
const tooltipProp = (value: unknown) => (value === 'time' ? 'time' : value !== 'false')

/** Quita los controles que solo existen en el playground y los textos opcionales vacíos. */
function componentProps(values: Values, playgroundOnly: Set<string> = PLAYGROUND_ONLY): Values {
  return {
    ...Object.fromEntries(
      Object.entries(values).filter(
        ([key, value]) => !playgroundOnly.has(key) && !(OPTIONAL_TEXTS.has(key) && value === ''),
      ),
    ),
    tooltip: tooltipProp(values.tooltip),
  }
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
  if (values.tooltip === 'false') attributes.push(':tooltip="false"')
  if (values.tooltip === 'time') attributes.push('tooltip="time"')
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

const LINE_TYPES = ['solid', 'dashed', 'dotted', 'dashdot']

/**
 * Nombre y estilo (color, grosor y trazo) de una serie del hidrograma: el
 * observado o de una previsión (su `name` y su `style`).
 */
function seriesStyleFields(
  prefix: string,
  title: string,
  defaults: { name: string; color: string; type: string },
): PropField[] {
  return [
    {
      key: `${prefix}Name`,
      label: `${title}: nombre`,
      type: 'string',
      default: defaults.name,
      playgroundOnly: true,
    },
    {
      key: `${prefix}Color`,
      label: `${title}: color`,
      type: 'color',
      default: defaults.color,
      playgroundOnly: true,
    },
    {
      key: `${prefix}Width`,
      label: `${title}: grosor (px)`,
      type: 'number',
      default: 2,
      min: 1,
      max: 6,
      step: 0.5,
      playgroundOnly: true,
    },
    {
      key: `${prefix}Type`,
      label: `${title}: trazo`,
      type: 'select',
      options: LINE_TYPES,
      default: defaults.type,
      playgroundOnly: true,
      description: 'Continua, discontinua, puntos o punto y raya.',
    },
  ]
}

/** Campos del formulario para personalizar nombre y estilo de las series del hidrograma. */
export const HYDROGRAPH_SERIES_FIELDS: PropField[] = [
  ...seriesStyleFields('observed', 'Observado', {
    name: 'Observado',
    color: '#2a78d6',
    type: 'solid',
  }),
  ...seriesStyleFields('harmonie', 'Harmonie', {
    name: 'Harmonie',
    color: '#eb6834',
    type: 'dashed',
  }),
  ...seriesStyleFields('eps', 'EPS', { name: 'EPS', color: '#05a873', type: 'dashdot' }),
  {
    key: 'gaugings',
    label: 'Segundo observado (aforos manuales)',
    type: 'boolean',
    default: false,
    playgroundOnly: true,
    description: 'Otra entrada en discharge.observed, con su nombre y su estilo (de puntos).',
  },
  {
    key: 'epsBandColor',
    label: 'EPS percentiles: color',
    type: 'string',
    default: '',
    playgroundOnly: true,
    description: 'bandStyle[banda].color. Vacío: el color de la línea de EPS.',
  },
  {
    key: 'epsOuterOpacity',
    label: 'EPS p10–p90: opacidad',
    type: 'number',
    default: 0.15,
    min: 0.05,
    max: 1,
    step: 0.05,
    playgroundOnly: true,
    description: "bandStyle['p10-p90'].opacity (la banda más ancha).",
  },
  {
    key: 'epsInnerOpacity',
    label: 'EPS p25–p75: opacidad',
    type: 'number',
    default: 0.3,
    min: 0.05,
    max: 1,
    step: 0.05,
    playgroundOnly: true,
    description: "bandStyle['p25-p75'].opacity.",
  },
  {
    key: 'epsBandsLegend',
    label: 'EPS percentiles en la leyenda',
    type: 'boolean',
    default: true,
    playgroundOnly: true,
    description: 'bandStyle[banda].legend.',
  },
  {
    key: 'precipitationUnit',
    label: 'Unidad de la precipitación (precipitation.unit)',
    type: 'select',
    options: ['mm', 'mm/h'],
    default: 'mm',
    playgroundOnly: true,
    description:
      'Acumulada por intervalo (mm) o intensidad (mm/h): título del eje, tooltip, tabla y CSV.',
  },
  {
    key: 'episode',
    label: 'Marcar el episodio (annotations)',
    type: 'boolean',
    default: false,
    playgroundOnly: true,
    description: 'Añade un intervalo en X con `annotations`, igual que en ASChart.',
  },
]

/** El estilo de una serie a partir del formulario (`style` de la variable o de la previsión). */
function styleOf(values: Values, prefix: string): HydroLineStyle {
  return {
    color: String(values[`${prefix}Color`] || ''),
    width: Number(values[`${prefix}Width`]) || 2,
    type: values[`${prefix}Type`] as HydroLineStyle['type'],
  }
}

/** `bandStyle` de EPS a partir del formulario: opacidad, color y leyenda de cada banda. */
function bandStyleOf(values: Values): Partial<Record<HydroBand, HydroBandStyle>> {
  const common = {
    color: String(values.epsBandColor || '') || undefined,
    legend: values.epsBandsLegend !== false,
  }
  return {
    'p10-p90': { ...common, opacity: Number(values.epsOuterOpacity) },
    'p25-p75': { ...common, opacity: Number(values.epsInnerOpacity) },
  }
}

function bandStyleSnippet(values: Values): string {
  const color = values.epsBandColor ? `color: '${values.epsBandColor}', ` : ''
  const legend = values.epsBandsLegend === false ? ', legend: false' : ''
  return `{ 'p10-p90': { ${color}opacity: ${values.epsOuterOpacity}${legend} }, 'p25-p75': { ${color}opacity: ${values.epsInnerOpacity}${legend} } }`
}

/** Texto del estilo en el snippet: `{ color: '#…', width: 2, type: 'dashed' }`. */
function styleSnippet(values: Values, prefix: string): string {
  const style = styleOf(values, prefix)
  return `{ color: '${style.color}', width: ${style.width}, type: '${style.type}' }`
}

/** Qué variables se muestran en el ejemplo (cada una es una prop del hidrograma). */
export const HYDROGRAPH_VARIABLE_FIELDS: PropField[] = [
  {
    key: 'showDischarge',
    label: 'Caudal (discharge)',
    type: 'boolean',
    default: true,
    playgroundOnly: true,
  },
  {
    key: 'showPrecipitation',
    label: 'Precipitación (precipitation)',
    type: 'boolean',
    default: true,
    playgroundOnly: true,
  },
  {
    key: 'showInflow',
    label: 'Caudal de entrada (inflow)',
    type: 'boolean',
    default: false,
    playgroundOnly: true,
    description: 'Mismo eje que el caudal (m³/s).',
  },
  {
    key: 'showOutflow',
    label: 'Caudal de salida (outflow)',
    type: 'boolean',
    default: false,
    playgroundOnly: true,
    description: 'Mismo eje que el caudal (m³/s).',
  },
  {
    key: 'showVolume',
    label: 'Volumen (volume)',
    type: 'boolean',
    default: false,
    playgroundOnly: true,
    description: 'Su propio eje, en hm³.',
  },
  {
    key: 'showLevel',
    label: 'Nivel (level)',
    type: 'boolean',
    default: false,
    playgroundOnly: true,
    description: 'Su propio eje, con previsión EPS y percentiles.',
  },
  {
    key: 'levelUnit',
    label: 'Unidad del nivel (level.unit)',
    type: 'select',
    options: ['m', 'msnm'],
    default: 'msnm',
    playgroundOnly: true,
  },
  {
    key: 'reservoirThresholds',
    label: 'Umbrales de volumen y nivel',
    type: 'boolean',
    default: true,
    playgroundOnly: true,
    description: "thresholds con variable: 'volume' (resguardo) y 'level' (cota máxima).",
  },
]

/** Props del hidrograma que no se editan en el formulario (datos, funciones...): solo se documentan. */
export const HYDROGRAPH_DOC_FIELDS: PropField[] = (
  [
    [
      'discharge',
      'HydroVariable',
      '',
      'Caudal (o nivel con magnitude="level"): línea, eje a la izquierda. Opcional.',
    ],
    ['inflow', 'HydroVariable', '', 'Caudal de entrada, en el eje del caudal (m³/s).'],
    ['outflow', 'HydroVariable', '', 'Caudal de salida (desembalse), en el eje del caudal (m³/s).'],
    ['volume', 'HydroVariable', '', 'Volumen, en su propio eje (hm³ por defecto).'],
    ['level', 'HydroVariable', '', "Nivel o cota, en su propio eje (m por defecto; unit: 'msnm')."],
    [
      'precipitation',
      'HydroVariable',
      '',
      'Precipitación: barras en su panel o superpuestas (precipitationLayout).',
    ],
    [
      'thresholds',
      'HydroThreshold[]',
      '',
      "Umbrales de aviso; cada uno en el eje de su variable ('discharge', 'volume' o 'level').",
    ],
    [
      'now',
      'Date | boolean',
      'true',
      'Línea "ahora" entre observado y previsto (true = la hora actual).',
    ],
    [
      'bands',
      'HydroBand[]',
      "['p10-p90', 'p25-p75']",
      'Bandas de percentiles a dibujar (v-model:bands). [] las oculta.',
    ],
    [
      'visibleForecasts',
      'string[]',
      'todas',
      'Ids de las previsiones visibles en todas las variables (v-model:visible-forecasts).',
    ],
    ['xAxis', "Omit<ChartXAxisConfig, 'type'>", '', 'Eje de tiempo: título, formato y límites.'],
    [
      'annotations',
      'ChartAnnotations',
      '',
      'Anotaciones extra como en ASChart; las de Y van al eje principal.',
    ],
    ['extraSeries', 'ChartSeries[]', '', 'Series adicionales (por defecto en el eje principal).'],
    [
      'extraYAxes',
      'ChartYAxis[]',
      '',
      'Ejes Y adicionales: hasta 4 en total con los del hidrograma.',
    ],
    [
      'seriesOverrides',
      'Record<string, Partial<ChartSeries>>',
      '',
      "Retoques por id: '<variable>-observed', '<variable>-<fuente>', '<variable>-<fuente>-p10-p90'.",
    ],
    [
      'yAxisOverrides',
      'Record<string, Partial<ChartYAxis>>',
      '',
      "Retoques de los ejes 'precipitation', 'discharge', 'volume' y 'level'.",
    ],
    [
      'currentTime',
      'Date | null',
      '',
      'Instante seleccionado (v-model:current-time), como en ASChart.',
    ],
    ['syncGroup', 'string', '', 'Sincroniza cursor y zoom con otras gráficas del mismo grupo.'],
    ['loading', 'boolean', 'false', 'Muestra el estado de carga.'],
    ['emptyText', 'string', '', 'Texto sin datos.'],
    ['error', 'string', '', 'Mensaje de error en lugar de la gráfica.'],
    [
      'nativeOptions',
      '(options, library) => unknown',
      '',
      'Vía de escape: retoca las opciones nativas del motor.',
    ],
  ] as const
).map(([key, docType, defaultText, description]) => ({
  key,
  label: key,
  type: 'string' as const,
  default: defaultText,
  docType,
  description,
  docOnly: true,
}))

const HYDROGRAPH_ONLY = new Set(
  [...HYDROGRAPH_SERIES_FIELDS, ...HYDROGRAPH_VARIABLE_FIELDS].map((field) => field.key),
)

/** Aplica nombres y colores del formulario a una variable del hidrograma. */
/** Aforos manuales: el segundo observado del ejemplo, de puntos y sin línea entre ellos. */
const GAUGINGS = {
  id: 'aforos',
  name: 'Aforos manuales',
  values: exampleGaugings,
  style: { color: '#6250d6', width: 2, type: 'dotted' as const },
}

/** Nombre y estilo del formulario sobre la variable de ejemplo: el 1.er observado y cada previsión. */
function customizeVariable(
  variable: HydroVariable,
  values: Values,
  extraObserved: HydroObserved[] = [],
): HydroVariable {
  const [first] = variable.observed as HydroObserved[]
  return {
    ...variable,
    observed: [
      {
        ...first!,
        name: String(values.observedName || 'Observado'),
        style: styleOf(values, 'observed'),
      },
      ...extraObserved,
    ],
    forecasts: variable.forecasts?.map((forecast) => ({
      ...forecast,
      name: String(values[`${forecast.id}Name`] || forecast.name),
      bandStyle: forecast.percentiles ? bandStyleOf(values) : undefined,
      style: styleOf(values, forecast.id),
    })),
  }
}

export function hydrographToProps(values: Values): Values {
  const props = componentProps(values, HYDROGRAPH_ONLY)
  const flow = values.showDischarge || values.showInflow || values.showOutflow
  return {
    ...props,
    discharge: values.showDischarge
      ? customizeVariable(exampleDischarge, values, values.gaugings ? [GAUGINGS] : [])
      : undefined,
    precipitation: values.showPrecipitation
      ? {
          ...customizeVariable(examplePrecipitation, values),
          unit: String(values.precipitationUnit),
        }
      : undefined,
    inflow: values.showInflow ? exampleInflow : undefined,
    outflow: values.showOutflow ? exampleOutflow : undefined,
    volume: values.showVolume ? exampleVolume : undefined,
    level: values.showLevel ? { ...exampleLevel, unit: String(values.levelUnit) } : undefined,
    thresholds: [
      ...(flow ? exampleThresholds : []),
      ...(values.reservoirThresholds
        ? exampleReservoirThresholds.filter(
            (t) =>
              (t.variable === 'volume' && values.showVolume) ||
              (t.variable === 'level' && values.showLevel),
          )
        : []),
    ],
    now: EXAMPLE_NOW,
    annotations: values.episode ? { x: exampleChartAnnotations.x } : undefined,
  }
}

export function hydrographToSnippet(values: Values): string {
  const observed = (name: string, values_: string, style: string) =>
    `{ id: 'saih', name: '${name}', values: ${values_}, style: ${style} },`
  const forecasts = (['harmonie', 'eps'] as const).map(
    (id) =>
      `{ id: '${id}', name: '${values[`${id}Name`]}', values: ${id}${id === 'eps' ? ', percentiles' : ''}, style: ${styleSnippet(values, id)}${id === 'eps' ? `, bandStyle: ${bandStyleSnippet(values)}` : ''} },`,
  )
  /** Una variable con su lista de observados y, si las hay, sus previsiones. */
  const variable = (
    prop: string,
    observedLines: string[],
    forecastLines: string[] = [],
    extra = '',
  ) => [
    `  :${prop}="{`,
    '    observed: [',
    ...indent(observedLines, 6),
    '    ],',
    ...(forecastLines.length ? ['    forecasts: [', ...indent(forecastLines, 6), '    ],'] : []),
    ...(extra ? [`    ${extra}`] : []),
    '  }"',
  ]
  const attributes = commonAttributes(values)
  if (values.magnitude === 'level') attributes.push('magnitude="level"')
  if (values.precipitationLayout === 'overlay') attributes.push('precipitation-layout="overlay"')
  if (values.precipitationInverted === false) attributes.push(':precipitation-inverted="false"')
  const reservoir = values.reservoirThresholds && (values.showVolume || values.showLevel)
  return [
    '<ASHydrographChart',
    ...indent(attributes, 2),
    ...(values.showDischarge
      ? variable(
          'discharge',
          [
            observed(String(values.observedName), 'caudal', styleSnippet(values, 'observed')),
            ...(values.gaugings
              ? [
                  "{ id: 'aforos', name: 'Aforos manuales', values: aforos, style: { color: '#6250d6', width: 2, type: 'dotted' } },",
                ]
              : []),
          ],
          forecasts,
        )
      : []),
    ...(values.showPrecipitation
      ? variable(
          'precipitation',
          [observed(String(values.observedName), 'lluvia', `{ color: '${values.observedColor}' }`)],
          [],
          `unit: '${values.precipitationUnit}',`,
        )
      : []),
    ...(values.showInflow
      ? variable(
          'inflow',
          ["{ id: 'saih', name: 'Caudal de entrada', values: entrada },"],
          ["{ id: 'eps', name: 'EPS', values: entradaEps },"],
        )
      : []),
    ...(values.showOutflow
      ? variable('outflow', ["{ id: 'saih', name: 'Caudal de salida', values: salida },"])
      : []),
    ...(values.showVolume
      ? variable('volume', ["{ id: 'saih', name: 'Volumen', values: volumen },"])
      : []),
    ...(values.showLevel
      ? variable(
          'level',
          ["{ id: 'saih', name: 'Nivel', values: cota },"],
          ["{ id: 'eps', name: 'EPS', values: cotaEps, percentiles: cotaPercentiles },"],
          `unit: '${values.levelUnit}',`,
        )
      : []),
    `  :thresholds="${reservoir ? '[...umbrales, ...umbralesEmbalse]' : 'umbrales'}"`,
    ...(values.episode
      ? [`  :annotations="{ x: [{ type: 'range', from: inicio, to: fin, label: 'Episodio' }] }"`]
      : []),
    '/>',
  ].join('\n')
}
