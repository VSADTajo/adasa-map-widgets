import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { provideLocale } from '@/core/composables/useLocale'
import type { AppSection } from '@/layout/types/AppShellProps'
import ASAppRail from './ASAppRail.vue'
import ASAppPanelHeader from './ASAppPanelHeader.vue'
import ASAppTopBar from './ASAppTopBar.vue'

const sections: AppSection[] = [
  { id: 'capas', label: 'Capas', icon: 'M1 1' },
  { id: 'mapasbase', label: 'Mapas base', icon: 'M2 2', position: 'bottom' },
  { id: 'admin', label: 'Admin', icon: 'M3 3', hidden: true },
]

describe('ASAppRail', () => {
  it('dos grupos (arriba y abajo), sin las secciones ocultas, con su icono y su nombre', () => {
    const wrapper = mount(ASAppRail, { props: { sections } })
    const groups = wrapper.findAll('.as-app-rail__group')
    expect(
      groups.map((group) => group.findAll('button').map((b) => b.attributes('aria-label'))),
    ).toEqual([['Capas'], ['Mapas base']])
    expect(groups[1]!.classes()).toContain('as-app-rail__group--bottom')
    expect(wrapper.find('button').attributes('title')).toBe('Capas')
    expect(wrapper.find('path').attributes('d')).toBe('M1 1')
    expect(wrapper.attributes('style')).toContain('width: 56px')
  })

  it('emite toggle con la sección y marca la activa con aria-pressed', async () => {
    const wrapper = mount(ASAppRail, {
      props: { sections, activeSection: 'mapasbase', controls: 'panel' },
    })
    const [capas, mapas] = wrapper.findAll('button')
    expect(capas!.attributes('aria-pressed')).toBe('false')
    expect(mapas!.attributes('aria-pressed')).toBe('true')
    expect(mapas!.classes()).toContain('as-app-rail__item--active')
    expect(mapas!.attributes('aria-controls')).toBe('panel')
    await capas!.trigger('click')
    expect(wrapper.emitted('toggle')).toEqual([['capas']])
  })

  it('su nombre accesible sigue el idioma', () => {
    const wrapper = mount(
      defineComponent({
        setup() {
          provideLocale('en')
          return () => h(ASAppRail, { sections })
        },
      }),
    )
    expect(wrapper.find('nav').attributes('aria-label')).toBe('Sections')
  })
})

describe('ASAppPanelHeader', () => {
  it('título y botón de cerrar con flecha a la izquierda (escritorio)', async () => {
    const wrapper = mount(ASAppPanelHeader, { props: { title: 'Capas' } })
    expect(wrapper.find('h2').text()).toBe('Capas')
    const button = wrapper.find('button')
    expect(button.attributes('aria-label')).toBe('Cerrar panel')
    const leftArrow = wrapper.find('path').attributes('d')
    await button.trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    await wrapper.setProps({ direction: 'down' })
    expect(wrapper.find('path').attributes('d')).not.toBe(leftArrow)
  })

  it('closeLabel cambia el nombre del botón', () => {
    const wrapper = mount(ASAppPanelHeader, { props: { title: 'Capas', closeLabel: 'Volver' } })
    expect(wrapper.find('button').attributes('aria-label')).toBe('Volver')
  })
})

describe('ASAppTopBar', () => {
  it('coloca los slots y su alto; abajo, con su clase', () => {
    const wrapper = mount(ASAppTopBar, {
      props: { position: 'bottom', height: 56 },
      slots: { brand: 'Marca', search: 'Buscar', actions: 'Usuario', start: '☰' },
    })
    expect(wrapper.classes()).toContain('as-app-top-bar--bottom')
    expect(wrapper.attributes('style')).toContain('height: 56px')
    expect(wrapper.text()).toBe('☰MarcaBuscarUsuario')
  })

  it('sin slots, solo el marco', () => {
    const wrapper = mount(ASAppTopBar)
    expect(wrapper.find('.as-app-top-bar__brand').exists()).toBe(false)
    expect(wrapper.find('.as-app-top-bar__search').exists()).toBe(false)
  })
})
