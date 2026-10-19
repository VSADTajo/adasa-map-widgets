import { vi } from 'vitest'
import { resolveSpec } from '@/charts/core/resolveSpec'
import { at, fakeLocale, fakeTokens, T0 } from '@/charts/core/chart.fixtures'
import type { ChartEngineHandlers } from './types'
import type { ChartProps } from '@/charts/types/chart'

/**
 * Utilidades de los tests de los motores (no se publican). jsdom no tiene
 * canvas: aquí se simulan el contexto 2D, `toDataURL` e `Image` para poder
 * probar el código que dibuja (tramas, exportación) sin navegador.
 */

/** Contexto 2D falso: acepta cualquier llamada o propiedad y anota las llamadas. */
export function fakeContext() {
  const calls: string[] = []
  const target: Record<string, unknown> = { calls }
  return new Proxy(target, {
    get(object, key: string) {
      if (key in object) return object[key]
      if (key === 'measureText') return (text: string) => ({ width: text.length * 6 })
      if (key === 'createPattern') return () => ({ setTransform: vi.fn() })
      return (...args: unknown[]) => {
        calls.push(`${key}(${args.length})`)
      }
    },
    set(object, key: string, value) {
      object[key] = value
      return true
    },
  }) as unknown as CanvasRenderingContext2D & { calls: string[] }
}

/** Simula canvas (contexto 2D y `toDataURL`) e `Image` (se "carga" al momento). */
export function mockCanvas() {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    () => fakeContext() as never,
  )
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,AAA')
  vi.stubGlobal(
    'Image',
    class {
      width = 10
      height = 10
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      set src(_value: string) {
        queueMicrotask(() => this.onload?.())
      }
    },
  )
}

/** Sin canvas (como jsdom sin simular): `getContext` devuelve null, sin avisos en la consola. */
export function noCanvas() {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
}

/** Manejadores de eventos espiados, para comprobar lo que el motor emite. */
export function spyHandlers(): ChartEngineHandlers & Record<string, ReturnType<typeof vi.fn>> {
  return {
    onPointClick: vi.fn(),
    onXClick: vi.fn(),
    onRangeChange: vi.fn(),
    onHover: vi.fn(),
  }
}

/** Especificación de prueba: caudal (línea), lluvia (barras) y una banda, con umbral y "ahora". */
export function sampleSpec(extra: Partial<ChartProps> = {}) {
  const props: ChartProps = {
    series: [
      {
        id: 'q',
        name: 'Caudal',
        type: 'line',
        data: [
          [at(0), 10],
          [at(1), 20],
          [at(2), 15],
        ],
      },
      {
        id: 'p',
        name: 'Lluvia',
        type: 'bar',
        yAxis: 'p',
        data: [
          [at(0), 1],
          [at(1), 3],
        ],
      },
      {
        id: 'b',
        name: 'Banda',
        type: 'range',
        data: [
          [at(0), 8, 12],
          [at(1), 15, 25],
        ],
      },
    ],
    yAxes: [
      { id: 'q', unit: 'm³/s' },
      { id: 'p', unit: 'mm' },
    ],
    annotations: { y: [{ value: 18, level: 'rojo', label: 'Rojo' }] },
    now: at(1),
    legend: { position: 'top' },
    legendValues: true,
    ...extra,
  }
  return resolveSpec(props, fakeTokens(), fakeLocale, () => T0)
}

export { at }
