import type { ChartImageFormat } from '@/charts/types/chart'
import type { ResolvedChartSpec, ResolvedSeries } from '@/charts/core/resolveSpec'
import { PATTERN_SIZE, patternDataUrl, patternTile } from '@/charts/core/patterns'
import { legendGroups, legendSample } from './types'

/**
 * Exportación común a los tres motores: cada motor entrega sus paneles como
 * imágenes (PNG o SVG) y aquí se componen, uno debajo de otro, con la
 * leyenda encima. La leyenda es HTML (común a los motores), así que ningún
 * motor la incluye en su imagen; sin ella, una imagen con varias series no
 * se podría leer.
 */

/** Un panel ya exportado por el motor. Medidas en px CSS. */
export interface ExportPart {
  /** `'png'`: `src` es un data URL. `'svg'`: `src` es el marcado SVG. */
  kind: 'png' | 'svg'
  src: string
  width: number
  height: number
}

const PAD = 8
const ROW = 20
const SWATCH = 18
const GAP = 16
/** Píxeles por px CSS del PNG: nítido en pantallas de alta densidad y al imprimir. */
const SCALE = 2

const escapeXml = (text: string) => text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

/** Una entrada de la leyenda exportada: una serie, o el título de un grupo (`legendGroup`). */
type LegendCell =
  { series: ResolvedSeries; label?: undefined } | { label: string; series?: undefined }

/**
 * Entradas de la leyenda: como en la HTML, una por nombre visible, sin las
 * ocultas, y cada grupo en su línea encabezada por su título.
 */
function legendItems(spec: ResolvedChartSpec, hidden: Set<string>): LegendCell[][] {
  if (!spec.legend) return []
  return legendGroups(spec.series)
    .map(({ group, entries }) => {
      const visible = entries
        .filter((series) => !hidden.has(series.name))
        .map((series): LegendCell => ({ series: legendSample(spec.series, series) }))
      return visible.length && group ? [{ label: group } as LegendCell, ...visible] : visible
    })
    .filter((cells) => cells.length)
}

const isLine = (series: ResolvedSeries) => series.type === 'line' || series.type === 'scatter'
const DASH = { solid: [], dashed: [4, 3], dotted: [1.5, 2.5], dashdot: [5, 2.5, 1.5, 2.5] } as const

type PlacedItem = LegendCell & { x: number; y: number }

/** Coloca las entradas en filas centradas que caben en `width`; cada grupo empieza fila. */
function layoutLegend(
  groups: LegendCell[][],
  width: number,
  measure: (text: string) => number,
): { placed: PlacedItem[]; height: number } {
  if (!groups.length) return { placed: [], height: 0 }
  const rows: { item: LegendCell; width: number }[][] = []
  for (const group of groups) {
    rows.push([])
    let rowWidth = 0
    for (const item of group) {
      const itemWidth = item.label
        ? measure(item.label)
        : SWATCH + 6 + measure(item.series!.legendLabel)
      const row = rows[rows.length - 1]!
      if (row.length && rowWidth + GAP + itemWidth > width - PAD * 2) {
        rows.push([])
        rowWidth = 0
      }
      rowWidth += (rows[rows.length - 1]!.length ? GAP : 0) + itemWidth
      rows[rows.length - 1]!.push({ item, width: itemWidth })
    }
  }
  const placed: PlacedItem[] = []
  rows.forEach((row, index) => {
    const total = row.reduce((sum, cell) => sum + cell.width, 0) + GAP * (row.length - 1)
    let x = Math.max((width - total) / 2, PAD)
    for (const cell of row) {
      placed.push({ ...cell.item, x, y: PAD + index * ROW + ROW / 2 })
      x += cell.width + GAP
    }
  })
  return { placed, height: rows.length * ROW + PAD * 2 }
}

function textMeasurer(spec: ResolvedChartSpec): (text: string) => number {
  const ctx = document.createElement('canvas').getContext('2d')
  if (!ctx) return (text) => text.length * spec.theme.fontSize * 0.6
  ctx.font = `${spec.theme.fontSize}px ${spec.theme.fontFamily}`
  return (text) => ctx.measureText(text).width
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('[ASChart] No se pudo componer la imagen exportada.'))
    image.src = src
  })
}

