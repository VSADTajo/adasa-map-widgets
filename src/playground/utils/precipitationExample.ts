import type { HydroPoint } from '@/charts/types/HydrographProps'
import type { PrecipitationSeries, PrecipitationThreshold } from '@/charts/types/PrecipitationProps'
import type { PropField } from '../propTypes'
import type { CodeExample } from '../registry'
import { EXAMPLE_NOW } from './chartExamples'

/*
 * Ejemplo de `ASPrecipitationChart`, como el widget de precipitaciones de
 * ThingsBoard: telemetría en tiempo real (mm/h), precipitación areal
 * observada (mm por hora) y la previsión de WRF (horaria, 3 días) o ECMWF
 * (cada 3 h, 7 días), con el selector de modelo en la barra.
 */

type Values = Record<string, unknown>

const MINUTE = 60_000
const at = (minutes: number) => new Date(EXAMPLE_NOW.getTime() + minutes * MINUTE)

/** Lluvia en ráfagas (mm/h), determinista: un frente hace 30 h y otro dentro de 20 h. */
function rainRate(hours: number): number {
  const burst = (center: number, width: number, peak: number) =>
    peak * Math.exp(-(((hours - center) / width) ** 2))
  const value =
    (burst(-30, 4, 9) + burst(-8, 3, 4) + burst(20, 6, 7) + burst(70, 10, 3)) *
    (0.65 + 0.35 * Math.abs(Math.sin(hours * 1.3)))
  return Math.round(value * 100) / 100
}

/** Puntos cada `stepMinutes` entre `fromMinutes` y `toMinutes` (respecto a ahora). */
function sample(
  fromMinutes: number,
  toMinutes: number,
  stepMinutes: number,
  value: (hours: number) => number,
): HydroPoint[] {
  const points: HydroPoint[] = []
  for (let minutes = fromMinutes; minutes <= toMinutes; minutes += stepMinutes) {
    points.push([at(minutes), value(minutes / 60)])
  }
  return points
}

/** mm caídos en el intervalo de `stepMinutes` que termina en cada instante. */
const depth =
  (stepMinutes: number, factor = 1) =>
  (hours: number) =>
    Math.round(rainRate(hours) * factor * (stepMinutes / 60) * 100) / 100

/** Telemetría: intensidad (mm/h) cada 10 min, últimas 48 h. */
export const DEMO_TELEMETRY = sample(-48 * 60, 0, 10, rainRate)
/** Precipitación areal de la subcuenca: mm por hora, últimas 48 h (algo menor que el pluviómetro). */
export const DEMO_AREAL = sample(-48 * 60, 0, 60, depth(60, 0.8))
/** Previsiones: mm por intervalo, desde la próxima hora. */
export const DEMO_FORECASTS: Record<string, HydroPoint[]> = {
  WRF: sample(60, 72 * 60, 60, depth(60)),
  ECMWF: sample(180, 7 * 24 * 60, 180, depth(180, 0.9)),
}

export const DEMO_PRECIPITATION_THRESHOLDS: PrecipitationThreshold[] = [
  { value: 10, level: 'amarillo', label: '10 mm/h' },
  { value: 60, level: 'naranja', axis: 'cumulative', label: '60 mm acumulados' },
]

/** Previsiones del ejemplo: cada una con su color (y su acumulado, del mismo color). */
const FORECASTS = [
  { id: 'WRF', label: 'WRF (3 días)', color: '#FFA500' },
  { id: 'ECMWF', label: 'ECMWF (7 días)', color: '#05a873' },
] as const

const DISPLAYS = ['bar', 'line', 'area']

/** Campos del formulario: qué series hay, sus acumulados y cómo se dibujan. */
export const PRECIPITATION_FIELDS: PropField[] = [
  {
    key: 'showTelemetry',
    label: "Observado: P. TR (input: 'intensity', cada 10 min)",
    type: 'boolean',
    default: true,
    playgroundOnly: true,
  },
  {
    key: 'showAreal',
    label: "Observado: P. Areal (input: 'depth', horaria)",
    type: 'boolean',
    default: true,
    playgroundOnly: true,
  },
  {
    key: 'showWRF',
    label: 'Previsión: WRF (horaria, 3 días)',
    type: 'boolean',
    default: true,
    playgroundOnly: true,
    description: 'Las previsiones también se eligen en la barra (selector múltiple).',
  },
  {
    key: 'showECMWF',
    label: 'Previsión: ECMWF (cada 3 h, 7 días)',
    type: 'boolean',
    default: true,
    playgroundOnly: true,
  },
  {
    key: 'telemetryCumulative',
    label: 'Acumulado de P. TR',
    type: 'boolean',
    default: true,
    playgroundOnly: true,
  },
  {
    key: 'arealCumulative',
    label: 'Acumulado de P. Areal',
    type: 'boolean',
    default: false,
    playgroundOnly: true,
  },
  {
    key: 'forecastCumulative',
    label: 'Acumulado de cada previsión',
    type: 'boolean',
    default: true,
    playgroundOnly: true,
  },
  {
    key: 'continueObserved',
    label: 'Las previsiones continúan el observado',
    type: 'boolean',
    default: true,
    playgroundOnly: true,
    description:
      'cumulative.continueFrom: por defecto, el primer observado con acumulado; false, desde 0.',
  },
  {
    key: 'observedDisplay',
    label: 'Observados: dibujo (display)',
    type: 'select',
    options: DISPLAYS,
    default: 'bar',
    playgroundOnly: true,
  },
  {
    key: 'forecastDisplay',
    label: 'Previsiones: dibujo (display)',
    type: 'select',
    options: DISPLAYS,
    default: 'bar',
    playgroundOnly: true,
    description: 'En columnas, semitransparentes; en área, con degradado.',
  },
  {
    key: 'forecastGradient',
    label: 'Previsiones en área: degradado (gradient)',
    type: 'boolean',
    default: true,
    playgroundOnly: true,
  },
  {
    key: 'withThresholds',
    label: 'Umbrales (intensidad y acumulado)',
    type: 'boolean',
    default: false,
    playgroundOnly: true,
  },
]

