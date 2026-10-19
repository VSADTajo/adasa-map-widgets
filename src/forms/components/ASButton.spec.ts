import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { provideTheme } from '@/core/composables/useTheme'
import ASButton from './ASButton.vue'
import ASIconButton from './ASIconButton.vue'

describe('ASButton', () => {
  describe('render', () => {
    it('es un <button type="button"> secundario y mediano por defecto', () => {
      const wrapper = mount(ASButton, { slots: { default: 'Guardar' } })
      expect(wrapper.element.tagName).toBe('BUTTON')
      expect(wrapper.attributes('type')).toBe('button')
      expect(wrapper.classes()).toEqual(
        expect.arrayContaining(['as-button--secondary', 'as-button--md']),
      )
      expect(wrapper.text()).toBe('Guardar')
    })

    it('aplica variante, tamaño, tipo y ancho completo', () => {
      const wrapper = mount(ASButton, {
        props: { variant: 'danger', size: 'lg', type: 'submit', block: true },
        slots: { default: 'Borrar' },
      })
      expect(wrapper.classes()).toEqual(
        expect.arrayContaining(['as-button--danger', 'as-button--lg', 'as-button--block']),
      )
      expect(wrapper.attributes('type')).toBe('submit')
    })

    it('pinta el icono al principio o al final del texto', async () => {
      const wrapper = mount(ASButton, {
        props: { icon: 'M1 1' },
        slots: { default: 'Filtrar' },
      })
      const content = () => wrapper.find('.as-button__content').element.children
      expect(content()[0]!.tagName).toBe('svg')
      await wrapper.setProps({ iconPosition: 'end' })
      expect(content()[1]!.tagName).toBe('svg')
    })

    it('sin texto y con icono es cuadrado', () => {
      const wrapper = mount(ASButton, { props: { icon: 'M1 1' } })
      expect(wrapper.classes()).toContain('as-button--icon-only')
    })
  })

  describe('click', () => {
    it('emite click al pulsarlo', async () => {
      const wrapper = mount(ASButton, { slots: { default: 'Ok' } })
      await wrapper.trigger('click')
      expect(wrapper.emitted('click')).toHaveLength(1)
    })

    it('deshabilitado: atributo disabled y no emite', async () => {
      const wrapper = mount(ASButton, { props: { disabled: true }, slots: { default: 'Ok' } })
      expect(wrapper.attributes('disabled')).toBeDefined()
      await wrapper.trigger('click')
      expect(wrapper.emitted('click')).toBeUndefined()
    })

    it('cargando: sigue enfocable, anuncia aria-busy y el texto de carga, y no emite', async () => {
      const wrapper = mount(ASButton, { props: { loading: true }, slots: { default: 'Guardar' } })
      expect(wrapper.attributes('disabled')).toBeUndefined()
      expect(wrapper.attributes('aria-busy')).toBe('true')
      expect(wrapper.attributes('aria-disabled')).toBe('true')
      expect(wrapper.find('.as-button__spinner').text()).toBe('Cargando…')
      // El texto se mantiene (oculto) para que el botón no cambie de ancho.
      expect(wrapper.find('.as-button__label').text()).toBe('Guardar')
      await wrapper.trigger('click')
      expect(wrapper.emitted('click')).toBeUndefined()
    })
  })

  describe('tema', () => {
    it('sin prop ni provideTheme no fuerza tema; hereda provideTheme y la prop manda', () => {
      expect(
        mount(ASButton)
          .classes()
          .some((c) => /--(dark|light)$/.test(c)),
      ).toBe(false)
      const inherited = mount(
        defineComponent({
          setup() {
            provideTheme('dark')
            return () => h(ASButton)
          },
        }),
      )
      expect(inherited.classes()).toContain('as-button--dark')
      expect(mount(ASButton, { props: { theme: 'light' } }).classes()).toContain('as-button--light')
    })
  })
})

describe('ASIconButton', () => {
  it('su label es el nombre accesible y el tooltip; ghost por defecto', () => {
    const wrapper = mount(ASIconButton, { props: { icon: 'M1 1', label: 'Cerrar' } })
    expect(wrapper.attributes()).toMatchObject({ 'aria-label': 'Cerrar', title: 'Cerrar' })
    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(['as-button--ghost', 'as-button--icon-only']),
    )
    expect(wrapper.attributes('aria-pressed')).toBeUndefined()
  })

  it('emite click; sin pressed no emite update:pressed', async () => {
    const wrapper = mount(ASIconButton, { props: { icon: 'M1 1', label: 'Cerrar' } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
    expect(wrapper.emitted('update:pressed')).toBeUndefined()
  })

  it('con pressed es un interruptor: aria-pressed y v-model:pressed', async () => {
    const wrapper = mount(ASIconButton, {
      props: {
        icon: 'M1 1',
        label: 'Filtros',
        pressed: false,
        'onUpdate:pressed': (value: boolean) => wrapper.setProps({ pressed: value }),
      },
    })
    expect(wrapper.attributes('aria-pressed')).toBe('false')
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:pressed')).toEqual([[true]])
    expect(wrapper.attributes('aria-pressed')).toBe('true')
    expect(wrapper.classes()).toContain('as-icon-button--pressed')
  })

  it('el slot icon sustituye al trazado (p. ej. un SVG de trazo propio)', () => {
    const wrapper = mount(ASIconButton, {
      props: { label: 'Siguiente' },
      slots: { icon: '<svg class="mi-icono" />' },
    })
    expect(wrapper.find('.mi-icono').exists()).toBe(true)
    expect(wrapper.findAll('svg')).toHaveLength(1)
    expect(wrapper.classes()).toContain('as-button--icon-only')
  })

  it('deshabilitado no emite nada', async () => {
    const wrapper = mount(ASIconButton, {
      props: { icon: 'M1 1', label: 'Filtros', pressed: false, disabled: true },
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
    expect(wrapper.emitted('update:pressed')).toBeUndefined()
  })
})
