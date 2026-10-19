import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { echartsEngine, toEChartsOption } from './echarts'
import { at, noCanvas, sampleSpec, spyHandlers } from './engines.fixtures'

/**
 * ECharts necesita canvas: se simula su API para comprobar cómo el motor
 * traduce sus eventos y acciones a los de ASChart.
 */
const fake = vi.hoisted(() => {
  type Handler = (event: Record<string, unknown>) => void
  const state = {
    charts: [] as ReturnType<typeof createChart>[],
    handlers: new Map<string, Handler>(),
    zrHandlers: new Map<string, Handler>(),
    containsPixel: true,
  }
  function createChart(options: Record<string, unknown>) {
    const chart = {
      options,
      setOption: vi.fn(),
      dispatchAction: vi.fn(),
      resize: vi.fn(),
      dispose: vi.fn(),
      getHeight: () => 300,
      getWidth: () => 600,
      getOption: () => ({ grid: [{ top: 20, height: 100 }], series: [{ itemStyle: {} }] }),
      on: (name: string, handler: Handler) => state.handlers.set(name, handler),
      getZr: () => ({
        on: (name: string, handler: Handler) => state.zrHandlers.set(name, handler),
      }),
      containPixel: () => state.containsPixel,
      convertFromPixel: (_finder: unknown, value: number) => value * 1000 + 0.4,
      convertToPixel: () => 42,
      getDataURL: () => 'data:image/png;base64,E',
      renderToSVGString: () => '<svg width="600" height="300"></svg>',
      getModel: () => ({
        getComponent: () => ({ axis: { scale: { getExtent: () => [1000, 2000] } } }),
      }),
    }
    state.charts.push(chart)
    return chart
  }
  return { state, createChart }
})

vi.mock('echarts/core', () => ({
  use: vi.fn(),
  init: (_el: unknown, _theme: unknown, options: Record<string, unknown>) =>
    fake.createChart(options),
}))
vi.mock('echarts/charts', () => ({ LineChart: {}, BarChart: {}, ScatterChart: {} }))
vi.mock('echarts/components', () => ({
  GridComponent: {},
  TooltipComponent: {},
  LegendComponent: {},
  DataZoomComponent: {},
  MarkLineComponent: {},
  MarkAreaComponent: {},
  AxisPointerComponent: {},
  ToolboxComponent: {},
}))
vi.mock('echarts/renderers', () => ({ CanvasRenderer: {}, SVGRenderer: {} }))

beforeEach(() => {
  noCanvas()
  fake.state.charts = []
  fake.state.handlers.clear()
  fake.state.zrHandlers.clear()
  fake.state.containsPixel = true
})
afterEach(() => vi.restoreAllMocks())

async function mount(extra = {}) {
  const element = document.createElement('div')
  const handlers = spyHandlers()
  const nativeOptions = vi.fn((options: unknown) => options)
  const instance = await echartsEngine.mount(element, sampleSpec(extra), handlers, nativeOptions)
  return { element, handlers, instance, chart: fake.state.charts[0]!, nativeOptions }
}

