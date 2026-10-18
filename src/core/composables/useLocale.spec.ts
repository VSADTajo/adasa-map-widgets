import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { provideLocale, useLocale, type LocaleContext } from './useLocale'
import type { LocaleDefinition } from './useLocale'

/** Monta un componente que provee el idioma (si se indica) y devuelve el contexto que ve un hijo. */
function withLocale(setup?: () => void): {
  child: LocaleContext
  html: () => string
} {
  let child!: LocaleContext
  const Child = defineComponent({
    setup() {
      child = useLocale()
      return () => h('span', child.t('legend.title'))
    },
  })
  const wrapper = mount(
    defineComponent({
      setup() {
        setup?.()
        return () => h(Child)
      },
    }),
  )
  return { child, html: () => wrapper.html() }
}

describe('useLocale', () => {
  it('sin provideLocale devuelve español', () => {
    const { child } = withLocale()
    expect(child.locale.value).toBe('es')
    expect(child.intlLocale.value).toBe('es-ES')
    expect(child.t('legend.title')).toBe('Leyenda')
  })

  it('usa el idioma de provideLocale', () => {
    const { child } = withLocale(() => provideLocale('en'))
    expect(child.t('legend.title')).toBe('Legend')
    expect(child.intlLocale.value).toBe('en-GB')
  })

  it('sustituye los parámetros {nombre} y deja intactos los que no recibe', () => {
    const { child } = withLocale()
    expect(child.t('basemaps.current', { name: 'OSM' })).toBe('Basemap: OSM. Cambiar basemap')
    expect(child.t('basemaps.current')).toBe('Basemap: {name}. Cambiar basemap')
  })

  it('cambia de idioma en caliente con setLocale y re-renderiza', async () => {
    let context!: LocaleContext
    const { html } = withLocale(() => {
      context = provideLocale('es')
    })
    expect(html()).toContain('Leyenda')
    context.setLocale('en')
    await nextTick()
    expect(html()).toContain('Legend')
  })

  it('admite idiomas del proyecto y completa las claves que faltan con español', () => {
    const ca: LocaleDefinition = { intl: 'ca-ES', messages: { 'legend.title': 'Llegenda' } }
    const { child } = withLocale(() => provideLocale('ca', { locales: { ca } }))
    expect(child.t('legend.title')).toBe('Llegenda')
    expect(child.t('legend.empty')).toBe('Sin leyenda disponible.')
    expect(child.formatNumber(1234567.8)).toBe('1.234.567,8')
  })

  it('un idioma no definido cae al español', () => {
    const { child } = withLocale(() => provideLocale('xx'))
    expect(child.t('legend.title')).toBe('Leyenda')
    expect(child.intlLocale.value).toBe('es-ES')
  })

  it('los formateadores usan el idioma activo', () => {
    const { child } = withLocale(() => provideLocale('en'))
    const date = new Date(2026, 9, 18, 6, 5)
    expect(child.formatNumber(12345.6)).toBe('12,345.6')
    expect(child.formatDate(date, 'weekday')).toBe('Sunday')
    expect(child.formatDate(date, { pattern: 'd MMM' })).toBe('18 Oct')
    expect(child.formatDuration(90 * 60_000, { style: 'long' })).toBe('1 hour and 30 minutes')
    expect(child.formatUnit(45, '%')).toBe('45%')
  })

  it('en español, los patrones de date-fns usan nombres en español', () => {
    const { child } = withLocale()
    expect(child.formatDate(new Date(2026, 9, 18), { pattern: 'd MMM yyyy' })).toBe('18 oct 2026')
  })
})
