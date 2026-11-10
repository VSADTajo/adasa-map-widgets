import { parseColor } from '@/core/utils/contrast'

/** `color` con opacidad `alpha`, como `rgba()`. Acepta hex o `rgb()`. */
export function withAlpha(color: string, alpha: number): string {
  try {
    const [r, g, b] = parseColor(color)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  } catch {
    return color
  }
}
