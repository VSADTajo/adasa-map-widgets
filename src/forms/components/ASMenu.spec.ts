import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import type { MenuEntry, MenuItem } from '@/forms/types/MenuProps'
import ASMenu from './ASMenu.vue'

const items: MenuEntry[] = [
  { id: 'png', label: 'Imagen PNG' },
  { id: 'svg', label: 'Imagen SVG', disabled: true },
  { type: 'separator', id: 'sep' },
  { id: 'csv', label: 'Datos CSV' },
]

function mountMenu(props: Record<string, unknown> = {}) {
  return mount(ASMenu, {
    props: { label: 'Descargar', items, ...props },
    attachTo: document.body,
  })
}

const trigger = (wrapper: ReturnType<typeof mountMenu>) => wrapper.find('button')
const focused = () => document.activeElement?.textContent?.trim()

afterEach(() => {
  document.body.innerHTML = ''
})

describe('ASMenu', () => {
  it('botón con aria-haspopup y un menú cerrado con su nombre', () => {
    const wrapper = mountMenu()
    expect(trigger(wrapper).attributes()).toMatchObject({
      'aria-haspopup': 'menu',
      'aria-expanded': 'false',
    })
    const menu = wrapper.find('[role="menu"]')
    expect(menu.attributes('aria-label')).toBe('Descargar')
    expect(trigger(wrapper).attributes('aria-controls')).toBe(menu.attributes('id'))
    expect(menu.isVisible()).toBe(false)
    expect(wrapper.findAll('[role="menuitem"]')).toHaveLength(3)
    expect(wrapper.find('[role="separator"]').exists()).toBe(true)
  })

  it('solo icono: label como nombre accesible y tooltip; badge visible', () => {
    const wrapper = mountMenu({ icon: 'M0 0', iconOnly: true, badge: 3 })
    expect(trigger(wrapper).attributes()).toMatchObject({
      'aria-label': 'Descargar',
      title: 'Descargar',
    })
    expect(trigger(wrapper).text()).toBe('3')
  })

  describe('teclado', () => {
    it('↓ abre con el foco en la primera; ↓/↑ saltan las deshabilitadas y dan la vuelta', async () => {
      const wrapper = mountMenu()
      await trigger(wrapper).trigger('keydown', { key: 'ArrowDown' })
      await nextTick()
      expect(trigger(wrapper).attributes('aria-expanded')).toBe('true')
      expect(wrapper.emitted('open')).toHaveLength(1)
      expect(focused()).toBe('Imagen PNG')
      const menu = wrapper.find('[role="menu"]')
      await menu.trigger('keydown', { key: 'ArrowDown' })
      await nextTick()
      expect(focused()).toBe('Datos CSV')
      await menu.trigger('keydown', { key: 'ArrowDown' })
      await nextTick()
      expect(focused()).toBe('Imagen PNG')
      await menu.trigger('keydown', { key: 'End' })
      await nextTick()
      expect(focused()).toBe('Datos CSV')
    })

    it('↑ abre con el foco en la última; una letra salta a la opción', async () => {
      const wrapper = mountMenu()
      await trigger(wrapper).trigger('keydown', { key: 'ArrowUp' })
      await nextTick()
      expect(focused()).toBe('Datos CSV')
      await wrapper.find('[role="menu"]').trigger('keydown', { key: 'i' })
      await nextTick()
      expect(focused()).toBe('Imagen PNG')
    })

    it('Intro elige, cierra y devuelve el foco al botón', async () => {
      const wrapper = mountMenu()
      await trigger(wrapper).trigger('keydown', { key: 'ArrowDown' })
      await nextTick()
      await wrapper.find('[role="menu"]').trigger('keydown', { key: 'Enter' })
      await nextTick()
      expect(wrapper.emitted('select')).toEqual([[items[0]]])
      expect(trigger(wrapper).attributes('aria-expanded')).toBe('false')
      expect(document.activeElement).toBe(trigger(wrapper).element)
    })

    it('Escape cierra sin propagarse y devuelve el foco', async () => {
      const wrapper = mountMenu()
      const outer = vi.fn()
      document.body.addEventListener('keydown', (event) => event.key === 'Escape' && outer())
      await trigger(wrapper).trigger('click')
      await wrapper.find('[role="menu"]').trigger('keydown', { key: 'Escape' })
      await nextTick()
      expect(trigger(wrapper).attributes('aria-expanded')).toBe('false')
      expect(outer).not.toHaveBeenCalled()
      expect(wrapper.emitted('close')).toHaveLength(1)
      expect(document.activeElement).toBe(trigger(wrapper).element)
    })
  })

  it('una opción deshabilitada no se elige', async () => {
    const wrapper = mountMenu()
    await trigger(wrapper).trigger('click')
    await wrapper.findAll('[role="menuitem"]')[1]!.trigger('click')
    expect(wrapper.emitted('select')).toBeUndefined()
    expect(wrapper.findAll('[role="menuitem"]')[1]!.attributes('aria-disabled')).toBe('true')
  })

  it('casillas: marcan con aria-checked y el menú sigue abierto; radios: cierran', async () => {
    const checkboxes: MenuEntry[] = [
      { id: 'wrf', label: 'WRF', type: 'checkbox', checked: true },
      { id: 'ecmwf', label: 'ECMWF', type: 'checkbox', checked: false },
      { type: 'separator', id: 's' },
      { id: 'p-wrf', label: 'Lluvia WRF', type: 'radio', checked: true },
    ]
    const wrapper = mountMenu({ items: checkboxes })
    await trigger(wrapper).trigger('click')
    const boxes = wrapper.findAll('[role="menuitemcheckbox"]')
    expect(boxes.map((b) => b.attributes('aria-checked'))).toEqual(['true', 'false'])
    await boxes[1]!.trigger('click')
    expect((wrapper.emitted('select')![0]![0] as MenuItem).id).toBe('ecmwf')
    expect(trigger(wrapper).attributes('aria-expanded')).toBe('true')
    const radio = wrapper.find('[role="menuitemradio"]')
    expect(radio.attributes('aria-checked')).toBe('true')
    await radio.trigger('click')
    expect(trigger(wrapper).attributes('aria-expanded')).toBe('false')
  })

  it('deshabilitado: no abre y explica por qué', async () => {
    const wrapper = mountMenu({ disabled: true, disabledReason: 'Sin percentiles' })
    expect(wrapper.attributes('title')).toBe('Sin percentiles')
    await trigger(wrapper).trigger('click')
    await trigger(wrapper).trigger('keydown', { key: 'ArrowDown' })
    expect(wrapper.emitted('open')).toBeUndefined()
  })

  it('clic fuera cierra', async () => {
    const wrapper = mountMenu()
    await trigger(wrapper).trigger('click')
    document.body.click()
    await nextTick()
    expect(trigger(wrapper).attributes('aria-expanded')).toBe('false')
  })
})
