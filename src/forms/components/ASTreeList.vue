<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import ASIcon from '@/core/components/ASIcon.vue'
import { ICONS } from '@/core/icons/icons'
import { useFieldId } from '@/core/composables/useFieldId'
import { useLocale } from '@/core/composables/useLocale'
import { useResolvedTheme } from '@/core/composables/useTheme'
import type {
  TreeCheckState,
  TreeListEmits,
  TreeListProps,
  TreeNode,
} from '@/forms/types/TreeListProps'
import {
  checkState,
  defaultExpandedIds,
  isGroup,
  toggleNode,
  visibleRows,
  type TreeRow,
} from '@/forms/utils/tree'
import ASIconButton from './ASIconButton.vue'
import ASSlider from './ASSlider.vue'

/**
 * Árbol con selección: capas de un mapa, estaciones por tipo, escenarios...
 * Los grupos se despliegan y, en `'multiple'`, su casilla marca o desmarca
 * todas sus hojas (y queda a medias si solo hay algunas). Las hojas pueden
 * llevar icono, muestra de color, contador, acciones y slider de opacidad.
 *
 * Controlado: `v-model` son los ids de las hojas seleccionadas;
 * `v-model:expanded` y `v-model:opacities` son opcionales (sin ellos, guarda
 * su propio estado). No sabe nada de mapas ni de stores: la lógica del
 * proyecto (p. ej. capas excluyentes entre grupos) va en el `set` de su `v-model`.
 *
 * Teclado (patrón *tree* de WAI-ARIA, un solo punto de tabulación):
 * ↑/↓ entre filas, → despliega o entra, ← pliega o sube al grupo,
 * Inicio/Fin, Espacio selecciona e Intro despliega un grupo o activa una hoja.
 * Tab desde una fila pasa a su slider y sus botones.
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
const props = withDefaults(defineProps<TreeListProps>(), {
  modelValue: undefined,
  selection: 'multiple',
  deselectable: true,
  expanded: undefined,
  opacities: undefined,
  emptyText: undefined,
  loading: false,
  dense: false,
  theme: undefined,
})

const emit = defineEmits<TreeListEmits>()
const theme = useResolvedTheme(() => props.theme, null)
const { t, formatNumber } = useLocale()
const baseId = useFieldId(() => undefined, 'as-tree')

// Estado propio para lo que el proyecto no controle: la prop manda si existe.
const internalSelected = ref<string[]>(props.modelValue ?? [])
const internalExpanded = ref<string[]>(props.expanded ?? defaultExpandedIds(props.items))
const internalOpacities = ref<Record<string, number>>(props.opacities ?? {})
const selected = computed(() => props.modelValue ?? internalSelected.value)
const expandedIds = computed(() => props.expanded ?? internalExpanded.value)
const opacityOf = (id: string): number => (props.opacities ?? internalOpacities.value)[id] ?? 1

const rows = computed(() => visibleRows(props.items, expandedIds.value))

/** Fila con el foco itinerante (la única con tabindex 0). */
const focusKey = ref<string | null>(null)
const activeKey = computed(() => {
  const keys = rows.value.map((row) => row.key)
  return focusKey.value && keys.includes(focusKey.value) ? focusKey.value : (keys[0] ?? null)
})
const tree = ref<HTMLElement | null>(null)

const rowId = (key: string): string => `${baseId.value}-${key.replace(/[^\w-]/g, '_')}`

function stateOf(node: TreeNode): TreeCheckState {
  return checkState(node, selected.value)
}

function isExpanded(node: TreeNode): boolean {
  return isGroup(node) && expandedIds.value.includes(node.id)
}

/** Se puede marcar: ni deshabilitada ni cargando, y con algún modo de selección. */
function canSelect(node: TreeNode): boolean {
  if (props.selection === 'none' || node.disabled || node.loading) return false
  return props.selection === 'multiple' || !isGroup(node)
}

const hasBadge = (node: TreeNode): boolean =>
  node.badge !== undefined && node.badge !== '' && node.badge !== 0

