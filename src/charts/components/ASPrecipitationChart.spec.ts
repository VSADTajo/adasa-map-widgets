import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import type { ResolvedChartSpec } from '@/charts/core/resolveSpec'
import type { ChartExposed } from '@/charts/types/chart'
import type { PrecipitationProps } from '@/charts/types/PrecipitationProps'
import ASPrecipitationChart from './ASPrecipitationChart.vue'

/** El motor se simula (como en ASChart.spec.ts): aquí importa lo que la gráfica le pasa. */
const engine = vi.hoisted(() => ({ mount: vi.fn(), update: vi.fn() }))

vi.mock('@/charts/engines', () => ({
  ENGINE_PACKAGES: { echarts: ['echarts'], chartjs: ['chart.js'], apexcharts: ['apexcharts'] },
  loadChartEngine: async (library: string) => ({
    library,
    packages: [],
    mount: async (_el: HTMLElement, spec: ResolvedChartSpec) => {
      engine.mount(spec)
      return {
        native: { library },
        update: (next: ResolvedChartSpec) => engine.update(next),
        resize: vi.fn(),
        dispose: vi.fn(),
        resetZoom: vi.fn(),
        showCursor: vi.fn(),
        zoomTo: vi.fn(),
        exportImage: vi.fn(async (format: string) => `data:${format}`),
      }
    },
  }),
}))

const t0 = new Date(2026, 9, 18)
const t1 = new Date(2026, 9, 18, 1)
const t2 = new Date(2026, 9, 18, 2)
const props: PrecipitationProps = {
  series: [
    {
      id: 'tr',
      name: 'P. TR',
      values: [
        [t0, 1],
        [t1, 2],
      ],
      cumulative: true,
    },
    { id: 'wrf', name: 'WRF', kind: 'forecast', values: [[t2, 3]], cumulative: true },
  ],
  now: t1,
}

beforeEach(() => {
  engine.mount.mockReset()
  engine.update.mockReset()
})

const lastSpec = () =>
  (engine.update.mock.calls.at(-1)?.[0] ?? engine.mount.mock.calls.at(-1)![0]) as ResolvedChartSpec
const cumulativeIds = () =>
  lastSpec()
    .series.filter((s) => s.yAxis === 'cumulative')
    .map((s) => s.id)

async function mountChart(extra: Partial<PrecipitationProps> = {}) {
  const wrapper = mount(ASPrecipitationChart, {
    props: { ...props, ...extra },
    attachTo: document.body,
  })
  await flushPromises()
  return wrapper
}

describe('ASPrecipitationChart', () => {
  it('dibuja con el motor elegido: intensidad, acumulados, "ahora" y tooltip con solo la fecha', async () => {
    const wrapper = await mountChart({ chartLibrary: 'chartjs' })
    const spec = lastSpec()
    expect(spec.yAxes.map((axis) => axis.id)).toEqual(['rate', 'cumulative'])
    expect(cumulativeIds()).toEqual(['cumulative-tr', 'cumulative-wrf'])
    expect(spec.annotations.x.some((a) => a.value === t1.getTime())).toBe(true)
    expect(spec.tooltip).toEqual({ mode: 'shared', content: 'time' })
    expect(spec.legend).toMatchObject({ position: 'bottom', values: true })
    wrapper.unmount()
  })

  it('sin barra no hay botón; con toolbar, el de los acumulados (solo si alguna serie lo tiene)', async () => {
    const plain = await mountChart()
    expect(plain.find('.as-chart__toolbar').exists()).toBe(false)
    plain.unmount()
    const withToolbar = await mountChart({ toolbar: { png: false, svg: false, csv: false } })
    const button = withToolbar.find('button[aria-label="Ocultar acumulados"]')
    expect(button.attributes('aria-pressed')).toBe('true')
    withToolbar.unmount()
    const none = await mountChart({
      toolbar: { png: false, svg: false, csv: false },
      series: [{ ...props.series[0]!, cumulative: undefined }],
    })
    expect(none.find('.as-chart__toolbar').exists()).toBe(false)
    none.unmount()
  })

  it('el botón oculta y vuelve a mostrar los acumulados (v-model:show-cumulative)', async () => {
    const wrapper = await mountChart({ toolbar: { png: false, svg: false, csv: false } })
    await wrapper.find('button[aria-label="Ocultar acumulados"]').trigger('click')
    await flushPromises()
    expect(cumulativeIds()).toEqual([])
    expect(wrapper.emitted('update:showCumulative')).toEqual([[false]])
    await wrapper.find('button[aria-label="Mostrar acumulados"]').trigger('click')
    await flushPromises()
    expect(cumulativeIds()).toHaveLength(2)
    wrapper.unmount()
  })

  it('con showCumulative controlado manda la prop; cumulativeToggle: false quita el botón', async () => {
    const wrapper = await mountChart({ showCumulative: false })
    expect(cumulativeIds()).toEqual([])
    await wrapper.setProps({ showCumulative: true })
    await flushPromises()
    expect(cumulativeIds()).toHaveLength(2)
    wrapper.unmount()
    const noToggle = await mountChart({
      toolbar: { png: false, svg: false, csv: false, cumulativeToggle: false },
    })
    expect(noToggle.find('button[aria-label="Ocultar acumulados"]').exists()).toBe(false)
    noToggle.unmount()
  })

  it('los elementos propios de la barra se reenvían (p. ej. el selector de modelo)', async () => {
    const wrapper = await mountChart({
      toolbar: {
        png: false,
        svg: false,
        csv: false,
        items: [{ type: 'button', id: 'modelo', label: 'Cambiar modelo', icon: 'M0 0' }],
      },
    })
    await wrapper.find('button[aria-label="Cambiar modelo"]').trigger('click')
    expect(wrapper.emitted('toolbar-action')).toEqual([[{ id: 'modelo' }]])
    expect(wrapper.emitted('update:showCumulative')).toBeUndefined()
    wrapper.unmount()
  })

  it('expone los mismos métodos que ASChart, con los acumulados en el CSV', async () => {
    const wrapper = await mountChart()
    const exposed = wrapper.vm as unknown as ChartExposed
    expect(exposed.exportData()).toContain('P. TR (acumulado)')
    expect(await exposed.exportImage('png')).toBe('data:png')
    wrapper.unmount()
  })
})
