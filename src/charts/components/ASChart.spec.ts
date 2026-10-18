import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { provideLocale } from '@/core/composables/useLocale'
import type { ResolvedChartSpec } from '@/charts/core/resolveSpec'
import type { ChartProps } from '@/charts/types/chart'
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
          exportImage: async () => 'data:image/png;base64,x',
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
    expect(mount(ASChart, { props: { series } }).attributes('aria-label')).toBe('Gráfica: Caudal')
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

  it('por defecto no hay barra; con zoom, solo "Restablecer zoom"', () => {
    expect(mount(ASChart, { props: { series } }).find('[role="toolbar"]').exists()).toBe(false)
    expect(tools(mount(ASChart, { props: { series, zoom: true } }))).toEqual(['Restablecer zoom'])
  })

  it('toolbar muestra "Descargar PNG" (y "Restablecer zoom" si hay zoom)', () => {
    expect(tools(mount(ASChart, { props: { series, toolbar: true } }))).toEqual(['Descargar PNG'])
    expect(tools(mount(ASChart, { props: { series, toolbar: true, zoom: true } }))).toEqual([
      'Restablecer zoom',
      'Descargar PNG',
    ])
  })

  it('toolbar: false la oculta aunque haya zoom; un objeto elige las acciones', () => {
    expect(
      mount(ASChart, { props: { series, toolbar: false, zoom: true } })
        .find('[role="toolbar"]')
        .exists(),
    ).toBe(false)
    expect(
      tools(mount(ASChart, { props: { series, zoom: true, toolbar: { resetZoom: false } } })),
    ).toEqual(['Descargar PNG'])
  })

  it('"Restablecer zoom" llama al motor', async () => {
    const wrapper = mount(ASChart, { props: { series, zoom: true } })
    await flushPromises()
    await wrapper.find('.as-chart__tool').trigger('click')
    expect(engine.resetZoom).toHaveBeenCalledOnce()
  })

  it('"Descargar PNG" descarga la imagen del motor como grafica.png', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const wrapper = mount(ASChart, { props: { series, toolbar: true } })
    await flushPromises()
    await wrapper.find('.as-chart__tool').trigger('click')
    await flushPromises()
    const link = click.mock.contexts[0] as HTMLAnchorElement
    expect(link.download).toBe('grafica.png')
    expect(link.href).toBe('data:image/png;base64,x')
  })
})
