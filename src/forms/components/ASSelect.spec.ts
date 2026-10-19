import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import type { SelectGroup, SelectOption, SelectValue } from '@/forms/types/common'
import ASSelect from './ASSelect.vue'

const options: (SelectOption | SelectGroup)[] = [
  { value: 'todas', label: 'Todas' },
  {
    label: 'Tajo',
    options: [
      { value: 'E01', label: 'Aranjuez' },
      { value: 'E02', label: 'Toledo', disabled: true },
      { value: 'E03', label: 'Talavera' },
    ],
  },
  { label: 'Jarama', options: [{ value: 'E10', label: 'Mejorada del Campo' }] },
  { value: 'rio', label: 'Río Alberche' },
]

/** ASSelect con v-model de verdad: el padre devuelve lo que emite. */
function mountSelect(props: Record<string, unknown> = {}) {
  const wrapper = mount(ASSelect, {
    props: {
      options,
      id: 's',
      label: 'Estación',
      ...props,
      'onUpdate:modelValue': (value: SelectValue | SelectValue[] | null) =>
        wrapper.setProps({ modelValue: value }),
    },
    attachTo: document.body,
  })
  return wrapper
}

const combobox = (wrapper: ReturnType<typeof mountSelect>) => wrapper.find('[role="combobox"]')
const key = (wrapper: ReturnType<typeof mountSelect>, name: string) =>
  combobox(wrapper).trigger('keydown', { key: name })
const activeLabel = (wrapper: ReturnType<typeof mountSelect>) => {
  const id = combobox(wrapper).attributes('aria-activedescendant')
  return id ? wrapper.find(`#${id}`).text() : undefined
}
const lastEmitted = (wrapper: ReturnType<typeof mountSelect>) =>
  wrapper.emitted('update:modelValue')?.at(-1)?.[0]

afterEach(() => {
  document.body.innerHTML = ''
  vi.useRealTimers()
})

