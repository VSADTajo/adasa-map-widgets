import { createApp, h, nextTick, ref, shallowRef, type Ref } from 'vue'
import '@/core/styles/tokens.css'
import ASChart from '@/charts/components/ASChart.vue'
import { resolveSpec, type SpecLocale } from '@/charts/core/resolveSpec'
import { chartToCsv } from '@/charts/core/data'
import { readTokens } from '@/core/utils/readTokens'
import { es } from '@/core/i18n/messages'
import { formatDate, formatNumber, formatUnit } from '@/core/utils/format'
import type { ChartExposed, ChartLibrary, ChartSeries } from '@/charts/types/chart'

/**
 * Prueba de rendimiento de las gráficas: 5 series de 100 000 puntos (una
 * por minuto, ~69 días) con un motor, medida en un navegador real.
 *
 * Uso: `npm run dev` y abrir `/perf.html?engine=echarts` (o `chartjs`,
 * `apexcharts`; `&series=5&points=100000` para cambiar el tamaño). El
 * resultado se muestra en la página y queda en `window.__perf` (para
 * lanzarla desde un script). Resultados y conclusiones: docs/rendimiento-graficas.md.
 */

interface PerfResult {
  engine: ChartLibrary
  series: number
  points: number
  /** ms de cada fase (o el error, si falló). */
  timings: Record<string, number | string>
  heapMB?: number
}

const params = new URLSearchParams(location.search)
const engine = (params.get('engine') ?? 'echarts') as ChartLibrary
const seriesCount = Number(params.get('series') ?? 5)
const pointCount = Number(params.get('points') ?? 100_000)

/** Paseo aleatorio reproducible (mismos datos en cada ejecución y motor). */
function makeSeries(seed: number): ChartSeries[] {
  let state = seed
  const random = () => (state = (state * 1_103_515_245 + 12_345) % 2_147_483_648) / 2_147_483_648
  const start = Date.UTC(2026, 8, 1)
  return Array.from({ length: seriesCount }, (_, s) => {
    let value = 50 + s * 20
    return {
      id: `s${s}`,
      name: `Serie ${s + 1}`,
      type: 'line' as const,
      data: Array.from({ length: pointCount }, (_, i): [Date, number] => {
        value += (random() - 0.5) * 2
        return [new Date(start + i * 60_000), Math.round(value * 100) / 100]
      }),
    }
  })
}

/** Espera a que el navegador pinte (dos frames: el cambio y su pintado). */
const painted = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  )

async function measure<T>(
  timings: PerfResult['timings'],
  name: string,
  action: () => T | Promise<T>,
) {
  const start = performance.now()
  timings[name] = 'en curso'
  try {
    const value = await action()
    timings[name] = Math.round(performance.now() - start)
    return value
  } catch (error) {
    timings[name] = `error: ${(error as Error).message}`
    return undefined
  }
}

/** Memoria JS en uso, tras recoger la basura si el navegador lo permite (Chromium con `--js-flags=--expose-gc`). */
const heapMB = () => {
  ;(window as unknown as { gc?: () => void }).gc?.()
  const memory = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory
  return memory ? Math.round(memory.usedJSHeapSize / 1_048_576) : undefined
}

async function run(): Promise<PerfResult> {
  const timings: PerfResult['timings'] = {}
  // Progreso parcial: si una fase no termina, se ve hasta dónde llegó.
  ;(window as unknown as { __perfProgress: object }).__perfProgress = timings
  const result: PerfResult = { engine, series: seriesCount, points: pointCount, timings }
  const host = document.getElementById('chart')!
  const heapBefore = heapMB()

  const series = (await measure(timings, 'generar datos', () => makeSeries(1))) as ChartSeries[]
  // El mismo idioma que usa ASChart por defecto (español), con los formateadores puros.
  const locale: SpecLocale = {
    t: (key, values) =>
      es[key].replace(/\{(\w+)\}/g, (m, name: string) => String(values?.[name] ?? m)),
    formatDate: (date, format) => formatDate(date, format),
    formatNumber: (value, options) => formatNumber(value, options),
    formatUnit: (value, unit, options) => formatUnit(value, unit, options),
    intlLocale: ref('es-ES'),
  }
  const spec = await measure(timings, 'resolveSpec', () =>
    resolveSpec({ series, chartLibrary: engine }, readTokens(host), locale),
  )

  // Montaje del componente completo, hasta que el motor avisa (`ready`) y se pinta.
  // `shallowRef`, como se recomienda para datos grandes: con `ref`, Vue envuelve cada
  // punto en un proxy reactivo (más memoria y más lento). `&reactive=deep` lo mide.
  const data: Ref<ChartSeries[]> =
    params.get('reactive') === 'deep' ? ref(series) : shallowRef(series)
  const chart = ref<ChartExposed | null>(null)
  let ready: () => void = () => {}
  const isReady = new Promise<void>((resolve) => (ready = resolve))
  await measure(timings, 'montar y primer dibujo', async () => {
    createApp({
      render: () =>
        h(ASChart, {
          ref: chart,
          chartLibrary: engine,
          series: data.value,
          yAxes: [{ id: 'y', label: 'Valor', unit: 'm³/s', beginAtZero: false }],
          zoom: true,
          animation: false,
          height: 400,
          onReady: () => ready(),
        }),
    }).mount(host)
    await isReady
    await painted()
  })

  // Actualizar los datos (p. ej. al refrescar del servidor).
  await measure(timings, 'actualizar datos', async () => {
    data.value = makeSeries(2)
    await nextTick()
    await painted()
  })

  // Cursor con el teclado: lo mismo que hace el ratón o un grupo de sincronización.
  const area = host.querySelector<HTMLElement>('[role="application"]')!
  area.focus()
  const steps = 20
  await measure(timings, `mover el cursor (${steps} pasos, total)`, async () => {
    for (let i = 0; i < steps; i++) {
      area.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }))
      await painted()
    }
  })

  const csv = await measure(timings, 'exportar CSV', () => chart.value!.exportData())
  if (typeof csv === 'string') timings['tamaño CSV (MB)'] = Math.round(csv.length / 1_048_576)
  await measure(timings, 'exportar PNG', () => chart.value!.exportImage('png'))
  await measure(timings, 'CSV sin motor (chartToCsv)', () => chartToCsv(spec!, locale.t))

  const heapAfter = heapMB()
  if (heapBefore !== undefined && heapAfter !== undefined) result.heapMB = heapAfter - heapBefore
  return result
}

const output = document.getElementById('result')!
output.textContent = `Midiendo ${engine} con ${seriesCount} × ${pointCount} puntos…`
const promise = run().then((result) => {
  output.textContent = JSON.stringify(result, null, 2)
  return result
})
;(window as unknown as { __perf: Promise<PerfResult> }).__perf = promise