/** Slider de opacidad: en las hojas con `opacity` que estén seleccionadas. */
const showsOpacity = (node: TreeNode): boolean =>
  Boolean(node.opacity) && !isGroup(node) && selected.value.includes(node.id)

function setSelected(ids: string[]): void {
  internalSelected.value = ids
  emit('update:modelValue', ids)
}

function setExpanded(node: TreeNode, open: boolean): void {
  if (!isGroup(node) || isExpanded(node) === open) return
  const ids = open
    ? [...expandedIds.value, node.id]
    : expandedIds.value.filter((id) => id !== node.id)
  internalExpanded.value = ids
  emit('update:expanded', ids)
  if (open) emit('expand', node)
}

function toggleSelection(node: TreeNode): void {
  if (!canSelect(node)) return
  setSelected(toggleNode(node, selected.value, props.selection, props.deselectable))
}

/** Clic, Intro o Espacio sobre una hoja. */
function activateLeaf(node: TreeNode): void {
  emit('node-click', node)
  toggleSelection(node)
}

function setOpacity(node: TreeNode, percent: number): void {
  const next = { ...(props.opacities ?? internalOpacities.value), [node.id]: percent / 100 }
  internalOpacities.value = next
  emit('update:opacities', next)
}

function onRowClick(row: TreeRow): void {
  focusKey.value = row.key
  if (row.kind === 'empty') return
  if (isGroup(row.node)) setExpanded(row.node, !isExpanded(row.node))
  else activateLeaf(row.node)
}

function focusRow(key: string | undefined): void {
  if (!key) return
  focusKey.value = key
  void nextTick(() => document.getElementById(rowId(key))?.focus())
}

function onKeydown(event: KeyboardEvent): void {
  // Solo las teclas pulsadas sobre una fila: el slider y los botones tienen las suyas.
  const target = event.target as HTMLElement
  if (target.getAttribute('role') !== 'treeitem') return
  const index = rows.value.findIndex((row) => row.key === activeKey.value)
  const row = rows.value[index]
  if (!row) return
  const node = row.kind === 'node' ? row.node : undefined
  const handled = (): void => event.preventDefault()

  switch (event.key) {
    case 'ArrowDown':
      handled()
      focusRow(rows.value[index + 1]?.key)
      break
    case 'ArrowUp':
      handled()
      focusRow(rows.value[index - 1]?.key)
      break
    case 'Home':
      handled()
      focusRow(rows.value[0]?.key)
      break
    case 'End':
      handled()
      focusRow(rows.value.at(-1)?.key)
      break
    case 'ArrowRight':
      handled()
      if (!node || !isGroup(node)) break
      if (!isExpanded(node)) setExpanded(node, true)
      else focusRow(rows.value[index + 1]?.key)
      break
    case 'ArrowLeft':
      handled()
      if (node && isExpanded(node)) setExpanded(node, false)
      else focusRow(row.parent)
      break
    case 'Enter':
      handled()
      if (!node) break
      if (isGroup(node)) setExpanded(node, !isExpanded(node))
      else activateLeaf(node)
      break
    case ' ':
      handled()
      if (!node) break
      if (isGroup(node) && !canSelect(node)) setExpanded(node, !isExpanded(node))
      else if (isGroup(node)) toggleSelection(node)
      else activateLeaf(node)
      break
  }
}

// Si la fila enfocada desaparece (se plegó su grupo), el foco pasa a la que quede activa.
watch(rows, () => {
  if (focusKey.value && !rows.value.some((row) => row.key === focusKey.value)) {
    const inside = tree.value?.contains(document.activeElement)
    focusKey.value = activeKey.value
    if (inside && activeKey.value) focusRow(activeKey.value)
  }
})

/** `aria-checked` en 'multiple' (con `mixed`); `aria-selected` en las hojas de 'single'. */
function ariaState(node: TreeNode): Record<string, string | undefined> {
  if (props.selection === 'multiple') {
    const state = stateOf(node)
    return { 'aria-checked': state === 'mixed' ? 'mixed' : String(state === 'checked') }
  }
  if (props.selection === 'single' && !isGroup(node)) {
    return { 'aria-selected': String(selected.value.includes(node.id)) }
  }
  return {}
}

