import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { MeasureSeries, TimePoint } from '@/detail/types/hydro'
import ASAlertStatus from './ASAlertStatus.vue'
import ASObservedSummary from './ASObservedSummary.vue'
import ASThresholdSummary from './ASThresholdSummary.vue'

const h = (hour: number) => new Date(2026, 9, 19, hour)
const thresholds = { amarillo: 40, naranja: 70, rojo: 90 }
const series = (id: string, values: (number | null)[], extra: Partial<MeasureSeries> = {}) => ({
  id,
  label: id,
  unit: 'm³/s',
  data: values.map((value, hour): TimePoint => [h(hour), value]),
  ...extra,
})

describe('ASAlertStatus', () => {
  it('latest: el nivel del último valor, con el valor y su fecha', () => {
    // Pasó por rojo, pero ahora está en amarillo: manda el último.
    const wrapper = mount(ASAlertStatus, {
      props: { series: [series('Observado', [10, 95, 50])], thresholds },
    })
    expect(wrapper.find('h3').text().replace(/\s+/g, ' ')).toBe('Último estado observado')
    expect(wrapper.find('.as-status-badge').text().replace(/\s+/g, ' ')).toBe('Amarillo')
    expect(wrapper.find('.as-alert-status__value').text().replace(/\s+/g, ' ')).toBe(
      '50 m³/s · 19 oct, 02:00',
    )
  })

  it('max: el más grave de los máximos de todas las series, y cuál lo decide', () => {
    const wrapper = mount(ASAlertStatus, {
      props: {
        series: [series('Harmonie', [10, 75, 20]), series('EPS', [30, 50])],
        thresholds,
        mode: 'max',
      },
    })
    expect(wrapper.find('h3').text().replace(/\s+/g, ' ')).toBe('Estado según las previsiones')
    expect(wrapper.find('.as-status-badge').text().replace(/\s+/g, ' ')).toBe('Naranja')
    expect(wrapper.find('.as-alert-status__value').text().replace(/\s+/g, ' ')).toContain(
      '(Harmonie)',
    )
  })

  it('los umbrales propios de una serie mandan sobre los del componente', () => {
    const wrapper = mount(ASAlertStatus, {
      props: { series: [series('Volumen', [5], { thresholds: { rojo: 4 } })], thresholds },
    })
    expect(wrapper.find('.as-status-badge').text().replace(/\s+/g, ' ')).toBe('Rojo')
  })

  it('sin datos: Normal y sin valor; cargando: esqueleto', async () => {
    const wrapper = mount(ASAlertStatus, { props: { series: [series('X', [null])], thresholds } })
    expect(wrapper.find('.as-status-badge').text().replace(/\s+/g, ' ')).toBe('Normal')
    expect(wrapper.find('.as-alert-status__value').exists()).toBe(false)
    await wrapper.setProps({ loading: true })
    expect(wrapper.find('.as-status-badge').exists()).toBe(false)
  })
})

describe('ASObservedSummary', () => {
  const entrada = series('entrada', [10, 80, 50], { label: 'Entrada' })
  const salida = series('salida', [20, 30], { label: 'Salida' })
  const volumen = series('volumen', [null], { label: 'Volumen', unit: 'hm³' })

  it('último valor y máximo con su fecha y su nivel', () => {
    const wrapper = mount(ASObservedSummary, { props: { series: [entrada], thresholds } })
    const rows = wrapper
      .findAll('.as-observed-summary__row')
      .map((row) => [
        row.find('dt').text().replace(/\s+/g, ' '),
        row.find('dd').text().replace(/\s+/g, ' '),
      ])
    expect(rows).toEqual([
      ['Último valor', '50 m³/s (nivel amarillo)'],
      ['Fecha del último', '19/10/2026, 02:00'],
      ['Máximo', '80 m³/s (nivel naranja)'],
      ['Fecha del máximo', '19/10/2026, 01:00'],
    ])
    // Con una sola serie no hay selector.
    expect(wrapper.find('[role="group"]').exists()).toBe(false)
  })

  it('con varias series: selector, sin datos deshabilitada, y v-model:active', async () => {
    const wrapper = mount(ASObservedSummary, {
      props: {
        series: [entrada, salida, volumen],
        thresholds,
        'onUpdate:active': (id: string) => wrapper.setProps({ active: id }),
      },
    })
    const buttons = wrapper.findAll('[role="group"] button')
    expect(buttons.map((b) => b.text().replace(/\s+/g, ' '))).toEqual([
      'Entrada',
      'Salida',
      'Volumen',
    ])
    expect(buttons[0]!.attributes('aria-pressed')).toBe('true')
    expect(buttons[2]!.attributes('disabled')).toBeDefined()
    await buttons[1]!.trigger('click')
    expect(wrapper.emitted('update:active')).toEqual([['salida']])
    expect(wrapper.findAll('dd')[0]!.text().replace(/\s+/g, ' ')).toBe('30 m³/s (nivel normal)')
  })

  it('sin datos, el texto vacío', () => {
    const wrapper = mount(ASObservedSummary, { props: { series: [volumen] } })
    expect(wrapper.find('.as-card__empty').text().replace(/\s+/g, ' ')).toBe(
      'No hay datos observados',
    )
  })
})

describe('ASThresholdSummary', () => {
  it('una línea por serie y nivel, de rojo a amarillo, con el último tramo', () => {
    const wrapper = mount(ASThresholdSummary, {
      props: {
        series: [series('Harmonie', [10, 95, 96, 20, 92, 45]), series('EPS', [30, 30])],
        thresholds,
        mode: 'forecast',
      },
    })
    expect(wrapper.findAll('li').map((li) => li.text().replace(/\s+/g, ' '))).toEqual([
      'Harmonie: nivel rojo superado en 2 intervalos. Último: 19 oct, 04:00',
      'Harmonie: nivel amarillo superado en 1 intervalo. Último: 19 oct, 05:00',
    ])
    expect(wrapper.find('.as-threshold-summary__dot--rojo').exists()).toBe(true)
  })

  it('un tramo de varios valores muestra su inicio y su fin', () => {
    const wrapper = mount(ASThresholdSummary, {
      props: { series: [series('Observado', [50, 55])], thresholds },
    })
    expect(wrapper.find('li').text().replace(/\s+/g, ' ')).toBe(
      'Observado: nivel amarillo superado en 1 intervalo. Último: 19 oct, 00:00 – 01:00',
    )
  })

  it('sin superaciones lo dice; sin datos, el texto vacío según el modo', () => {
    const calm = mount(ASThresholdSummary, {
      props: { series: [series('Observado', [1, 2])], thresholds },
    })
    expect(calm.find('.as-threshold-summary__none').text().replace(/\s+/g, ' ')).toBe(
      'Sin superaciones de umbral en el periodo observado',
    )
    const empty = mount(ASThresholdSummary, {
      props: { series: [series('Harmonie', [null])], thresholds, mode: 'forecast' },
    })
    expect(empty.find('.as-card__empty').text().replace(/\s+/g, ' ')).toBe(
      'No hay datos de previsión',
    )
  })
})
