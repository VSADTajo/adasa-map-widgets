import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import type { AppLogo } from '@/layout/types/AppBrandProps'
import ASAppBrand from './ASAppBrand.vue'
import ASAppShell from './ASAppShell.vue'

const logos: AppLogo[] = [
  { src: '/chtajo.svg', alt: 'Confederación Hidrográfica del Tajo', href: '/' },
  { src: '/ministerio.svg', alt: 'Ministerio', hideOnMobile: true, height: 36 },
]

afterEach(() => vi.unstubAllGlobals())

describe('ASAppBrand', () => {
  it('logos con su texto alternativo, enlace opcional, nombre y subtítulo', () => {
    const wrapper = mount(ASAppBrand, {
      props: { logos, title: 'Visor SAIH', subtitle: 'Preproducción' },
    })
    const images = wrapper.findAll('img')
    expect(images.map((img) => img.attributes('alt'))).toEqual([
      'Confederación Hidrográfica del Tajo',
      'Ministerio',
    ])
    expect(images.map((img) => img.attributes('height'))).toEqual(['40', '36'])
    expect(wrapper.find('a').attributes('href')).toBe('/')
    expect(wrapper.find('a img').attributes('src')).toBe('/chtajo.svg')
    expect(wrapper.find('.as-app-brand__title').text()).toBe('Visor SAIH')
    expect(wrapper.find('.as-app-brand__subtitle').text()).toBe('Preproducción')
  })

  it('compact: logos más bajos, sin los hideOnMobile ni el subtítulo', () => {
    const wrapper = mount(ASAppBrand, {
      props: { logos, title: 'Visor', subtitle: 'Pre', compact: true },
    })
    expect(wrapper.findAll('img').map((img) => img.attributes('height'))).toEqual(['32'])
    expect(wrapper.find('.as-app-brand__subtitle').exists()).toBe(false)
  })

  it('dentro de un ASAppShell en móvil se reduce sola', async () => {
    // jsdom no mide: el shell recibe 375 px de ancho.
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(private callback: ResizeObserverCallback) {}
        observe() {
          this.callback([{ contentRect: { width: 375 } } as ResizeObserverEntry], this as never)
        }
        disconnect() {}
      },
    )
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(ASAppShell, { sections: [] }, { brand: () => h(ASAppBrand, { logos }) }),
      }),
    )
    await nextTick()
    expect(wrapper.findAll('.as-app-brand img')).toHaveLength(1)
    expect(wrapper.find('.as-app-brand').classes()).toContain('as-app-brand--compact')
  })
})