function describedBy(row: TreeRow): string | undefined {
  const node = row.node
  const ids = [
    node.description && `${rowId(row.key)}-desc`,
    hasBadge(node) && `${rowId(row.key)}-badge`,
    node.disabled && node.disabledReason && `${rowId(row.key)}-reason`,
  ].filter(Boolean)
  return ids.length ? ids.join(' ') : undefined
}

const percent = (value: number): string => `${formatNumber(value)} %`
</script>

<template>
  <div
    class="as-tree-list"
    :class="[theme && `as-tree-list--${theme}`, { 'as-tree-list--dense': props.dense }]"
  >
    <p v-if="props.loading" class="as-tree-list__status" role="status">
      {{ t('forms.loading') }}
    </p>
    <p v-else-if="props.items.length === 0" class="as-tree-list__status">
      <slot name="empty">{{ props.emptyText ?? t('treeList.empty') }}</slot>
    </p>
    <ul
      v-else
      ref="tree"
      class="as-tree-list__tree"
      role="tree"
      :aria-label="props.label"
      :aria-multiselectable="props.selection === 'multiple' || undefined"
      @keydown="onKeydown"
    >
      <template v-for="row in rows" :key="row.key">
        <li
          v-if="row.kind === 'empty'"
          :id="rowId(row.key)"
          class="as-tree-list__item as-tree-list__item--empty"
          role="treeitem"
          aria-disabled="true"
          :aria-level="row.level"
          :aria-posinset="row.position"
          :aria-setsize="row.size"
          :tabindex="row.key === activeKey ? 0 : -1"
          :style="{ '--as-tree-level': row.level }"
          @click="onRowClick(row)"
        >
          <span class="as-tree-list__row">{{ row.node.emptyText }}</span>
        </li>
        <li
          v-else
          :id="rowId(row.key)"
          class="as-tree-list__item"
          :class="{
            'as-tree-list__item--group': isGroup(row.node),
            'as-tree-list__item--selected': !isGroup(row.node) && selected.includes(row.node.id),
            'as-tree-list__item--disabled': row.node.disabled,
          }"
          role="treeitem"
          v-bind="ariaState(row.node)"
          :aria-expanded="isGroup(row.node) ? isExpanded(row.node) : undefined"
          :aria-disabled="row.node.disabled || undefined"
          :aria-busy="row.node.loading || undefined"
          :aria-level="row.level"
          :aria-posinset="row.position"
          :aria-setsize="row.size"
          :aria-labelledby="`${rowId(row.key)}-label`"
          :aria-describedby="describedBy(row)"
          :title="row.node.disabled ? row.node.disabledReason : undefined"
          :tabindex="row.key === activeKey ? 0 : -1"
          :style="{ '--as-tree-level': row.level }"
          @click="onRowClick(row)"
          @focus="focusKey = row.key"
        >
          <div class="as-tree-list__row">
            <ASIcon
              v-if="isGroup(row.node)"
              class="as-tree-list__chevron"
              :icon="ICONS.chevronRight"
              :size="18"
            />
            <span v-else class="as-tree-list__chevron-space" />

            <span v-if="row.node.loading" class="as-tree-list__spinner" aria-hidden="true" />
            <span
              v-else-if="props.selection === 'multiple'"
              class="as-tree-list__check"
              :class="`as-tree-list__check--${stateOf(row.node)}`"
              aria-hidden="true"
              @click.stop="toggleSelection(row.node)"
            >
              <ASIcon
                v-if="stateOf(row.node) !== 'unchecked'"
                :icon="stateOf(row.node) === 'mixed' ? ICONS.minus : ICONS.check"
                size="100%"
              />
            </span>
            <span
              v-else-if="props.selection === 'single' && !isGroup(row.node)"
              class="as-tree-list__radio"
              :class="{ 'as-tree-list__radio--on': selected.includes(row.node.id) }"
              aria-hidden="true"
            />

            <span
              v-if="row.node.swatch"
              class="as-tree-list__swatch"
              :style="{ background: row.node.swatch }"
              aria-hidden="true"
            />
            <ASIcon
              v-if="row.node.icon"
              class="as-tree-list__icon"
              :icon="row.node.icon"
              :size="18"
            />

            <span class="as-tree-list__text">
              <!-- El id va fuera del slot: el nombre accesible no se pierde al personalizarlo. -->
              <span :id="`${rowId(row.key)}-label`" class="as-tree-list__label">
                <slot
                  name="node"
                  :node="row.node"
                  :level="row.level"
                  :state="stateOf(row.node)"
                  :expanded="isExpanded(row.node)"
                >
                  {{ row.node.label }}
                </slot>
              </span>
              <span
                v-if="row.node.description"
                :id="`${rowId(row.key)}-desc`"
                class="as-tree-list__description"
              >
                {{ row.node.description }}
              </span>
              <span
                v-if="row.node.disabled && row.node.disabledReason"
                :id="`${rowId(row.key)}-reason`"
                class="as-tree-list__reason"
              >
                {{ row.node.disabledReason }}
              </span>
            </span>

            <span
              v-if="hasBadge(row.node)"
              :id="`${rowId(row.key)}-badge`"
              class="as-tree-list__badge"
            >
              {{ row.node.badge }}
            </span>

            <span
              v-if="row.node.actions?.length"
              class="as-tree-list__actions"
              @click.stop
              @keydown.stop
            >
              <ASIconButton
                v-for="action in row.node.actions"
                :key="action.id"
                class="as-tree-list__action"
                :class="{ 'as-tree-list__action--danger': action.danger }"
                variant="ghost"
                size="sm"
                :icon="action.icon"
                :label="action.label"
                :tabindex="row.key === activeKey ? 0 : -1"
                @click="emit('node-action', { node: row.node, action: action.id })"
              />
            </span>
          </div>

          <div v-if="showsOpacity(row.node)" class="as-tree-list__extra" @click.stop @keydown.stop>
            <ASSlider
              :model-value="Math.round(opacityOf(row.node.id) * 100)"
              :label="t('treeList.opacity', { label: row.node.label })"
              hide-label
              :step="5"
              :format="percent"
              :focusable="row.key === activeKey"
              @update:model-value="setOpacity(row.node, $event)"
            />
          </div>
        </li>
      </template>
    </ul>
  </div>
