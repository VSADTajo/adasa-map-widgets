import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { provideLocale } from '@/core/composables/useLocale'
import type { ResolvedChartSpec } from '@/charts/core/resolveSpec'
import type { ChartExposed, ChartProps } from '@/charts/types/chart'
import ASChart from './ASChart.vue'

/**
 * El motor real (ECharts, Chart.js, Apex) necesita un navegador: se simula
 * para comprobar el ciclo de vida que es común a todos.
 */
const engine = vi.hoisted(() => ({
  mount: vi.fn(),
  update: vi.fn(),
  dispose: vi.fn(),
  resetZoom: vi.fn(),
  showCursor: vi.fn(),
  zoomTo: vi.fn(),
  exportImage: vi.fn(async (format: string) =>
    format === 'svg' ? 'data:image/svg+xml,x' : 'data:image/png;base64,x',
  ),
  fail: false,
}))

vi.mock('@/charts/engines', () => ({
  ENGINE_PACKAGES: { echarts: ['echarts'], chartjs: ['chart.js'], apexcharts: ['apexcharts'] },
  loadChartEngine: async (library: string) => {
    if (engine.fail) throw new Error('Cannot find module')
    return {
      library,
      packages: [],
      mount: async (_el: HTMLElement, spec: ResolvedChartSpec, handlers: unknown) => {
        engine.mount(spec, handlers)
        return {
          native: { library },
          update: engine.update,
          resize: vi.fn(),
          dispose: engine.dispose,
          resetZoom: engine.resetZoom,
          showCursor: engine.showCursor,
          zoomTo: engine.zoomTo,
          exportImage: engine.exportImage,
        }
      },
    }
  },
}))

const series: ChartProps['series'] = [
  {
    id: 'q',
    name: 'Caudal',
    type: 'line',
    data: [
      [new Date(2026, 9, 18), 1],
      [new Date(2026, 9, 18, 1), 2],
    ],
  },
]

beforeEach(() => {
  engine.mount.mockReset()
  engine.update.mockReset()
  engine.dispose.mockReset()
  engine.resetZoom.mockReset()
  engine.showCursor.mockReset()
  engine.zoomTo.mockReset()
  engine.exportImage.mockClear()
  engine.fail = false
})
afterEach(() => vi.restoreAllMocks())

