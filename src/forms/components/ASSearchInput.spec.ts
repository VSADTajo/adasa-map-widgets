import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import type { SearchSuggestion } from '@/forms/types/SearchInputProps'
import ASSearchInput from './ASSearchInput.vue'

const SUGGESTIONS: SearchSuggestion[] = [
  { id: 'E01', label: 'Aranjuez', description: 'Aforo · 3E01', group: 'Estaciones' },
  { id: 'M01', label: 'Aranjuez', description: 'Madrid', group: 'Municipios' },
  { id: 'E02', label: 'Arganda del Rey', group: 'Estaciones' },
]

/** ASSearchInput con v-model de verdad y una búsqueda simulada. */
function mountSearch(
  fetchSuggestions = vi.fn<(q: string, s: AbortSignal) => Promise<SearchSuggestion[]>>(
    async () => SUGGESTIONS,
  ),
  props: Record<string, unknown> = {},
) {
  const wrapper = mount(ASSearchInput, {
    props: {
      id: 'b',
      label: 'Buscar',
      modelValue: '',
      fetchSuggestions,
      ...props,
      'onUpdate:modelValue': (value: string) => wrapper.setProps({ modelValue: value }),
    },
    attachTo: document.body,
  })
  return { wrapper, fetchSuggestions }
}

async function type(wrapper: ReturnType<typeof mountSearch>['wrapper'], text: string) {
  await wrapper.find('input').setValue(text)
}

async function settle() {
  vi.advanceTimersByTime(300)
  await flushPromises()
}