const svgDataUrl = (markup: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`

async function composePng(
  parts: ExportPart[],
  spec: ResolvedChartSpec,
  hidden: Set<string>,
): Promise<string> {
  const width = Math.max(...parts.map((part) => part.width))
  const measure = textMeasurer(spec)
  const legend = layoutLegend(legendItems(spec, hidden), width, measure)
  const height = legend.height + parts.reduce((sum, part) => sum + part.height, 0)

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * SCALE)
  canvas.height = Math.round(height * SCALE)
  const ctx = canvas.getContext('2d')!
  ctx.scale(SCALE, SCALE)
  ctx.fillStyle = spec.theme.surface
  ctx.fillRect(0, 0, width, height)

  ctx.font = `${spec.theme.fontSize}px ${spec.theme.fontFamily}`
  ctx.textBaseline = 'middle'
  for (const { series, label, x, y } of legend.placed) {
    if (label !== undefined) {
      ctx.fillStyle = spec.theme.textMuted
      ctx.font = `600 ${spec.theme.fontSize}px ${spec.theme.fontFamily}`
      ctx.fillText(label, x, y)
      ctx.font = `${spec.theme.fontSize}px ${spec.theme.fontFamily}`
      continue
    }
    if (isLine(series)) {
      ctx.strokeStyle = series.color
      ctx.lineWidth = 2.5
      ctx.setLineDash([...DASH[series.lineStyle]])
      ctx.beginPath()
      ctx.moveTo(x + 1, y)
      ctx.lineTo(x + SWATCH - 1, y)
      ctx.stroke()
      ctx.setLineDash([])
    } else {
      const tile = series.pattern ? patternTile(series.pattern.kind, series.pattern) : null
      const pattern = tile ? ctx.createPattern(tile, 'repeat') : null
      const band = series.type === 'range' && !pattern
      ctx.globalAlpha = pattern ? 1 : band ? series.opacity : Math.max(series.opacity, 0.5)
      ctx.fillStyle = pattern ?? series.color
      ctx.fillRect(x + 2, y - 4.5, 14, 9)
      ctx.globalAlpha = 1
      // Banda: su opacidad real (como en la leyenda HTML), con un borde del color.
      if (band) {
        ctx.strokeStyle = series.color
        ctx.lineWidth = 1
        ctx.strokeRect(x + 2.5, y - 4, 13, 8)
      }
    }
    ctx.fillStyle = spec.theme.text
    ctx.fillText(series.legendLabel, x + SWATCH + 6, y)
  }

  let top = legend.height
  for (const part of parts) {
    const image = await loadImage(part.kind === 'svg' ? svgDataUrl(part.src) : part.src)
    ctx.drawImage(image, 0, top, part.width, part.height)
    top += part.height
  }
  return canvas.toDataURL('image/png')
}

function composeSvg(parts: ExportPart[], spec: ResolvedChartSpec, hidden: Set<string>): string {
  const width = Math.max(...parts.map((part) => part.width))
  const legend = layoutLegend(legendItems(spec, hidden), width, textMeasurer(spec))
  const height = legend.height + parts.reduce((sum, part) => sum + part.height, 0)
  const { fontFamily, fontSize, surface, text } = spec.theme

  const defs: string[] = []
  const legendMarkup = legend.placed.map(({ series, label, x, y }, index) => {
    if (label !== undefined) {
      return `<text x="${x}" y="${y}" dominant-baseline="central" font-weight="600" fill="${spec.theme.textMuted}">${escapeXml(label)}</text>`
    }
    let swatch: string
    if (isLine(series)) {
      const dash = DASH[series.lineStyle].join(' ')
      swatch = `<line x1="${x + 1}" y1="${y}" x2="${x + SWATCH - 1}" y2="${y}" stroke="${series.color}" stroke-width="2.5"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`
    } else {
      const tile = series.pattern ? patternDataUrl(series.pattern.kind, series.pattern) : null
      if (tile) {
        const id = `as-legend-pattern-${index}`
        defs.push(
          `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${PATTERN_SIZE}" height="${PATTERN_SIZE}"><image href="${tile}" width="${PATTERN_SIZE}" height="${PATTERN_SIZE}"/></pattern>`,
        )
        swatch = `<rect x="${x + 2}" y="${y - 4.5}" width="14" height="9" rx="2" fill="url(#${id})"/>`
      } else {
        const band = series.type === 'range'
        const opacity = band ? series.opacity : Math.max(series.opacity, 0.5)
        swatch = `<rect x="${x + 2}" y="${y - 4.5}" width="14" height="9" rx="2" fill="${series.color}" fill-opacity="${opacity}"${band ? ` stroke="${series.color}" stroke-width="1"` : ''}/>`
      }
    }
    return `${swatch}<text x="${x + SWATCH + 6}" y="${y}" dominant-baseline="central" fill="${text}">${escapeXml(series.legendLabel)}</text>`
  })

  let top = legend.height
  const panels = parts.map((part) => {
    const y = top
    top += part.height
    if (part.kind === 'png') {
      return `<image x="0" y="${y}" width="${part.width}" height="${part.height}" href="${part.src}"/>`
    }
    // Un <svg> anidado se coloca en (0, 0) de su <g>: así no hay que tocar sus atributos.
    const markup = part.src.replace(/^\s*<\?xml[^>]*\?>/, '').replace(/<!DOCTYPE[^>]*>/i, '')
    return `<g transform="translate(0 ${y})">${markup}</g>`
  })

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="${escapeXml(fontFamily)}" font-size="${fontSize}">`,
    defs.length ? `<defs>${defs.join('')}</defs>` : '',
    `<rect width="${width}" height="${height}" fill="${surface}"/>`,
    ...legendMarkup,
    ...panels,
    '</svg>',
  ].join('')
}

/**
 * Compone los paneles exportados por un motor, con la leyenda encima, en
 * una sola imagen. Devuelve un data URL (`image/png` o `image/svg+xml`).
 *
 * @param hidden Series ocultas desde la leyenda: tampoco salen en la imagen.
 */
export async function composeImage(
  parts: ExportPart[],
  format: ChartImageFormat,
  spec: ResolvedChartSpec,
  hidden: Set<string>,
): Promise<string> {
  if (!parts.length) return ''
  return format === 'svg'
    ? svgDataUrl(composeSvg(parts, spec, hidden))
    : composePng(parts, spec, hidden)
}
