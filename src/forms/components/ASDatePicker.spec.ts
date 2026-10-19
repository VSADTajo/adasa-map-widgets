import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { provideLocale } from '@/core/composables/useLocale'
import ASDatePicker from './ASDatePicker.vue'

const d = (year: number, month: number, day: number, h = 0, m = 0) =>
  new Date(year, month - 1, day, h, m)

/** ASDatePicker con v-model de verdad: el padre devuelve lo que emite. */
function mountPicker(props: Record<string, unknown> = {}) {
  const wrapper = mount(ASDatePicker, {
    props: {
      id: 'f',
      label: 'Fecha',
      modelValue: null,
      ...props,
      'onUpdate:modelValue': (value: Date | null) => wrapper.setProps({ modelValue: value }),
    },
    attachTo: document.body,
  })
  return wrapper
}

const lastEmitted = (wrapper: ReturnType<typeof mountPicker>) =>
  wrapper.emitted('update:modelValue')?.at(-1)?.[0]

async function openCalendar(wrapper: ReturnType<typeof mountPicker>) {
  await wrapper.find('[aria-haspopup="dialog"]').trigger('click')
  await nextTick()
}

const focusedCell = () => document.activeElement as HTMLElement

afterEach(() => {
  document.body.innerHTML = ''
  vi.useRealTimers()
})

