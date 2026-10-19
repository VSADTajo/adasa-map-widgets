import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { chartjsEngine } from './chartjs'
import { at, mockCanvas, sampleSpec, spyHandlers } from './engines.fixtures'

/**
 * Chart.js necesita canvas: se simula la clase `Chart` para comprobar cómo
 * el motor traduce sus eventos y acciones a los de ASChart.
 */
const fake = vi.hoisted(() => {
  const charts: FakeChart[] = []
  class FakeChart {
    static register = () => {}
    config: Any
    canvas: HTMLCanvasElement
    data: Any
    width = 600
    height = 150
    chartArea = { left: 50, right: 550, top: 10, bottom: 140 }
    scales = {
      x: {
        min: 1000,
        max: 2000,
        getValueForPixel: (px: number) => px * 1000,
        getPixelForValue: () => 100,
      },
    }
    draw = vi.fn()
    update = vi.fn()
    destroy = vi.fn()
    resize = vi.fn()
    setDatasetVisibility = vi.fn()
    zoomScale = vi.fn()
    resetZoom = vi.fn()
    nearest: { datasetIndex: number; index: number }[] = []
    getElementsAtEventForMode = () => this.nearest
    constructor(canvas: HTMLCanvasElement, config: Any) {
      this.canvas = canvas
      this.config = config
      this.data = config.data
      charts.push(this)
    }
  }
  return { charts, FakeChart }
})

// Simulaciones de la librería: tipos laxos a propósito.
type Any = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

vi.mock('chart.js', () => ({ Chart: fake.FakeChart, registerables: [] }))
vi.mock('chartjs-plugin-annotation', () => ({ default: {} }))
vi.mock('chartjs-plugin-zoom', () => ({ default: {} }))
vi.mock('chartjs-adapter-date-fns', () => ({}))

beforeEach(() => {
  mockCanvas()
  fake.charts.length = 0
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

async function mount(extra = {}) {
  const element = document.createElement('div')
  const handlers = spyHandlers()
  const instance = await chartjsEngine.mount(element, sampleSpec(extra), handlers, (c) => c)
  const tooltip = () => element.querySelector<HTMLElement>('[data-as-tooltip]')!
  return { element, handlers, instance, chart: fake.charts[0]!, tooltip }
}

describe('chartjsEngine.mount', () => {
  it('un Chart por panel con la cruceta común; native es el gráfico (o la lista)', async () => {
    const { instance, chart } = await mount()
    expect(fake.charts).toHaveLength(1)
    expect(chart.config.plugins.map((p: { id: string }) => p.id)).toEqual(['asCrosshair'])
    expect(instance.native).toBe(chart)
  })

  it('el cursor dentro del área emite onHover, mueve la cruceta y abre el tooltip', async () => {
    const { handlers, chart, tooltip } = await mount()
    chart.config.options.onHover({ x: 100, y: 50 }, [], chart)
    expect(handlers.onHover).toHaveBeenLastCalledWith(new Date(100_000))
    expect(chart.draw).toHaveBeenCalled()
    // Fuera del área de dibujo: sin instante.
    chart.config.options.onHover({ x: 10, y: 50 }, [], chart)
    expect(handlers.onHover).toHaveBeenLastCalledWith(null)
    expect(tooltip().style.display).toBe('none')
  })

  it('la cruceta se pinta en el instante del cursor, solo dentro del área', async () => {
    const { instance, chart } = await mount()
    const crosshair = chart.config.plugins[0]
    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
    }
    crosshair.afterDatasetsDraw({ ...chart, ctx })
    expect(ctx.stroke).not.toHaveBeenCalled()
    instance.showCursor(at(1).getTime())
    crosshair.afterDatasetsDraw({ ...chart, ctx })
    expect(ctx.moveTo).toHaveBeenCalledWith(100, 10)
  })

  it('un clic en un punto da el punto y el instante; en el área, solo el instante', async () => {
    const { handlers, chart } = await mount()
    const datasetIndex = chart.data.datasets.findIndex((d: { asId: string }) => d.asId === 'q')
    chart.config.options.onClick({ x: 3, y: 50 }, [{ datasetIndex, index: 1 }], chart)
    expect(handlers.onPointClick).toHaveBeenCalledWith({ seriesId: 'q', x: at(1), y: 20 })
    expect(handlers.onXClick).toHaveBeenLastCalledWith(new Date(3000))
    chart.config.options.onClick({ x: null, y: null }, [], chart)
    expect(handlers.onXClick).toHaveBeenCalledOnce()
  })

  it('al salir del lienzo se quitan el cursor y el tooltip', async () => {
    const { handlers, chart, tooltip } = await mount()
    chart.canvas.dispatchEvent(new Event('mouseleave'))
    expect(handlers.onHover).toHaveBeenLastCalledWith(null)
    expect(tooltip().style.display).toBe('none')
  })

  it('con zoom, acabar de hacer zoom emite el rango y lo aplica al resto de paneles', async () => {
    const { handlers, chart } = await mount({ zoom: true })
    chart.config.options.plugins.zoom.zoom.onZoomComplete({ chart })
    expect(handlers.onRangeChange).toHaveBeenCalledWith({
      start: new Date(1000),
      end: new Date(2000),
    })
  })

  it('la leyenda oculta los datasets con ese nombre (también la banda inferior)', async () => {
    const { element, chart } = await mount()
    const band = [...element.querySelectorAll('[data-as-legend] button')].find((b) =>
      b.textContent?.includes('Banda'),
    ) as HTMLButtonElement
    band.click()
    const hiddenIndexes = chart.setDatasetVisibility.mock.calls
      .filter(([, visible]) => visible === false)
      .map(([index]) => chart.data.datasets[index].asId)
    expect(hiddenIndexes).toEqual(['b__low', 'b'])
  })

  it('showCursor abre el tooltip en el instante; sin tooltip o con null, lo cierra', async () => {
    const { instance, tooltip } = await mount()
    instance.showCursor(at(1).getTime())
    expect(tooltip().style.display).toBe('block')
    instance.showCursor(null)
    expect(tooltip().style.display).toBe('none')
  })

  it('zoomTo, resetZoom, update, resize y dispose', async () => {
    const { element, instance, chart } = await mount()
    instance.zoomTo({ start: 1, end: 2 })
    expect(chart.zoomScale).toHaveBeenCalledWith('x', { min: 1, max: 2 }, 'none')
    instance.zoomTo(null)
    instance.resetZoom()
    expect(chart.resetZoom).toHaveBeenCalledTimes(2)
    instance.update(sampleSpec({ tooltip: false }))
    expect(chart.destroy).toHaveBeenCalled()
    expect(fake.charts).toHaveLength(2)
    instance.resize()
    expect(fake.charts[1]!.resize).toHaveBeenCalled()
    instance.dispose()
    expect(element.children).toHaveLength(0)
  })

  it('exporta los lienzos de los paneles (en SVG, como imagen)', async () => {
    const { instance } = await mount()
    const svg = decodeURIComponent(await instance.exportImage('svg'))
    expect(svg).toContain('<image x="0"')
    expect(svg).toContain('href="data:image/png;base64,AAA"')
  })
})
