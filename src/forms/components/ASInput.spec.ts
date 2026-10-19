import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { provideLocale } from '@/core/composables/useLocale'
import ASInput from './ASInput.vue'
import ASFormField from './ASFormField.vue'
import { parseDecimal } from '@/forms/utils/field'

/** ASInput con v-model de verdad: el padre devuelve lo que emite. */
function mountInput(props: Record<string, unknown> = {}) {
  const wrapper = mount(ASInput, {
    props: {
      modelValue: '',
      ...props,
      'onUpdate:modelValue': (value: string | number | null) =>
        wrapper.setProps({ modelValue: value }),
    },
    attachTo: document.body,
  })
  return wrapper
}

describe('ASInput', () => {
  describe('etiqueta, ayuda y error', () => {
    it('la etiqueta apunta al input y la ayuda va en aria-describedby', () => {
      const wrapper = mountInput({ label: 'Nombre', hint: 'Como en el SAIH', id: 'nombre' })
      expect(wrapper.find('label').attributes('for')).toBe('nombre')
      const input = wrapper.find('input')
      expect(input.attributes('id')).toBe('nombre')
      expect(input.attributes('aria-describedby')).toBe('nombre-hint')
      expect(wrapper.find('#nombre-hint').text()).toBe('Como en el SAIH')
    })

    it('genera un id si no se pasa', () => {
      const wrapper = mountInput({ label: 'Nombre' })
      const id = wrapper.find('input').attributes('id')
      expect(id).toMatch(/^as-field-\d+$/)
      expect(wrapper.find('label').attributes('for')).toBe(id)
    })

    it('un error con texto se muestra y marca aria-invalid; true solo marca', async () => {
      const wrapper = mountInput({ id: 'q', error: 'Obligatorio', required: true, label: 'Q' })
      const input = wrapper.find('input')
      expect(input.attributes('aria-invalid')).toBe('true')
      expect(input.attributes('aria-required')).toBe('true')
      expect(input.attributes('aria-describedby')).toBe('q-error')
      expect(wrapper.find('#q-error').text()).toBe('Obligatorio')
      expect(wrapper.find('.as-form-field__required').attributes('aria-hidden')).toBe('true')
      await wrapper.setProps({ error: true })
      expect(input.attributes('aria-invalid')).toBe('true')
      expect(wrapper.find('#q-error').exists()).toBe(false)
    })

    it('la unidad se ve y se anuncia con el campo', () => {
      const wrapper = mountInput({ id: 'u', unit: 'm³/s', hint: 'Caudal' })
      expect(wrapper.find('#u-unit').text()).toBe('m³/s')
      expect(wrapper.find('input').attributes('aria-describedby')).toBe('u-hint u-unit')
    })
  })

  describe('v-model de texto', () => {
    it('emite el texto al escribir y muestra lo que devuelve el padre', async () => {
      const wrapper = mountInput()
      await wrapper.find('input').setValue('Aranjuez')
      expect(wrapper.emitted('update:modelValue')).toEqual([['Aranjuez']])
      await wrapper.setProps({ modelValue: 'Toledo' })
      expect(wrapper.find('input').element.value).toBe('Toledo')
    })

    it('los atributos van al input; class, al marco', () => {
      const wrapper = mount(ASInput, { attrs: { name: 'q', maxlength: '5', class: 'mio' } })
      expect(wrapper.find('input').attributes()).toMatchObject({ name: 'q', maxlength: '5' })
      expect(wrapper.classes()).toContain('mio')
      expect(wrapper.find('input').classes()).not.toContain('mio')
    })
  })

  describe('números', () => {
    it.each([
      ['12,5', 12.5],
      ['12.5', 12.5],
      ['-3', -3],
      ['12,', 12],
      ['', null],
      ['-', null],
      ['abc', null],
      ['1,2,3', null],
    ])('parseDecimal(%j) = %j', (text, expected) => {
      expect(parseDecimal(text)).toBe(expected)
    })

    it('emite number con coma decimal y no reescribe lo que se está tecleando', async () => {
      const wrapper = mountInput({ type: 'number', modelValue: null })
      const input = wrapper.find('input')
      expect(input.attributes()).toMatchObject({ type: 'text', inputmode: 'decimal' })
      await input.setValue('12,')
      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([12])
      // El padre devuelve 12: la coma que se está escribiendo no desaparece.
      expect(input.element.value).toBe('12,')
      await input.setValue('12,5')
      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([12.5])
      await input.setValue('')
      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([null])
    })

    it('muestra el valor con el separador decimal del idioma', async () => {
      expect(mountInput({ type: 'number', modelValue: 3.25 }).find('input').element.value).toBe(
        '3,25',
      )
      const english = mount(
        defineComponent({
          setup() {
            provideLocale('en')
            return () => h(ASInput, { type: 'number', modelValue: 3.25 })
          },
        }),
      )
      expect(english.find('input').element.value).toBe('3.25')
    })

    it('↑/↓ suman o restan step dentro de min y max', async () => {
      const wrapper = mountInput({ type: 'number', modelValue: 0.2, step: 0.1, min: 0, max: 0.3 })
      const input = wrapper.find('input')
      await input.trigger('keydown', { key: 'ArrowUp' })
      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([0.3])
      await input.trigger('keydown', { key: 'ArrowUp' })
      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([0.3])
      await wrapper.setProps({ modelValue: 0 })
      await input.trigger('keydown', { key: 'ArrowDown' })
      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([0])
    })
  })

  describe('borrar', () => {
    it('solo aparece con valor; vacía, emite clear y devuelve el foco', async () => {
      const wrapper = mountInput({ clearable: true })
      expect(wrapper.find('button').exists()).toBe(false)
      await wrapper.find('input').setValue('algo')
      const button = wrapper.find('button')
      expect(button.attributes('aria-label')).toBe('Borrar')
      await button.trigger('click')
      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([''])
      expect(wrapper.emitted('clear')).toHaveLength(1)
      expect(document.activeElement).toBe(wrapper.find('input').element)
      wrapper.unmount()
    })

    it('no aparece si está deshabilitado o es de solo lectura', () => {
      for (const state of [{ disabled: true }, { readonly: true }]) {
        const wrapper = mountInput({ clearable: true, modelValue: 'x', ...state })
        expect(wrapper.find('button').exists()).toBe(false)
      }
    })
  })

  it('iconos, slots y estado deshabilitado', () => {
    const wrapper = mount(ASInput, {
      props: { prefixIcon: 'M1 1', disabled: true },
      slots: { suffix: '<b class="mi-sufijo">€</b>' },
    })
    expect(wrapper.find('.as-control-box__affix path').attributes('d')).toBe('M1 1')
    expect(wrapper.find('.mi-sufijo').exists()).toBe(true)
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
    expect(wrapper.find('.as-control-box').classes()).toContain('as-control-box--disabled')
  })
})

