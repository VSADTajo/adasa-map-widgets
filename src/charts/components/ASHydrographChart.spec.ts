import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import type { ResolvedChartSpec } from '@/charts/core/resolveSpec'
import type { ChartExposed } from '@/charts/types/chart'
import type { HydrographProps } from '@/charts/types/HydrographProps'
import ASHydrographChart from './ASHydrographChart.vue'

/** El motor se simula (como en ASChart.spec.ts): aquí importa lo que el hidrograma le pasa. */
const engine = vi.hoisted(() => ({
  mount: vi.fn(),
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
        update: vi.fn(),
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
