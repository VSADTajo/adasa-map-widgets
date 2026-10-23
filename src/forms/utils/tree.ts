import type { TreeCheckState, TreeNode, TreeSelection } from '@/forms/types/TreeListProps'

/*
 * Lógica pura de `ASTreeList`: qué hojas cuelgan de un nodo, el estado de
 * su casilla, qué selección resulta al pulsarlo y qué filas se ven. Se
 * exporta para que el proyecto calcule lo mismo fuera del componente (p. ej.
 * las capas visibles de un grupo para su store).
 */

/** Si el nodo es un grupo (tiene `children`, aunque esté vacío). */
export function isGroup(node: TreeNode): boolean {
  return Array.isArray(node.children)
}

/** Ids de todas las hojas de uno o varios nodos (una hoja devuelve su propio id). */
export function leafIds(nodes: TreeNode | TreeNode[]): string[] {
  const list = Array.isArray(nodes) ? nodes : [nodes]
  return list.flatMap((node) => (isGroup(node) ? leafIds(node.children!) : [node.id]))
}

/** Hojas que se pueden seleccionar (ni deshabilitadas ni cargando). */
function selectableLeaves(node: TreeNode, inherited = false): TreeNode[] {
  const blocked = inherited || Boolean(node.disabled)
  if (isGroup(node)) return node.children!.flatMap((child) => selectableLeaves(child, blocked))
  return blocked || node.loading ? [] : [node]
}

/**
 * Estado de la casilla: una hoja, marcada o no; un grupo, según sus hojas
 * (`mixed` si solo están algunas). Un grupo vacío está desmarcado.
 */
export function checkState(node: TreeNode, selected: readonly string[]): TreeCheckState {
  const ids = leafIds(node)
  const count = ids.filter((id) => selected.includes(id)).length
  if (count === 0) return 'unchecked'
  return count === ids.length ? 'checked' : 'mixed'
}

/**
 * Selección que resulta de pulsar un nodo.
 * - `'multiple'`: una hoja se añade o se quita; un grupo marca todas sus
 *   hojas seleccionables o, si ya lo estaban, las quita. Las deshabilitadas
 *   no cambian.
 * - `'single'`: la hoja pasa a ser la única; si ya lo era y `deselectable`, se quita.
 *   Un grupo no cambia la selección.
 * - `'none'`: nada cambia.
 */
export function toggleNode(
  node: TreeNode,
  selected: readonly string[],
  selection: TreeSelection = 'multiple',
  deselectable = true,
): string[] {
  const current = [...selected]
  if (selection === 'none') return current
  const leaves = selectableLeaves(node).map((leaf) => leaf.id)
  if (selection === 'single') {
    if (isGroup(node) || leaves.length === 0) return current
    if (current.includes(node.id)) return deselectable ? [] : current
    return [node.id]
  }
  if (leaves.length === 0) return current
  const allSelected = leaves.every((id) => current.includes(id))
  return allSelected
    ? current.filter((id) => !leaves.includes(id))
    : [...current, ...leaves.filter((id) => !current.includes(id))]
}

/** Busca un nodo por id en todo el árbol. */
export function findNode(nodes: TreeNode[], id: string): TreeNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node
    const found = isGroup(node) ? findNode(node.children!, id) : undefined
    if (found) return found
  }
  return undefined
}

/** Ids de los grupos con `defaultExpanded`. */
export function defaultExpandedIds(nodes: TreeNode[]): string[] {
  return nodes.flatMap((node) =>
    isGroup(node)
      ? [...(node.defaultExpanded ? [node.id] : []), ...defaultExpandedIds(node.children!)]
      : [],
  )
}

/** Una fila visible del árbol: un nodo, o el texto de un grupo vacío desplegado. */
export interface TreeRow {
  /** Id de la fila (el del nodo, o `<grupo>::empty`). */
  key: string
  node: TreeNode
  /** `'empty'`: la fila con el `emptyText` del grupo `node`. */
  kind: 'node' | 'empty'
  /** Profundidad, desde 1 (para `aria-level` y la sangría). */
  level: number
  /** Posición entre sus hermanos y cuántos son (`aria-posinset` / `aria-setsize`). */
  position: number
  size: number
  /** Id del grupo padre (para ← en el teclado). */
  parent?: string
}

/** Filas visibles, en orden, según los grupos desplegados. */
export function visibleRows(
  nodes: TreeNode[],
  expanded: readonly string[],
  level = 1,
  parent?: string,
): TreeRow[] {
  return nodes.flatMap((node, index) => {
    const row: TreeRow = {
      key: node.id,
      node,
      kind: 'node',
      level,
      position: index + 1,
      size: nodes.length,
      parent,
    }
    if (!isGroup(node) || !expanded.includes(node.id)) return [row]
    if (node.children!.length === 0) {
      return node.emptyText
        ? [
            row,
            {
              key: `${node.id}::empty`,
              node,
              kind: 'empty' as const,
              level: level + 1,
              position: 1,
              size: 1,
              parent: node.id,
            },
          ]
        : [row]
    }
    return [row, ...visibleRows(node.children!, expanded, level + 1, node.id)]
  })
}
