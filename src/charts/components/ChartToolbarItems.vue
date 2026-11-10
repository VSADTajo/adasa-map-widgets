<script setup lang="ts">
import { useLocale } from '@/core/composables/useLocale'
import ASButton from '@/forms/components/ASButton.vue'
import ASIconButton from '@/forms/components/ASIconButton.vue'
import ASMenu from '@/forms/components/ASMenu.vue'
import type { MenuEntry, MenuItem } from '@/forms/types/MenuProps'
import type {
  ChartToolbarActionEvent,
  ChartToolbarChangeEvent,
  ChartToolbarItem,
  ChartToolbarMenu,
  ChartToolbarSelect,
} from '@/charts/types/chart'

/**
 * Elementos propios de la barra de herramientas de una gráfica (interno del
 * dominio): botones, selectores, menús, etiquetas y datos destacados, a
 * partir de `toolbar.items`. Son controlados: emiten la acción o el valor
 * nuevo y la gráfica lo reenvía como `toolbar-action` / `toolbar-change`.
 */
const props = defineProps<{ items: ChartToolbarItem[] }>()
const emit = defineEmits<{
  action: [event: ChartToolbarActionEvent]
  change: [event: ChartToolbarChangeEvent]
}>()

const { t, formatNumber, formatUnit } = useLocale()
const SELECT_ALL = '__as-select-all'

const selected = (item: ChartToolbarSelect): string[] =>
  Array.isArray(item.value) ? item.value : [item.value]

/** Opciones elegibles (no deshabilitadas) de un selector. */
const enabledValues = (item: ChartToolbarSelect) =>
  item.options.filter((option) => !option.disabled).map((option) => option.value)

function selectEntries(item: ChartToolbarSelect): MenuEntry[] {
  const values = selected(item)
  const options: MenuEntry[] = item.options.map((option) => ({
    id: option.value,
    label: option.label,
    disabled: option.disabled,
    type: item.multiple ? 'checkbox' : 'radio',
    checked: values.includes(option.value),
  }))
  if (!item.multiple || !item.selectAll) return options
  const enabled = enabledValues(item)
  return [
    {
      id: SELECT_ALL,
      label: t('chart.selectAll'),
      type: 'checkbox',
      checked: enabled.length > 0 && enabled.every((value) => values.includes(value)),
    },
    { type: 'separator', id: `${SELECT_ALL}-separator` },
    ...options,
  ]
}

function selectBadge(item: ChartToolbarSelect): string | number | undefined {
  if (!item.showCount) return undefined
  if (item.multiple) return selected(item).length
  return item.options.find((option) => option.value === item.value)?.label
}

function onSelect(item: ChartToolbarSelect, entry: MenuItem): void {
  const values = selected(item)
  if (!item.multiple) {
    emit('change', { id: item.id, value: entry.id })
    return
  }
  let next: string[]
  if (entry.id === SELECT_ALL) {
    const enabled = enabledValues(item)
    const allOn = enabled.every((value) => values.includes(value))
    next = allOn
      ? values.filter((value) => !enabled.includes(value))
      : [...new Set([...values, ...enabled])]
  } else {
    next = values.includes(entry.id)
      ? values.filter((value) => value !== entry.id)
      : [...values, entry.id]
  }
  // Mismo orden que las opciones, para que el valor no dependa del orden de los clics.
  emit('change', {
    id: item.id,
    value: item.options.map((o) => o.value).filter((value) => next.includes(value)),
  })
}

function menuEntries(item: ChartToolbarMenu): MenuEntry[] {
  return item.items.map((entry) =>
    entry.pressed === undefined
      ? { ...entry, type: 'action' as const }
      : { ...entry, type: 'checkbox' as const, checked: entry.pressed },
  )
}

const isMenuActive = (item: ChartToolbarMenu) => item.items.some((entry) => entry.pressed)

function formatValue(value: number | null, unit?: string): string {
  return unit ? formatUnit(value, unit) : formatNumber(value)
}
</script>

