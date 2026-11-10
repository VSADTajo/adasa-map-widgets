<script setup lang="ts">
import { computed, ref } from 'vue'
import ASIcon from '@/core/components/ASIcon.vue'
import { ICONS } from '@/core/icons/icons'
import { useFieldId } from '@/core/composables/useFieldId'
import { useResolvedTheme } from '@/core/composables/useTheme'
import type { CollapsibleEmits, CollapsibleProps } from '@/forms/types/CollapsibleProps'

/**
 * Sección plegable: una cabecera con su título y un chevron que muestra u
 * oculta el contenido. Sigue el patrón *disclosure* de WAI-ARIA: la cabecera
 * es un `<button aria-expanded>` dentro de un encabezado (`headingLevel`).
 *
 * Controlado con `v-model:open`; sin él, guarda su propio estado.
 * Cerrada, el contenido sigue montado (no pierde su estado) pero es inerte.
 *
 * @example
 * ```vue
 * <ASCollapsible title="Estaciones" :badge="activas.length">
 *   <ASTreeList v-model="activas" :items="estaciones" label="Capas de estaciones" />
 * </ASCollapsible>
 * ```
 */
const props = withDefaults(defineProps<CollapsibleProps>(), {
  open: undefined,
  defaultOpen: true,
  badge: undefined,
  headingLevel: 3,
  flat: false,
  id: undefined,
  theme: undefined,
})

const emit = defineEmits<CollapsibleEmits>()
const theme = useResolvedTheme(() => props.theme, null)
const contentId = useFieldId(() => props.id, 'as-collapsible')

const internal = ref(props.defaultOpen)
const isOpen = computed(() => props.open ?? internal.value)
const hasBadge = computed(
  () => props.badge !== undefined && props.badge !== '' && props.badge !== 0,
)

function toggle(): void {
  if (props.disabled) return
  const next = !isOpen.value
  internal.value = next
  emit('update:open', next)
}
</script>

<template>
  <section
    class="as-collapsible"
    :class="[
      theme && `as-collapsible--${theme}`,
      {
        'as-collapsible--open': isOpen,
        'as-collapsible--flat': props.flat,
        'as-collapsible--disabled': props.disabled,
      },
    ]"
  >
    <div class="as-collapsible__header">
      <component :is="`h${props.headingLevel}`" class="as-collapsible__heading">
        <button
          type="button"
          class="as-collapsible__trigger"
          :aria-expanded="isOpen"
          :aria-controls="contentId"
          :disabled="props.disabled"
          @click="toggle"
        >
          <span class="as-collapsible__title">{{ props.title }}</span>
          <span v-if="hasBadge" class="as-collapsible__badge">{{ props.badge }}</span>
          <ASIcon class="as-collapsible__chevron" :icon="ICONS.chevronDown" :size="20" />
        </button>
      </component>
      <div v-if="$slots.actions" class="as-collapsible__actions">
        <slot name="actions" />
      </div>
    </div>
    <!-- Rejilla de 0fr a 1fr: anima la altura sin medirla. -->
    <div :id="contentId" class="as-collapsible__panel" :inert="!isOpen || undefined">
      <div class="as-collapsible__content">
        <slot />
      </div>
    </div>
  </section>
</template>

<style scoped>
.as-collapsible {
  border: 1px solid var(--as-color-border, light-dark(#cbd5e1, #475569));
  border-radius: var(--as-radius, 10px);
  background: var(--as-color-surface, light-dark(#ffffff, #1e293b));
  color: var(--as-color-text, light-dark(#0f172a, #f1f5f9));
  font-family: var(--as-font-family, system-ui, sans-serif);
  font-size: var(--as-font-size-sm, 0.875rem);
}

.as-collapsible--dark {
  color-scheme: dark;
}

.as-collapsible--light {
  color-scheme: light;
}

.as-collapsible--flat {
  border: none;
  border-radius: 0;
  background: transparent;
}

.as-collapsible__header {
  display: flex;
  align-items: center;
}

.as-collapsible__heading {
  flex: 1;
  min-width: 0;
  margin: 0;
  font-size: inherit;
}

.as-collapsible__trigger {
  display: flex;
  gap: var(--as-space-2, 8px);
  align-items: center;
  width: 100%;
  padding: var(--as-space-2, 8px) var(--as-space-3, 12px);
  border: none;
  border-radius: inherit;
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: var(--as-font-weight-semibold, 600);
  text-align: left;
  cursor: pointer;
}

.as-collapsible--flat .as-collapsible__trigger {
  padding-inline: 0;
}

.as-collapsible__trigger:hover:not(:disabled) {
  background: var(--as-color-surface-muted, light-dark(#f1f5f9, #334155));
}

.as-collapsible__trigger:focus-visible {
  outline: none;
  box-shadow: var(--as-focus-ring, 0 0 0 2px light-dark(#2563eb, #60a5fa));
}

.as-collapsible__trigger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.as-collapsible__title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.as-collapsible__badge {
  min-width: 20px;
  padding: 0 6px;
  box-sizing: border-box;
  border-radius: var(--as-radius-full, 9999px);
  background: var(--as-color-surface-muted, light-dark(#f1f5f9, #334155));
  color: var(--as-color-text, light-dark(#0f172a, #f1f5f9));
  font-size: var(--as-font-size-xs, 0.75rem);
  line-height: 20px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.as-collapsible__chevron {
  color: var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
  transition: transform 0.2s ease;
}

.as-collapsible--open .as-collapsible__chevron {
  transform: rotate(180deg);
}

.as-collapsible__actions {
  display: flex;
  gap: var(--as-space-1, 4px);
  padding-right: var(--as-space-2, 8px);
}

.as-collapsible__panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.2s ease;
}

.as-collapsible--open .as-collapsible__panel {
  grid-template-rows: 1fr;
}

.as-collapsible__content {
  min-height: 0;
  overflow: hidden;
}

.as-collapsible--open .as-collapsible__content {
  padding: 0 var(--as-space-2, 8px) var(--as-space-2, 8px);
}

.as-collapsible--flat.as-collapsible--open .as-collapsible__content {
  padding-inline: 0;
}

@media (prefers-reduced-motion: reduce) {
  .as-collapsible__panel,
  .as-collapsible__chevron {
    transition: none;
  }
}
</style>
