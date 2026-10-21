import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { AppSection } from '@/layout/types/AppShellProps'
import ASAppBottomSheet from './ASAppBottomSheet.vue'
import ASAppDetailPanel from './ASAppDetailPanel.vue'
import ASAppDrawer from './ASAppDrawer.vue'
import ASAppMobileMenu from './ASAppMobileMenu.vue'

describe('ASAppDrawer', () => {
  it('abierto: su ancho y el contenido; cerrado, ancho 0 e inerte sin perder el contenido', async () => {
    const wrapper = mount(ASAppDrawer, {
      props: { open: true, width: 300, label: 'Capas', id: 'panel' },
      slots: { default: '<p class="contenido">Capas</p>' },
    })
    expect(wrapper.classes()).toContain('as-app-drawer--open')
    expect(wrapper.attributes('style')).toContain('--as-app-drawer-width: 300px')
    const panel = wrapper.find('aside')
    expect(panel.attributes()).toMatchObject({ id: 'panel', 'aria-label': 'Capas' })
    expect(panel.attributes('inert')).toBeUndefined()
    await wrapper.setProps({ open: false })
    expect(wrapper.classes()).not.toContain('as-app-drawer--open')
    expect(panel.attributes('inert')).toBeDefined()
    expect(wrapper.find('.contenido').exists()).toBe(true)
  })
})

describe('ASAppDetailPanel', () => {
  it('se coloca desde offset y cierra con su botón', async () => {
    const wrapper = mount(ASAppDetailPanel, {
      props: { open: true, offset: 376 },
      slots: { default: '<p>Ficha</p>' },
    })
    expect(wrapper.attributes('style')).toContain('left: 376px')
    expect(wrapper.attributes('aria-label')).toBe('Detalle')
    const close = wrapper.find('button')
    expect(close.attributes('aria-label')).toBe('Cerrar detalle')
    await close.trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('sin botón de cerrar, con otros textos; cerrado, inerte', () => {
    const wrapper = mount(ASAppDetailPanel, {
      props: { open: false, closeButton: false, label: 'Ficha de la estación' },
    })
    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.attributes('aria-label')).toBe('Ficha de la estación')
    expect(wrapper.attributes('inert')).toBeDefined()
  })
})

describe('ASAppBottomSheet', () => {
  it('el asa amplía y reduce, y emite update:expanded aunque no se enlace', async () => {
    const wrapper = mount(ASAppBottomSheet, { props: { open: true, label: 'Capas' } })
    const handle = wrapper.find('button')
    expect(handle.attributes()).toMatchObject({
      'aria-label': 'Ampliar panel',
      'aria-expanded': 'false',
    })
    await handle.trigger('click')
    expect(wrapper.classes()).toContain('as-app-bottom-sheet--expanded')
    expect(handle.attributes('aria-label')).toBe('Reducir panel')
    expect(wrapper.emitted('update:expanded')).toEqual([[true]])
  })

  it('al cerrarse vuelve a su altura; expanded controlado manda', async () => {
    const wrapper = mount(ASAppBottomSheet, {
      props: { open: true, expanded: true, height: '50%' },
    })
    expect(wrapper.attributes('style')).toContain('--as-app-bottom-sheet-height: 50%')
    expect(wrapper.classes()).toContain('as-app-bottom-sheet--expanded')
    await wrapper.setProps({ open: false })
    expect(wrapper.classes()).not.toContain('as-app-bottom-sheet--expanded')
    expect(wrapper.emitted('update:expanded')).toEqual([[false]])
    expect(wrapper.attributes('inert')).toBeDefined()
  })
})

describe('ASAppMobileMenu', () => {
  const sections: AppSection[] = [
    { id: 'capas', label: 'Capas', icon: 'M0 0' },
    { id: 'oculta', label: 'Oculta', icon: 'M0 0', hidden: true },
    { id: 'avisos', label: 'Avisos', icon: 'M0 0' },
  ]

  it('lista las secciones visibles y marca la abierta', () => {
    const wrapper = mount(ASAppMobileMenu, {
      props: { open: true, sections, activeSection: 'avisos', id: 'menu' },
    })
    const items = wrapper.findAll('.as-app-mobile-menu__item')
    expect(items.map((item) => item.text())).toEqual(['Capas', 'Avisos'])
    expect(items.map((item) => item.attributes('aria-pressed'))).toEqual(['false', 'true'])
    expect(wrapper.find('nav').attributes()).toMatchObject({
      id: 'menu',
      'aria-label': 'Secciones',
    })
  })

  it('elegir emite select; tocar fuera emite update:open false', async () => {
    const wrapper = mount(ASAppMobileMenu, { props: { open: true, sections } })
    await wrapper.findAll('.as-app-mobile-menu__item')[0]!.trigger('click')
    expect(wrapper.emitted('select')).toEqual([['capas']])
    await wrapper.find('.as-app-mobile-menu__backdrop').trigger('click')
    expect(wrapper.emitted('update:open')).toEqual([[false]])
  })

  it('cerrado: sin fondo e inerte', () => {
    const wrapper = mount(ASAppMobileMenu, { props: { open: false, sections } })
    expect(wrapper.find('.as-app-mobile-menu__backdrop').exists()).toBe(false)
    expect(wrapper.find('nav').attributes('inert')).toBeDefined()
  })
})
