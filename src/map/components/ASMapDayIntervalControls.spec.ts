import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { provideLocale } from '@/core/composables/useLocale'
import ASMapDayIntervalControls from './ASMapDayIntervalControls.vue'
import type { DayIntervalProps } from '@/map/types/DayIntervalProps'

// Domingo 18/10/2026: día base fijo para que las etiquetas no dependan de hoy.
const BASE_DATE = new Date(2026, 9, 18)

const props: DayIntervalProps = {
  baseDate: BASE_DATE,
  days: 4,
  alerts: [{ start: new Date(2026, 9, 18, 6), end: new Date(2026, 9, 18, 12), level: 'naranja' }],
}

function mountControls(extra: Partial<DayIntervalProps> = {}, locale?: string) {
  return mount(
    defineComponent({
      setup() {
        if (locale) provideLocale(locale)
        return () => h(ASMapDayIntervalControls, { ...props, ...extra })
      },
    }),
  )
}

const dayTitles = (wrapper: ReturnType<typeof mountControls>) =>
  wrapper.findAll('.as-day-interval-controls__day-title').map((title) => title.text())

describe('ASMapDayIntervalControls · textos', () => {
  it('por defecto mantiene los textos en español', () => {
    const wrapper = mountControls()
    expect(wrapper.find('.as-day-interval-controls__title').text()).toBe('Avisos')
    expect(dayTitles(wrapper)).toEqual([
      'Hoy 18/10',
      'Mañana 19/10',
      'Pasado mañana 20/10',
      'Miércoles 21/10',
    ])
  })

  it('compone la etiqueta accesible de cada intervalo', () => {
    const pills = mountControls().findAll('[aria-label]')
    const labels = pills.map((pill) => pill.attributes('aria-label'))
    expect(labels).toContain('Hoy 18/10, 06-12h, nivel naranja')
    expect(labels).toContain('Hoy 18/10, 00-06h')
  })

  it('el título de la prop tiene prioridad sobre el traducido', () => {
    const wrapper = mountControls({ title: 'Avisos AEMET' })
    expect(wrapper.find('.as-day-interval-controls__title').text()).toBe('Avisos AEMET')
  })

  it('se traduce con provideLocale', () => {
    const wrapper = mountControls({}, 'en')
    expect(wrapper.find('.as-day-interval-controls__title').text()).toBe('Warnings')
    expect(dayTitles(wrapper)).toEqual([
      'Today 18/10',
      'Tomorrow 19/10',
      'Day after tomorrow 20/10',
      'Wednesday 21/10',
    ])
  })
})
