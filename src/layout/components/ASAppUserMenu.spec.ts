import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { provideLocale } from '@/core/composables/useLocale'
import { provideTheme } from '@/core/composables/useTheme'
import ASAppUserMenu from './ASAppUserMenu.vue'

afterEach(() => {
  document.body.innerHTML = ''
})

const user = { name: 'Ana Pérez', email: 'ana@chtajo.es' }

async function open(wrapper: ReturnType<typeof mount>) {
  await wrapper.find('button[aria-haspopup="menu"]').trigger('click')
}

describe('ASAppUserMenu', () => {
  it('avatar con iniciales y nombre accesible; cabecera con nombre y correo', async () => {
    const wrapper = mount(ASAppUserMenu, { props: { user }, attachTo: document.body })
    const trigger = wrapper.find('button[aria-haspopup="menu"]')
    expect(trigger.attributes('aria-label')).toBe('Menú de usuario')
    expect(trigger.text()).toBe('AP')
    await open(wrapper)
    expect(wrapper.find('.as-app-user-menu__header').text()).toContain('Ana Pérez')
    expect(wrapper.find('.as-app-user-menu__header').text()).toContain('ana@chtajo.es')
    expect(wrapper.find('.as-menu__header').attributes('role')).toBe('presentation')
  })

  it('sin nombre, las iniciales salen del correo; con foto, la foto', () => {
    expect(
      mount(ASAppUserMenu, { props: { user: { email: 'luis.gil@x.es' } } })
        .find('button')
        .text(),
    ).toBe('LG')
    const photo = mount(ASAppUserMenu, { props: { user: { name: 'Ana', avatar: '/ana.jpg' } } })
    expect(photo.find('.as-app-user-menu__avatar img').attributes('src')).toBe('/ana.jpg')
  })

  it('opciones por defecto: tema oscuro, idiomas y cerrar sesión', async () => {
    const wrapper = mount(ASAppUserMenu, { props: { user }, attachTo: document.body })
    await open(wrapper)
    expect(wrapper.find('[role="menuitemcheckbox"]').text()).toBe('Tema oscuro')
    expect(wrapper.findAll('[role="menuitemradio"]').map((r) => r.text())).toEqual([
      'Español',
      'English',
    ])
    expect(wrapper.findAll('[role="menuitem"]').map((r) => r.text())).toEqual(['Cerrar sesión'])
  })

  it('sin v-model, el tema y el idioma cambian los de provideTheme y provideLocale', async () => {
    // Los contextos que devuelven provideTheme/provideLocale (inject no ve los de su propio componente).
    let theme!: ReturnType<typeof provideTheme>
    let locale!: ReturnType<typeof provideLocale>
    const wrapper = mount(
      defineComponent({
        setup() {
          theme = provideTheme('light')
          locale = provideLocale('es')
          return () => h(ASAppUserMenu, { user })
        },
      }),
      { attachTo: document.body },
    )
    await open(wrapper)
    expect(wrapper.find('[role="menuitemcheckbox"]').attributes('aria-checked')).toBe('false')
    await wrapper.find('[role="menuitemcheckbox"]').trigger('click')
    expect(theme.resolvedMode.value).toBe('dark')
    await wrapper.findAll('[role="menuitemradio"]')[1]!.trigger('click')
    expect(locale.locale.value).toBe('en')
    // El menú ya está en inglés.
    await open(wrapper)
    expect(wrapper.find('[role="menuitemcheckbox"]').text()).toBe('Dark theme')
  })

  it('con v-model, emite y deja que mande el proyecto', async () => {
    const wrapper = mount(ASAppUserMenu, {
      props: { user, theme: 'dark', locale: 'en' },
      attachTo: document.body,
    })
    await open(wrapper)
    expect(wrapper.find('[role="menuitemcheckbox"]').attributes('aria-checked')).toBe('true')
    expect(wrapper.findAll('[role="menuitemradio"]')[1]!.attributes('aria-checked')).toBe('true')
    await wrapper.find('[role="menuitemcheckbox"]').trigger('click')
    expect(wrapper.emitted('update:theme')).toEqual([['light']])
    await open(wrapper)
    await wrapper.findAll('[role="menuitemradio"]')[0]!.trigger('click')
    expect(wrapper.emitted('update:locale')).toEqual([['es']])
  })

  it('opciones propias emiten select; cerrar sesión, logout', async () => {
    const wrapper = mount(ASAppUserMenu, {
      props: {
        user,
        items: [{ id: 'perfil', label: 'Mi perfil' }],
        showTheme: false,
        showLocale: false,
      },
      attachTo: document.body,
    })
    await open(wrapper)
    const items = wrapper.findAll('[role="menuitem"]')
    expect(items.map((i) => i.text())).toEqual(['Mi perfil', 'Cerrar sesión'])
    await items[0]!.trigger('click')
    expect(wrapper.emitted('select')).toEqual([[{ id: 'perfil', label: 'Mi perfil' }]])
    await open(wrapper)
    await wrapper.findAll('[role="menuitem"]')[1]!.trigger('click')
    expect(wrapper.emitted('logout')).toHaveLength(1)
  })
})