<template>
  <template v-for="item in props.items" :key="item.id">
    <template v-if="item.type === 'button'">
      <span :title="item.disabled ? item.disabledReason : undefined" class="as-chart-tools__slot">
        <ASIconButton
          v-if="item.icon"
          :icon="item.icon"
          :label="item.label"
          size="sm"
          :pressed="item.pressed"
          :disabled="item.disabled"
          @click="emit('action', { id: item.id })"
        />
        <ASButton
          v-else
          variant="ghost"
          size="sm"
          :disabled="item.disabled"
          :aria-pressed="item.pressed"
          :class="{ 'as-chart-tools__pressed': item.pressed }"
          @click="emit('action', { id: item.id })"
        >
          {{ item.label }}
        </ASButton>
      </span>
    </template>

    <ASMenu
      v-else-if="item.type === 'select'"
      :label="item.label"
      :icon="item.icon"
      :icon-only="Boolean(item.icon)"
      :badge="selectBadge(item)"
      size="sm"
      :disabled="item.disabled"
      :disabled-reason="item.disabledReason"
      :items="selectEntries(item)"
      @select="onSelect(item, $event)"
    />

    <ASMenu
      v-else-if="item.type === 'menu'"
      :label="item.label"
      :icon="item.icon"
      :icon-only="Boolean(item.icon)"
      size="sm"
      :active="isMenuActive(item)"
      :disabled="item.disabled"
      :disabled-reason="item.disabledReason"
      :items="menuEntries(item)"
      @select="emit('action', { id: item.id, itemId: $event.id })"
    />

    <span
      v-else-if="item.type === 'chip'"
      class="as-chart-tools__chip"
      :class="`as-chart-tools__chip--${item.tone ?? 'neutral'}`"
    >
      {{ item.label }}
    </span>

    <span v-else-if="item.type === 'info'" class="as-chart-tools__info">
      <strong v-if="item.label" class="as-chart-tools__info-title">{{ item.label }}</strong
      >{{ ' ' }}
      <span v-for="entry in item.values" :key="entry.label">
        {{ entry.label }}: <strong>{{ formatValue(entry.value, entry.unit) }}</strong
        >{{ ' ' }}
      </span>
    </span>
  </template>
</template>

<style scoped>
.as-chart-tools__slot {
  display: inline-flex;
}

.as-chart-tools__pressed {
  --as-button-bg: color-mix(
    in srgb,
    var(--as-color-primary, light-dark(#2563eb, #60a5fa)) 18%,
    transparent
  );
  --as-button-fg: var(--as-color-primary, light-dark(#2563eb, #60a5fa));
}

.as-chart-tools__chip {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 var(--as-space-2, 8px);
  border-radius: var(--as-radius-full, 9999px);
  font-size: var(--as-font-size-xs, 0.75rem);
  font-weight: var(--as-font-weight-semibold, 600);
  white-space: nowrap;
}

.as-chart-tools__chip--neutral {
  background-color: var(--as-color-surface-muted, light-dark(#f1f5f9, #334155));
  color: var(--as-color-text, light-dark(#0f172a, #f1f5f9));
}

.as-chart-tools__chip--primary {
  background-color: var(--as-color-primary, light-dark(#2563eb, #60a5fa));
  color: var(--as-color-primary-contrast, light-dark(#ffffff, #0f172a));
}

.as-chart-tools__info {
  display: inline-flex;
  flex-wrap: wrap;
  gap: var(--as-space-1, 4px) var(--as-space-3, 12px);
  align-items: center;
  padding: 2px var(--as-space-3, 12px);
  border-radius: var(--as-radius-full, 9999px);
  background-color: var(--as-color-surface-muted, light-dark(#f1f5f9, #334155));
  font-size: var(--as-font-size-xs, 0.75rem);
  font-variant-numeric: tabular-nums;
}

.as-chart-tools__info-title {
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
</style>
