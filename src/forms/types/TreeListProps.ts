import type { IconValue } from '@/core/types/icon'

/**
 * Un nodo de `ASTreeList`: una hoja (lo que se selecciona: una capa, una
 * estación, un escenario) o un grupo, si tiene `children`.
 *
 * @example
 * ```ts
 * const capas: TreeNode[] = [
 *   { id: 'subcuencas', label: 'Subcuencas', opacity: true },
 *   {
 *     id: 'saih',
 *     label: 'SAIH',
 *     children: [
 *       { id: 'AR', label: 'Aforo en río', swatch: '#2563eb' },
 *       { id: 'E', label: 'Embalses', icon: mdiWater },
 *     ],
 *   },
 *   { id: 'eventos', label: 'Eventos pasados', children: [], emptyText: 'No hay eventos guardados' },
 * ]
 * ```
 */
export interface TreeNode {
  /** Id único en todo el árbol. En las hojas, es lo que va en `v-model`. */
  id: string
  /** Texto de la fila (y su nombre accesible). */
  label: string
  /** Segunda línea, más pequeña (p. ej. "Aforo · 3E01"). */
  description?: string
  /** Icono delante del texto (ver `IconValue`). */
  icon?: IconValue
  /** Muestra de color delante del texto (un color CSS), como en una leyenda. */
  swatch?: string
  /**
   * Hijos: lo convierten en grupo. `[]` es un grupo vacío, que al
   * desplegarse muestra `emptyText`.
   */
  children?: TreeNode[]
  /** Texto de un grupo sin hijos (p. ej. "No hay eventos guardados"). */
  emptyText?: string
  /**
   * Desplegado al montar, cuando `expanded` no se controla desde fuera.
   * @default false
   */
  defaultExpanded?: boolean
  /** Se ve, se puede enfocar, pero no se puede seleccionar. @default false */
  disabled?: boolean
  /** Por qué está deshabilitado: se muestra como tooltip y se anuncia. */
  disabledReason?: string
  /** Contador al final de la fila (p. ej. estaciones con aviso). `0` o vacío no se muestra. */
  badge?: number | string
  /**
   * Cargando: un indicador ocupa el lugar de la casilla y no se puede
   * seleccionar (p. ej. mientras se pide un escenario).
   * @default false
   */
  loading?: boolean
  /**
   * Muestra un slider de opacidad bajo la hoja mientras está seleccionada
   * (`v-model:opacities`).
   * @default false
   */
  opacity?: boolean
  /** Botones de la fila (borrar, zoom a la capa, descargar...): emiten `node-action`. */
  actions?: TreeNodeAction[]
}

/** Botón de una fila de `ASTreeList`. */
export interface TreeNodeAction {
  /** Id de la acción, que llega en `node-action`. */
  id: string
  /** Nombre accesible y tooltip del botón. */
  label: string
  /** Icono (ver `IconValue`). */
  icon: IconValue
  /** Acción destructiva (p. ej. borrar): en el color de peligro. @default false */
  danger?: boolean
}

/**
 * Cómo se selecciona en `ASTreeList`:
 * - `'multiple'`: casillas; la de un grupo marca o desmarca todas sus hojas y
 *   queda a medias (`mixed`) si solo hay algunas.
 * - `'single'`: una hoja a la vez (radios); los grupos solo se despliegan.
 * - `'none'`: solo lista, sin casillas (las hojas emiten `node-click`).
 */
export type TreeSelection = 'multiple' | 'single' | 'none'

/** Estado de la casilla de un nodo: el de un grupo sale de sus hojas. */
export type TreeCheckState = 'checked' | 'unchecked' | 'mixed'

/**
 * Props de `ASTreeList`.
 *
 * @example
 * ```vue
 * <ASTreeList
 *   v-model="capasActivas"
 *   v-model:opacities="opacidades"
 *   :items="capas"
 *   label="Capas"
 *   @node-action="onAccion"
 * />
 * ```
 */
export interface TreeListProps {
  /** Nodos de primer nivel (ver `TreeNode`). */
  items: TreeNode[]
  /**
   * Ids de las HOJAS seleccionadas (`v-model`). El estado de los grupos se
   * calcula a partir de ellas. Sin él, el árbol guarda su propia selección.
   */
  modelValue?: string[]
  /**
   * Modo de selección (ver `TreeSelection`).
   * @default 'multiple'
   */
  selection?: TreeSelection
  /**
   * En `'single'`, pulsar la hoja seleccionada la deselecciona.
   * @default true
   */
  deselectable?: boolean
  /**
   * Grupos desplegados (`v-model:expanded`). Sin él, el árbol guarda su
   * propio estado, que empieza en los `defaultExpanded` de los nodos.
   */
  expanded?: string[]
  /**
   * Opacidad de cada hoja con `opacity: true`, de 0 a 1 (`v-model:opacities`).
   * Las que no estén valen 1.
   */
  opacities?: Record<string, number>
  /** Nombre accesible del árbol (p. ej. "Capas de estaciones"). */
  label: string
  /** Texto cuando `items` está vacío. Por defecto, "Sin elementos". */
  emptyText?: string
  /**
   * Cargando: sustituye la lista por un aviso de carga.
   * @default false
   */
  loading?: boolean
  /**
   * Filas más bajas (32 px en vez de 40), para listas largas.
   * @default false
   */
  dense?: boolean
  /**
   * Tema. Sin prop, el de `provideTheme`; si tampoco hay, el del contenedor.
   */
  theme?: 'light' | 'dark'
}

/** Eventos de `ASTreeList`. */
export interface TreeListEmits {
  /** Nueva selección: ids de hojas (para `v-model`). */
  'update:modelValue': [ids: string[]]
  /** Grupos desplegados (para `v-model:expanded`). */
  'update:expanded': [ids: string[]]
  /** Opacidades (para `v-model:opacities`). */
  'update:opacities': [opacities: Record<string, number>]
  /** Se desplegó un grupo: p. ej. para pedir sus hijos al abrirlo. */
  expand: [node: TreeNode]
  /** Se activó una hoja (clic, Intro o Espacio), en cualquier modo de selección. */
  'node-click': [node: TreeNode]
  /** Se pulsó un botón de una fila. */
  'node-action': [event: { node: TreeNode; action: string }]
}

/** Props del slot `#node` de `ASTreeList` (el contenido de una fila). */
export interface TreeNodeSlotProps {
  node: TreeNode
  /** Profundidad: 1 en el primer nivel. */
  level: number
  state: TreeCheckState
  expanded: boolean
}
