import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import type { DateRange } from '@/forms/types/DateRangePickerProps'
import ASDateRangePicker from './ASDateRangePicker.vue'

const d = (year: number, month: number, day: number, h = 0, m = 0, s = 0, ms = 0) =>
  new Date(year, month - 1, day, h, m, s, ms)
const now = d(2026, 10, 18, 10, 30)

/** ASDateRangePicker con v-model de verdad: el padre devuelve lo que emite. */
function mountPicker(props: Record<string, unknown> = {}) {
  const wrapper = mount(ASDateRangePicker, {
    props: {
      id: 'p',
      label: 'Periodo',
      modelValue: null,
      now,
      ...props,
      'onUpdate:modelValue': (value: DateRange | null) => wrapper.setProps({ modelValue: value }),
    },
    attachTo: document.body,
  })
  return wrapper
}

const lastEmitted = (wrapper: ReturnType<typeof mountPicker>) =>
  wrapper.emitted('update:modelValue')?.at(-1)?.[0]

async function open(wrapper: ReturnType<typeof mountPicker>) {
  await wrapper.find('#p').trigger('click')
  await nextTick()
}

const day = (wrapper: ReturnType<typeof mountPicker>, label: string) =>
  wrapper.findAll('td').find((td) => td.attributes('aria-label')?.startsWith(label))!

const button = (wrapper: ReturnType<typeof mountPicker>, text: string) =>
  wrapper.findAll('[role="dialog"] button').find((b) => b.text() === text)!

afterEach(() => {
  document.body.innerHTML = ''
})

