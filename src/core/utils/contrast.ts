/**
 * Contraste WCAG 2.1 entre dos colores. Interno (no se exporta en la API
 * pública): lo usan los tests de tokens y la página "Tokens" del playground.
 */

/** Acepta `#rgb`, `#rrggbb` y `rgb()`/`rgba()` (ignora el alfa). */
export function parseColor(color: string): [number, number, number] {
  const value = color.trim()
  const hex = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(value)?.[1]
  if (hex) {
    const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex
    return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number]
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(value)
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]
  throw new Error(`Color no soportado: "${color}"`)
}

function relativeLuminance(color: string): number {
  const [r, g, b] = parseColor(color).map((channel) => {
    const c = channel / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Razón de contraste WCAG (1 a 21) entre dos colores. */
export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ]
  return (light + 0.05) / (dark + 0.05)
}
