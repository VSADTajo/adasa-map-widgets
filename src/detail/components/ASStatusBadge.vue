<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '@/core/composables/useLocale'
import type { MessageKey } from '@/core/i18n/messages'
import type { StatusBadgeProps } from '@/detail/types/StatusBadgeProps'

/**
 * Píldora de un nivel de aviso (normal, amarillo, naranja, rojo) con los
 * colores reservados de los tokens `--as-alert-*`. Siempre lleva texto: el
 * nombre del nivel o, con `label`, otro texto (un valor) más el nivel
 * oculto para los lectores de pantalla.
 *
 * @example
 * ```vue
 * <ASStatusBadge level="rojo" size="lg" />
 * ```
 */
const props = withDefaults(defineProps<StatusBadgeProps>(), {
  label: undefined,
  size: 'md',
})

const { t } = useLocale()
const levelName = computed(() => t(`detail.level.${props.level}` as MessageKey))
</script>

<template>
  <span
    class="as-status-badge"
    :class="[`as-status-badge--${props.level}`, `as-status-badge--${props.size}`]"
  >
    {{ props.label ?? levelName }}
    <span v-if="props.label" class="as-status-badge__sr-only">
      ({{ t('detail.levelName', { level: levelName.toLowerCase() }) }})
    </span>
  </span>
</template>

<style scoped>
.as-status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  height: 24px;
  padding: 0 var(--as-space-3, 12px);
  border-radius: var(--as-radius-sm, 4px);
  font-family: var(--as-font-family, system-ui, sans-serif);
  font-size: var(--as-font-size-xs, 0.75rem);
  font-weight: var(--as-font-weight-semibold, 600);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.as-status-badge--sm {
  height: 20px;
  padding: 0 var(--as-space-2, 8px);
}

.as-status-badge--lg {
  height: 36px;
  min-width: 128px;
  padding: 0 var(--as-space-4, 16px);
  font-size: var(--as-font-size-md, 1rem);
  font-weight: var(--as-font-weight-bold, 700);
}

.as-status-badge--normal {
  background-color: var(--as-alert-normal, #43a047);
  color: var(--as-alert-normal-text, #1a1a1a);
}

.as-status-badge--amarillo {
  background-color: var(--as-alert-amarillo, #ffd54f);
  color: var(--as-alert-amarillo-text, #2f2f2f);
}

.as-status-badge--naranja {
  background-color: var(--as-alert-naranja, #fb8c00);
  color: var(--as-alert-naranja-text, #1a1a1a);
}

.as-status-badge--rojo {
  background-color: var(--as-alert-rojo, #d32f2f);
  color: var(--as-alert-rojo-text, #ffffff);
}

.as-status-badge__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