describe('ASDateRangePicker', () => {
  it('es un botón que abre un diálogo; muestra el periodo o el placeholder', async () => {
    const wrapper = mountPicker()
    const trigger = wrapper.find('#p')
    expect(trigger.element.tagName).toBe('BUTTON')
    expect(trigger.attributes()).toMatchObject({
      'aria-haspopup': 'dialog',
      'aria-expanded': 'false',
    })
    expect(trigger.text()).toBe('Elige un periodo')
    await wrapper.setProps({ modelValue: { start: d(2026, 10, 1), end: d(2026, 10, 18) } })
    expect(trigger.text()).toBe('01/10/2026 – 18/10/2026')
    await open(wrapper)
    expect(wrapper.find('[role="dialog"]').attributes('aria-label')).toBe('Elegir periodo')
  })

  describe('periodos predefinidos', () => {
    it('por defecto: últimas 24 h, 7 días, 30 días y año hidrológico', async () => {
      const wrapper = mountPicker()
      await open(wrapper)
      expect(wrapper.findAll('.as-date-range-picker__preset').map((b) => b.text())).toEqual([
        'Últimas 24 h',
        'Últimos 7 días',
        'Últimos 30 días',
        'Año hidrológico actual',
      ])
    })

    it('se aplican al pulsarlos, desde `now`, y quedan marcados', async () => {
      const wrapper = mountPicker()
      await open(wrapper)
      await button(wrapper, 'Año hidrológico actual').trigger('click')
      expect(lastEmitted(wrapper)).toEqual({ start: d(2026, 10, 1), end: now })
      expect(wrapper.emitted('preset-selected')).toEqual([['hydroYear']])
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
      await open(wrapper)
      expect(button(wrapper, 'Año hidrológico actual').attributes('aria-pressed')).toBe('true')
      expect(button(wrapper, 'Últimas 24 h').attributes('aria-pressed')).toBe('false')
    })

    it('se recortan a min/max', async () => {
      const wrapper = mountPicker({ min: d(2026, 10, 15) })
      await open(wrapper)
      await button(wrapper, 'Últimos 7 días').trigger('click')
      expect(lastEmitted(wrapper)).toEqual({ start: d(2026, 10, 15), end: now })
    })

    it('admite periodos propios y [] los oculta', async () => {
      const avenida = { start: d(2025, 3, 1), end: d(2025, 3, 10) }
      const wrapper = mountPicker({
        presets: ['today', { id: 'avenida', label: 'Avenida de 2025', range: () => avenida }],
      })
      await open(wrapper)
      await button(wrapper, 'Avenida de 2025').trigger('click')
      expect(lastEmitted(wrapper)).toEqual(avenida)
      expect(wrapper.emitted('preset-selected')).toEqual([['avenida']])
      await wrapper.setProps({ presets: [] })
      await open(wrapper)
      expect(wrapper.find('.as-date-range-picker__presets').exists()).toBe(false)
    })
  })

  describe('calendario', () => {
    it('dos clics marcan inicio y fin; Aplicar emite de las 00:00 al final del día', async () => {
      const wrapper = mountPicker({ modelValue: { start: d(2026, 10, 1), end: d(2026, 10, 18) } })
      await open(wrapper)
      const apply = () => button(wrapper, 'Aplicar')
      await day(wrapper, 'lunes, 5 de octubre').trigger('click')
      expect(wrapper.find('.as-date-range-picker__status').text()).toBe('Elige el día de fin')
      expect(apply().attributes('disabled')).toBeDefined()
      await day(wrapper, 'jueves, 8 de octubre').trigger('click')
      expect(wrapper.find('.as-date-range-picker__status').text()).toBe('Elige el día de inicio')
      expect(day(wrapper, 'martes, 6 de octubre').attributes('aria-selected')).toBe('true')
      expect(day(wrapper, 'lunes, 5 de octubre').attributes('aria-label')).toBe(
        'lunes, 5 de octubre de 2026, inicio del periodo',
      )
      await apply().trigger('click')
      expect(lastEmitted(wrapper)).toEqual({
        start: d(2026, 10, 5),
        end: d(2026, 10, 8, 23, 59, 59, 999),
      })
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    })

    it('si el segundo día es anterior, se intercambian', async () => {
      const wrapper = mountPicker()
      await open(wrapper)
      await day(wrapper, 'jueves, 8 de octubre').trigger('click')
      await day(wrapper, 'lunes, 5 de octubre').trigger('click')
      await button(wrapper, 'Aplicar').trigger('click')
      expect(lastEmitted(wrapper)).toEqual({
        start: d(2026, 10, 5),
        end: d(2026, 10, 8, 23, 59, 59, 999),
      })
    })

    it('Cancelar y Escape descartan el borrador', async () => {
      const wrapper = mountPicker()
      await open(wrapper)
      await day(wrapper, 'lunes, 5 de octubre').trigger('click')
      await button(wrapper, 'Cancelar').trigger('click')
      await open(wrapper)
      await day(wrapper, 'lunes, 5 de octubre').trigger('click')
      await wrapper.find('[role="dialog"]').trigger('keydown', { key: 'Escape' })
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    })

    it('con hora: inicio a las 00:00 y fin a las 23:59, editables', async () => {
      const wrapper = mountPicker({ withTime: true })
      await open(wrapper)
      await day(wrapper, 'lunes, 5 de octubre').trigger('click')
      await day(wrapper, 'jueves, 8 de octubre').trigger('click')
      const legends = wrapper.findAll('legend').map((l) => l.text())
      expect(legends).toEqual(['Hora de inicio', 'Hora de fin'])
      const [startHours] = wrapper.findAll('fieldset input')
      await startHours!.setValue('6')
      await button(wrapper, 'Aplicar').trigger('click')
      expect(lastEmitted(wrapper)).toEqual({
        start: d(2026, 10, 5, 6),
        end: d(2026, 10, 8, 23, 59),
      })
      expect(wrapper.find('#p').text()).toBe('05/10/2026 06:00 – 08/10/2026 23:59')
    })
  })

  it('clearable vacía el periodo; deshabilitado no abre', async () => {
    const wrapper = mountPicker({
      clearable: true,
      modelValue: { start: d(2026, 10, 1), end: d(2026, 10, 2) },
    })
    await wrapper.find('button[aria-label="Borrar"]').trigger('click')
    expect(lastEmitted(wrapper)).toBeNull()
    await wrapper.setProps({ disabled: true })
    await open(wrapper)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })
})