</template>

<style scoped>
.as-tree-list {
  --as-tree-row: 40px;
  --as-tree-indent: 20px;
  font-family: var(--as-font-family, system-ui, sans-serif);
  font-size: var(--as-font-size-sm, 0.875rem);
  color: var(--as-color-text, light-dark(#0f172a, #f1f5f9));
}

.as-tree-list--dark {
  color-scheme: dark;
}

.as-tree-list--light {
  color-scheme: light;
}

.as-tree-list--dense {
  --as-tree-row: 32px;
}

.as-tree-list__status {
  margin: 0;
  padding: var(--as-space-3, 12px) var(--as-space-2, 8px);
  color: var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
}

.as-tree-list__tree {
  margin: 0;
  padding: 0;
  list-style: none;
}

.as-tree-list__item {
  border-radius: var(--as-radius-sm, 4px);
  outline: none;
  cursor: pointer;
}

.as-tree-list__item:focus-visible {
  box-shadow: inset var(--as-focus-ring, 0 0 0 2px light-dark(#2563eb, #60a5fa));
}

.as-tree-list__row {
  display: flex;
  gap: var(--as-space-2, 8px);
  align-items: center;
  min-height: var(--as-tree-row);
  padding: 2px var(--as-space-1, 4px) 2px
    calc((var(--as-tree-level, 1) - 1) * var(--as-tree-indent) + var(--as-space-1, 4px));
  box-sizing: border-box;
  border-radius: inherit;
}

.as-tree-list__item:not(.as-tree-list__item--empty) > .as-tree-list__row:hover {
  background: var(--as-color-surface-muted, light-dark(#f1f5f9, #334155));
}

.as-tree-list__item--selected > .as-tree-list__row {
  font-weight: var(--as-font-weight-medium, 500);
}

.as-tree-list__item--disabled {
  cursor: not-allowed;
}

.as-tree-list__item--disabled > .as-tree-list__row {
  opacity: 0.55;
}

.as-tree-list__item--empty {
  cursor: default;
  color: var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
  font-size: var(--as-font-size-xs, 0.75rem);
  font-style: italic;
}

.as-tree-list__chevron,
.as-tree-list__chevron-space {
  flex: none;
  width: 18px;
  color: var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
  transition: transform 0.15s ease;
}

.as-tree-list__item[aria-expanded='true'] > .as-tree-list__row > .as-tree-list__chevron {
  transform: rotate(90deg);
}

/* Casilla y radio dibujados: el estado lo anuncia la fila (aria-checked / aria-selected). */
.as-tree-list__check,
.as-tree-list__radio,
.as-tree-list__spinner {
  flex: none;
  box-sizing: border-box;
  width: 18px;
  height: 18px;
}

.as-tree-list__check {
  display: grid;
  padding: 1px;
  border: 2px solid var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
  border-radius: var(--as-radius-sm, 4px);
  background: var(--as-color-surface, light-dark(#ffffff, #1e293b));
  color: var(--as-color-primary-contrast, light-dark(#ffffff, #0f172a));
}

.as-tree-list__check--checked,
.as-tree-list__check--mixed {
  border-color: var(--as-color-primary, light-dark(#2563eb, #60a5fa));
  background: var(--as-color-primary, light-dark(#2563eb, #60a5fa));
}

.as-tree-list__radio {
  border: 2px solid var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
  border-radius: 50%;
  background: var(--as-color-surface, light-dark(#ffffff, #1e293b));
}

.as-tree-list__radio--on {
  border-color: var(--as-color-primary, light-dark(#2563eb, #60a5fa));
  box-shadow: inset 0 0 0 3px var(--as-color-surface, light-dark(#ffffff, #1e293b));
  background: var(--as-color-primary, light-dark(#2563eb, #60a5fa));
}

.as-tree-list__spinner {
  border: 2px solid var(--as-color-border, light-dark(#cbd5e1, #475569));
  border-top-color: var(--as-color-primary, light-dark(#2563eb, #60a5fa));
  border-radius: 50%;
  animation: as-tree-list-spin 0.8s linear infinite;
}

@keyframes as-tree-list-spin {
  to {
    transform: rotate(360deg);
  }
}

.as-tree-list__swatch {
  flex: none;
  width: 12px;
  height: 12px;
  border-radius: 3px;
  /* Separa la muestra del fondo aunque el color se parezca. */
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.2);
}

.as-tree-list__icon {
  flex: none;
  color: var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
}

.as-tree-list__text {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.as-tree-list__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.as-tree-list__description,
.as-tree-list__reason {
  color: var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
  font-size: var(--as-font-size-xs, 0.75rem);
  font-weight: var(--as-font-weight-regular, 400);
}

.as-tree-list__badge {
  flex: none;
  min-width: 20px;
  padding: 0 6px;
  box-sizing: border-box;
  border-radius: var(--as-radius-full, 9999px);
  background: var(--as-color-surface-muted, light-dark(#f1f5f9, #334155));
  font-size: var(--as-font-size-xs, 0.75rem);
  font-weight: var(--as-font-weight-regular, 400);
  line-height: 20px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.as-tree-list__actions {
  display: flex;
  flex: none;
  gap: 2px;
}

.as-tree-list__action--danger {
  color: var(--as-color-danger, light-dark(#dc2626, #f87171));
}

.as-tree-list__extra {
  padding: 0 var(--as-space-3, 12px) var(--as-space-2, 8px)
    calc(
      (var(--as-tree-level, 1) - 1) * var(--as-tree-indent) + 18px + 18px + var(--as-space-4, 16px)
    );
  cursor: default;
}

@media (prefers-reduced-motion: reduce) {
  .as-tree-list__chevron {
    transition: none;
  }

  .as-tree-list__spinner {
    animation-duration: 2s;
  }
}
</style>