/** Ids de las previsiones visibles según el formulario. */
const visibleForecasts = (values: Values) =>
  FORECASTS.filter((forecast) => values[`show${forecast.id}`]).map((forecast) => forecast.id)

/** Las series del ejemplo según el formulario: dos observados y dos previsiones. */
export function precipitationSeries(values: Values): PrecipitationSeries[] {
  const observedDisplay = values.observedDisplay as PrecipitationSeries['display']
  return [
    ...(values.showTelemetry
      ? [
          {
            id: 'tr',
            name: 'P. TR',
            values: DEMO_TELEMETRY,
            input: 'intensity' as const,
            intervalMinutes: 10,
            display: observedDisplay,
            style: { color: '#0066CC' },
            cumulative: Boolean(values.telemetryCumulative),
          },
        ]
      : []),
    ...(values.showAreal
      ? [
          {
            id: 'areal',
            name: 'P. Areal',
            values: DEMO_AREAL,
            display: observedDisplay,
            style: { color: '#9C27B0' },
            cumulative: Boolean(values.arealCumulative),
          },
        ]
      : []),
    ...FORECASTS.filter((forecast) => values[`show${forecast.id}`]).map(
      (forecast): PrecipitationSeries => ({
        id: forecast.id.toLowerCase(),
        name: forecast.id,
        kind: 'forecast',
        values: DEMO_FORECASTS[forecast.id]!,
        display: values.forecastDisplay as PrecipitationSeries['display'],
        gradient: Boolean(values.forecastGradient),
        style: { color: forecast.color },
        cumulative: values.forecastCumulative
          ? values.continueObserved
            ? true
            : { continueFrom: false }
          : false,
      }),
    ),
  ]
}

/** Selector múltiple de previsiones en la barra (con "Todas" y cuántas hay elegidas). */
export function providerToolbar(values: Values) {
  return values.toolbar === false
    ? false
    : {
        items: [
          {
            type: 'select' as const,
            id: 'forecasts',
            label: 'Previsiones',
            multiple: true,
            selectAll: true,
            showCount: true,
            value: visibleForecasts(values),
            options: FORECASTS.map((forecast) => ({ value: forecast.id, label: forecast.label })),
          },
        ],
      }
}

/** Sincroniza los interruptores del formulario con el selector de la barra. */
export function applyForecastSelection(values: Values, ids: string[]): void {
  for (const forecast of FORECASTS) values[`show${forecast.id}`] = ids.includes(forecast.id)
}

export function precipitationSnippet(values: Values): string {
  const lines = ['<ASPrecipitationChart']
  const attributes: string[] = [`chart-library="${values.chartLibrary}"`]
  if (values.rate === 'depth') attributes.push('rate="depth"')
  if (values.interval) attributes.push(`:interval="${values.interval}"`)
  attributes.push('v-model:show-cumulative="verAcumulados"')
  if (values.tooltip === 'true') attributes.push(':tooltip="true"')
  if (values.tooltip === 'false') attributes.push(':tooltip="false"')
  if (values.legendValues === false) attributes.push(':legend-values="false"')
  if (values.zoom) attributes.push('zoom')
  if (values.theme) attributes.push(`theme="${values.theme}"`)
  attributes.push(`:height="${values.height}"`)
  lines.push(...attributes.map((a) => `  ${a}`))
  const observedDisplay =
    values.observedDisplay !== 'bar' ? `, display: '${values.observedDisplay}'` : ''
  const series: string[] = []
  if (values.showTelemetry) {
    series.push(
      `{ id: 'tr', name: 'P. TR', values: telemetria, input: 'intensity', intervalMinutes: 10${observedDisplay}, style: { color: '#0066CC' }${values.telemetryCumulative ? ', cumulative: true' : ''} },`,
    )
  }
  if (values.showAreal) {
    series.push(
      `{ id: 'areal', name: 'P. Areal', values: areal${observedDisplay}, style: { color: '#9C27B0' }${values.arealCumulative ? ', cumulative: true' : ''} },`,
    )
  }
  const cumulative = values.forecastCumulative
    ? values.continueObserved
      ? ', cumulative: true'
      : ', cumulative: { continueFrom: false }'
    : ''
  const display = values.forecastDisplay !== 'bar' ? `, display: '${values.forecastDisplay}'` : ''
  const gradient =
    values.forecastDisplay === 'area' && !values.forecastGradient ? ', gradient: false' : ''
  for (const forecast of FORECASTS.filter((f) => values[`show${f.id}`])) {
    series.push(
      `{ id: '${forecast.id.toLowerCase()}', name: '${forecast.id}', kind: 'forecast', values: ${forecast.id.toLowerCase()}${display}${gradient}, style: { color: '${forecast.color}' }${cumulative} },`,
    )
  }
  lines.push('  :series="[', ...series.map((s) => `    ${s}`), '  ]"')
  if (values.withThresholds) lines.push('  :thresholds="umbrales"')
  if (values.toolbar !== false) {
    lines.push(
      `  :toolbar="{ items: [{ type: 'select', id: 'forecasts', label: 'Previsiones', multiple: true, selectAll: true, showCount: true, value: previsiones, options: modelos }] }"`,
      '  @toolbar-change="({ id, value }) => id === \'forecasts\' && (previsiones = value)"',
    )
  }
  lines.push('/>')
  return lines.join('\n')
}

