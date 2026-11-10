<script setup lang="ts">
import ASIcon from '@/core/components/ASIcon.vue'
import { ICONS } from '@/core/icons/icons'

/**
 * Ayuda y mensaje de error bajo un control (interno del dominio). Sus ids
 * (`<id>-hint`, `<id>-error`) son los que el control pone en
 * `aria-describedby` (ver `describedByOf`).
 */
defineProps<{
  id: string
  hint?: string
  error?: string | boolean
}>()
</script>

<template>
  <p v-if="hint" :id="`${id}-hint`" class="as-field-messages__hint">{{ hint }}</p>
  <p v-if="typeof error === 'string' && error" :id="`${id}-error`" class="as-field-messages__error">
    <ASIcon :path="ICONS.alertCircle" size="1.1em" />
    <span>{{ error }}</span>
  </p>
</template>

<style scoped>
.as-field-messages__hint,
.as-field-messages__error {
  margin: var(--as-space-1, 4px) 0 0;
  font-size: var(--as-font-size-xs, 0.75rem);
  line-height: var(--as-line-height-normal, 1.5);
}

.as-field-messages__hint {
  color: var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
}

.as-field-messages__error {
  display: flex;
  gap: var(--as-space-1, 4px);
  align-items: flex-start;
  color: var(--as-color-danger, light-dark(#dc2626, #f87171));
}

.as-field-messages__error :deep(.as-icon) {
  margin-top: 0.1em;
}
</style>