describe('ASFormField', () => {
  it('da al slot el id, la etiqueta y los ids de la ayuda y el error', () => {
    const wrapper = mount(ASFormField, {
      props: { label: 'Cuenca', hint: 'Ayuda', error: 'Mal', id: 'c' },
      slots: {
        default: `<template #default="{ id, labelId, describedBy, invalid }">
          <input :id="id" :data-label="labelId" :aria-describedby="describedBy" :aria-invalid="invalid" />
        </template>`,
      },
    })
    expect(wrapper.find('input').attributes()).toMatchObject({
      id: 'c',
      'data-label': 'c-label',
      'aria-describedby': 'c-hint c-error',
      'aria-invalid': 'true',
    })
    expect(wrapper.find('label').attributes()).toMatchObject({ for: 'c', id: 'c-label' })
  })

  it('como fieldset usa una legend y se deshabilita entero', () => {
    const wrapper = mount(ASFormField, {
      props: { as: 'fieldset', label: 'Fuente', disabled: true, hint: 'h', id: 'f' },
    })
    expect(wrapper.element.tagName).toBe('FIELDSET')
    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.attributes('aria-describedby')).toBe('f-hint')
    expect(wrapper.find('legend').text()).toBe('Fuente')
    expect(wrapper.find('label').exists()).toBe(false)
  })
})
