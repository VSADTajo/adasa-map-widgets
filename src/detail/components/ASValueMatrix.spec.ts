import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { AggregateKind, ExceededLevel, TimePoint } from '@/detail/types/hydro'
import ASThresholdLegend from './ASThresholdLegend.vue'
import ASValueMatrix from './ASValueMatrix.vue'

const at = (day: number, hour: number) => new Date(2026, 9, day, hour)
const thresholds = { amarillo: 40, naranja: 70, rojo: 90 }

const observed = {
  id: 'obs',
  label: 'Observado',
  unit: 'm³/s',
  // Dos valores por intervalo de 6 h: 00-06 (10 y 50), 06-12 (75 y 95).
  data: [
    [at(19, 1), 10],
    [at(19, 4), 50],
    [at(19, 7), 75],
    [at(19, 9), 95],
  ] as TimePoint[],
}
const harmonie = {
  id: 'harmonie',
  label: 'Harmonie',
  data: [[at(19, 13), 20]] as TimePoint[],
}

function mountMatrix(props: Record<string, unknown> = {}) {
  const wrapper = mount(ASValueMatrix, {
    props: {
      series: [observed, harmonie],
      thresholds,
      ...props,
      'onUpdate:aggregate': (kind: AggregateKind) => wrapper.setProps({ aggregate: kind }),
    },
  })
  return wrapper
}

const rowCells = (wrapper: ReturnType<typeof mountMatrix>, row: number) =>
  wrapper.findAll('tbody tr')[row]!.findAll('td')

describe('ASValueMatrix', () => {
  it('una fila por serie y una columna por intervalo de 6 h', () => {
    const wrapper = mountMatrix()
    expect(wrapper.find('h3').text().replace(/\s+/g, ' ')).toBe('Valores cada 6 h')
    expect(wrapper.findAll('thead th').map((th) => th.text().replace(/\s+/g, ' '))).toEqual([
      'Serie',
      '19/10, 00:00',
      '19/10, 06:00',
      '19/10, 12:00',
    ])
    expect(wrapper.findAll('tbody th').map((th) => th.text().replace(/\s+/g, ' '))).toEqual([
      'Observado (m³/s)',
      'Harmonie',
    ])
    // Harmonie no tiene datos en los dos primeros intervalos.
    expect(rowCells(wrapper, 1).map((td) => td.text().replace(/\s+/g, ' '))).toEqual([
      '—',
      '—',
      '20',
    ])
  })

  it('la media por defecto; el selector cambia a mínimo o máximo (v-model:aggregate)', async () => {
    const wrapper = mountMatrix()
    const values = () =>
      rowCells(wrapper, 0).map((td) => td.text().replace(/\s+/g, ' ').split(',')[0]!.trim())
    expect(values()).toEqual(['30', '85', '—'])
    const buttons = wrapper.findAll('[role="group"] button')
    expect(buttons.map((b) => b.text().replace(/\s+/g, ' '))).toEqual(['Mínimo', 'Medio', 'Máximo'])
    await buttons[2]!.trigger('click')
    expect(wrapper.emitted('update:aggregate')).toEqual([['max']])
    expect(values()).toEqual(['50', '95', '—'])
  })

  it('cada celda lleva su nivel: color, title y texto para lectores de pantalla', () => {
    const wrapper = mountMatrix()
    const [first, second] = rowCells(wrapper, 0)
    expect(first!.classes()).toContain('as-value-matrix__cell--normal')
    expect(second!.classes()).toContain('as-value-matrix__cell--naranja')
    expect(second!.attributes('title')).toBe('Naranja')
    expect(second!.text().replace(/\s+/g, ' ')).toBe('85 , nivel naranja')
  })

  it('la zona de la tabla se enfoca para desplazarla, con su nombre', () => {
    const region = mountMatrix().find('[role="region"]')
    expect(region.attributes('tabindex')).toBe('0')
    expect(region.attributes('aria-label')).toContain('Desplázate en horizontal')
  })

  it('days limita las columnas; la leyenda muestra los umbrales', () => {
    const wrapper = mountMatrix({ days: 0.5 })
    expect(wrapper.findAll('thead th')).toHaveLength(3)
    expect(
      wrapper.findAll('.as-value-matrix__legend li').map((li) => li.text().replace(/\s+/g, ' ')),
    ).toEqual(['Amarillo desde 40 m³/s', 'Naranja desde 70 m³/s', 'Rojo desde 90 m³/s'])
  })

  it('sin datos, el texto vacío', () => {
    const wrapper = mountMatrix({ series: [{ id: 'x', label: 'X', data: [] }] })
    expect(wrapper.find('.as-card__empty').exists()).toBe(true)
  })
})

describe('ASThresholdLegend', () => {
  function mountLegend(props: Record<string, unknown> = {}) {
    const wrapper = mount(ASThresholdLegend, {
      props: {
        thresholds,
        unit: 'm³/s',
        ...props,
        'onUpdate:selected': (level: ExceededLevel | null) => wrapper.setProps({ selected: level }),
      },
    })
    return wrapper
  }

  it('los tres umbrales con su valor, de amarillo a rojo', () => {
    const wrapper = mountLegend()
    expect(wrapper.find('h3').text().replace(/\s+/g, ' ')).toBe('Umbrales')
    expect(wrapper.findAll('button').map((b) => b.text().replace(/\s+/g, ' '))).toEqual([
      'Amarillo 40 m³/s',
      'Naranja 70 m³/s',
      'Rojo 90 m³/s',
    ])
    expect(wrapper.findAll('button')[2]!.attributes('title')?.replace(/\s+/g, ' ')).toBe(
      'Resaltar el umbral rojo (90 m³/s)',
    )
  })

  it('pulsar resalta (aria-pressed); pulsar el resaltado lo quita', async () => {
    const wrapper = mountLegend()
    const naranja = () => wrapper.findAll('button')[1]!
    await naranja().trigger('click')
    expect(wrapper.emitted('update:selected')).toEqual([['naranja']])
    expect(naranja().attributes('aria-pressed')).toBe('true')
    await naranja().trigger('click')
    expect(wrapper.emitted('update:selected')!.at(-1)).toEqual([null])
    expect(naranja().attributes('aria-pressed')).toBe('false')
  })

  it('un umbral sin valor se deshabilita; sin ninguno, el texto vacío', () => {
    const partial = mountLegend({ thresholds: { amarillo: 40 } })
    expect(partial.findAll('button')[2]!.attributes('disabled')).toBeDefined()
    expect(partial.findAll('button')[2]!.text().replace(/\s+/g, ' ')).toBe('Rojo —')
    const none = mountLegend({ thresholds: {} })
    expect(none.find('.as-card__empty').text().replace(/\s+/g, ' ')).toBe(
      'No hay umbrales definidos',
    )
  })
})
