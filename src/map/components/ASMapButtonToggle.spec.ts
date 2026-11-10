import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { provideTheme } from '@/core/composables/useTheme'
import ASMapButtonToggle from './ASMapButtonToggle.vue'
import type { ButtonToggleOption, ButtonToggleProps } from '@/map/types/ButtonToggleProps'

const options: ButtonToggleOption[] = [
  { value: 'observado', label: 'Observado' },
  { value: 'harmonie', label: 'Harmonie' },
  { value: 'eps', label: 'EPS Medio', disabled: true },
]

function mountToggle(props: Partial<ButtonToggleProps> = {}) {
  return mount(ASMapButtonToggle, { props: { options, ...props } })
}

/**
 * Monta el componente con `v-model` real: el listener de `update:modelValue`
 * devuelve el valor como prop, igual que haría el componente padre.
 */
function mountWithVModel(modelValue: string) {
  const wrapper = mount(ASMapButtonToggle, {
    props: {
      options,
      modelValue,
      'onUpdate:modelValue': (value: string) => wrapper.setProps({ modelValue: value }),
    },
  })
  return wrapper
}

function activeLabel(wrapper: ReturnType<typeof mountToggle>): string | undefined {
  return wrapper.find('.as-button-toggle__btn--active').text()
}

describe('ASMapButtonToggle', () => {
  describe('render', () => {
    it('pinta un botón por opción dentro de un grupo accesible', () => {
      const wrapper = mountToggle({ modelValue: 'observado' })
      expect(wrapper.attributes('role')).toBe('group')
      expect(wrapper.findAll('button').map((b) => b.text())).toEqual([
        'Observado',
        'Harmonie',
        'EPS Medio',
      ])
    })

    it('marca la opción activa con clase, aria-pressed y el color de acento', () => {
      const wrapper = mountToggle({ modelValue: 'harmonie', accentColor: '#ff0000' })
      const [observado, harmonie] = wrapper.findAll('button')
      expect(harmonie!.classes()).toContain('as-button-toggle__btn--active')
      expect(harmonie!.attributes('aria-pressed')).toBe('true')
      expect(harmonie!.attributes('style')).toContain('background-color: rgb(255, 0, 0)')
      expect(observado!.attributes('aria-pressed')).toBe('false')
    })

    it('aplica la posición y el offset en píxeles', () => {
      const wrapper = mountToggle({ position: 'bottom-right', offset: 12 })
      expect(wrapper.classes()).toContain('as-button-toggle--bottom-right')
      expect(wrapper.attributes('style')).toContain('bottom: 12px')
      expect(wrapper.attributes('style')).toContain('right: 12px')
    })
  })

  describe('v-model', () => {
    it('emite update:modelValue con el value del botón pulsado', async () => {
      const wrapper = mountToggle({ modelValue: 'observado' })
      await wrapper.findAll('button')[1]!.trigger('click')
      expect(wrapper.emitted('update:modelValue')).toEqual([['harmonie']])
    })

    it('refleja el nuevo valor cuando el padre lo devuelve como prop', async () => {
      const wrapper = mountWithVModel('observado')
      await wrapper.findAll('button')[1]!.trigger('click')
      expect(wrapper.props('modelValue')).toBe('harmonie')
      expect(activeLabel(wrapper)).toBe('Harmonie')
    })

    it('no emite nada al pulsar el botón ya activo', async () => {
      const wrapper = mountToggle({ modelValue: 'observado' })
      await wrapper.findAll('button')[0]!.trigger('click')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })
  })

  describe('opción disabled', () => {
    it('deshabilita el botón y no emite al pulsarlo', async () => {
      const wrapper = mountToggle({ modelValue: 'observado' })
      const eps = wrapper.findAll('button')[2]!
      expect(eps.attributes('disabled')).toBeDefined()
      await eps.trigger('click')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })
  })

  describe('selección obligatoria', () => {
    it('sin modelValue, activa la primera opción', () => {
      expect(activeLabel(mountToggle())).toBe('Observado')
    })

    it('con un modelValue que no coincide con ninguna opción, activa la primera', () => {
      expect(activeLabel(mountToggle({ modelValue: 'no-existe' }))).toBe('Observado')
    })

    it('siempre hay exactamente un botón activo', () => {
      expect(mountToggle({ modelValue: 'harmonie' }).findAll('[aria-pressed="true"]')).toHaveLength(
        1,
      )
    })
  })

  describe('tema', () => {
    it('sin prop ni provideTheme usa el tema oscuro', () => {
      expect(mountToggle().classes()).toContain('as-button-toggle--dark')
    })

    it('hereda el tema de provideTheme y la prop theme tiene prioridad', () => {
      const withTheme = (props: Partial<ButtonToggleProps>) =>
        mount(
          defineComponent({
            setup() {
              provideTheme('light')
              return () => h(ASMapButtonToggle, { options, ...props })
            },
          }),
        )
      expect(withTheme({}).find('.as-button-toggle').classes()).toContain('as-button-toggle--light')
      expect(withTheme({ theme: 'dark' }).find('.as-button-toggle').classes()).toContain(
        'as-button-toggle--dark',
      )
    })
  })
})
