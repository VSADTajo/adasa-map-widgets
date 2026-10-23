import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ASCollapsible from './ASCollapsible.vue'

describe('ASCollapsible', () => {
  it('cabecera: botón con aria-expanded y aria-controls dentro de un h3', () => {
    const wrapper = mount(ASCollapsible, {
      props: { title: 'Estaciones' },
      slots: { default: '<p class="contenido">Lista</p>' },
    })
    const button = wrapper.find('h3 > button')
    expect(button.text()).toContain('Estaciones')
    expect(button.attributes('aria-expanded')).toBe('true')
    const panel = wrapper.find(`#${button.attributes('aria-controls')}`)
    expect(panel.find('.contenido').exists()).toBe(true)
    expect(panel.attributes('inert')).toBeUndefined()
  })

  it('sin v-model: se pliega con su propio estado, sigue montado e inerte, y emite', async () => {
    const wrapper = mount(ASCollapsible, {
      props: { title: 'Estaciones' },
      slots: { default: '<p class="contenido">Lista</p>' },
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('button').attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('.as-collapsible__panel').attributes('inert')).toBeDefined()
    expect(wrapper.find('.contenido').exists()).toBe(true)
    expect(wrapper.emitted('update:open')).toEqual([[false]])
  })

  it('defaultOpen false empieza cerrada', () => {
    const wrapper = mount(ASCollapsible, { props: { title: 'X', defaultOpen: false } })
    expect(wrapper.find('button').attributes('aria-expanded')).toBe('false')
  })

  it('con v-model:open manda la prop: si el padre no la cambia, sigue igual', async () => {
    const wrapper = mount(ASCollapsible, { props: { title: 'X', open: true } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('update:open')).toEqual([[false]])
    expect(wrapper.find('button').attributes('aria-expanded')).toBe('true')
    await wrapper.setProps({ open: false })
    expect(wrapper.find('button').attributes('aria-expanded')).toBe('false')
  })

  it('contador (0 no se ve), nivel del encabezado, slot de acciones y deshabilitada', async () => {
    const wrapper = mount(ASCollapsible, {
      props: { title: 'Capas', badge: 3, headingLevel: 2, disabled: true },
      slots: { actions: '<button class="accion">Todo</button>' },
    })
    expect(wrapper.find('h2 .as-collapsible__badge').text()).toBe('3')
    expect(wrapper.find('.accion').exists()).toBe(true)
    await wrapper.find('h2 button').trigger('click')
    expect(wrapper.emitted('update:open')).toBeUndefined()
    await wrapper.setProps({ badge: 0 })
    expect(wrapper.find('.as-collapsible__badge').exists()).toBe(false)
  })
})
