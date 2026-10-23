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
 *
 * Busca sobre los puntos tal cual (sin copiar sus X): se llama en cada
 * movimiento del cursor, y con series de 100 000 puntos copiarlas se nota.
 */
function nearestIndex(
  points: readonly (readonly [number | string, ...unknown[]])[],
  x: number | string,
): number {
  if (points.length === 0) return -1
  if (typeof x === 'string' || typeof points[0]![0] === 'string') {
    return points.findIndex(([px]) => px === x)
  }
  const at = (index: number) => points[index]![0] as number
  let low = 0
  let high = points.length - 1
  while (low < high) {
    const mid = (low + high) >> 1
    if (at(mid) < x) low = mid + 1
    else high = mid
  }
  const best = low > 0 && Math.abs(at(low - 1) - x) <= Math.abs(at(low) - x) ? low - 1 : low
  // Con un solo punto no hay paso de muestreo: solo vale el instante exacto.
  const step = points.length > 1 ? Math.abs(at(1) - at(0)) : 0
  return Math.abs(at(best) - x) <= step / 2 ? best : -1
}

function rowFor(
  spec: ResolvedChartSpec,
  series: ResolvedSeries,
  x: number | string,
): TooltipRow | null {
  const axis = spec.yAxes[series.yAxisIndex]!
  if (series.type === 'range') {
    const index = nearestIndex(series.ranges, x)
    const point = series.ranges[index]
    if (!point || point[1] === null || point[2] === null) return null
    return {
      seriesId: series.id,
      name: series.name,
      color: series.color,
      text: `${axis.formatValue(point[1])} – ${axis.formatValue(point[2])}`,
    }
  }
  const index = nearestIndex(series.points, x)
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
  const time = escapeHtml(spec.xAxis.formatTooltip(x))
  // Solo la fecha (`tooltip: 'time'`), p. ej. con los valores en la leyenda.
  if (spec.tooltip && spec.tooltip.content === 'time')
    return `<div style="font-weight:600">${time}</div>`
  const rows = tooltipRows(spec, x, seriesId)
  const header = `<div style="font-weight:600;margin-bottom:4px">${time}</div>`
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