describe('ASChart', () => {
  it('monta el motor elegido con la especificación resuelta y emite ready', async () => {
    const wrapper = mount(ASChart, { props: { series, chartLibrary: 'chartjs' } })
    await flushPromises()
    expect(engine.mount).toHaveBeenCalledOnce()
    const spec = engine.mount.mock.calls[0]![0] as ResolvedChartSpec
    expect(spec.library).toBe('chartjs')
    expect(spec.series.map((s) => s.id)).toEqual(['q'])
    expect(wrapper.emitted('ready')).toEqual([
      [{ library: 'chartjs', instance: { library: 'chartjs' } }],
    ])
  })

  it('redibuja (sin remontar) cuando cambian los props', async () => {
    const wrapper = mount(ASChart, { props: { series } })
    await flushPromises()
    await wrapper.setProps({ now: new Date(2026, 9, 18) })
    expect(engine.update).toHaveBeenCalledOnce()
    expect(engine.mount).toHaveBeenCalledOnce()
  })

  it('remonta al cambiar de motor y libera el anterior', async () => {
    const wrapper = mount(ASChart, { props: { series } })
    await flushPromises()
    await wrapper.setProps({ chartLibrary: 'apexcharts' })
    await flushPromises()
    expect(engine.dispose).toHaveBeenCalledOnce()
    expect(engine.mount).toHaveBeenCalledTimes(2)
  })

  it('reenvía los eventos del motor', async () => {
    const wrapper = mount(ASChart, { props: { series } })
    await flushPromises()
    const handlers = engine.mount.mock.calls[0]![1] as { onXClick: (x: Date) => void }
    handlers.onXClick(new Date(2026, 9, 18))
    expect(wrapper.emitted('x-click')).toEqual([[{ x: new Date(2026, 9, 18) }]])
  })

  it('un clic en un instante emite time-select y update:currentTime', async () => {
    const wrapper = mount(ASChart, { props: { series } })
    await flushPromises()
    const handlers = engine.mount.mock.calls[0]![1] as { onXClick: (x: Date | number) => void }
    handlers.onXClick(new Date(2026, 9, 18, 1))
    handlers.onXClick(3) // eje no temporal: solo x-click
    expect(wrapper.emitted('time-select')).toEqual([[{ time: new Date(2026, 9, 18, 1) }]])
    expect(wrapper.emitted('update:currentTime')).toEqual([[new Date(2026, 9, 18, 1)]])
    expect(wrapper.emitted('x-click')).toHaveLength(2)
  })

  describe('syncGroup', () => {
    type Handlers = {
      onHover: (x: Date | number | null) => void
      onRangeChange: (event: { start: Date; end: Date }) => void
    }
    const handlersOf = (index: number) => engine.mount.mock.calls[index]![1] as Handlers

    it('las gráficas del mismo grupo comparten cursor y zoom; las demás, no', async () => {
      const wrappers = [
        mount(ASChart, { props: { series, syncGroup: 'cuenca' } }),
        mount(ASChart, { props: { series, syncGroup: 'cuenca' } }),
        mount(ASChart, { props: { series } }),
      ]
      await flushPromises()
      handlersOf(0).onHover(new Date(2026, 9, 18, 1))
      // Una sola llamada: la del otro miembro (ni la propia ni la de la gráfica sin grupo).
      expect(engine.showCursor).toHaveBeenCalledOnce()
      expect(engine.showCursor).toHaveBeenCalledWith(new Date(2026, 9, 18, 1).getTime())
      await new Promise(requestAnimationFrame)
      handlersOf(0).onRangeChange({ start: new Date(2026, 9, 18), end: new Date(2026, 9, 18, 1) })
      expect(engine.zoomTo).toHaveBeenCalledOnce()
      expect(engine.zoomTo).toHaveBeenCalledWith({
        start: new Date(2026, 9, 18).getTime(),
        end: new Date(2026, 9, 18, 1).getTime(),
      })
      for (const wrapper of wrappers) wrapper.unmount()
    })

    it('lo que llega del grupo no se reenvía (sin rebotes)', async () => {
      const wrappers = [
        mount(ASChart, { props: { series, syncGroup: 'eco' } }),
        mount(ASChart, { props: { series, syncGroup: 'eco' } }),
      ]
      await flushPromises()
      // El motor del segundo reacciona al cursor remoto emitiendo su propio hover.
      engine.showCursor.mockImplementationOnce((x: number) => handlersOf(1).onHover(x))
      handlersOf(0).onHover(5)
      expect(engine.showCursor).toHaveBeenCalledOnce()
      for (const wrapper of wrappers) wrapper.unmount()
    })
  })

  it('si el motor no está instalado, lo explica en español con el comando npm', async () => {
    engine.fail = true
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const wrapper = mount(ASChart, { props: { series, chartLibrary: 'apexcharts' } })
    await flushPromises()
    expect(wrapper.find('.as-chart__message').text()).toBe(
      'No se pudo cargar apexcharts. Instala la dependencia opcional: npm i apexcharts',
    )
  })

  it('muestra los estados de carga, vacío y error', async () => {
    const empty = mount(ASChart, { props: { series: [{ ...series[0]!, data: [] }] } })
    expect(empty.find('.as-chart__message').text()).toBe('Sin datos')
    const loading = mount(ASChart, { props: { series, loading: true } })
    expect(loading.find('.as-chart__message').text()).toBe('Cargando…')
    const failed = mount(ASChart, { props: { series, error: 'Servicio caído' } })
    expect(failed.find('.as-chart__message--error').text()).toBe('Servicio caído')
  })

  it('genera la etiqueta accesible con los nombres de las series', () => {
    expect(mount(ASChart, { props: { series } }).attributes('aria-label')).toBe(
      'Gráfica de líneas: Caudal',
    )
  })

  it('sin tema, no fuerza ninguno; con la prop, aplica su clase', () => {
    expect(mount(ASChart, { props: { series } }).classes()).not.toContain('as-dark')
    expect(mount(ASChart, { props: { series, theme: 'dark' } }).classes()).toContain('as-dark')
  })

  it('traduce sus textos con provideLocale', () => {
    const wrapper = mount(
      defineComponent({
        setup() {
          provideLocale('en')
          return () => h(ASChart, { series: [{ ...series[0]!, data: [] }] })
        },
      }),
    )
    expect(wrapper.find('.as-chart__message').text()).toBe('No data')
  })
})

