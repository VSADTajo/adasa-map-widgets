import { describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import type { TreeNode } from '@/forms/types/TreeListProps'
import ASTreeList from './ASTreeList.vue'

const ITEMS: TreeNode[] = [
  { id: 'subcuencas', label: 'Subcuencas', opacity: true, swatch: '#2563eb' },
  {
    id: 'saih',
    label: 'SAIH',
    defaultExpanded: true,
    children: [
      { id: 'AR', label: 'Aforo en río', description: 'Aforos', badge: 4 },
      { id: 'E', label: 'Embalses', disabled: true, disabledReason: 'Sin datos' },
    ],
  },
  { id: 'eventos', label: 'Eventos', children: [], emptyText: 'No hay eventos' },
]

const items = (wrapper: VueWrapper) => wrapper.findAll('[role="treeitem"]')
const item = (wrapper: VueWrapper, label: string) =>
  items(wrapper).find((row) => row.find('.as-tree-list__label').text() === label)!
const press = (wrapper: VueWrapper, label: string, key: string) =>
  item(wrapper, label).trigger('keydown', { key })

describe('ASTreeList', () => {
  describe('render y ARIA', () => {
    it('árbol con su nombre; filas con nivel, posición y grupos desplegados por defecto', () => {
      const wrapper = mount(ASTreeList, { props: { items: ITEMS, label: 'Capas' } })
      expect(wrapper.find('[role="tree"]').attributes()).toMatchObject({
        'aria-label': 'Capas',
        'aria-multiselectable': 'true',
      })
      expect(items(wrapper).map((row) => row.find('.as-tree-list__label').text())).toEqual([
        'Subcuencas',
        'SAIH',
        'Aforo en río',
        'Embalses',
        'Eventos',
      ])
      expect(item(wrapper, 'Aforo en río').attributes()).toMatchObject({
        'aria-level': '2',
        'aria-posinset': '1',
        'aria-setsize': '2',
      })
      expect(item(wrapper, 'SAIH').attributes('aria-expanded')).toBe('true')
      expect(item(wrapper, 'Eventos').attributes('aria-expanded')).toBe('false')
    })

    it('nombre accesible y descripción (texto, contador y motivo de deshabilitado)', () => {
      const wrapper = mount(ASTreeList, { props: { items: ITEMS, label: 'Capas' } })
      const aforo = item(wrapper, 'Aforo en río')
      const described = aforo.attributes('aria-describedby')!.split(' ')
      expect(described.map((id) => wrapper.find(`#${id}`).text())).toEqual(['Aforos', '4'])
      const embalses = item(wrapper, 'Embalses')
      expect(embalses.attributes()).toMatchObject({ 'aria-disabled': 'true', title: 'Sin datos' })
      expect(wrapper.find(`#${embalses.attributes('aria-describedby')}`).text()).toBe('Sin datos')
      expect(wrapper.find(`#${aforo.attributes('aria-labelledby')}`).text()).toBe('Aforo en río')
    })

    it('un solo punto de tabulación: la primera fila', () => {
      const wrapper = mount(ASTreeList, { props: { items: ITEMS, label: 'Capas' } })
      expect(items(wrapper).map((row) => row.attributes('tabindex'))).toEqual([
        '0',
        '-1',
        '-1',
        '-1',
        '-1',
      ])
    })

    it('sin items, el texto vacío; cargando, el aviso de carga', async () => {
      const wrapper = mount(ASTreeList, { props: { items: [], label: 'Capas' } })
      expect(wrapper.text()).toBe('Sin elementos')
      await wrapper.setProps({ emptyText: 'No hay capas' })
      expect(wrapper.text()).toBe('No hay capas')
      await wrapper.setProps({ loading: true, items: ITEMS })
      expect(wrapper.find('[role="status"]').text()).toBe('Cargando…')
    })
  })

  describe("selección 'multiple'", () => {
    it('aria-checked de las hojas y el grupo a medias (mixed)', () => {
      const wrapper = mount(ASTreeList, {
        props: { items: ITEMS, label: 'Capas', modelValue: ['E'] },
      })
      expect(item(wrapper, 'SAIH').attributes('aria-checked')).toBe('mixed')
      expect(item(wrapper, 'Embalses').attributes('aria-checked')).toBe('true')
      expect(item(wrapper, 'Subcuencas').attributes('aria-checked')).toBe('false')
    })

    it('clic en una hoja la añade; la casilla del grupo marca sus hojas seleccionables', async () => {
      const wrapper = mount(ASTreeList, { props: { items: ITEMS, label: 'Capas' } })
      await item(wrapper, 'Subcuencas').trigger('click')
      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([['subcuencas']])
      await item(wrapper, 'SAIH').find('.as-tree-list__check').trigger('click')
      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([['subcuencas', 'AR']])
      expect(wrapper.emitted('node-click')![0]![0]).toMatchObject({ id: 'subcuencas' })
    })

    it('una hoja deshabilitada no se selecciona', async () => {
      const wrapper = mount(ASTreeList, { props: { items: ITEMS, label: 'Capas' } })
      await item(wrapper, 'Embalses').trigger('click')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('con v-model manda la prop', async () => {
      const wrapper = mount(ASTreeList, {
        props: { items: ITEMS, label: 'Capas', modelValue: [] },
      })
      await item(wrapper, 'Subcuencas').trigger('click')
      expect(item(wrapper, 'Subcuencas').attributes('aria-checked')).toBe('false')
      await wrapper.setProps({ modelValue: ['subcuencas'] })
      expect(item(wrapper, 'Subcuencas').attributes('aria-checked')).toBe('true')
    })
  })

  describe("selección 'single' y 'none'", () => {
    it("'single': aria-selected en las hojas; elegir otra la sustituye y repetir la quita", async () => {
      const wrapper = mount(ASTreeList, {
        props: { items: ITEMS, label: 'Capas', selection: 'single', modelValue: ['AR'] },
      })
      expect(wrapper.find('[role="tree"]').attributes('aria-multiselectable')).toBeUndefined()
      expect(item(wrapper, 'Aforo en río').attributes('aria-selected')).toBe('true')
      expect(item(wrapper, 'SAIH').attributes('aria-selected')).toBeUndefined()
      await item(wrapper, 'Subcuencas').trigger('click')
      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([['subcuencas']])
      await item(wrapper, 'Aforo en río').trigger('click')
      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([[]])
    })

    it("'none': sin casillas; la hoja solo emite node-click", async () => {
      const wrapper = mount(ASTreeList, {
        props: { items: ITEMS, label: 'Capas', selection: 'none' },
      })
      expect(wrapper.find('.as-tree-list__check').exists()).toBe(false)
      await item(wrapper, 'Subcuencas').trigger('click')
      expect(wrapper.emitted('node-click')).toHaveLength(1)
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })
  })

  describe('desplegar', () => {
    it('clic en un grupo lo pliega o despliega, emite update:expanded y expand al abrir', async () => {
      const wrapper = mount(ASTreeList, { props: { items: ITEMS, label: 'Capas' } })
      await item(wrapper, 'SAIH').trigger('click')
      expect(wrapper.emitted('update:expanded')!.at(-1)).toEqual([[]])
      expect(items(wrapper)).toHaveLength(3)
      await item(wrapper, 'Eventos').trigger('click')
      expect(wrapper.emitted('expand')![0]![0]).toMatchObject({ id: 'eventos' })
      expect(wrapper.find('.as-tree-list__item--empty').text()).toBe('No hay eventos')
    })

    it('con v-model:expanded manda la prop', () => {
      const wrapper = mount(ASTreeList, {
        props: { items: ITEMS, label: 'Capas', expanded: ['eventos'] },
      })
      expect(item(wrapper, 'SAIH').attributes('aria-expanded')).toBe('false')
      expect(item(wrapper, 'Eventos').attributes('aria-expanded')).toBe('true')
    })
  })

  describe('teclado', () => {
    it('↓/↑ mueven el foco itinerante; Inicio/Fin a los extremos', async () => {
      const wrapper = mount(ASTreeList, {
        props: { items: ITEMS, label: 'Capas' },
        attachTo: document.body,
      })
      await press(wrapper, 'Subcuencas', 'ArrowDown')
      expect(item(wrapper, 'SAIH').attributes('tabindex')).toBe('0')
      await press(wrapper, 'SAIH', 'End')
      expect(item(wrapper, 'Eventos').attributes('tabindex')).toBe('0')
      await press(wrapper, 'Eventos', 'Home')
      expect(item(wrapper, 'Subcuencas').attributes('tabindex')).toBe('0')
      await press(wrapper, 'Subcuencas', 'ArrowUp')
      expect(item(wrapper, 'Subcuencas').attributes('tabindex')).toBe('0')
      wrapper.unmount()
    })

    it('← pliega o sube al grupo; → despliega o entra en el primer hijo', async () => {
      const wrapper = mount(ASTreeList, {
        props: { items: ITEMS, label: 'Capas' },
        attachTo: document.body,
      })
      await item(wrapper, 'Aforo en río').trigger('focus')
      await press(wrapper, 'Aforo en río', 'ArrowLeft')
      expect(item(wrapper, 'SAIH').attributes('tabindex')).toBe('0')
      await press(wrapper, 'SAIH', 'ArrowLeft')
      expect(item(wrapper, 'SAIH').attributes('aria-expanded')).toBe('false')
      await press(wrapper, 'SAIH', 'ArrowRight')
      expect(item(wrapper, 'SAIH').attributes('aria-expanded')).toBe('true')
      await press(wrapper, 'SAIH', 'ArrowRight')
      expect(item(wrapper, 'Aforo en río').attributes('tabindex')).toBe('0')
      wrapper.unmount()
    })

    it('Espacio selecciona (también un grupo); Intro despliega un grupo', async () => {
      const wrapper = mount(ASTreeList, { props: { items: ITEMS, label: 'Capas' } })
      await press(wrapper, 'Subcuencas', ' ')
      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([['subcuencas']])
      await item(wrapper, 'SAIH').trigger('focus')
      await press(wrapper, 'SAIH', ' ')
      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([['subcuencas', 'AR']])
      await press(wrapper, 'SAIH', 'Enter')
      expect(item(wrapper, 'SAIH').attributes('aria-expanded')).toBe('false')
    })
  })

  describe('opacidad, acciones y slot', () => {
    it('slider de opacidad solo con la hoja seleccionada; emite update:opacities de 0 a 1', async () => {
      const wrapper = mount(ASTreeList, { props: { items: ITEMS, label: 'Capas' } })
      expect(wrapper.find('input[type="range"]').exists()).toBe(false)
      await wrapper.setProps({ modelValue: ['subcuencas'], opacities: { subcuencas: 0.6 } })
      const slider = wrapper.find('input[type="range"]')
      expect((slider.element as HTMLInputElement).value).toBe('60')
      expect(wrapper.find('.as-tree-list__extra label').text()).toBe('Opacidad de Subcuencas')
      await slider.setValue('30')
      expect(wrapper.emitted('update:opacities')).toEqual([[{ subcuencas: 0.3 }]])
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('las acciones emiten node-action sin seleccionar la fila', async () => {
      const withActions: TreeNode[] = [
        {
          id: 'evento-1',
          label: 'Avenida 2023',
          actions: [{ id: 'borrar', label: 'Borrar', icon: 'M0 0', danger: true }],
        },
      ]
      const wrapper = mount(ASTreeList, { props: { items: withActions, label: 'Eventos' } })
      const button = wrapper.find('.as-tree-list__action')
      expect(button.attributes('aria-label')).toBe('Borrar')
      await button.trigger('click')
      expect(wrapper.emitted('node-action')).toEqual([[{ node: withActions[0], action: 'borrar' }]])
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('loading: indicador en lugar de la casilla, aria-busy y no se selecciona', async () => {
      const wrapper = mount(ASTreeList, {
        props: { items: [{ id: 'x', label: 'X', loading: true }], label: 'L' },
      })
      expect(wrapper.find('.as-tree-list__spinner').exists()).toBe(true)
      expect(items(wrapper)[0]!.attributes('aria-busy')).toBe('true')
      await items(wrapper)[0]!.trigger('click')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('el slot #node cambia el contenido sin perder el nombre accesible', () => {
      const wrapper = mount(ASTreeList, {
        props: { items: ITEMS, label: 'Capas' },
        slots: {
          node: '<template #node="{ node, level }">{{ node.label }} · {{ level }}</template>',
        },
      })
      const aforo = items(wrapper)[2]!
      expect(wrapper.find(`#${aforo.attributes('aria-labelledby')}`).text()).toBe(
        'Aforo en río · 2',
      )
    })
  })
})