describe('echartsEngine.mount', () => {
  it('crea un lienzo canvas, dibuja la leyenda HTML y pasa la opción por nativeOptions', async () => {
    const { element, chart, nativeOptions } = await mount()
    expect(chart.options).toEqual({ renderer: 'canvas' })
    expect(chart.setOption).toHaveBeenCalledOnce()
    expect(nativeOptions).toHaveBeenCalledWith(expect.any(Object), 'echarts')
    expect(element.querySelectorAll('[data-as-legend] button')).toHaveLength(3)
  })

  it('traduce el puntero del eje a onHover (con fecha en ejes temporales) y la salida a null', async () => {
    const { handlers } = await mount()
    fake.state.handlers.get('updateAxisPointer')!({ axesInfo: [{ value: at(1).getTime() }] })
    expect(handlers.onHover).toHaveBeenLastCalledWith(at(1))
    fake.state.zrHandlers.get('globalout')!({})
    expect(handlers.onHover).toHaveBeenLastCalledWith(null)
  })

  it('un clic en una serie da su punto; en una banda, el valor superior; en una anotación, nada', async () => {
    const { handlers } = await mount()
    const click = fake.state.handlers.get('click')!
    click({ seriesId: 'q', value: [at(0).getTime(), 10], dataIndex: 0 })
    expect(handlers.onPointClick).toHaveBeenLastCalledWith({ seriesId: 'q', x: at(0), y: 10 })
    click({ seriesId: 'b', value: [at(1).getTime(), 10], dataIndex: 1 })
    expect(handlers.onPointClick).toHaveBeenLastCalledWith({ seriesId: 'b', x: at(1), y: 25 })
    click({ seriesId: '__annotations-x-0', value: [0, 0], dataIndex: 0 })
    click({ value: [0, 0], dataIndex: 0 })
    expect(handlers.onPointClick).toHaveBeenCalledTimes(2)
  })

  it('un clic en el área da el instante redondeado; fuera de los paneles, nada', async () => {
    const { handlers } = await mount()
    const click = fake.state.zrHandlers.get('click')!
    click({ offsetX: 5, offsetY: 5 })
    expect(handlers.onXClick).toHaveBeenCalledWith(new Date(5000))
    fake.state.containsPixel = false
    click({ offsetX: 6, offsetY: 5 })
    expect(handlers.onXClick).toHaveBeenCalledOnce()
  })

  it('el zoom emite el rango visible', async () => {
    const { handlers } = await mount()
    fake.state.handlers.get('datazoom')!({})
    expect(handlers.onRangeChange).toHaveBeenCalledWith({
      start: new Date(1000),
      end: new Date(2000),
    })
  })

  it('la leyenda oculta y vuelve a mostrar la serie, también tras redibujar', async () => {
    const { element, chart, instance } = await mount()
    const button = () => element.querySelector<HTMLButtonElement>('[data-as-legend] button')!
    button().click()
    expect(chart.dispatchAction).toHaveBeenLastCalledWith({
      type: 'legendUnSelect',
      name: 'Caudal',
    })
    instance.update(sampleSpec())
    expect(chart.dispatchAction).toHaveBeenLastCalledWith({
      type: 'legendUnSelect',
      name: 'Caudal',
    })
    button().click()
    expect(chart.dispatchAction).toHaveBeenLastCalledWith({ type: 'legendSelect', name: 'Caudal' })
  })

  it('showCursor abre el tooltip en ese instante; con null lo cierra', async () => {
    const { chart, instance } = await mount()
    instance.showCursor(at(1).getTime())
    // A media altura del primer panel, el que calcula la opción (sin leerla del gráfico).
    const [grid] = toEChartsOption(sampleSpec(), 300).grid as { top: number; height: number }[]
    expect(chart.dispatchAction).toHaveBeenLastCalledWith({
      type: 'showTip',
      x: 42,
      y: grid!.top + grid!.height / 2,
    })
    instance.showCursor(null)
    expect(chart.dispatchAction).toHaveBeenCalledWith({ type: 'hideTip' })
  })

  it('zoomTo, resetZoom, resize y dispose', async () => {
    const { element, chart, instance } = await mount()
    instance.zoomTo({ start: 1, end: 2 })
    expect(chart.dispatchAction).toHaveBeenLastCalledWith({
      type: 'dataZoom',
      startValue: 1,
      endValue: 2,
    })
    instance.zoomTo(null)
    instance.resetZoom()
    expect(chart.dispatchAction).toHaveBeenLastCalledWith({ type: 'dataZoom', start: 0, end: 100 })
    instance.resize()
    expect(chart.setOption).toHaveBeenCalledTimes(2)
    instance.dispose()
    expect(chart.dispose).toHaveBeenCalled()
    expect(element.children).toHaveLength(0)
  })

  it('exporta a SVG redibujando con el renderizador SVG en modo SSR', async () => {
    const { instance } = await mount()
    const url = await instance.exportImage('svg')
    const ssr = fake.state.charts[1]!
    expect(ssr.options).toMatchObject({ renderer: 'svg', ssr: true, width: 600, height: 300 })
    expect(ssr.dispose).toHaveBeenCalled()
    expect(decodeURIComponent(url)).toContain('<svg width="600" height="300"></svg>')
  })
})