describe('ASDatePicker', () => {
  describe('campo de texto', () => {
    it('muestra la fecha con el formato corto del idioma y el formato como placeholder', () => {
      const wrapper = mountPicker({ modelValue: d(2026, 10, 5) })
      const input = wrapper.find('input')
      expect(input.element.value).toBe('05/10/2026')
      expect(input.attributes('placeholder')).toBe('dd/mm/aaaa')
      expect(wrapper.find('label').attributes('for')).toBe('f')
    })

    it('con hora, dd/mm/aaaa hh:mm', () => {
      const wrapper = mountPicker({ modelValue: d(2026, 10, 5, 7, 30), withTime: true })
      expect(wrapper.find('input').element.value).toBe('05/10/2026 07:30')
      expect(wrapper.find('input').attributes('placeholder')).toBe('dd/mm/aaaa hh:mm')
    })

    it('Intro confirma lo escrito y emite la fecha (a las 00:00 sin hora)', async () => {
      const wrapper = mountPicker()
      const input = wrapper.find('input')
      await input.setValue('5/10/2026')
      await input.trigger('keydown', { key: 'Enter' })
      expect(lastEmitted(wrapper)).toEqual(d(2026, 10, 5))
      expect(input.element.value).toBe('05/10/2026')
    })

    it('un texto que no es fecha no emite y marca el error con el formato', async () => {
      const wrapper = mountPicker()
      const input = wrapper.find('input')
      await input.setValue('mañana')
      await input.trigger('change')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(input.attributes('aria-invalid')).toBe('true')
      expect(wrapper.find('#f-error').text()).toBe('Fecha no válida. Escríbela como dd/mm/aaaa')
    })

    it('una fecha fuera de min/max no emite', async () => {
      const wrapper = mountPicker({ min: d(2026, 1, 1), max: d(2026, 12, 31) })
      const input = wrapper.find('input')
      await input.setValue('01/01/2027')
      await input.trigger('change')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(wrapper.find('#f-error').text()).toBe('Fecha fuera del rango permitido')
      // El día de max vale aunque max tenga hora.
      await input.setValue('31/12/2026')
      await input.trigger('change')
      expect(lastEmitted(wrapper)).toEqual(d(2026, 12, 31))
      expect(wrapper.find('#f-error').exists()).toBe(false)
    })

    it('vaciar el campo emite null; el botón de borrar también', async () => {
      const wrapper = mountPicker({ modelValue: d(2026, 10, 5), clearable: true })
      await wrapper.find('button[aria-label="Borrar"]').trigger('click')
      expect(lastEmitted(wrapper)).toBeNull()
      await wrapper.setProps({ modelValue: d(2026, 10, 6) })
      await wrapper.find('input').setValue('')
      await wrapper.find('input').trigger('change')
      expect(lastEmitted(wrapper)).toBeNull()
    })

    it('en inglés (en-GB) también es día/mes/año', () => {
      const wrapper = mount(
        defineComponent({
          setup() {
            provideLocale('en')
            return () => h(ASDatePicker, { modelValue: d(2026, 10, 5) })
          },
        }),
      )
      expect(wrapper.find('input').element.value).toBe('05/10/2026')
      expect(wrapper.find('input').attributes('placeholder')).toBe('dd/mm/yyyy')
    })
  })

  describe('calendario', () => {
    it('abre un diálogo con la rejilla del mes y el foco en el día elegido', async () => {
      const wrapper = mountPicker({ modelValue: d(2026, 10, 5) })
      const toggle = wrapper.find('[aria-haspopup="dialog"]')
      expect(toggle.attributes()).toMatchObject({
        'aria-label': 'Elegir fecha',
        'aria-expanded': 'false',
      })
      await openCalendar(wrapper)
      expect(toggle.attributes('aria-expanded')).toBe('true')
      const dialog = wrapper.find('[role="dialog"]')
      expect(dialog.attributes()).toMatchObject({
        'aria-modal': 'true',
        'aria-label': 'Elegir fecha',
      })
      const grid = wrapper.find('[role="grid"]')
      expect(wrapper.find(`#${grid.attributes('aria-labelledby')}`).text()).toBe('octubre de 2026')
      expect(wrapper.findAll('th')).toHaveLength(7)
      expect(focusedCell().textContent!.trim()).toBe('5')
      expect(focusedCell().getAttribute('aria-selected')).toBe('true')
      expect(focusedCell().getAttribute('aria-label')).toBe('lunes, 5 de octubre de 2026')
    })

    it('flechas, RePág y Mayús+RePág mueven el foco; Intro elige, cierra y devuelve el foco', async () => {
      const wrapper = mountPicker({ modelValue: d(2026, 10, 5) })
      await openCalendar(wrapper)
      const grid = wrapper.find('[role="grid"]')
      await grid.trigger('keydown', { key: 'ArrowRight' })
      await grid.trigger('keydown', { key: 'ArrowDown' })
      await nextTick()
      expect(focusedCell().getAttribute('aria-label')).toBe('martes, 13 de octubre de 2026')
      await grid.trigger('keydown', { key: 'PageDown' })
      await nextTick()
      expect(focusedCell().getAttribute('aria-label')).toBe('viernes, 13 de noviembre de 2026')
      await grid.trigger('keydown', { key: 'PageUp', shiftKey: true })
      await grid.trigger('keydown', { key: 'Home' })
      await nextTick()
      expect(focusedCell().getAttribute('aria-label')).toBe('lunes, 10 de noviembre de 2025')
      await grid.trigger('keydown', { key: 'Enter' })
      await nextTick()
      expect(lastEmitted(wrapper)).toEqual(d(2025, 11, 10))
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
      expect(document.activeElement).toBe(wrapper.find('[aria-haspopup="dialog"]').element)
    })

    it('los botones de mes cambian el mes sin mover el foco a la rejilla', async () => {
      const wrapper = mountPicker({ modelValue: d(2026, 10, 5) })
      await openCalendar(wrapper)
      await wrapper.find('button[aria-label="Mes siguiente"]').trigger('click')
      expect(wrapper.find('h2').text()).toBe('noviembre de 2026')
      await wrapper.find('button[aria-label="Mes anterior"]').trigger('click')
      await wrapper.find('button[aria-label="Mes anterior"]').trigger('click')
      expect(wrapper.find('h2').text()).toBe('septiembre de 2026')
    })

    it('los días fuera de min/max no se eligen', async () => {
      const wrapper = mountPicker({ modelValue: d(2026, 10, 5), max: d(2026, 10, 10) })
      await openCalendar(wrapper)
      const day11 = wrapper
        .findAll('td')
        .find((td) => td.attributes('aria-label')?.startsWith('domingo, 11 de octubre'))!
      expect(day11.attributes('aria-disabled')).toBe('true')
      await day11.trigger('click')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('Escape cierra sin propagarse y devuelve el foco al botón', async () => {
      const wrapper = mountPicker()
      const outer = vi.fn()
      document.body.addEventListener('keydown', (event) => event.key === 'Escape' && outer())
      await openCalendar(wrapper)
      await wrapper.find('[role="dialog"]').trigger('keydown', { key: 'Escape' })
      await nextTick()
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
      expect(outer).not.toHaveBeenCalled()
      expect(document.activeElement).toBe(wrapper.find('[aria-haspopup="dialog"]').element)
    })

    it('"Hoy" elige el día actual', async () => {
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(d(2026, 10, 18, 9, 41))
      const wrapper = mountPicker()
      await openCalendar(wrapper)
      await wrapper
        .findAll('[role="dialog"] button')
        .find((b) => b.text() === 'Hoy')!
        .trigger('click')
      expect(lastEmitted(wrapper)).toEqual(d(2026, 10, 18))
    })
  })

  describe('con hora', () => {
    it('elegir un día mantiene la hora; los campos de hora la cambian', async () => {
      const wrapper = mountPicker({ modelValue: d(2026, 10, 5, 7, 30), withTime: true })
      await openCalendar(wrapper)
      const day6 = wrapper
        .findAll('td')
        .find((td) => td.attributes('aria-label')?.startsWith('martes, 6 de octubre'))!
      await day6.trigger('click')
      expect(lastEmitted(wrapper)).toEqual(d(2026, 10, 6, 7, 30))
      // Con hora el diálogo sigue abierto para ajustarla.
      expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
      const [hours, minutes] = wrapper.findAll('fieldset input')
      expect(hours!.attributes('aria-label')).toBe('Horas')
      await hours!.setValue('18')
      expect(lastEmitted(wrapper)).toEqual(d(2026, 10, 6, 18, 30))
      await minutes!.setValue('5')
      expect(lastEmitted(wrapper)).toEqual(d(2026, 10, 6, 18, 5))
      await wrapper
        .findAll('[role="dialog"] button')
        .find((b) => b.text() === 'Hecho')!
        .trigger('click')
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    })
  })

  it('deshabilitado: ni escribe ni abre', async () => {
    const wrapper = mountPicker({ disabled: true })
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
    await openCalendar(wrapper)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })
})
