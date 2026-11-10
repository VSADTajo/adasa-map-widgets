<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { useFieldId } from '@/core/composables/useFieldId'
import { useLocale } from '@/core/composables/useLocale'
import { useResolvedTheme } from '@/core/composables/useTheme'
import type { CardProps } from '@/detail/types/CardProps'

/**
 * Tarjeta de un panel de detalle: cabecera con título (y acciones a la
 * derecha), y un cuerpo que muestra el contenido, un esqueleto mientras
 * carga o un texto si no hay datos. Es el marco común de todas las
 * tarjetas del dominio (`ASAlertStatus`, `ASValueMatrix`...).
 *
 * Es una `<section>` con el título como nombre accesible, y anuncia
 * `aria-busy` mientras carga.
 *
 * @example
 * ```vue
 * <ASCard title="Caudal" :loading="cargando">
 *   <template #actions><ASIconButton :icon="mdiDownload" label="Descargar" size="sm" /></template>
 *   <MiContenido />
 * </ASCard>
 * ```
 */
const props = withDefaults(defineProps<CardProps>(), {
  title: undefined,
  headingLevel: 3,
  skeletonLines: 3,
  emptyText: undefined,
  theme: undefined,
})

const slots = useSlots()
const { t } = useLocale()
const theme = useResolvedTheme(() => props.theme, null)
const titleId = useFieldId(() => undefined, 'as-card')
const hasHeader = computed(() => Boolean(props.title || slots.title || slots.actions))
</script>

<template>
  <section
    class="as-card"
    :class="theme && `as-card--${theme}`"
    :aria-labelledby="props.title || slots.title ? titleId : undefined"
    :aria-busy="props.loading || undefined"
  >
    <header v-if="hasHeader" class="as-card__header">
      <component
        :is="`h${props.headingLevel}`"
        v-if="props.title || slots.title"
        :id="titleId"
        class="as-card__title"
        :title="props.title"
      >
        <slot name="title">{{ props.title }}</slot>
      </component>
      <div v-if="slots.actions" class="as-card__actions"><slot name="actions" /></div>
    </header>

    <div class="as-card__body">
      <div v-if="props.loading" class="as-card__skeleton">
        <span class="as-card__sr-only">{{ t('detail.loading') }}</span>
        <span
          v-for="line in props.skeletonLines"
          :key="line"
          class="as-card__skeleton-line"
          aria-hidden="true"
        />
      </div>
      <div v-else-if="props.empty" class="as-card__empty">
        <slot name="empty">{{ props.emptyText ?? t('detail.empty') }}</slot>
      </div>
      <slot v-else />
    </div>
  </section>
</template>

<style scoped>
.as-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--as-color-border, light-dark(#cbd5e1, #475569));
  border-radius: var(--as-radius, 8px);
  background-color: var(--as-color-surface, light-dark(#ffffff, #1e293b));
  color: var(--as-color-text, light-dark(#0f172a, #f1f5f9));
  box-shadow: var(--as-shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.16));
  font-family: var(--as-font-family, system-ui, sans-serif);
  font-size: var(--as-font-size-sm, 0.875rem);
}

.as-card--dark {
  color-scheme: dark;
}

.as-card--light {
  color-scheme: light;
}

.as-card__header {
  display: flex;
  gap: var(--as-space-2, 8px);
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
  box-sizing: border-box;
  padding: var(--as-space-2, 8px) var(--as-space-4, 16px);
  border-bottom: 1px solid var(--as-color-border, light-dark(#cbd5e1, #475569));
}

.as-card__title {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  font-size: var(--as-font-size-sm, 0.875rem);
  font-weight: var(--as-font-weight-bold, 700);
  line-height: var(--as-line-height-tight, 1.25);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.as-card__actions {
  display: flex;
  flex: none;
  gap: var(--as-space-1, 4px);
  align-items: center;
}

.as-card__body {
  flex: 1;
  min-height: 0;
  padding: var(--as-space-4, 16px);
}

.as-card__empty {
  display: grid;
  place-items: center;
  min-height: 64px;
  color: var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
  text-align: center;
}

.as-card__skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--as-space-3, 12px);
}

.as-card__skeleton-line {
  height: 12px;
  border-radius: var(--as-radius-sm, 4px);
  background: linear-gradient(
    90deg,
    var(--as-color-surface-muted, light-dark(#f1f5f9, #334155)) 25%,
    color-mix(in srgb, var(--as-color-surface-muted, light-dark(#f1f5f9, #334155)) 50%, transparent)
      50%,
    var(--as-color-surface-muted, light-dark(#f1f5f9, #334155)) 75%
  );
  background-size: 200% 100%;
  animation: as-card-shimmer 1.4s ease-in-out infinite;
}

/* La última, más corta: se lee como un párrafo. */
.as-card__skeleton-line:last-child:not(:first-of-type) {
  width: 60%;
}

@keyframes as-card-shimmer {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .as-card__skeleton-line {
    animation: none;
  }
}

.as-card__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
