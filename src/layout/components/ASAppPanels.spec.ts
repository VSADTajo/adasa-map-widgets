import { afterEach, describe, expect, it } from 'vitest'
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

  it("empuja por defecto; con mode 'overlay', tapa el contenido", async () => {
    const wrapper = mount(ASAppDrawer, { props: { open: true } })
    expect(wrapper.classes()).toContain('as-app-drawer--push')
    await wrapper.setProps({ mode: 'overlay' })
    expect(wrapper.classes()).toContain('as-app-drawer--overlay')
    expect(wrapper.classes()).not.toContain('as-app-drawer--push')
    await wrapper.setProps({ open: false })
    expect(wrapper.find('aside').attributes('inert')).toBeDefined()
  })
})

describe('ASAppDetailPanel', () => {
  it('se coloca desde offset y cierra con su botón', async () => {
    const wrapper = mount(ASAppDetailPanel, {
      props: { open: true, offset: 376 },
      slots: { default: '<p>Ficha</p>' },
    })
    expect(wrapper.attributes('style')).toContain('--as-app-detail-offset: 376px')
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

  describe('ancho', () => {
    /** Contenedor de 1000 px (jsdom no mide): el panel queda dentro, desde `offset`. */
    function mountSized(props: Record<string, unknown> = {}) {
      const wrapper = mount(ASAppDetailPanel, {
        props: { open: true, offset: 100, ...props },
        attachTo: document.body,
      })
      const container = wrapper.element.parentElement!
      Object.defineProperty(container, 'clientWidth', { value: 1000 })
      container.getBoundingClientRect = () => ({ left: 0, right: 1000 }) as DOMRect
      return wrapper
    }
    afterEach(() => {
      document.body.innerHTML = ''
    })

    it('sin width ocupa todo desde offset; con width, se pega a la derecha', async () => {
      const wrapper = mountSized()
      expect(wrapper.classes()).not.toContain('as-app-detail-panel--sized')
      expect(wrapper.find('[role="separator"]').exists()).toBe(false)
      await wrapper.setProps({ width: 480 })
      expect(wrapper.classes()).toContain('as-app-detail-panel--sized')
      expect(wrapper.attributes('style')).toContain('--as-app-detail-width: 480px')
    })

    it('arrastrar el asa cambia el ancho, entre minWidth y lo disponible', async () => {
      const wrapper = mountSized({ resizable: true })
      const resizer = wrapper.find('[role="separator"]')
      expect(resizer.attributes()).toMatchObject({
        'aria-orientation': 'vertical',
        'aria-label': 'Cambiar el ancho del detalle',
        tabindex: '0',
      })
      await resizer.trigger('pointerdown', { button: 0 })
      expect(wrapper.classes()).toContain('as-app-detail-panel--resizing')
      await resizer.trigger('pointermove', { clientX: 400 })
      await resizer.trigger('pointermove', { clientX: 900 })
      await resizer.trigger('pointermove', { clientX: 0 })
      await resizer.trigger('pointerup')
      // 1000 − 400; el mínimo (320); lo disponible desde offset (900).
      expect(wrapper.emitted('update:width')).toEqual([[600], [320], [900]])
      expect(wrapper.classes()).not.toContain('as-app-detail-panel--resizing')
      // Sin v-model también funciona: el ancho se queda en el panel.
      expect(wrapper.attributes('style')).toContain('--as-app-detail-width: 900px')
      await resizer.trigger('pointermove', { clientX: 500 })
      expect(wrapper.emitted('update:width')).toHaveLength(3)
    })

    it('flechas (con Mayús, más), Fin al mínimo; Inicio y doble clic lo ocupan todo', async () => {
      const wrapper = mountSized({ resizable: true, width: 500 })
      const resizer = wrapper.find('[role="separator"]')
      await resizer.trigger('keydown', { key: 'ArrowLeft' })
      await resizer.trigger('keydown', { key: 'ArrowRight', shiftKey: true })
      await resizer.trigger('keydown', { key: 'End' })
      await resizer.trigger('keydown', { key: 'Home' })
      await wrapper.setProps({ width: 600 })
      await resizer.trigger('dblclick')
      expect(wrapper.emitted('update:width')).toEqual([
        [516],
        [452],
        [320],
        [undefined],
        [undefined],
      ])
      expect(wrapper.classes()).not.toContain('as-app-detail-panel--sized')
    })
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

  it('las secciones de abajo van al final; contador y motivo de las deshabilitadas', async () => {
    const wrapper = mount(ASAppMobileMenu, {
      props: {
        open: true,
        sections: [
          { id: 'ajustes', label: 'Ajustes', icon: 'M0 0', position: 'bottom' },
          { id: 'avisos', label: 'Avisos', icon: 'M0 0', badge: 2 },
          {
            id: 'sim',
            label: 'Simulaciones',
            icon: 'M0 0',
            disabled: true,
            disabledReason: 'Sin permisos',
          },
        ] satisfies AppSection[],
      },
    })
    const items = wrapper.findAll('.as-app-mobile-menu__item')
    expect(items.map((item) => item.find('.as-app-mobile-menu__text').text())).toEqual([
      'Avisos',
      'Simulaciones Sin permisos',
      'Ajustes',
    ])
    expect(items[0]!.find('.as-app-mobile-menu__badge').text()).toBe('2')
    expect(items[0]!.attributes('aria-label')).toBe('Avisos (2)')
    expect(items[1]!.attributes('aria-disabled')).toBe('true')
    await items[1]!.trigger('click')
    expect(wrapper.emitted('select')).toBeUndefined()
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
