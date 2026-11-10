import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import type { SearchSuggestion } from '@/forms/types/SearchInputProps'
import ASAppSearch from './ASAppSearch.vue'

const suggestion: SearchSuggestion = {
  id: 'E01',
  label: 'Aranjuez',
  actions: [{ id: 'centrar', icon: 'M0 0', label: 'Centrar en el mapa' }],
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('ASAppSearch', () => {
  it('etiqueta "Buscar" oculta a la vista pero asociada; forma de píldora', () => {
    const wrapper = mount(ASAppSearch, { props: { fetchSuggestions: vi.fn(async () => []) } })
    const label = wrapper.find('label')
    expect(label.text()).toBe('Buscar')
    expect(label.classes()).toContain('as-form-field__label--hidden')
    expect(label.attributes('for')).toBe(wrapper.find('input').attributes('id'))
    expect(wrapper.classes()).toContain('as-app-search')
  })

  it('reenvía los eventos de ASSearchInput', async () => {
    const wrapper = mount(ASAppSearch, {
      props: { label: 'Buscar estación', fetchSuggestions: vi.fn(async () => [suggestion]) },
      attachTo: document.body,
    })
    await wrapper.find('input').setValue('ara')
    vi.advanceTimersByTime(300)
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')).toEqual([['ara']])
    await wrapper.find('[role="option"] button').trigger('click')
    expect(wrapper.emitted('suggestion-action')).toEqual([[{ actionId: 'centrar', suggestion }]])
    await wrapper.find('[role="option"]').trigger('click')
    expect(wrapper.emitted('select')).toEqual([[suggestion]])
    await wrapper.find('input').trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('submit')).toEqual([['Aranjuez']])
  })
})
