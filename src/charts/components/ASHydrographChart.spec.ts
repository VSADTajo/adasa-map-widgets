import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import type { ResolvedChartSpec } from '@/charts/core/resolveSpec'
import type { ChartExposed, ChartSeries } from '@/charts/types/chart'
import type { HydrographProps, HydroPoint } from '@/charts/types/HydrographProps'
import ASHydrographChart from './ASHydrographChart.vue'
import ASChart from './ASChart.vue'

/** El motor se simula (como en ASChart.spec.ts): aquí importa lo que el hidrograma le pasa. */
const engine = vi.hoisted(() => ({
  mount: vi.fn(),
  update: vi.fn(),
  resetZoom: vi.fn(),
  exportImage: vi.fn(async (format: string) => `data:${format}`),
}))

vi.mock('@/charts/engines', () => ({
  ENGINE_PACKAGES: { echarts: ['echarts'], chartjs: ['chart.js'], apexcharts: ['apexcharts'] },
  loadChartEngine: async (library: string) => ({
    library,
    packages: [],
    mount: async (_el: HTMLElement, spec: ResolvedChartSpec, handlers: unknown) => {
      engine.mount(spec, handlers)
      return {
        native: { library },
        update: (spec: ResolvedChartSpec) => engine.update(spec),
        resize: vi.fn(),
        dispose: vi.fn(),
        resetZoom: engine.resetZoom,
        showCursor: vi.fn(),
        zoomTo: vi.fn(),
        exportImage: engine.exportImage,
      }
    },
  }),
}))

const t0 = new Date(2026, 9, 18)
const t1 = new Date(2026, 9, 18, 1)
const props: HydrographProps = {
  discharge: {
    observed: [
      [t0, 10],
      [t1, 12],
    ],
  },
  precipitation: { observed: [[t0, 2]] },
  thresholds: [{ value: 20, level: 'rojo' }],
  now: t1,
}

beforeEach(() => {
  engine.mount.mockReset()
  engine.update.mockReset()
  engine.resetZoom.mockReset()
})
afterEach(() => vi.restoreAllMocks())

const specOf = (index = 0) => engine.mount.mock.calls[index]![0] as ResolvedChartSpec

describe('ASHydrographChart', () => {
  it('dibuja con el motor elegido los dos paneles, el umbral y "Ahora"', async () => {
    mount(ASHydrographChart, { props: { ...props, chartLibrary: 'chartjs' } })
    await flushPromises()
    const spec = specOf()
    expect(spec.library).toBe('chartjs')
    expect(spec.panels.map((panel) => panel.id)).toEqual(['precipitation', 'discharge'])
    expect(spec.annotations.y.map((a) => a.label)).toEqual(['Umbral rojo'])
    expect(spec.annotations.x.map((a) => a.label)).toEqual(['Ahora'])
  })

  it('por defecto mide 420 px y muestra "Ahora"; now: false lo quita', async () => {
    const wrapper = mount(ASHydrographChart, { props: { discharge: props.discharge } })
    await flushPromises()
    expect(wrapper.find('.as-chart').attributes('style')).toContain('height: 420px')
    expect(specOf().annotations.x).toHaveLength(1)
    mount(ASHydrographChart, { props: { ...props, now: false } })
    await flushPromises()
    expect(specOf(1).annotations.x).toHaveLength(0)
  })

  it('acepta xAxis y annotations como ASChart (las Y, sobre el eje de caudal)', async () => {
    mount(ASHydrographChart, {
      props: {
        ...props,
        xAxis: { label: 'Hora local' },
        annotations: {
          x: [{ type: 'range', from: t0, to: t1, label: 'Episodio' }],
          y: [{ value: 5 }],
        },
      },
    })
    await flushPromises()
    const spec = specOf()
    expect(spec.xAxis).toMatchObject({ type: 'time', label: 'Hora local' })
    expect(spec.annotations.x.map((a) => a.label)).toContain('Episodio')
    expect(spec.annotations.y.map((a) => a.yAxis)).toEqual(['discharge', 'discharge'])
  })

  it('reenvía los eventos de la gráfica', async () => {
    const wrapper = mount(ASHydrographChart, { props })
    await flushPromises()
    const handlers = engine.mount.mock.calls[0]![1] as {
      onXClick: (x: Date) => void
      onPointClick: (e: object) => void
      onRangeChange: (e: object) => void
    }
    handlers.onXClick(t1)
    handlers.onPointClick({ seriesId: 'discharge-observed', x: t1, y: 12 })
    handlers.onRangeChange({ start: t0, end: t1 })
    expect(wrapper.emitted('x-click')).toEqual([[{ x: t1 }]])
    expect(wrapper.emitted('time-select')).toEqual([[{ time: t1 }]])
    expect(wrapper.emitted('update:currentTime')).toEqual([[t1]])
    expect(wrapper.emitted('point-click')).toHaveLength(1)
    expect(wrapper.emitted('range-change')).toHaveLength(1)
    expect(wrapper.emitted('ready')).toHaveLength(1)
  })

  it('expone los mismos métodos que ASChart', async () => {
    const wrapper = mount(ASHydrographChart, { props })
    await flushPromises()
    const exposed = wrapper.vm as unknown as ChartExposed
    expect(await exposed.exportImage('svg')).toBe('data:svg')
    expect(exposed.exportData()).toContain('Fecha y hora;Observado (mm);Observado (m³/s)')
    exposed.resetZoom()
    expect(engine.resetZoom).toHaveBeenCalled()
    expect(exposed.getInstance()).toEqual({ library: 'echarts' })
    expect(() => exposed.refresh()).not.toThrow()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    await exposed.download('png')
    expect((click.mock.contexts[0] as HTMLAnchorElement).download).toBe('grafica.png')
  })
})

