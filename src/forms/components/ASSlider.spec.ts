import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { provideTheme } from '@/core/composables/useTheme'
import ASSlider from './ASSlider.vue'

describe('ASSlider', () => {
  it('un range nativo con su etiqueta, rango y valor formateado en español', () => {
    const wrapper = mount(ASSlider, {
      props: { modelValue: 2.5, min: 0, max: 10, step: 0.5, label: 'Umbral' },
    })
    const input = wrapper.find('input')
    expect(input.attributes()).toMatchObject({
      type: 'range',
      min: '0',
      max: '10',
      step: '0.5',
      'aria-valuetext': '2,5',
    })
    expect(wrapper.find('label').attributes('for')).toBe(input.attributes('id'))
    expect(wrapper.find('output').text()).toBe('2,5')
    expect(input.attributes('style')).toContain('--as-slider-fill: 25%')
  })

  it('format cambia el texto a la vista y el que se anuncia', () => {
    const wrapper = mount(ASSlider, {
      props: { modelValue: 40, label: 'Opacidad', format: (v: number) => `${v} %` },
    })
    expect(wrapper.find('output').text()).toBe('40 %')
    expect(wrapper.find('input').attributes('aria-valuetext')).toBe('40 %')
  })

  it('emite update:modelValue al moverlo y change al soltarlo, como número', async () => {
    const wrapper = mount(ASSlider, { props: { modelValue: 10, label: 'Opacidad' } })
    const input = wrapper.find('input')
    ;(input.element as HTMLInputElement).value = '35'
    await input.trigger('input')
    await input.trigger('change')
    expect(wrapper.emitted('update:modelValue')).toEqual([[35]])
    expect(wrapper.emitted('change')).toEqual([[35]])
  })

  it('hideLabel la oculta a la vista sin quitarla; showValue false quita el valor', () => {
    const wrapper = mount(ASSlider, {
      props: { modelValue: 1, label: 'Opacidad', hideLabel: true, showValue: false },
    })
    expect(wrapper.find('label').classes()).toContain('as-slider__label--hidden')
    expect(wrapper.find('output').exists()).toBe(false)
  })

  it('focusable false lo saca del orden de tabulación; disabled lo deshabilita', () => {
    const wrapper = mount(ASSlider, {
      props: { modelValue: 1, label: 'X', focusable: false, disabled: true },
    })
    expect(wrapper.find('input').attributes('tabindex')).toBe('-1')
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
  })

  it('hereda el tema de provideTheme', () => {
    const wrapper = mount(
      defineComponent({
        setup() {
          provideTheme('dark')
          return () => h(ASSlider, { modelValue: 1, label: 'X' })
        },
      }),
    )
    expect(wrapper.find('.as-slider').classes()).toContain('as-slider--dark')
  })
})
