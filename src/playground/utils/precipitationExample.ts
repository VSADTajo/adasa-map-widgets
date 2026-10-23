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

/** Campos del formulario: qué series hay, sus acumulados y cómo se dibujan. */
export const PRECIPITATION_FIELDS: PropField[] = [
  {
    key: 'provider',
    label: 'Modelo de previsión',
    type: 'select',
    options: ['WRF', 'ECMWF'],
    default: 'WRF',
    playgroundOnly: true,
    description: 'También desde el selector de la barra (toolbar.items + toolbar-change).',
  },
  {
    key: 'showTelemetry',
    label: "P. TR (input: 'intensity', cada 10 min)",
    type: 'boolean',
    default: true,
    playgroundOnly: true,
  },
  {
    key: 'showAreal',
    label: "P. Areal (input: 'depth', horaria)",
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
    label: 'Acumulado de la previsión',
    type: 'boolean',
    default: true,
    playgroundOnly: true,
  },
  {
    key: 'continueObserved',
    label: 'La previsión continúa el observado',
    type: 'boolean',
    default: true,
    playgroundOnly: true,
    description:
      'cumulative.continueFrom: por defecto, el primer observado con acumulado; false, desde 0.',
  },
  {
    key: 'forecastDisplay',
    label: 'Previsión: dibujo (display)',
    type: 'select',
    options: ['area', 'line', 'bar'],
    default: 'area',
    playgroundOnly: true,
  },
  {
    key: 'forecastGradient',
    label: 'Previsión: degradado (gradient)',
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

/** Las series del ejemplo según el formulario. */
export function precipitationSeries(values: Values): PrecipitationSeries[] {
  const provider = String(values.provider || 'WRF')
  return [
    ...(values.showTelemetry
      ? [
          {
            id: 'tr',
            name: 'P. TR',
            values: DEMO_TELEMETRY,
            input: 'intensity' as const,
            intervalMinutes: 10,
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
            style: { color: '#9C27B0' },
            cumulative: Boolean(values.arealCumulative),
          },
        ]
      : []),
    {
      id: 'prevision',
      name: provider,
      kind: 'forecast' as const,
      values: DEMO_FORECASTS[provider]!,
      display: values.forecastDisplay as PrecipitationSeries['display'],
      gradient: Boolean(values.forecastGradient),
      style: { color: '#FFA500' },
      cumulative: values.forecastCumulative
        ? {
            name: 'Acumulat',
            style: { color: '#14b554' },
            ...(values.continueObserved ? {} : { continueFrom: false as const }),
          }
        : false,
    },
  ]
}

/** El selector de modelo en la barra, como en el widget de ThingsBoard. */
export function providerToolbar(values: Values) {
  return values.toolbar === false
    ? false
    : {
        items: [
          {
            type: 'select' as const,
            id: 'provider',
            label: 'Modelo de previsión',
            value: String(values.provider || 'WRF'),
            // Muestra en el botón el modelo elegido.
            showCount: true,
            options: [
              { value: 'WRF', label: 'WRF (3 días)' },
              { value: 'ECMWF', label: 'ECMWF (7 días)' },
            ],
          },
        ],
      }
}

export function precipitationSnippet(values: Values): string {
  const lines = ['<ASPrecipitationChart']
  const attributes: string[] = [`chart-library="${values.chartLibrary}"`]
  if (values.rate === 'depth') attributes.push('rate="depth"')
  attributes.push('v-model:show-cumulative="verAcumulados"')
  if (values.tooltip === 'true') attributes.push(':tooltip="true"')
  if (values.tooltip === 'false') attributes.push(':tooltip="false"')
  if (values.legendValues === false) attributes.push(':legend-values="false"')
  if (values.zoom) attributes.push('zoom')
  if (values.theme) attributes.push(`theme="${values.theme}"`)
  attributes.push(`:height="${values.height}"`)
  lines.push(...attributes.map((a) => `  ${a}`))
  const series: string[] = []
  if (values.showTelemetry) {
    series.push(
      `{ id: 'tr', name: 'P. TR', values: telemetria, input: 'intensity', intervalMinutes: 10, style: { color: '#0066CC' }${values.telemetryCumulative ? ', cumulative: true' : ''} },`,
    )
  }
  if (values.showAreal) {
    series.push(
      `{ id: 'areal', name: 'P. Areal', values: areal, style: { color: '#9C27B0' }${values.arealCumulative ? ', cumulative: true' : ''} },`,
    )
  }
  const cumulative = values.forecastCumulative
    ? `, cumulative: { name: 'Acumulat', style: { color: '#14b554' }${values.continueObserved ? '' : ', continueFrom: false'} }`
    : ''
  const display = values.forecastDisplay !== 'area' ? `, display: '${values.forecastDisplay}'` : ''
  const gradient = values.forecastGradient ? '' : ', gradient: false'
  series.push(
    `{ id: 'prevision', name: modelo, kind: 'forecast', values: prevision, style: { color: '#FFA500' }${display}${gradient}${cumulative} },`,
  )
  lines.push('  :series="[', ...series.map((s) => `    ${s}`), '  ]"')
  if (values.withThresholds) lines.push('  :thresholds="umbrales"')
  if (values.toolbar !== false) {
    lines.push(
      `  :toolbar="{ items: [{ type: 'select', id: 'provider', label: 'Modelo de previsión', value: modelo, options: modelos, showCount: true }] }"`,
      '  @toolbar-change="({ id, value }) => id === \'provider\' && (modelo = value)"',
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
      'La gráfica no pide datos: el proyecto los trae (con su token) y los pasa en series. El selector de modelo es un elemento propio de la barra; al cambiarlo, el proyecto pide la otra previsión.',
    code: `<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { ASPrecipitationChart, type PrecipitationSeries } from '@vsadtajo/adasa-ui/charts'

const modelo = ref<'WRF' | 'ECMWF'>('WRF')
const prevision = ref<[Date, number | null][]>([])

watchEffect(async () => {
  const dias = modelo.value === 'ECMWF' ? 7 : 3
  const respuesta = await fetch(\`/v1/prediction-results/?prediction_provider=\${modelo.value}&dias=\${dias}\`, {
    headers: { Authorization: \`Bearer \${token}\` },
  })
  prevision.value = (await respuesta.json()).map((p) => [new Date(p.date_timestamp * 1000), p.value])
})

const series = computed<PrecipitationSeries[]>(() => [
  { id: 'tr', name: 'P. TR', values: telemetria.value, input: 'intensity', style: { color: '#0066CC' } },
  { id: 'prevision', name: modelo.value, kind: 'forecast', values: prevision.value,
    style: { color: '#FFA500' }, cumulative: { name: 'Acumulat', style: { color: '#14b554' } } },
])
</script>

<template>
  <ASPrecipitationChart
    :series="series"
    :toolbar="{ items: [{ type: 'select', id: 'modelo', label: 'Modelo', value: modelo, showCount: true,
      options: [{ value: 'WRF', label: 'WRF' }, { value: 'ECMWF', label: 'ECMWF' }] }] }"
    @toolbar-change="({ value }) => (modelo = value)"
  />
</template>`,
  },
]