describe('ASHydrographChart · acciones propias de la barra', () => {
  const t2 = new Date(2026, 9, 18, 2)
  const percentiles = {
    p10: [
      [t1, 8],
      [t2, 9],
    ] as HydroPoint[],
    p90: [
      [t1, 15],
      [t2, 18],
    ] as HydroPoint[],
  }
  const withForecasts: HydrographProps = {
    ...props,
    thresholds: [
      { value: 30, level: 'rojo' },
      { value: 15, level: 'amarillo' },
    ],
    discharge: {
      observed: props.discharge.observed,
      forecasts: [
        {
          id: 'harmonie',
          name: 'Harmonie',
          values: [
            [t1, 12],
            [t2, 14],
          ],
        },
        {
          id: 'eps',
          name: 'EPS',
          values: [
            [t1, 12],
            [t2, 13],
          ],
          percentiles,
        },
      ],
    },
    toolbar: { png: false, svg: false, csv: false },
  }

  /** El último spec que recibió el motor (al montar o al actualizarse). */
  const lastSpec = () =>
    (engine.update.mock.calls.at(-1)?.[0] ??
      engine.mount.mock.calls.at(-1)![0]) as ResolvedChartSpec
  const toolButtons = (wrapper: ReturnType<typeof mount>) =>
    wrapper.findAll('.as-chart__toolbar button').map((b) => b.attributes('aria-label'))

  async function mountChart(extra: Partial<HydrographProps> = {}) {
    const wrapper = mount(ASHydrographChart, {
      props: { ...withForecasts, ...extra },
      attachTo: document.body,
    })
    await flushPromises()
    return wrapper
  }

  it('con toolbar, añade el selector de previsiones, los percentiles y enfocar umbral', async () => {
    const wrapper = await mountChart()
    expect(toolButtons(wrapper)).toEqual(['Previsiones', 'Ocultar percentiles', 'Enfocar umbral'])
    // Sin barra (por defecto), ninguna.
    const plain = mount(ASHydrographChart, { props })
    expect(plain.find('.as-chart__toolbar').exists()).toBe(false)
    wrapper.unmount()
  })

  it('cada acción se puede desactivar y solo aparece si tiene sentido', async () => {
    const wrapper = await mountChart({
      toolbar: { png: false, svg: false, csv: false, focusThreshold: false },
      discharge: { observed: props.discharge.observed },
    })
    // Sin previsiones ni percentiles, ni selector ni botón de percentiles.
    expect(wrapper.find('.as-chart__toolbar').exists()).toBe(false)
    wrapper.unmount()
  })

  it('enfocar umbral: uno a uno de menor a mayor y vuelta a todos', async () => {
    const wrapper = await mountChart()
    const focus = () =>
      wrapper.find('button[aria-label^="Enfocar umbral"], button[aria-label^="Umbral enfocado"]')
    expect(lastSpec().annotations.y).toHaveLength(2)
    await focus().trigger('click')
    await flushPromises()
    expect(lastSpec().annotations.y.map((a) => a.value)).toEqual([15])
    expect(focus().attributes('aria-label')).toBe(
      'Umbral enfocado: amarillo. Pulsa para el siguiente',
    )
    expect(focus().attributes('aria-pressed')).toBe('true')
    await focus().trigger('click')
    await flushPromises()
    expect(lastSpec().annotations.y.map((a) => a.value)).toEqual([30])
    await focus().trigger('click')
    await flushPromises()
    expect(lastSpec().annotations.y).toHaveLength(2)
    expect(
      (wrapper.emitted('threshold-focus') ?? []).map(
        ([t]) => (t as { value: number } | null)?.value ?? null,
      ),
    ).toEqual([15, 30, null])
    wrapper.unmount()
  })

  it('percentiles: el botón oculta y vuelve a mostrar las bandas (v-model:bands)', async () => {
    const wrapper = await mountChart()
    const ranges = () => lastSpec().series.filter((series) => series.type === 'range')
    expect(ranges().length).toBeGreaterThan(0)
    await wrapper.find('button[aria-label="Ocultar percentiles"]').trigger('click')
    await flushPromises()
    expect(ranges()).toHaveLength(0)
    expect(wrapper.emitted('update:bands')).toEqual([[[]]])
    await wrapper.find('button[aria-label="Mostrar percentiles"]').trigger('click')
    await flushPromises()
    expect(ranges().length).toBeGreaterThan(0)
    expect(wrapper.emitted('update:bands')!.at(-1)).toEqual([['p10-p90', 'p25-p75']])
    wrapper.unmount()
  })

  it('previsiones: ocultar una no cambia el color de las demás (v-model:visible-forecasts)', async () => {
    const wrapper = await mountChart()
    // El color tal como lo pide el hidrograma (el token): en jsdom, todos se resuelven igual.
    const colorOf = (id: string) =>
      (wrapper.findComponent(ASChart).props('series') as ChartSeries[]).find(
        (series) => series.id === id,
      )?.color
    const epsColor = colorOf('discharge-eps')
    expect(epsColor).toBe('var(--as-data-cat-3)')
    expect(colorOf('discharge-harmonie')).toBeDefined()
    await wrapper.find('button[aria-label="Previsiones"]').trigger('click')
    const options = wrapper.findAll('[role="menuitemcheckbox"]')
    expect(options.map((o) => o.text())).toEqual(['Todas', 'Harmonie', 'EPS'])
    // Se oculta la primera: EPS pasaría a ser la primera fuente y cambiaría de color.
    await options[1]!.trigger('click')
    await flushPromises()
    expect(wrapper.emitted('update:visibleForecasts')).toEqual([[['eps']]])
    expect(colorOf('discharge-harmonie')).toBeUndefined()
    expect(colorOf('discharge-eps')).toBe(epsColor)
    wrapper.unmount()
  })

  it('visibleForecasts controlado por el proyecto', async () => {
    const wrapper = await mountChart({ visibleForecasts: ['eps'] })
    expect(lastSpec().series.some((series) => series.id === 'discharge-harmonie')).toBe(false)
    expect(wrapper.find('button[aria-label="Previsiones"]').text()).toBe('1')
    wrapper.unmount()
  })

  it('los elementos propios del proyecto se reenvían como en ASChart', async () => {
    const wrapper = await mountChart({
      toolbar: {
        png: false,
        svg: false,
        csv: false,
        items: [{ type: 'button', id: 'simulacion', label: 'Elegir simulación', icon: 'M0 0' }],
      },
    })
    expect(toolButtons(wrapper).at(-1)).toBe('Elegir simulación')
    await wrapper.find('button[aria-label="Elegir simulación"]').trigger('click')
    expect(wrapper.emitted('toolbar-action')).toEqual([[{ id: 'simulacion' }]])
    wrapper.unmount()
  })
})
