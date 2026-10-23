import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { isSvgPath, provideIcons } from '@/core/composables/useIcons'
import type { IconResolver } from '@/core/types/icon'
import ASIcon from './ASIcon.vue'

/** Componente de icono de "otra librería": recibe width/height como Lucide o Iconify. */
const FakeIcon = defineComponent({
  props: { name: { type: String, default: 'x' } },
  setup: (props) => () => h('svg', { 'data-name': props.name }),
})

/** Monta ASIcon con un resolvedor de nombres registrado. */
function withResolver(resolve: IconResolver, props: Record<string, unknown>) {
  return mount(
    defineComponent({
      setup() {
        provideIcons(resolve)
        return () => h(ASIcon, props)
      },
    }),
  )
}

describe('ASIcon', () => {
  describe('trazado SVG', () => {
    it('pinta el trazado en una caja de 24 × 24 con el color del texto', () => {
      const wrapper = mount(ASIcon, { props: { icon: 'M1 1L2 2' } })
      expect(wrapper.attributes('viewBox')).toBe('0 0 24 24')
      expect(wrapper.attributes('width')).toBe('24px')
      expect(wrapper.find('path').attributes()).toMatchObject({
        d: 'M1 1L2 2',
        fill: 'currentColor',
      })
    })

    it('path (obsoleto) sigue funcionando', () => {
      const wrapper = mount(ASIcon, { props: { path: 'M0 0' } })
      expect(wrapper.find('path').attributes('d')).toBe('M0 0')
    })

    it('size: un número son píxeles y un string se usa tal cual', async () => {
      const wrapper = mount(ASIcon, { props: { icon: 'M0 0', size: 18 } })
      expect(wrapper.attributes('height')).toBe('18px')
      await wrapper.setProps({ size: '1em' })
      expect(wrapper.attributes('height')).toBe('1em')
    })

    it('sin label es decorativo; con label se anuncia como imagen', async () => {
      const wrapper = mount(ASIcon, { props: { icon: 'M0 0' } })
      expect(wrapper.attributes('aria-hidden')).toBe('true')
      await wrapper.setProps({ label: 'Aviso' })
      expect(wrapper.attributes('aria-hidden')).toBeUndefined()
      expect(wrapper.attributes()).toMatchObject({ role: 'img', 'aria-label': 'Aviso' })
    })
  })

  describe('componente de otra librería', () => {
    it('lo pinta con el tamaño y decorativo', () => {
      const wrapper = mount(ASIcon, { props: { icon: FakeIcon, size: 20 } })
      expect(wrapper.attributes()).toMatchObject({ width: '20px', 'aria-hidden': 'true' })
      expect(wrapper.classes()).toContain('as-icon')
    })

    it('con props ({ component, props }), como el Icon de Iconify', () => {
      const wrapper = mount(ASIcon, {
        props: { icon: { component: FakeIcon, props: { name: 'mdi:layers' } } },
      })
      expect(wrapper.attributes('data-name')).toBe('mdi:layers')
    })
  })

  describe('nombre (provideIcons)', () => {
    it('el resolvedor lo traduce a un trazado, un componente o las clases de una fuente', () => {
      const resolve: IconResolver = (name) =>
        name === 'mdi:layers'
          ? { path: 'M5 5' }
          : name === 'tabler:map'
            ? { component: FakeIcon, props: { name } }
            : name.startsWith('mdi-')
              ? { class: `mdi ${name}` }
              : undefined
      expect(withResolver(resolve, { icon: 'mdi:layers' }).find('path').attributes('d')).toBe(
        'M5 5',
      )
      expect(withResolver(resolve, { icon: 'tabler:map' }).attributes('data-name')).toBe(
        'tabler:map',
      )
      const font = withResolver(resolve, { icon: 'mdi-layers', size: 20 })
      expect(font.element.tagName).toBe('I')
      expect(font.classes()).toEqual(expect.arrayContaining(['mdi', 'mdi-layers', 'as-icon--font']))
      expect(font.attributes('style')).toContain('font-size: 20px')
    })

    it('sin resolver: un hueco del mismo tamaño y un aviso (una vez por nombre)', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const wrapper = mount(ASIcon, { props: { icon: 'no:existe', size: 16 } })
      mount(ASIcon, { props: { icon: 'no:existe' } })
      expect(wrapper.element.tagName).toBe('SPAN')
      expect(wrapper.attributes('style')).toContain('width: 16px')
      expect(warn).toHaveBeenCalledTimes(1)
      warn.mockRestore()
    })
  })
})

describe('isSvgPath', () => {
  it.each([
    ['M12,16L19.36,10.27', true],
    ['m 1 2', true],
    ['M0 0', true],
    ['mdi:layers', false],
    ['mdi-layers', false],
    ['Map', false],
  ])('%j → %s', (value, expected) => {
    expect(isSvgPath(value)).toBe(expected)
  })
})
