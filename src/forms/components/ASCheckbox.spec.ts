import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { provideTheme } from '@/core/composables/useTheme'
import type { SelectValue } from '@/forms/types/common'
import ASCheckbox from './ASCheckbox.vue'
import ASSwitch from './ASSwitch.vue'
import ASRadioGroup from './ASRadioGroup.vue'

describe('ASCheckbox', () => {
  it('es un checkbox nativo dentro de su etiqueta, con la ayuda en aria-describedby', () => {
    const wrapper = mount(ASCheckbox, { props: { label: 'Con aviso', hint: 'Ayuda', id: 'c' } })
    const input = wrapper.find('input')
    expect(input.attributes()).toMatchObject({ type: 'checkbox', id: 'c' })
    expect(input.attributes('aria-describedby')).toBe('c-hint')
    expect(input.element.closest('label')!.textContent).toContain('Con aviso')
  })

  it('booleano: emite el contrario y se marca con lo que devuelve el padre', async () => {
    const wrapper = mount(ASCheckbox, {
      props: {
        modelValue: false,
        'onUpdate:modelValue': (value: unknown) =>
          wrapper.setProps({ modelValue: value as boolean }),
      },
    })
    await wrapper.find('input').setValue(true)
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
    expect(wrapper.find('input').element.checked).toBe(true)
    expect(wrapper.classes()).toContain('as-checkbox--checked')
  })

  it('controlado: si el padre no acepta el cambio, vuelve a su estado', async () => {
    const wrapper = mount(ASCheckbox, { props: { modelValue: false } })
    await wrapper.find('input').setValue(true)
    expect(wrapper.find('input').element.checked).toBe(false)
  })

  it('grupo: varios checkboxes comparten un array', async () => {
    const tipos = ref<SelectValue[]>(['aforo'])
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          ['aforo', 'embalse'].map((value) =>
            h(ASCheckbox, {
              value,
              label: value,
              modelValue: tipos.value,
              'onUpdate:modelValue': (v: boolean | SelectValue[]) =>
                (tipos.value = v as SelectValue[]),
            }),
          ),
      }),
    )
    const [aforo, embalse] = wrapper.findAll('input')
    expect(aforo!.element.checked).toBe(true)
    expect(embalse!.element.checked).toBe(false)
    await embalse!.setValue(true)
    expect(tipos.value).toEqual(['aforo', 'embalse'])
    await aforo!.setValue(false)
    expect(tipos.value).toEqual(['embalse'])
  })

  it('indeterminado: propiedad del DOM y guion en la casilla', () => {
    const wrapper = mount(ASCheckbox, { props: { indeterminate: true } })
    expect(wrapper.find('input').element.indeterminate).toBe(true)
    expect(wrapper.find('.as-checkbox__box path').exists()).toBe(true)
  })

  it('error y deshabilitado', () => {
    const wrapper = mount(ASCheckbox, {
      props: { error: 'Acepta las condiciones', disabled: true, id: 'e' },
    })
    const input = wrapper.find('input')
    expect(input.attributes()).toMatchObject({
      'aria-invalid': 'true',
      'aria-describedby': 'e-error',
    })
    expect(input.attributes('disabled')).toBeDefined()
    expect(wrapper.find('#e-error').text()).toBe('Acepta las condiciones')
  })
})

describe('ASSwitch', () => {
  it('es un button role="switch" con aria-checked y su etiqueta asociada', () => {
    const wrapper = mount(ASSwitch, { props: { label: 'Auto', id: 's', modelValue: true } })
    const button = wrapper.find('button')
    expect(button.attributes()).toMatchObject({ role: 'switch', 'aria-checked': 'true', id: 's' })
    expect(wrapper.find('label').attributes('for')).toBe('s')
  })

  it('v-model: emite el contrario y lo refleja', async () => {
    const wrapper = mount(ASSwitch, {
      props: {
        modelValue: false,
        'onUpdate:modelValue': (value: boolean) => wrapper.setProps({ modelValue: value }),
      },
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
    expect(wrapper.find('button').attributes('aria-checked')).toBe('true')
  })

  it('deshabilitado no emite; etiqueta a la izquierda con labelPosition="start"', async () => {
    const wrapper = mount(ASSwitch, {
      props: { disabled: true, labelPosition: 'start', label: 'x' },
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.classes()).toContain('as-switch--label-start')
  })

  it('hereda el tema de provideTheme', () => {
    const wrapper = mount(
      defineComponent({
        setup() {
          provideTheme('dark')
          return () => h(ASSwitch)
        },
      }),
    )
    expect(wrapper.classes()).toContain('as-switch--dark')
  })
})

describe('ASRadioGroup', () => {
  const options = [
    { value: 'observado', label: 'Observado' },
    { value: 'harmonie', label: 'Harmonie', description: 'Modelo AEMET' },
    { value: 3, label: 'EPS', disabled: true },
  ]

  it('fieldset con legend; radios con el mismo name', () => {
    const wrapper = mount(ASRadioGroup, { props: { options, label: 'Fuente', id: 'f' } })
    expect(wrapper.element.tagName).toBe('FIELDSET')
    expect(wrapper.find('legend').text()).toBe('Fuente')
    const radios = wrapper.findAll('input[type="radio"]')
    expect(new Set(radios.map((r) => r.attributes('name')))).toEqual(new Set(['f-name']))
    expect(radios[2]!.attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Modelo AEMET')
  })

  it('v-model: emite el value de la opción (aunque sea un número) y la marca', async () => {
    const wrapper = mount(ASRadioGroup, {
      props: {
        options,
        modelValue: 'observado',
        'onUpdate:modelValue': (value: SelectValue) => wrapper.setProps({ modelValue: value }),
      },
    })
    const radios = wrapper.findAll('input')
    expect(radios[0]!.element.checked).toBe(true)
    await radios[1]!.setValue(true)
    expect(wrapper.emitted('update:modelValue')).toEqual([['harmonie']])
    expect(wrapper.findAll('label')[1]!.classes()).toContain('as-radio-group__option--checked')
  })

  it('controlado: si el padre no acepta el cambio, sigue marcada la de la prop', async () => {
    const wrapper = mount(ASRadioGroup, { props: { options, modelValue: 'observado' } })
    const radios = wrapper.findAll('input')
    await radios[1]!.setValue(true)
    expect(radios[0]!.element.checked).toBe(true)
    expect(radios[1]!.element.checked).toBe(false)
  })

  it('horizontal, error y name propio', () => {
    const wrapper = mount(ASRadioGroup, {
      props: { options, orientation: 'horizontal', error: 'Elige una', name: 'fuente', id: 'g' },
    })
    expect(wrapper.find('.as-radio-group__options--horizontal').exists()).toBe(true)
    expect(wrapper.find('input').attributes()).toMatchObject({
      name: 'fuente',
      'aria-invalid': 'true',
    })
    expect(wrapper.attributes('aria-describedby')).toBe('g-error')
  })
})
