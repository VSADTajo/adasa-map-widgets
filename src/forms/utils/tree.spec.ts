import { describe, expect, it } from 'vitest'
import type { TreeNode } from '@/forms/types/TreeListProps'
import {
  checkState,
  defaultExpandedIds,
  findNode,
  isGroup,
  leafIds,
  toggleNode,
  visibleRows,
} from './tree'

const TREE: TreeNode[] = [
  { id: 'subcuencas', label: 'Subcuencas' },
  {
    id: 'saih',
    label: 'SAIH',
    defaultExpanded: true,
    children: [
      { id: 'AR', label: 'Aforo en río' },
      { id: 'AC', label: 'Aforo en canal' },
      { id: 'E', label: 'Embalses', disabled: true },
      {
        id: 'pluvio',
        label: 'Pluviómetros',
        defaultExpanded: true,
        children: [
          { id: 'P1', label: 'P1' },
          { id: 'P2', label: 'P2', loading: true },
        ],
      },
    ],
  },
  { id: 'eventos', label: 'Eventos', children: [], emptyText: 'No hay eventos' },
]
const saih = TREE[1]!

describe('leafIds e isGroup', () => {
  it('hojas de un nodo, de un grupo anidado y de una lista; un grupo vacío no tiene', () => {
    expect(leafIds(TREE[0]!)).toEqual(['subcuencas'])
    expect(leafIds(saih)).toEqual(['AR', 'AC', 'E', 'P1', 'P2'])
    expect(leafIds(TREE)).toEqual(['subcuencas', 'AR', 'AC', 'E', 'P1', 'P2'])
    expect(leafIds(TREE[2]!)).toEqual([])
  })

  it('un grupo es el que tiene children, aunque esté vacío', () => {
    expect(TREE.map(isGroup)).toEqual([false, true, true])
  })
})

describe('checkState', () => {
  it.each([
    [[], 'unchecked'],
    [['AR'], 'mixed'],
    [['AR', 'AC', 'E', 'P1', 'P2'], 'checked'],
  ] as const)('grupo con %j → %s', (selected, expected) => {
    expect(checkState(saih, selected)).toBe(expected)
  })

  it('hoja marcada o no; grupo vacío, desmarcado', () => {
    expect(checkState(TREE[0]!, ['subcuencas'])).toBe('checked')
    expect(checkState(TREE[0]!, [])).toBe('unchecked')
    expect(checkState(TREE[2]!, ['subcuencas'])).toBe('unchecked')
  })
})

describe('toggleNode', () => {
  describe("'multiple'", () => {
    it('una hoja se añade o se quita, sin tocar el resto', () => {
      expect(toggleNode(TREE[0]!, ['AR'])).toEqual(['AR', 'subcuencas'])
      expect(toggleNode(TREE[0]!, ['AR', 'subcuencas'])).toEqual(['AR'])
    })

    it('un grupo marca las hojas seleccionables (ni deshabilitadas ni cargando)', () => {
      expect(toggleNode(saih, ['subcuencas'])).toEqual(['subcuencas', 'AR', 'AC', 'P1'])
    })

    it('con todas sus hojas seleccionables marcadas, las quita (y deja las deshabilitadas)', () => {
      expect(toggleNode(saih, ['AR', 'AC', 'P1', 'E'])).toEqual(['E'])
    })

    it('una hoja deshabilitada, cargando o dentro de un grupo deshabilitado no cambia', () => {
      const off: TreeNode = {
        id: 'g',
        label: 'G',
        disabled: true,
        children: [{ id: 'x', label: 'X' }],
      }
      expect(toggleNode(findNode(TREE, 'E')!, [])).toEqual([])
      expect(toggleNode(findNode(TREE, 'P2')!, [])).toEqual([])
      expect(toggleNode(off, [])).toEqual([])
    })
  })

  describe("'single'", () => {
    it('la hoja pasa a ser la única; pulsarla otra vez la quita', () => {
      expect(toggleNode(TREE[0]!, ['AR'], 'single')).toEqual(['subcuencas'])
      expect(toggleNode(TREE[0]!, ['subcuencas'], 'single')).toEqual([])
    })

    it('sin deselectable, pulsar la seleccionada no cambia nada', () => {
      expect(toggleNode(TREE[0]!, ['subcuencas'], 'single', false)).toEqual(['subcuencas'])
    })

    it('un grupo no cambia la selección', () => {
      expect(toggleNode(saih, ['AR'], 'single')).toEqual(['AR'])
    })
  })

  it("'none' no cambia nada", () => {
    expect(toggleNode(TREE[0]!, ['AR'], 'none')).toEqual(['AR'])
  })
})

describe('findNode y defaultExpandedIds', () => {
  it('encuentra un nodo a cualquier profundidad', () => {
    expect(findNode(TREE, 'P2')?.label).toBe('P2')
    expect(findNode(TREE, 'no')).toBeUndefined()
  })

  it('reúne los grupos con defaultExpanded, también anidados', () => {
    expect(defaultExpandedIds(TREE)).toEqual(['saih', 'pluvio'])
  })
})

describe('visibleRows', () => {
  it('con todo plegado, solo el primer nivel, con su posición entre hermanos', () => {
    expect(
      visibleRows(TREE, []).map((row) => [row.key, row.level, row.position, row.size]),
    ).toEqual([
      ['subcuencas', 1, 1, 3],
      ['saih', 1, 2, 3],
      ['eventos', 1, 3, 3],
    ])
  })

  it('los grupos desplegados muestran sus hijos con nivel y padre', () => {
    const rows = visibleRows(TREE, ['saih', 'pluvio'])
    expect(rows.map((row) => row.key)).toEqual([
      'subcuencas',
      'saih',
      'AR',
      'AC',
      'E',
      'pluvio',
      'P1',
      'P2',
      'eventos',
    ])
    expect(rows.find((row) => row.key === 'P1')).toMatchObject({ level: 3, parent: 'pluvio' })
  })

  it('un grupo vacío desplegado añade la fila de su emptyText (si lo tiene)', () => {
    const rows = visibleRows(TREE, ['eventos'])
    expect(rows.at(-1)).toMatchObject({ key: 'eventos::empty', kind: 'empty', level: 2 })
    const sinTexto: TreeNode[] = [{ id: 'g', label: 'G', children: [] }]
    expect(visibleRows(sinTexto, ['g'])).toHaveLength(1)
  })
})
