import { withAlpha } from './color'

/**
 * Patrones (decal) para los rellenos: con `patterns`, cada serie rellena
 * (barras, áreas y bandas) lleva una trama distinta además de su color, para
 * que se distingan sin depender del color (daltonismo, impresión en B/N).
 * Los tres motores pintan la misma tesela, así que se ven iguales.
 */

/** Tramas, en el orden en que se asignan a las series rellenas. */
export const PATTERN_KINDS = [
  'diagonal',
  'dots',
  'diagonal-reverse',
  'horizontal',
  'vertical',
  'grid',
] as const

export type ChartPatternKind = (typeof PATTERN_KINDS)[number]

/** Lado de la tesela, en px. */
export const PATTERN_SIZE = 10

/** Opacidad a partir de la cual el relleno se considera opaco (barras). */
const OPAQUE = 0.6

/**
 * Colores de la tesela: el fondo es el relleno de la serie y la trama...
 *
 * - En rellenos opacos (barras), del color de la superficie: contrasta con
 *   la serie tanto como la serie con el fondo (≥ 3:1, ver tokens.spec.ts).
 * - En rellenos translúcidos (áreas, bandas), del color de la serie: sobre
 *   un relleno casi del color del fondo, una trama clara no se vería.
 */
export function patternColors(
  color: string,
  opacity: number,
  surface: string,
): { background: string; stroke: string } {
  return {
    background: withAlpha(color, opacity),
    stroke: opacity >= OPAQUE ? surface : color,
  }
}

/** Dibuja la trama `kind` en una tesela de `PATTERN_SIZE` × `PATTERN_SIZE` (ya escalada). */
export function drawPattern(
  ctx: CanvasRenderingContext2D,
  kind: ChartPatternKind,
  colors: { background: string; stroke: string },
): void {
  const s = PATTERN_SIZE
  ctx.clearRect(0, 0, s, s)
  ctx.fillStyle = colors.background
  ctx.fillRect(0, 0, s, s)
  ctx.strokeStyle = colors.stroke
  ctx.fillStyle = colors.stroke
  ctx.lineWidth = 1.5
  ctx.lineCap = 'square'
  const line = (x1: number, y1: number, x2: number, y2: number) => {
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }
  switch (kind) {
    case 'diagonal':
      // La diagonal y sus dos trozos en las esquinas: así la tesela casa con sus vecinas.
      line(0, s, s, 0)
      line(-s / 2, s / 2, s / 2, -s / 2)
      line(s / 2, s * 1.5, s * 1.5, s / 2)
      break
    case 'diagonal-reverse':
      line(0, 0, s, s)
      line(-s / 2, s / 2, s / 2, s * 1.5)
      line(s / 2, -s / 2, s * 1.5, s / 2)
      break
    case 'horizontal':
      line(0, s / 2, s, s / 2)
      break
    case 'vertical':
      line(s / 2, 0, s / 2, s)
      break
    case 'grid':
      line(0, s / 2, s, s / 2)
      line(s / 2, 0, s / 2, s)
      break
    case 'dots':
      ctx.beginPath()
      ctx.arc(s / 2, s / 2, 1.8, 0, Math.PI * 2)
      ctx.fill()
      break
  }
}

const tiles = new Map<string, HTMLCanvasElement | null>()

/**
 * Tesela del patrón como canvas (cacheada), o `null` si no se puede dibujar
 * (sin canvas, p. ej. en tests con jsdom): entonces se rellena con el color liso.
 *
 * @param scale Píxeles por px CSS (2 = nítida en pantallas de alta densidad).
 */
export function patternTile(
  kind: ChartPatternKind,
  colors: { background: string; stroke: string },
  scale = 1,
): HTMLCanvasElement | null {
  const key = `${kind}|${colors.background}|${colors.stroke}|${scale}`
  if (tiles.has(key)) return tiles.get(key)!
  let tile: HTMLCanvasElement | null = null
  try {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = PATTERN_SIZE * scale
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(scale, scale)
      drawPattern(ctx, kind, colors)
      tile = canvas
    }
  } catch {
    tile = null
  }
  tiles.set(key, tile)
  return tile
}

/** La tesela como data URL (para SVG, CSS y ApexCharts), o `null` si no se puede dibujar. */
export function patternDataUrl(
  kind: ChartPatternKind,
  colors: { background: string; stroke: string },
  scale = 1,
): string | null {
  try {
    return patternTile(kind, colors, scale)?.toDataURL('image/png') ?? null
  } catch {
    return null
  }
}