describe('ASChart · barra de herramientas', () => {
  const tools = (wrapper: ReturnType<typeof mount>) =>
    wrapper.findAll('.as-chart__tool').map((button) => button.text())

  /** Captura las descargas (el clic en el enlace temporal) sin navegar. */
  function captureDownloads() {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    return () => click.mock.contexts.map((link) => link as HTMLAnchorElement)
  }

  /** Bytes de un Blob (el de jsdom no tiene `arrayBuffer()`). */
  const readBlob = (blob: Blob) =>
    new Promise<ArrayBuffer>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.readAsArrayBuffer(blob)
    })

  it('por defecto no hay barra; con zoom, solo "Restablecer zoom"', () => {
    expect(mount(ASChart, { props: { series } }).find('.as-chart__toolbar').exists()).toBe(false)
    expect(tools(mount(ASChart, { props: { series, zoom: true } }))).toEqual(['Restablecer zoom'])
  })

  it('toolbar muestra PNG, SVG y CSV (y "Restablecer zoom" con zoom), con nombres accesibles', () => {
    const wrapper = mount(ASChart, { props: { series, toolbar: true, zoom: true } })
    expect(tools(wrapper)).toEqual(['Restablecer zoom', 'PNG', 'SVG', 'CSV'])
    expect(
      wrapper.findAll('.as-chart__tool').map((button) => button.attributes('aria-label')),
    ).toEqual([undefined, 'Descargar imagen PNG', 'Descargar imagen SVG', 'Descargar datos CSV'])
  })

  it('toolbar: false la oculta aunque haya zoom; un objeto elige las acciones', () => {
    expect(
      mount(ASChart, { props: { series, toolbar: false, zoom: true } })
        .find('.as-chart__toolbar')
        .exists(),
    ).toBe(false)
    const custom = { resetZoom: false, svg: false }
    expect(tools(mount(ASChart, { props: { series, zoom: true, toolbar: custom } }))).toEqual([
      'PNG',
      'CSV',
    ])
    // `download` (obsoleto) sigue controlando el PNG.
    expect(tools(mount(ASChart, { props: { series, toolbar: { download: false } } }))).toEqual([
      'SVG',
      'CSV',
    ])
  })

  it('"Restablecer zoom" llama al motor', async () => {
    const wrapper = mount(ASChart, { props: { series, zoom: true } })
    await flushPromises()
    await wrapper.find('.as-chart__tool').trigger('click')
    expect(engine.resetZoom).toHaveBeenCalledOnce()
  })

  it('PNG y SVG descargan la imagen del motor como grafica.png / grafica.svg', async () => {
    const downloads = captureDownloads()
    const wrapper = mount(ASChart, { props: { series, toolbar: true } })
    await flushPromises()
    const [png, svg] = wrapper.findAll('.as-chart__tool')
    await png!.trigger('click')
    await svg!.trigger('click')
    await flushPromises()
    expect(engine.exportImage.mock.calls).toEqual([['png'], ['svg']])
    expect(downloads().map((link) => [link.download, link.href])).toEqual([
      ['grafica.png', 'data:image/png;base64,x'],
      ['grafica.svg', 'data:image/svg+xml,x'],
    ])
  })

  it('CSV descarga los datos con BOM (para Excel) y el nombre de `fileName`', async () => {
    const downloads = captureDownloads()
    const blobs: Blob[] = []
    URL.createObjectURL = vi.fn((blob: Blob) => {
      blobs.push(blob)
      return 'blob:csv'
    })
    URL.revokeObjectURL = vi.fn()
    const wrapper = mount(ASChart, { props: { series, toolbar: true, fileName: 'caudal' } })
    await flushPromises()
    await wrapper.findAll('.as-chart__tool')[2]!.trigger('click')
    expect(downloads()[0]!.download).toBe('caudal.csv')
    expect(blobs[0]!.type).toBe('text/csv;charset=utf-8')
    const bytes = new Uint8Array(await readBlob(blobs[0]!))
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf])
    expect(new TextDecoder().decode(bytes)).toContain('Fecha y hora;Caudal\r\n2026-10-18 00:00;1')
  })

  it('pantalla completa: solo si el navegador la permite; entra y sale', async () => {
    let fullscreenElement: Element | null = null
    Object.defineProperty(document, 'fullscreenEnabled', { value: true, configurable: true })
    Object.defineProperty(document, 'fullscreenElement', {
      get: () => fullscreenElement,
      configurable: true,
    })
    const setFullscreen = (element: Element | null) => {
      fullscreenElement = element
      document.dispatchEvent(new Event('fullscreenchange'))
    }
    HTMLElement.prototype.requestFullscreen = vi.fn(async () => setFullscreen(wrapper.element))
    document.exitFullscreen = vi.fn(async () => setFullscreen(null))
    const wrapper = mount(ASChart, { props: { series, toolbar: true } })
    await flushPromises()
    const button = () => wrapper.findAll('.as-chart__tool').at(-1)!
    expect(button().text()).toBe('Pantalla completa')
    await button().trigger('click')
    await flushPromises()
    expect(wrapper.classes()).toContain('as-chart--fullscreen')
    expect(button().text()).toBe('Salir de pantalla completa')
    await button().trigger('click')
    await flushPromises()
    expect(wrapper.classes()).not.toContain('as-chart--fullscreen')
    Object.defineProperty(document, 'fullscreenEnabled', { value: undefined, configurable: true })
  })

  it('expone exportImage y exportData para usarlos desde fuera', async () => {
    const wrapper = mount(ASChart, { props: { series } })
    await flushPromises()
    const exposed = wrapper.vm as unknown as ChartExposed
    expect(await exposed.exportImage('svg')).toBe('data:image/svg+xml,x')
    expect(exposed.exportData({ separator: ',', decimalSeparator: '.' })).toBe(
      'Fecha y hora,Caudal\r\n2026-10-18 00:00,1\r\n2026-10-18 01:00,2',
    )
  })
})

