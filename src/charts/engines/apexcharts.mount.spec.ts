import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apexchartsEngine } from './apexcharts'
import { at, noCanvas, sampleSpec, spyHandlers } from './engines.fixtures'

/**
 * ApexCharts necesita un navegador real: se simula su clase para comprobar
 * cómo el motor traduce sus eventos y acciones a los de ASChart.
 */
const fake = vi.hoisted(() => {
  const charts: FakeApex[] = []
  class FakeApex {
    el: HTMLElement
    options: Any
    w = {
      globals: {
        seriesNames: [] as string[],
        minX: 0,
        maxX: 10_000,
        translateX: 0,
        gridWidth: 100,
        svgWidth: 600,
        svgHeight: 150,
      },
    }
    render = vi.fn(async () => {})
    destroy = vi.fn()
    zoomX = vi.fn()
    resetSeries = vi.fn()
    showSeries = vi.fn()
    hideSeries = vi.fn()
    updateOptions = vi.fn(async () => {})
    dataURI = vi.fn(async () => ({ imgURI: 'data:image/png;base64,A' }))
    getSvgString = vi.fn(async () => '<svg width="600" height="150"></svg>')
    constructor(el: HTMLElement, options: Any) {
      this.el = el
      this.options = options
      this.w.globals.seriesNames = options.series.map((s: { name: string }) => s.name)
      charts.push(this)
    }
  }
  return { charts, FakeApex }
})

// Simulaciones de la librería: tipos laxos a propósito.
type Any = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

vi.mock('apexcharts', () => ({ default: fake.FakeApex }))

beforeEach(() => {
  noCanvas()
  fake.charts.length = 0
})
afterEach(() => vi.restoreAllMocks())

async function mount(extra = {}) {
  const element = document.createElement('div')
  const handlers = spyHandlers()
  const instance = await apexchartsEngine.mount(element, sampleSpec(extra), handlers, (o) => o)
  const chart = fake.charts[0]!
  return { element, handlers, instance, chart, events: chart.options.chart.events }
}

/** Evento de ratón en la posición X `clientX` (el gráfico empieza en 0). */
const mouseAt = (clientX: number) => ({ clientX }) as MouseEvent

describe('apexchartsEngine.mount', () => {
  it('crea y dibuja un gráfico por panel', async () => {
    const { instance, chart } = await mount()
    expect(chart.render).toHaveBeenCalled()
    expect(instance.native).toBe(chart)
  })

  it('traduce la posición del ratón a un instante (onHover / onXClick)', async () => {
    const { handlers, events } = await mount()
    events.mouseMove(mouseAt(50), { w: fake.charts[0]!.w })
    expect(handlers.onHover).toHaveBeenLastCalledWith(new Date(5000))
    events.mouseMove(mouseAt(150), { w: fake.charts[0]!.w })
    expect(handlers.onHover).toHaveBeenLastCalledWith(null)
    events.click(mouseAt(25), { w: fake.charts[0]!.w })
    expect(handlers.onXClick).toHaveBeenCalledWith(new Date(2500))
    events.click(mouseAt(-5), { w: fake.charts[0]!.w })
    expect(handlers.onXClick).toHaveBeenCalledOnce()
    events.mouseLeave()
    expect(handlers.onHover).toHaveBeenLastCalledWith(null)
  })

  it('un clic en un punto da su serie y valor; en una banda, el superior', async () => {
    const { handlers, events } = await mount()
    events.dataPointSelection(null, null, { seriesIndex: 0, dataPointIndex: 1 })
    expect(handlers.onPointClick).toHaveBeenLastCalledWith({ seriesId: 'q', x: at(1), y: 20 })
    events.dataPointSelection(null, null, { seriesIndex: 2, dataPointIndex: 1 })
    expect(handlers.onPointClick).toHaveBeenLastCalledWith({ seriesId: 'b', x: at(1), y: 25 })
    events.dataPointSelection(null, null, { seriesIndex: 9, dataPointIndex: 0 })
    expect(handlers.onPointClick).toHaveBeenCalledTimes(2)
  })

  it('el zoom emite el rango (y lo ignora si Apex no da límites)', async () => {
    const { handlers, events } = await mount()
    events.zoomed(null, { xaxis: { min: 1000, max: 2000 } })
    events.zoomed(null, { xaxis: {} })
    expect(handlers.onRangeChange).toHaveBeenCalledOnce()
    expect(handlers.onRangeChange).toHaveBeenCalledWith({
      start: new Date(1000),
      end: new Date(2000),
    })
  })

  it('la leyenda oculta y muestra la serie por su id', async () => {
    const { element, chart } = await mount()
    const button = element.querySelector<HTMLButtonElement>('[data-as-legend] button')!
    button.click()
    expect(chart.hideSeries).toHaveBeenCalledWith('q')
    element.querySelector<HTMLButtonElement>('[data-as-legend] button')!.click()
    expect(chart.showSeries).toHaveBeenCalledWith('q')
  })

  it('showCursor coloca la cruceta HTML en el instante; fuera del rango o con null, la quita', async () => {
    const { element, instance } = await mount()
    const crosshair = () => element.querySelector<HTMLElement>('[data-as-crosshair]')!
    instance.showCursor(5000)
    expect(crosshair().style.display).toBe('block')
    expect(crosshair().style.left).toBe('50px')
    instance.showCursor(20_000)
    expect(crosshair().style.display).toBe('none')
    instance.showCursor(5000)
    instance.showCursor(null)
    expect(crosshair().style.display).toBe('none')
  })

  it('zoomTo, resetZoom (al rango de datos), update, resize y dispose', async () => {
    const { element, instance, chart } = await mount()
    instance.zoomTo({ start: 1, end: 2 })
    expect(chart.zoomX).toHaveBeenCalledWith(1, 2)
    instance.zoomTo(null)
    expect(chart.zoomX).toHaveBeenLastCalledWith(at(0).getTime(), at(2).getTime())
    instance.resize()
    expect(chart.updateOptions).toHaveBeenCalled()
    instance.update(sampleSpec())
    await vi.waitFor(() => expect(fake.charts).toHaveLength(2))
    expect(chart.destroy).toHaveBeenCalled()
    instance.dispose()
    expect(element.children).toHaveLength(0)
  })

  it('exporta el SVG nativo de cada panel', async () => {
    const { instance, chart } = await mount()
    const svg = decodeURIComponent(await instance.exportImage('svg'))
    expect(svg).toContain('<svg width="600" height="150"></svg>')
    expect(chart.getSvgString).toHaveBeenCalled()
  })
})
