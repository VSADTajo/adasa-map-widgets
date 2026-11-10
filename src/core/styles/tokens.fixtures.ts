import { readFileSync } from 'node:fs'
import { parseColor } from '@/core/utils/contrast'

/**
 * Lectura de los tokens de color de tokens.css para los tests de contraste
 * (los de los tokens y los de componentes que combinan tokens, como las
 * tramas de las gráficas). No se publica: los `*.fixtures.ts` quedan fuera del build.
 */

// Con fs y no con `?raw`: Vitest vacía los .css importados aunque sea en crudo.
const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf-8')

export type Mode = 'light' | 'dark'

/** `--as-x: valor;` de tokens.css, sin comentarios. */
const declarations = new Map(
  [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/--as-([\w-]+):\s*([^;]+);/g)].map((m) => [
    m[1]!,
    m[2]!.trim(),
  ]),
)

/** Valor de un token de color en un modo, resolviendo `light-dark(a, b)`. */
export function token(name: string, mode: Mode): string {
  const value = declarations.get(name)
  if (!value) throw new Error(`No existe --as-${name}`)
  if (!value.startsWith('light-dark(')) return value
  // Separa por la coma de primer nivel: los valores pueden ser `rgba(a, b, c, d)`.
  const args = value.slice('light-dark('.length, -1)
  let depth = 0
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '(') depth++
    else if (args[i] === ')') depth--
    else if (args[i] === ',' && depth === 0) {
      return (mode === 'light' ? args.slice(0, i) : args.slice(i + 1)).trim()
    }
  }
  throw new Error(`light-dark() mal formado en --as-${name}`)
}

/** Color resultante de pintar `color` (hex o rgba con alfa) encima de `backdrop` (opaco). */
export function composite(color: string, backdrop: string): string {
  const alpha = Number(/rgba\([^)]*,\s*([\d.]+)\s*\)/.exec(color)?.[1] ?? 1)
  const [fg, bg] = [parseColor(color), parseColor(backdrop)]
  return `rgb(${fg.map((c, i) => Math.round(alpha * c + (1 - alpha) * bg[i]!)).join(', ')})`
}

export const MODES: Mode[] = ['light', 'dark']
export const surface = (mode: Mode) => token('color-surface', mode)