describe('ASChart · accesibilidad', () => {
  const t0 = new Date(2026, 9, 18).getTime()
  const t1 = new Date(2026, 9, 18, 1).getTime()

  it('describe la gráfica (aria-describedby) con el rango y los valores extremos', async () => {
    const wrapper = mount(ASChart, { props: { series } })
    await flushPromises()
    const description = wrapper.find(`#${wrapper.attributes('aria-describedby')}`)
    expect(description.text()).toContain('Valores desde 18/10/2026, 00:00 hasta 18/10/2026, 01:00.')
    expect(description.text()).toContain('Caudal: mínimo 1, máximo 2')
  })

  it('`description` sustituye a la generada', async () => {
    const wrapper = mount(ASChart, { props: { series, description: 'Caudal en Aranjuez' } })
    await flushPromises()
    expect(wrapper.find(`#${wrapper.attributes('aria-describedby')}`).text()).toBe(
      'Caudal en Aranjuez',
    )
  })

  it('incluye una tabla de datos oculta para lectores de pantalla (salvo con dataTable: false)', async () => {
    const wrapper = mount(ASChart, { props: { series } })
    await flushPromises()
    const table = wrapper.find('table.as-chart__sr')
    expect(table.find('caption').text()).toBe('Datos: Gráfica de líneas: Caudal')
    expect(table.findAll('th[scope="col"]').map((th) => th.text())).toEqual([
      'Fecha y hora',
      'Caudal',
    ])
    const cells = table
      .findAll('tbody tr')
      .map((tr) => tr.findAll('th, td').map((cell) => cell.text()))
    expect(cells).toEqual([
      ['18/10/2026, 00:00', '1'],
      ['18/10/2026, 01:00', '2'],
    ])
    const without = mount(ASChart, { props: { series, dataTable: false } })
    await flushPromises()
    expect(without.find('table').exists()).toBe(false)
  })

  it('el área de datos se recorre con el teclado y anuncia los valores', async () => {
    const wrapper = mount(ASChart, { props: { series } })
    await flushPromises()
    const area = wrapper.find('[role="application"]')
    expect(area.attributes('tabindex')).toBe('0')
    const live = wrapper.find('[aria-live="polite"]')

    await area.trigger('keydown', { key: 'ArrowRight' })
    expect(engine.showCursor).toHaveBeenLastCalledWith(t0)
    expect(live.text()).toBe('18/10/2026, 00:00: Caudal 1')

    await area.trigger('keydown', { key: 'End' })
    expect(engine.showCursor).toHaveBeenLastCalledWith(t1)

    await area.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('time-select')).toEqual([[{ time: new Date(t1) }]])

    await area.trigger('keydown', { key: 'Escape' })
    expect(engine.showCursor).toHaveBeenLastCalledWith(null)
    expect(live.text()).toBe('')
  })

  it('el cursor movido con el teclado llega al resto del syncGroup', async () => {
    const wrappers = [
      mount(ASChart, { props: { series, syncGroup: 'teclado' } }),
      mount(ASChart, { props: { series, syncGroup: 'teclado' } }),
    ]
    await flushPromises()
    await wrappers[0]!.find('[role="application"]').trigger('keydown', { key: 'Home' })
    // Una vez en la propia gráfica y otra en la del grupo.
    expect(engine.showCursor.mock.calls).toEqual([[t0], [t0]])
    for (const wrapper of wrappers) wrapper.unmount()
  })

  it('sin datos, el área no es enfocable', async () => {
    const wrapper = mount(ASChart, { props: { series: [{ ...series[0]!, data: [] }] } })
    await flushPromises()
    expect(wrapper.find('[role="application"]').exists()).toBe(false)
  })
})
