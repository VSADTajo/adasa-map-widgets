import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { provideTheme } from '@/core/composables/useTheme'
import type { AppSection } from '@/layout/types/AppShellProps'
import ASAppShell from './ASAppShell.vue'

const sections: AppSection[] = [
  { id: 'capas', label: 'Capas', icon: 'M0 0' },
  { id: 'avisos', label: 'Avisos', icon: 'M0 0' },
  { id: 'oculta', label: 'Oculta', icon: 'M0 0', hidden: true },
  { id: 'mapasbase', label: 'Mapas base', icon: 'M0 0', position: 'bottom' },
]

/** Simula el ancho del layout (jsdom no mide): por debajo de 960 px, diseño móvil. */
function setWidth(width: number) {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(private callback: ResizeObserverCallback) {}
      observe() {
        this.callback([{ contentRect: { width } } as ResizeObserverEntry], this as never)
      }
      disconnect() {}
    },
  )
}

/** Shell con v-model de verdad (el padre devuelve lo que emite) y slots de prueba. */
function mountShell(initial: { activeSection?: string | null; detailOpen?: boolean } = {}) {
  const activeSection = ref<string | null>(initial.activeSection ?? null)
  const detailOpen = ref(initial.detailOpen ?? false)
  const wrapper = mount(
    defineComponent({
      setup: () => () =>
        h(
          ASAppShell,
          {
            sections,
            activeSection: activeSection.value,
            detailOpen: detailOpen.value,
            'onUpdate:activeSection': (value: string | null) => (activeSection.value = value),
            'onUpdate:detailOpen': (value: boolean) => (detailOpen.value = value),
          },
          {
            default: () => h('div', { class: 'mapa' }, 'Mapa'),
            brand: () => h('span', 'Marca'),
            search: () => h('input', { class: 'buscador' }),
            section: ({
              section,
              close,
              mobile,
            }: {
              section: AppSection
              close: () => void
              mobile: boolean
            }) =>
              h('div', { class: 'panel' }, [
                `${section.label}${mobile ? ' (móvil)' : ''}`,
                h('button', { class: 'cerrar', onClick: close }),
              ]),
            detail: () => h('p', { class: 'ficha' }, 'Ficha'),
          },
        ),
    }),
    { attachTo: document.body },
  )
  return { wrapper, activeSection, detailOpen }
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('ASAppShell · escritorio', () => {
  it('muestra la barra, la barra de iconos (sin las ocultas) y el contenido principal', () => {
    const { wrapper } = mountShell()
    expect(wrapper.find('.as-app-top-bar--top').text()).toContain('Marca')
    expect(wrapper.find('.buscador').exists()).toBe(true)
    expect(wrapper.findAll('.as-app-rail__item').map((b) => b.attributes('aria-label'))).toEqual([
      'Capas',
      'Avisos',
      'Mapas base',
    ])
    expect(wrapper.find('.as-app-shell__main .mapa').exists()).toBe(true)
    expect(wrapper.find('.as-app-drawer').classes()).not.toContain('as-app-drawer--open')
  })

  it('pulsar una sección abre su panel; pulsarla otra vez lo cierra', async () => {
    const { wrapper, activeSection } = mountShell()
    await wrapper.findAll('.as-app-rail__item')[0]!.trigger('click')
    expect(activeSection.value).toBe('capas')
    expect(wrapper.find('.as-app-drawer').classes()).toContain('as-app-drawer--open')
    expect(wrapper.find('.panel').text()).toBe('Capas')
    expect(wrapper.findAll('.as-app-rail__item')[0]!.attributes('aria-pressed')).toBe('true')

    await wrapper.findAll('.as-app-rail__item')[0]!.trigger('click')
    expect(activeSection.value).toBeNull()
    expect(wrapper.find('.as-app-drawer').classes()).not.toContain('as-app-drawer--open')
    // El contenido se queda mientras el panel sale (no desaparece de golpe).
    expect(wrapper.find('.panel').exists()).toBe(true)
  })

  it('cambiar de sección cierra el panel y lo reabre con la nueva a los 280 ms', async () => {
    const { wrapper } = mountShell({ activeSection: 'capas' })
    await wrapper.findAll('.as-app-rail__item')[1]!.trigger('click')
    const drawer = () => wrapper.find('.as-app-drawer').classes()
    expect(drawer()).not.toContain('as-app-drawer--open')
    expect(wrapper.find('.panel').text()).toBe('Capas')
    vi.advanceTimersByTime(279)
    await nextTick()
    expect(drawer()).not.toContain('as-app-drawer--open')
    vi.advanceTimersByTime(1)
    await nextTick()
    expect(drawer()).toContain('as-app-drawer--open')
    expect(wrapper.find('.panel').text()).toBe('Avisos')
  })

  it('el panel se cierra con el `close` del slot', async () => {
    const { wrapper, activeSection } = mountShell({ activeSection: 'capas' })
    await wrapper.find('.cerrar').trigger('click')
    expect(activeSection.value).toBeNull()
  })

  it('el detalle empieza tras los menús: con el panel abierto, tras los dos', async () => {
    const { wrapper } = mountShell({ detailOpen: true })
    const detail = () => wrapper.find('.as-app-detail-panel')
    expect(detail().classes()).toContain('as-app-detail-panel--open')
    expect(detail().attributes('style')).toContain('left: 56px')
    await wrapper.findAll('.as-app-rail__item')[0]!.trigger('click')
    expect(detail().attributes('style')).toContain('left: 376px')
    // Abrir el panel no cierra el detalle.
    expect(detail().classes()).toContain('as-app-detail-panel--open')
  })

  it('el detalle se cierra con su botón y los paneles cerrados son inertes', async () => {
    const { wrapper, detailOpen } = mountShell({ detailOpen: true })
    expect(wrapper.find('.as-app-drawer__panel').attributes('inert')).toBeDefined()
    await wrapper.find('.as-app-detail-panel__close').trigger('click')
    expect(detailOpen.value).toBe(false)
    expect(wrapper.find('.as-app-detail-panel').attributes('inert')).toBeDefined()
  })

  it('Escape cierra primero el detalle y después el panel', async () => {
    const { wrapper, activeSection, detailOpen } = mountShell({
      activeSection: 'capas',
      detailOpen: true,
    })
    await wrapper.find('.as-app-shell').trigger('keydown', { key: 'Escape' })
    expect(detailOpen.value).toBe(false)
    expect(activeSection.value).toBe('capas')
    await wrapper.find('.as-app-shell').trigger('keydown', { key: 'Escape' })
    expect(activeSection.value).toBeNull()
  })
})

describe('ASAppShell · móvil', () => {
  beforeEach(() => setWidth(375))

  it('la barra va abajo, sin barra de iconos, y el buscador queda tras un botón', async () => {
    const { wrapper } = mountShell()
    await nextTick()
    expect(wrapper.find('.as-app-shell').classes()).toContain('as-app-shell--mobile')
    expect(wrapper.find('.as-app-top-bar--bottom').exists()).toBe(true)
    expect(wrapper.find('.as-app-rail').exists()).toBe(false)
    expect(wrapper.find('.buscador').exists()).toBe(false)
    await wrapper.find('[aria-label="Buscar"]').trigger('click')
    expect(wrapper.find('.as-app-shell__mobile-search .buscador').exists()).toBe(true)
  })

  it('el menú despliega las secciones; elegir una lo cierra y la abre desde abajo', async () => {
    const { wrapper, activeSection } = mountShell()
    await nextTick()
    const menuButton = wrapper.find('[aria-label="Menú"]')
    await menuButton.trigger('click')
    expect(menuButton.attributes('aria-expanded')).toBe('true')
    const items = wrapper.findAll('.as-app-mobile-menu__item')
    expect(items.map((item) => item.text())).toEqual(['Capas', 'Avisos', 'Mapas base'])
    await items[0]!.trigger('click')
    expect(activeSection.value).toBe('capas')
    expect(wrapper.find('.as-app-mobile-menu').classes()).not.toContain('as-app-mobile-menu--open')
    expect(wrapper.find('.as-app-bottom-sheet').classes()).toContain('as-app-bottom-sheet--open')
    expect(wrapper.find('.panel').text()).toBe('Capas (móvil)')
  })

  it('el asa amplía y reduce el panel, y al cerrarlo vuelve a su tamaño', async () => {
    const { wrapper, activeSection } = mountShell({ activeSection: 'capas' })
    await nextTick()
    const handle = wrapper.find('.as-app-bottom-sheet__handle')
    expect(handle.attributes('aria-label')).toBe('Ampliar panel')
    await handle.trigger('click')
    expect(wrapper.find('.as-app-bottom-sheet').classes()).toContain(
      'as-app-bottom-sheet--expanded',
    )
    expect(handle.attributes('aria-label')).toBe('Reducir panel')
    activeSection.value = null
    await nextTick()
    expect(wrapper.find('.as-app-bottom-sheet').classes()).not.toContain(
      'as-app-bottom-sheet--expanded',
    )
  })

  it('Escape cierra antes el menú; tocar fuera también', async () => {
    const { wrapper } = mountShell()
    await nextTick()
    await wrapper.find('[aria-label="Menú"]').trigger('click')
    await wrapper.find('.as-app-shell').trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('.as-app-mobile-menu').classes()).not.toContain('as-app-mobile-menu--open')
    await wrapper.find('[aria-label="Menú"]').trigger('click')
    await wrapper.find('.as-app-mobile-menu__backdrop').trigger('click')
    expect(wrapper.find('.as-app-mobile-menu').classes()).not.toContain('as-app-mobile-menu--open')
  })

  it('el detalle ocupa toda la pantalla, siempre con su botón de cerrar', async () => {
    const { wrapper } = mountShell({ detailOpen: true })
    await nextTick()
    expect(wrapper.find('.as-app-detail-panel').attributes('style')).toContain('left: 0px')
    expect(wrapper.find('.as-app-detail-panel__close').exists()).toBe(true)
  })
})

describe('ASAppShell · tema', () => {
  it('sin tema no fuerza ninguno; hereda provideTheme y la prop manda', () => {
    expect(mountShell().wrapper.find('.as-app-shell').classes()).not.toContain('as-dark')
    const inherited = mount(
      defineComponent({
        setup() {
          provideTheme('dark')
          return () => h(ASAppShell, { sections })
        },
      }),
    )
    expect(inherited.find('.as-app-shell').classes()).toContain('as-dark')
    expect(mount(ASAppShell, { props: { sections, theme: 'light' } }).classes()).toContain(
      'as-light',
    )
  })
})
