import type { ChartSeries, ChartSeriesType } from '@/charts/types/chart'
import type { ResolvedChartSpec, SpecLocale } from './resolveSpec'
import { tooltipRows } from './tooltip'

/**
 * Textos accesibles generados a partir de la especificación: el nombre de
 * la gráfica (`aria-label`), su descripción (tipo, series, rango de X y de
 * cada serie, umbrales) y lo que se anuncia al recorrerla con el teclado.
 */

type Translate = SpecLocale['t']

const TYPE_KEYS = {
  line: 'chart.typeLine',
  area: 'chart.typeArea',
  bar: 'chart.typeBar',
  range: 'chart.typeRange',
  scatter: 'chart.typeScatter',
} as const satisfies Record<ChartSeriesType, string>

/** "a, b y c" en el idioma de la gráfica. */
function list(items: string[], intlLocale: string): string {
  return new Intl.ListFormat(intlLocale, { type: 'conjunction' }).format(items)
}

const unique = <T>(items: T[]) => [...new Set(items)]

/**
 * Nombre accesible: "Gráfica de líneas y barras: Caudal, Precipitación".
 * Sale de los props (no de la especificación) para tenerlo desde el primer render.
 */
export function chartAriaLabel(
  series: Pick<ChartSeries, 'type' | 'name' | 'legend'>[],
  intlLocale: string,
  t: Translate,
): string {
  const types = unique(series.map((s) => t(TYPE_KEYS[s.type])))
  // Las series sin leyenda (p. ej. las bandas del hidrograma) son detalle: no van en el nombre.
  const names = unique(series.filter((s) => s.legend !== false).map((s) => s.name))
  return t('chart.ariaLabel', {
    types: list(types, intlLocale),
    series: (names.length ? names : unique(series.map((s) => s.name))).join(', '),
  })
}

/**
 * Descripción para lectores de pantalla: rango del eje X, mínimo y máximo
 * de cada serie (con el instante del máximo) y umbrales con nombre.
 */
export function chartDescription(spec: ResolvedChartSpec, t: Translate): string {
  const sentences: string[] = []
  const xs = spec.series
    .flatMap((series) => [...series.points, ...series.ranges].map(([x]) => x))
    .filter((x) => typeof x === 'string' || Number.isFinite(x))
  if (xs.length) {
    const ordered = spec.xAxis.type === 'category' ? xs : [...xs].sort((a, b) => +a - +b)
    sentences.push(
      t('chart.describeX', {
        from: spec.xAxis.formatTooltip(ordered[0]!),
        to: spec.xAxis.formatTooltip(ordered[ordered.length - 1]!),
      }),
    )
  }

  for (const series of spec.series) {
    const axis = spec.yAxes[series.yAxisIndex]!
    if (series.type === 'range') {
      const lows = series.ranges.map(([, low]) => low).filter((v): v is number => v !== null)
      const highs = series.ranges.map(([, , high]) => high).filter((v): v is number => v !== null)
      if (!lows.length || !highs.length) continue
      sentences.push(
        t('chart.describeRange', {
          name: series.name,
          min: axis.formatValue(Math.min(...lows)),
          max: axis.formatValue(Math.max(...highs)),
        }),
      )
      continue
    }
    const valid = series.points.filter((point): point is [number | string, number] =>
      Number.isFinite(point[1]),
    )
    if (!valid.length) continue
    const min = valid.reduce((a, b) => (b[1] < a[1] ? b : a))
    const max = valid.reduce((a, b) => (b[1] > a[1] ? b : a))
    sentences.push(
      t('chart.describeSeries', {
        name: series.name,
        min: axis.formatValue(min[1]),
        max: axis.formatValue(max[1]),
        at: spec.xAxis.formatTooltip(max[0]),
      }),
    )
  }

  for (const annotation of spec.annotations.y) {
    if (!annotation.label || annotation.kind !== 'line') continue
    sentences.push(
      t('chart.describeThreshold', {
        label: annotation.label,
        value: spec.yAxes[annotation.yAxisIndex]!.formatValue(annotation.value!),
      }),
    )
  }
  return sentences.join(' ')
}

/** Lo que se anuncia al llegar a `x` con el teclado: "18/10/2026, 20:00: Caudal 69,2 m³/s, Lluvia 0,8 mm". */
export function chartAnnouncement(
  spec: ResolvedChartSpec,
  x: number | string,
  t: Translate,
): string {
  const rows = tooltipRows(spec, x)
  const values = rows.length
    ? rows.map((row) => `${row.name} ${row.text}`).join(', ')
    : t('chart.noValues')
  return `${spec.xAxis.formatTooltip(x)}: ${values}`
}
