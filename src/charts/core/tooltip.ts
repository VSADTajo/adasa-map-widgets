import type { ResolvedChartSpec, ResolvedSeries } from './resolveSpec'

export interface TooltipRow {
  seriesId: string
  name: string
  color: string
  /** Valor ya formateado con la unidad de su eje (o "inferior – superior" en bandas). */
  text: string
}

/**
 * Índice del punto más cercano a `x` en una lista ordenada por X, si está a
 * menos de medio paso de muestreo de esa serie. Así una serie horaria y otra
 * cada 15 minutos aparecen juntas en el tooltip aunque sus instantes no
 * coincidan exactamente.
 */
function nearestIndex(xs: (number | string)[], x: number | string): number {
  if (xs.length === 0) return -1
  if (typeof x === 'string' || typeof xs[0] === 'string') return xs.indexOf(x)
  const values = xs as number[]
  let low = 0
  let high = values.length - 1
  while (low < high) {
    const mid = (low + high) >> 1
    if (values[mid]! < x) low = mid + 1
    else high = mid
  }
  const candidates = [low - 1, low].filter((i) => i >= 0 && i < values.length)
  const best = candidates.reduce((a, b) =>
    Math.abs(values[a]! - x) <= Math.abs(values[b]! - x) ? a : b,
  )
  // Con un solo punto no hay paso de muestreo: solo vale el instante exacto.
  const step = values.length > 1 ? Math.abs(values[1]! - values[0]!) : 0
  return Math.abs(values[best]! - x) <= step / 2 ? best : -1
}

function rowFor(
  spec: ResolvedChartSpec,
  series: ResolvedSeries,
  x: number | string,
): TooltipRow | null {
  const axis = spec.yAxes[series.yAxisIndex]!
  if (series.type === 'range') {
    const index = nearestIndex(
      series.ranges.map(([px]) => px),
      x,
    )
    const point = series.ranges[index]
    if (!point || point[1] === null || point[2] === null) return null
    return {
      seriesId: series.id,
      name: series.name,
      color: series.color,
      text: `${axis.formatValue(point[1])} – ${axis.formatValue(point[2])}`,
    }
  }
  const index = nearestIndex(
    series.points.map(([px]) => px),
    x,
  )
  const value = series.points[index]?.[1]
  if (value === undefined || value === null) return null
  return {
    seriesId: series.id,
    name: series.name,
    color: series.color,
    text: axis.formatValue(value),
  }
}

/** Filas del tooltip compartido en el instante `x`: una por serie visible con valor cerca de `x`. */
export function tooltipRows(
  spec: ResolvedChartSpec,
  x: number | string,
  seriesId?: string,
): TooltipRow[] {
  return spec.series
    .filter((series) => series.tooltip && (seriesId === undefined || series.id === seriesId))
    .map((series) => rowFor(spec, series, x))
    .filter((row): row is TooltipRow => row !== null)
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
}

/** Tooltip en HTML (para los motores que aceptan HTML: ECharts y ApexCharts). */
export function tooltipHtml(
  spec: ResolvedChartSpec,
  x: number | string,
  seriesId?: string,
): string {
  const rows = tooltipRows(spec, x, seriesId)
  const header = `<div style="font-weight:600;margin-bottom:4px">${escapeHtml(spec.xAxis.formatTooltip(x))}</div>`
  const body = rows
    .map(
      (row) =>
        `<div style="display:flex;align-items:center;gap:6px;line-height:1.5">` +
        `<span style="width:10px;height:10px;border-radius:2px;background:${row.color};flex:none"></span>` +
        `<span style="flex:1">${escapeHtml(row.name)}</span>` +
        `<span style="font-weight:600;font-variant-numeric:tabular-nums;margin-left:12px">${escapeHtml(row.text)}</span>` +
        `</div>`,
    )
    .join('')
  return header + body
}
