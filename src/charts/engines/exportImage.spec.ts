import { afterEach, describe, expect, it, vi } from 'vitest'
import { composeImage, type ExportPart } from './exportImage'
import { mockCanvas, noCanvas, sampleSpec } from './engines.fixtures'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const svgPart: ExportPart = {
  kind: 'svg',
  src: '<?xml version="1.0"?><!DOCTYPE svg><svg width="300" height="100"><rect/></svg>',
  width: 300,
  height: 100,
}
const pngPart: ExportPart = { kind: 'png', src: 'data:image/png;base64,P', width: 300, height: 80 }

/** El SVG compuesto, ya decodificado del data URL. */
async function composedSvg(parts: ExportPart[], hidden = new Set<string>(), extra = {}) {
  const url = await composeImage(parts, 'svg', sampleSpec(extra), hidden)
  expect(url.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true)
  return decodeURIComponent(url.slice(url.indexOf(',') + 1))
}

describe('composeImage · SVG', () => {
  it('pone la leyenda encima y los paneles debajo, uno tras otro', async () => {
    noCanvas()
    const svg = await composedSvg([svgPart, pngPart])
    const legendHeight = Number(/<g transform="translate\(0 (\d+)\)"/.exec(svg)![1])
    expect(svg).toMatch(new RegExp(`height="${legendHeight + 180}"`))
    expect(svg).toContain(`<image x="0" y="${legendHeight + 100}" width="300" height="80"`)
    // Sin declaración XML ni DOCTYPE dentro: el SVG anidado tiene que ser válido.
    expect(svg).not.toContain('<?xml')
    expect(svg).not.toContain('<!DOCTYPE')
  })

  it('una entrada por nombre, sin las ocultas: línea para líneas, rectángulo para rellenos', async () => {
    noCanvas()
    const svg = await composedSvg([svgPart], new Set(['Lluvia']))
    expect(svg).toContain('>Caudal</text>')
    expect(svg).toContain('>Banda</text>')
    expect(svg).not.toContain('>Lluvia</text>')
    expect(svg).toMatch(/<line [^>]*stroke="#c1"/)
    // La banda, con su opacidad real y un borde de su color (como en la leyenda HTML).
    expect(svg).toMatch(/<rect [^>]*fill="#c3" fill-opacity="[\d.]+" stroke="#c3"/)
  })

  it('escapa los nombres de las series', async () => {
    noCanvas()
    const svg = await composedSvg([svgPart], new Set(), {
      series: [{ id: 'x', name: 'A & <B>', type: 'line', data: [[0, 1]] }],
      legend: true,
    })
    expect(svg).toContain('>A &#38; &#60;B&#62;</text>')
  })

  it('con `patterns`, la muestra de la leyenda usa la trama', async () => {
    mockCanvas()
    const svg = await composedSvg([svgPart], new Set(), { patterns: true })
    expect(svg).toContain('<pattern id="as-legend-pattern-')
    expect(svg).toMatch(/fill="url\(#as-legend-pattern-\d\)"/)
  })

  it('sin leyenda (legend: false), solo los paneles', async () => {
    noCanvas()
    const svg = await composedSvg([svgPart], new Set(), { legend: false })
    expect(svg).toContain('<g transform="translate(0 0)">')
    expect(svg).not.toContain('<text')
  })

  it('sin paneles, no hay imagen', async () => {
    expect(await composeImage([], 'svg', sampleSpec(), new Set())).toBe('')
  })
})

describe('composeImage · PNG', () => {
  it('dibuja fondo, leyenda y paneles en un canvas al doble de resolución', async () => {
    mockCanvas()
    const drawn: number[][] = []
    const getContext = HTMLCanvasElement.prototype.getContext as unknown as ReturnType<typeof vi.fn>
    getContext.mockImplementation(function (this: HTMLCanvasElement) {
      // Las funciones flecha de dentro ven el `this` de esta: el canvas que pide el contexto.
      return new Proxy(
        {},
        {
          get: (_target, key) =>
            key === 'measureText'
              ? (text: string) => ({ width: text.length * 6 })
              : key === 'drawImage'
                ? (...args: unknown[]) => drawn.push([this.width, ...(args.slice(1) as number[])])
                : key === 'createPattern'
                  ? () => null
                  : () => {},
          set: () => true,
        },
      )
    })
    const url = await composeImage([pngPart, svgPart], 'png', sampleSpec(), new Set())
    expect(url).toBe('data:image/png;base64,AAA')
    // Dos paneles: el segundo empieza donde acaba el primero (y ambos tras la leyenda).
    const [first, second] = drawn
    expect(first![0]).toBe(600)
    expect(second![2]).toBe(first![2]! + 80)
  })

  it('falla con un mensaje claro si una imagen no se puede cargar', async () => {
    mockCanvas()
    vi.stubGlobal(
      'Image',
      class {
        onerror: (() => void) | null = null
        set src(_value: string) {
          queueMicrotask(() => this.onerror?.())
        }
      },
    )
    await expect(composeImage([pngPart], 'png', sampleSpec(), new Set())).rejects.toThrow(
      'No se pudo componer la imagen exportada',
    )
  })
})