describe('ASSelect', () => {
  describe('ARIA', () => {
    it('combobox con su etiqueta y una listbox cerrada', () => {
      const wrapper = mountSelect({ hint: 'Ayuda' })
      expect(combobox(wrapper).attributes()).toMatchObject({
        id: 's',
        tabindex: '0',
        'aria-labelledby': 's-label',
        'aria-expanded': 'false',
        'aria-controls': 's-listbox',
        'aria-haspopup': 'listbox',
        'aria-describedby': 's-hint',
      })
      expect(combobox(wrapper).text()).toBe('Selecciona una opción')
      expect(wrapper.find('[role="listbox"]').isVisible()).toBe(false)
    })

    it('grupos con título (role="group") y opciones con aria-selected', async () => {
      const wrapper = mountSelect({ modelValue: 'E03' })
      await combobox(wrapper).trigger('click')
      const groups = wrapper.findAll('[role="group"]')
      expect(groups).toHaveLength(2)
      const labelId = groups[0]!.attributes('aria-labelledby')
      expect(wrapper.find(`#${labelId}`).text()).toBe('Tajo')
      const talavera = wrapper.findAll('[role="option"]').find((o) => o.text() === 'Talavera')!
      expect(talavera.attributes('aria-selected')).toBe('true')
      expect(wrapper.findAll('[role="option"]')[2]!.attributes('aria-disabled')).toBe('true')
    })
  })

  describe('selección única', () => {
    it('clic abre la lista con la opción elegida activa; elegir cierra y emite', async () => {
      const wrapper = mountSelect({ modelValue: 'E01' })
      await combobox(wrapper).trigger('click')
      expect(combobox(wrapper).attributes('aria-expanded')).toBe('true')
      expect(wrapper.emitted('open')).toHaveLength(1)
      expect(activeLabel(wrapper)).toBe('Aranjuez')
      await wrapper
        .findAll('[role="option"]')
        .find((o) => o.text() === 'Talavera')!
        .trigger('click')
      expect(lastEmitted(wrapper)).toBe('E03')
      expect(combobox(wrapper).attributes('aria-expanded')).toBe('false')
      expect(combobox(wrapper).text()).toBe('Talavera')
    })

    it('una opción deshabilitada no se elige', async () => {
      const wrapper = mountSelect()
      await combobox(wrapper).trigger('click')
      await wrapper
        .findAll('[role="option"]')
        .find((o) => o.text() === 'Toledo')!
        .trigger('click')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('clic fuera cierra sin elegir', async () => {
      const wrapper = mountSelect()
      await combobox(wrapper).trigger('click')
      document.body.click()
      await nextTick()
      expect(combobox(wrapper).attributes('aria-expanded')).toBe('false')
      expect(wrapper.emitted('close')).toHaveLength(1)
    })

    it('clearable vacía la selección a null', async () => {
      const wrapper = mountSelect({ modelValue: 'E01', clearable: true })
      await wrapper.find('button[aria-label="Borrar"]').trigger('click')
      expect(lastEmitted(wrapper)).toBeNull()
      expect(wrapper.find('button[aria-label="Borrar"]').exists()).toBe(false)
    })
  })

  describe('teclado', () => {
    it('↓ abre; ↓/↑ recorren saltando las deshabilitadas; Intro elige', async () => {
      const wrapper = mountSelect()
      await key(wrapper, 'ArrowDown')
      expect(activeLabel(wrapper)).toBe('Todas')
      await key(wrapper, 'ArrowDown')
      expect(activeLabel(wrapper)).toBe('Aranjuez')
      await key(wrapper, 'ArrowDown')
      expect(activeLabel(wrapper)).toBe('Talavera') // Toledo está deshabilitada
      await key(wrapper, 'ArrowUp')
      expect(activeLabel(wrapper)).toBe('Aranjuez')
      await key(wrapper, 'Enter')
      expect(lastEmitted(wrapper)).toBe('E01')
    })

    it('Inicio y Fin; AvPág salta 10 sin pasarse del final', async () => {
      const wrapper = mountSelect()
      await key(wrapper, 'Enter')
      await key(wrapper, 'End')
      expect(activeLabel(wrapper)).toBe('Río Alberche')
      await key(wrapper, 'Home')
      expect(activeLabel(wrapper)).toBe('Todas')
      await key(wrapper, 'PageDown')
      expect(activeLabel(wrapper)).toBe('Río Alberche')
    })

    it('Espacio abre y elige; Escape cierra sin propagarse; Tab cierra sin elegir', async () => {
      const wrapper = mountSelect()
      const parentEscape = vi.fn()
      wrapper.element.parentElement!.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key === 'Escape') parentEscape()
      })
      await key(wrapper, ' ')
      expect(combobox(wrapper).attributes('aria-expanded')).toBe('true')
      await key(wrapper, 'Escape')
      expect(combobox(wrapper).attributes('aria-expanded')).toBe('false')
      expect(parentEscape).not.toHaveBeenCalled()
      // Cerrada, Escape sí llega al contenedor (p. ej. para cerrar su panel).
      await key(wrapper, 'Escape')
      expect(parentEscape).toHaveBeenCalledTimes(1)
      await key(wrapper, ' ')
      await key(wrapper, 'ArrowDown')
      await key(wrapper, 'Tab')
      expect(combobox(wrapper).attributes('aria-expanded')).toBe('false')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('escribir salta a la opción que empieza por esas letras, sin tildes', async () => {
      vi.useFakeTimers()
      const wrapper = mountSelect()
      // Cerrada y con selección única, elige directamente (como un <select> nativo).
      await key(wrapper, 't')
      expect(lastEmitted(wrapper)).toBe('todas')
      await key(wrapper, 'a')
      expect(lastEmitted(wrapper)).toBe('E03') // "ta" → Talavera
      vi.advanceTimersByTime(600)
      await key(wrapper, 'r')
      expect(lastEmitted(wrapper)).toBe('rio') // "Río"
    })
  })

  describe('búsqueda', () => {
    it('filtra sin mayúsculas ni tildes, emite search y oculta los grupos vacíos', async () => {
      const wrapper = mountSelect({ searchable: true })
      const input = wrapper.find('input')
      expect(input.attributes()).toMatchObject({ role: 'combobox', 'aria-autocomplete': 'list' })
      await input.setValue('RIO')
      expect(wrapper.emitted('search')).toEqual([['RIO']])
      expect(wrapper.findAll('[role="option"]').map((o) => o.text())).toEqual(['Río Alberche'])
      expect(wrapper.findAll('[role="group"]')).toHaveLength(0)
      expect(activeLabel(wrapper)).toBe('Río Alberche')
      await key(wrapper, 'Enter')
      expect(lastEmitted(wrapper)).toBe('rio')
    })

    it('sin resultados muestra el texto vacío', async () => {
      const wrapper = mountSelect({ searchable: true, noOptionsText: 'Nada' })
      await wrapper.find('input').setValue('zzz')
      expect(wrapper.find('.as-select__empty').text()).toBe('Nada')
    })

    it('filtro propio', async () => {
      const wrapper = mountSelect({
        searchable: true,
        filter: (option: SelectOption, query: string) => String(option.value).startsWith(query),
      })
      await wrapper.find('input').setValue('E0')
      expect(wrapper.findAll('[role="option"]').map((o) => o.text())).toEqual([
        'Aranjuez',
        'Toledo',
        'Talavera',
      ])
    })

    it('sin foco muestra la opción elegida', async () => {
      const wrapper = mountSelect({ searchable: true, modelValue: 'E01' })
      expect(wrapper.find('input').element.value).toBe('Aranjuez')
    })
  })

  describe('selección múltiple', () => {
    it('chips, la lista sigue abierta al elegir y lo elegido se anuncia', async () => {
      const wrapper = mountSelect({ multiple: true, modelValue: ['E01'] })
      expect(wrapper.find('[role="listbox"]').attributes('aria-multiselectable')).toBe('true')
      expect(wrapper.findAll('.as-select__chip').map((c) => c.text())).toEqual(['Aranjuez'])
      await key(wrapper, 'ArrowDown')
      expect(activeLabel(wrapper)).toBe('Aranjuez')
      await key(wrapper, 'ArrowDown')
      expect(activeLabel(wrapper)).toBe('Talavera')
      await key(wrapper, 'Enter')
      expect(lastEmitted(wrapper)).toEqual(['E01', 'E03'])
      expect(combobox(wrapper).attributes('aria-expanded')).toBe('true')
      expect(combobox(wrapper).attributes('aria-describedby')).toBe('s-selection')
      expect(wrapper.find('#s-selection').text()).toBe('Aranjuez, Talavera')
      // Volver a elegirla la quita.
      await key(wrapper, 'Enter')
      expect(lastEmitted(wrapper)).toEqual(['E01'])
    })

    it('el aspa de un chip lo quita y Retroceso quita el último', async () => {
      const wrapper = mountSelect({ multiple: true, modelValue: ['E01', 'E03'] })
      await wrapper.find('.as-select__chip-remove').trigger('click')
      expect(lastEmitted(wrapper)).toEqual(['E03'])
      await key(wrapper, 'Backspace')
      expect(lastEmitted(wrapper)).toEqual([])
    })

    it('maxChips resume el resto en "+N"', () => {
      const wrapper = mountSelect({
        multiple: true,
        maxChips: 1,
        modelValue: ['E01', 'E03', 'rio'],
      })
      const chips = wrapper.findAll('.as-select__chip')
      expect(chips.map((c) => c.text())).toEqual(['Aranjuez', '+2'])
      expect(chips[1]!.attributes('title')).toBe('2 más seleccionadas')
    })
  })

  describe('estados', () => {
    it('deshabilitado: no se enfoca ni se abre', async () => {
      const wrapper = mountSelect({ disabled: true })
      expect(combobox(wrapper).attributes()).toMatchObject({
        tabindex: '-1',
        'aria-disabled': 'true',
      })
      await combobox(wrapper).trigger('click')
      await key(wrapper, 'ArrowDown')
      expect(combobox(wrapper).attributes('aria-expanded')).toBe('false')
    })

    it('error: aria-invalid y el mensaje en aria-describedby', () => {
      const wrapper = mountSelect({ error: 'Elige una estación' })
      expect(combobox(wrapper).attributes()).toMatchObject({
        'aria-invalid': 'true',
        'aria-describedby': 's-error',
      })
    })
  })
})