/** Ejemplos: cómo convertir entre mm y mm/h, y el widget de ThingsBoard con datos de una API. */
export const precipitationExamples: CodeExample[] = [
  {
    title: 'mm por intervalo o mm/h: input y rate',
    description:
      "Cada serie dice cómo llegan sus valores (input: 'depth', mm caídos en el intervalo que termina en cada instante; 'intensity', mm/h) y la gráfica dice qué muestra el eje izquierdo (rate: 'intensity' por defecto, o 'depth'). La librería convierte en los dos sentidos con la duración de cada intervalo (la distancia al punto anterior, o intervalMinutes si la serie tiene huecos). El acumulado se calcula siempre en mm. Las mismas conversiones se exportan como funciones puras para usarlas fuera de la gráfica.",
    code: `import { convertPrecipitation, toCumulative, toDepth, toIntensity } from '@vsadtajo/adasa-ui/charts'

// La API devuelve mm por hora; quiero mm/h:
const intensidad = toIntensity(mmPorHora)                       // 2 mm en 30 min → 4 mm/h
// La telemetría llega en mm/h cada 10 min; quiero mm por intervalo:
const mm = toDepth(telemetria, { intervalMinutes: 10 })        // 6 mm/h → 1 mm
// Lo mismo, eligiendo origen y destino:
const serie = convertPrecipitation(valores, 'depth', 'intensity')
// Acumulado (mm), continuando un total anterior:
const acumulado = toCumulative(mm, { start: totalObservado })`,
  },
  {
    title: 'Desde una API de predicciones (como el widget de ThingsBoard)',
    description:
      'La gráfica no pide datos: el proyecto los trae (con su token) y los pasa en series, con tantos observados y previsiones como haga falta. El selector de previsiones es un elemento propio de la barra; al cambiarlo, el proyecto pide las elegidas.',
    code: `<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { ASPrecipitationChart, type PrecipitationSeries } from '@vsadtajo/adasa-ui/charts'

const previsiones = ref(['WRF', 'ECMWF'])
const datos = ref<Record<string, [Date, number | null][]>>({})

// Cada previsión elegida, de la API (WRF a 3 días, ECMWF a 7).
watchEffect(async () => {
  for (const modelo of previsiones.value) {
    const respuesta = await fetch(\`/v1/prediction-results/?prediction_provider=\${modelo}\`, {
      headers: { Authorization: \`Bearer \${token}\` },
    })
    datos.value[modelo] = (await respuesta.json()).map((p) => [new Date(p.date_timestamp * 1000), p.value])
  }
})

const series = computed<PrecipitationSeries[]>(() => [
  // Varios observados...
  { id: 'tr', name: 'P. TR', values: telemetria.value, input: 'intensity', style: { color: '#0066CC' }, cumulative: true },
  { id: 'areal', name: 'P. Areal', values: areal.value, style: { color: '#9C27B0' } },
  // ...y varias previsiones; cada acumulado continúa el de P. TR.
  ...previsiones.value.map((modelo) => ({
    id: modelo, name: modelo, kind: 'forecast' as const, values: datos.value[modelo] ?? [], cumulative: true,
  })),
])
</script>

<template>
  <ASPrecipitationChart
    :series="series"
    :toolbar="{ items: [{ type: 'select', id: 'previsiones', label: 'Previsiones', value: previsiones,
      multiple: true, selectAll: true, showCount: true,
      options: [{ value: 'WRF', label: 'WRF' }, { value: 'ECMWF', label: 'ECMWF' }] }] }"
    @toolbar-change="({ value }) => (previsiones = value)"
  />
</template>`,
  },
]
