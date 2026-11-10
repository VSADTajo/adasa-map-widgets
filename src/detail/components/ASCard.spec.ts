import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { provideTheme } from '@/core/composables/useTheme'
import ASCard from './ASCard.vue'
import ASDetailHeader from './ASDetailHeader.vue'
import ASStatusBadge from './ASStatusBadge.vue'

describe('ASCard', () => {
  it('una section con el título como nombre accesible, acciones y contenido', () => {
    const wrapper = mount(ASCard, {
      props: { title: 'Resumen de datos observados' },
      slots: { default: '<p class="contenido">Hola</p>', actions: '<button>Descargar</button>' },
    })
    const heading = wrapper.find('h3')
    expect(heading.text().replace(/\s+/g, ' ')).toBe('Resumen de datos observados')
    expect(heading.attributes('title')).toBe('Resumen de datos observados')
    expect(wrapper.attributes('aria-labelledby')).toBe(heading.attributes('id'))
    expect(wrapper.find('.as-card__actions button').text().replace(/\s+/g, ' ')).toBe('Descargar')
    expect(wrapper.find('.contenido').exists()).toBe(true)
  })

  it('headingLevel cambia el nivel del título', () => {
    const wrapper = mount(ASCard, { props: { title: 'X', headingLevel: 4 } })
    expect(wrapper.find('h4').exists()).toBe(true)
  })

  it('cargando: esqueleto con sus líneas, aria-busy y sin contenido', () => {
    const wrapper = mount(ASCard, {
      props: { title: 'X', loading: true, skeletonLines: 2 },
      slots: { default: '<p class="contenido" />' },
    })
    expect(wrapper.attributes('aria-busy')).toBe('true')
    expect(wrapper.findAll('.as-card__skeleton-line')).toHaveLength(2)
    expect(wrapper.find('.as-card__skeleton').text().replace(/\s+/g, ' ')).toBe('Cargando…')
    expect(wrapper.find('.contenido').exists()).toBe(false)
  })

  it('vacía: el texto por defecto, el propio o el slot', async () => {
    const wrapper = mount(ASCard, { props: { empty: true } })
    expect(wrapper.find('.as-card__empty').text().replace(/\s+/g, ' ')).toBe('Sin datos')
    await wrapper.setProps({ emptyText: 'No hay datos observados' })
    expect(wrapper.find('.as-card__empty').text().replace(/\s+/g, ' ')).toBe(
      'No hay datos observados',
    )
    // Sin título ni acciones no hay cabecera.
    expect(wrapper.find('header').exists()).toBe(false)
  })

  it('hereda el tema de provideTheme y la prop manda', () => {
    const inherited = mount(
      defineComponent({
        setup() {
          provideTheme('dark')
          return () => h(ASCard, { title: 'X' })
        },
      }),
    )
    expect(inherited.classes()).toContain('as-card--dark')
    expect(mount(ASCard, { props: { theme: 'light' } }).classes()).toContain('as-card--light')
    expect(
      mount(ASCard)
        .classes()
        .some((c) => /--(dark|light)$/.test(c)),
    ).toBe(false)
  })
})

describe('ASStatusBadge', () => {
  it.each([
    ['normal', 'Normal'],
    ['amarillo', 'Amarillo'],
    ['naranja', 'Naranja'],
    ['rojo', 'Rojo'],
  ] as const)('%s se muestra como "%s" con su color', (level, text) => {
    const wrapper = mount(ASStatusBadge, { props: { level } })
    expect(wrapper.text().replace(/\s+/g, ' ')).toBe(text)
    expect(wrapper.classes()).toContain(`as-status-badge--${level}`)
  })

  it('con otro texto, el nivel va oculto para los lectores de pantalla', () => {
    const wrapper = mount(ASStatusBadge, { props: { level: 'naranja', label: '75 m³/s' } })
    expect(wrapper.text().replace(/\s+/g, ' ')).toBe('75 m³/s (nivel naranja)')
    expect(wrapper.find('.as-status-badge__sr-only').exists()).toBe(true)
  })
})

describe('ASDetailHeader', () => {
  it('título, subtítulo, etiquetas y botón de cerrar', async () => {
    const wrapper = mount(ASDetailHeader, {
      props: {
        title: '3E01',
        subtitle: 'Tajo en Aranjuez',
        tags: [{ label: 'Aforo', icon: 'M0 0' }, { label: 'Madrid' }],
      },
      slots: { default: '<span class="centro">Fuente</span>' },
    })
    expect(wrapper.find('h2').text().replace(/\s+/g, ' ')).toBe('3E01')
    expect(wrapper.find('.as-detail-header__subtitle').text().replace(/\s+/g, ' ')).toBe(
      'Tajo en Aranjuez',
    )
    expect(
      wrapper.findAll('.as-detail-header__tag').map((t) => t.text().replace(/\s+/g, ' ')),
    ).toEqual(['Aforo', 'Madrid'])
    expect(wrapper.find('.centro').exists()).toBe(true)
    expect(wrapper.classes()).toContain('as-detail-header--sticky')
    const close = wrapper.find('button[aria-label="Cerrar"]')
    await close.trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('cargando: "Cargando…" sin subtítulo ni etiquetas; sin botón si no es closable', () => {
    const wrapper = mount(ASDetailHeader, {
      props: {
        title: '3E01',
        subtitle: 'X',
        tags: [{ label: 'Aforo' }],
        loading: true,
        closable: false,
        sticky: false,
      },
    })
    expect(wrapper.find('h2').text().replace(/\s+/g, ' ')).toBe('Cargando…')
    expect(wrapper.find('.as-detail-header__subtitle').exists()).toBe(false)
    expect(wrapper.find('.as-detail-header__tags').exists()).toBe(false)
    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.classes()).not.toContain('as-detail-header--sticky')
  })
})