const input = (wrapper: ReturnType<typeof mountSearch>['wrapper']) => wrapper.find('input')
const status = (wrapper: ReturnType<typeof mountSearch>['wrapper']) =>
  wrapper.find('[role="status"]').text()

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('ASSearchInput', () => {
  it('combobox con lista de sugerencias cerrada y su etiqueta', () => {
    const { wrapper } = mountSearch()
    expect(input(wrapper).attributes()).toMatchObject({
      role: 'combobox',
      'aria-autocomplete': 'list',
      'aria-expanded': 'false',
      'aria-controls': 'b-listbox',
    })
    expect(wrapper.find('label').attributes('for')).toBe('b')
  })

  describe('búsqueda', () => {
    it('espera al debounce y a minChars antes de buscar', async () => {
      const { wrapper, fetchSuggestions } = mountSearch()
      await type(wrapper, 'a')
      await settle()
      expect(fetchSuggestions).not.toHaveBeenCalled()
      await type(wrapper, 'ar')
      vi.advanceTimersByTime(299)
      expect(fetchSuggestions).not.toHaveBeenCalled()
      await settle()
      expect(fetchSuggestions).toHaveBeenCalledTimes(1)
      expect(fetchSuggestions.mock.calls[0]![0]).toBe('ar')
      expect(fetchSuggestions.mock.calls[0]![1]).toBeInstanceOf(AbortSignal)
      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['ar'])
    })

    it('seguir escribiendo cancela la petición en curso y una respuesta tardía no pisa a la nueva', async () => {
      const resolvers: ((value: SearchSuggestion[]) => void)[] = []
      const fetchSuggestions = vi.fn(
        (_q: string, _s: AbortSignal) => new Promise<SearchSuggestion[]>((r) => resolvers.push(r)),
      )
      const { wrapper } = mountSearch(fetchSuggestions)
      await type(wrapper, 'ar')
      await settle()
      const firstSignal = fetchSuggestions.mock.calls[0]![1]
      await type(wrapper, 'arg')
      expect(firstSignal.aborted).toBe(true)
      await settle()
      resolvers[1]!([SUGGESTIONS[2]!])
      await flushPromises()
      resolvers[0]!(SUGGESTIONS)
      await flushPromises()
      expect(wrapper.findAll('[role="option"]').map((o) => o.text())).toEqual(['Arganda del Rey'])
    })

    it('mientras busca anuncia "Buscando…" y marca aria-busy; después, el número de resultados', async () => {
      let resolve!: (value: SearchSuggestion[]) => void
      const { wrapper } = mountSearch(
        vi.fn(() => new Promise<SearchSuggestion[]>((r) => (resolve = r))),
      )
      await type(wrapper, 'ar')
      await settle()
      expect(status(wrapper)).toBe('Buscando…')
      expect(input(wrapper).attributes('aria-busy')).toBe('true')
      resolve(SUGGESTIONS)
      await flushPromises()
      expect(status(wrapper)).toBe('3 resultados')
      expect(input(wrapper).attributes('aria-busy')).toBeUndefined()
      expect(input(wrapper).attributes('aria-expanded')).toBe('true')
    })

    it('sin resultados lo dice; un error se emite y se anuncia', async () => {
      const { wrapper } = mountSearch(vi.fn(async () => []))
      await type(wrapper, 'zz')
      await settle()
      expect(status(wrapper)).toBe('Sin resultados para «zz»')
      const failure = new Error('500')
      const { wrapper: failing } = mountSearch(vi.fn(async () => Promise.reject(failure)))
      await type(failing, 'ar')
      await settle()
      expect(failing.emitted('error')).toEqual([[failure]])
      expect(status(failing)).toBe('No se pudo completar la búsqueda')
    })

    it('agrupa por `group` y resalta lo buscado sin tildes', async () => {
      const { wrapper } = mountSearch(
        vi.fn(async () => [...SUGGESTIONS, { id: 'R1', label: 'Río Árgano', group: 'Ríos' }]),
      )
      await type(wrapper, 'ar')
      await settle()
      const groups = wrapper.findAll('[role="group"]')
      expect(groups.map((g) => wrapper.find(`#${g.attributes('aria-labelledby')}`).text())).toEqual(
        ['Estaciones', 'Municipios', 'Ríos'],
      )
      expect(wrapper.findAll('mark').map((m) => m.text())).toEqual(['Ar', 'Ar', 'Ar', 'Ár'])
    })
  })

  describe('teclado', () => {
    it('↓ recorre en el orden de los grupos; Intro elige y emite select y el texto', async () => {
      const { wrapper } = mountSearch()
      await type(wrapper, 'ar')
      await settle()
      const active = () => {
        const id = input(wrapper).attributes('aria-activedescendant')
        return id ? wrapper.find(`#${id}`).text() : undefined
      }
      expect(active()).toBeUndefined()
      await input(wrapper).trigger('keydown', { key: 'ArrowDown' })
      await input(wrapper).trigger('keydown', { key: 'ArrowDown' })
      // Orden por grupos: Aranjuez (estación), Arganda del Rey, Aranjuez (municipio).
      expect(active()).toContain('Arganda del Rey')
      await input(wrapper).trigger('keydown', { key: 'Enter' })
      expect(wrapper.emitted('select')).toEqual([[SUGGESTIONS[2]]])
      expect(input(wrapper).element.value).toBe('Arganda del Rey')
      expect(input(wrapper).attributes('aria-expanded')).toBe('false')
    })

    it('Intro sin sugerencia activa emite submit con el texto', async () => {
      const { wrapper } = mountSearch()
      await type(wrapper, 'calle mayor 1')
      await input(wrapper).trigger('keydown', { key: 'Enter' })
      expect(wrapper.emitted('submit')).toEqual([['calle mayor 1']])
    })

    it('Escape cierra la lista sin propagarse y, cerrada, vacía el campo', async () => {
      const { wrapper } = mountSearch()
      const outer = vi.fn()
      document.body.addEventListener('keydown', (event) => event.key === 'Escape' && outer())
      await type(wrapper, 'ar')
      await settle()
      await input(wrapper).trigger('keydown', { key: 'Escape' })
      expect(input(wrapper).attributes('aria-expanded')).toBe('false')
      await input(wrapper).trigger('keydown', { key: 'Escape' })
      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([''])
      expect(outer).not.toHaveBeenCalled()
      // Vacío, Escape ya llega al contenedor.
      await input(wrapper).trigger('keydown', { key: 'Escape' })
      expect(outer).toHaveBeenCalledTimes(1)
    })
  })

  it('clic en una sugerencia la elige; el botón de borrar vacía y cancela', async () => {
    const { wrapper } = mountSearch()
    await type(wrapper, 'ar')
    await settle()
    await wrapper.findAll('[role="option"]')[0]!.trigger('click')
    expect(wrapper.emitted('select')).toEqual([[SUGGESTIONS[0]]])
    await wrapper.find('button[aria-label="Borrar"]').trigger('click')
    expect(input(wrapper).element.value).toBe('')
    expect(document.activeElement).toBe(input(wrapper).element)
  })

  describe('etiquetas, acciones y no disponibles', () => {
    const rich: SearchSuggestion[] = [
      {
        id: 'E01',
        label: 'Aranjuez',
        tags: [
          { label: 'Aforo', color: '#ffd54f' },
          { label: 'Punto SAIH', color: '#1d283a' },
          { label: 'Sin color' },
        ],
        actions: [
          { id: 'centrar', icon: 'M0 0', label: 'Centrar en el mapa' },
          { id: 'ficha', icon: 'M0 0', label: 'Abrir ficha', disabled: true },
        ],
      },
      {
        id: 'E02',
        label: 'Arganda',
        unavailable: true,
        unavailableReason: 'No visible en el mapa con el modelo actual',
        actions: [{ id: 'centrar', icon: 'M0 0', label: 'Centrar en el mapa', disabled: true }],
      },
    ]

    async function mountRich() {
      const { wrapper } = mountSearch(vi.fn(async () => rich))
      await type(wrapper, 'ar')
      await settle()
      return wrapper
    }

    it('etiquetas con su color y el texto que más contrasta', async () => {
      const wrapper = await mountRich()
      const tags = wrapper.findAll('[role="option"]')[0]!.findAll('.as-search-input__tag')
      expect(tags.map((tag) => tag.text())).toEqual(['Aforo', 'Punto SAIH', 'Sin color'])
      // Amarillo claro → texto oscuro; azul marino → texto blanco; sin color, el del tema.
      expect(tags[0]!.attributes('style')).toContain('color: rgb(15, 23, 42)')
      expect(tags[1]!.attributes('style')).toContain('color: rgb(255, 255, 255)')
      expect(tags[2]!.attributes('style')).toBeUndefined()
      wrapper.unmount()
    })

    it('el botón de una acción emite suggestion-action sin elegir la sugerencia', async () => {
      const wrapper = await mountRich()
      const [centrar, ficha] = wrapper.findAll('[role="option"]')[0]!.findAll('button')
      expect(centrar!.attributes()).toMatchObject({
        'aria-label': 'Centrar en el mapa',
        tabindex: '-1',
      })
      expect(ficha!.attributes('disabled')).toBeDefined()
      await centrar!.trigger('click')
      expect(wrapper.emitted('suggestion-action')).toEqual([
        [{ actionId: 'centrar', suggestion: rich[0] }],
      ])
      expect(wrapper.emitted('select')).toBeUndefined()
      wrapper.unmount()
    })

    it('Mayús + Intro ejecuta la primera acción habilitada de la activa; sin ninguna, elige', async () => {
      const wrapper = await mountRich()
      await input(wrapper).trigger('keydown', { key: 'ArrowDown' })
      await input(wrapper).trigger('keydown', { key: 'Enter', shiftKey: true })
      expect(wrapper.emitted('suggestion-action')).toEqual([
        [{ actionId: 'centrar', suggestion: rich[0] }],
      ])
      await input(wrapper).trigger('keydown', { key: 'ArrowDown' })
      await input(wrapper).trigger('keydown', { key: 'Enter', shiftKey: true })
      // Arganda solo tiene una acción deshabilitada: Mayús + Intro la elige.
      expect(wrapper.emitted('select')).toEqual([[rich[1]]])
      wrapper.unmount()
    })

    it('no disponible: se ve atenuada, con el motivo en el tooltip y para lectores de pantalla', async () => {
      const wrapper = await mountRich()
      const option = wrapper.findAll('[role="option"]')[1]!
      expect(option.classes()).toContain('as-search-input__option--unavailable')
      expect(option.find('.as-search-input__unavailable').attributes('title')).toBe(
        'No visible en el mapa con el modelo actual',
      )
      expect(option.text()).toContain('No visible en el mapa con el modelo actual')
      wrapper.unmount()
    })

    it('slot suggestion para un diseño propio', async () => {
      const wrapper = mount(ASSearchInput, {
        props: { label: 'Buscar', fetchSuggestions: vi.fn(async () => rich) },
        slots: {
          suggestion: `<template #suggestion="{ suggestion, parts }">
            <b class="mia">{{ suggestion.label }} · {{ parts.length }}</b>
          </template>`,
        },
        attachTo: document.body,
      })
      await type(wrapper as never, 'ar')
      await settle()
      expect(wrapper.findAll('.mia').map((b) => b.text())).toEqual(['Aranjuez · 2', 'Arganda · 2'])
      wrapper.unmount()
    })
  })

  it('hideLabel: la etiqueta no se ve pero sigue asociada al campo', () => {
    const { wrapper } = mountSearch(undefined, { hideLabel: true })
    const label = wrapper.find('label')
    expect(label.classes()).toContain('as-form-field__label--hidden')
    expect(label.attributes('for')).toBe('b')
  })
})
