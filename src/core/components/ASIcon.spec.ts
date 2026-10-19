import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ASIcon from './ASIcon.vue'

describe('ASIcon', () => {
  it('pinta el trazado en una caja de 24 × 24 con el color del texto', () => {
    const wrapper = mount(ASIcon, { props: { path: 'M1 1L2 2' } })
    expect(wrapper.attributes('viewBox')).toBe('0 0 24 24')
    expect(wrapper.attributes('width')).toBe('24px')
    expect(wrapper.find('path').attributes()).toMatchObject({ d: 'M1 1L2 2', fill: 'currentColor' })
  })

  it('size: un número son píxeles y un string se usa tal cual', async () => {
    const wrapper = mount(ASIcon, { props: { path: 'M0 0', size: 18 } })
    expect(wrapper.attributes('height')).toBe('18px')
    await wrapper.setProps({ size: '1em' })
    expect(wrapper.attributes('height')).toBe('1em')
  })

  it('sin label es decorativo; con label se anuncia como imagen', async () => {
    const wrapper = mount(ASIcon, { props: { path: 'M0 0' } })
    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.attributes('role')).toBeUndefined()
    await wrapper.setProps({ label: 'Aviso' })
    expect(wrapper.attributes('aria-hidden')).toBeUndefined()
    expect(wrapper.attributes()).toMatchObject({ role: 'img', 'aria-label': 'Aviso' })
  })
})
