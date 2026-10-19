<script setup lang="ts">
import ASIcon from '@/core/components/ASIcon.vue'
import { ICONS } from '@/core/icons/icons'
import { useLocale } from '@/core/composables/useLocale'
import type { DetailHeaderEmits, DetailHeaderProps } from '@/detail/types/DetailHeaderProps'
import ASIconButton from '@/forms/components/ASIconButton.vue'

/**
 * Cabecera de un panel de detalle (la ficha de una estación, un embalse...):
 * título y subtítulo a la izquierda, un hueco central (slot por defecto),
 * etiquetas y el botón de cerrar a la derecha. Usa el color corporativo
 * (`--as-app-chrome`), como la barra de `ASAppShell`, y se queda fija arriba
 * al desplazar el panel.
 *
 * @example
 * ```vue
 * <ASDetailHeader title="3E01" subtitle="Tajo en Aranjuez" :tags="etiquetas" @close="cerrar">
 *   <MiSelectorDeFuente />
 * </ASDetailHeader>
 * ```
 */
const props = withDefaults(defineProps<DetailHeaderProps>(), {
  title: undefined,
  subtitle: undefined,
  tags: () => [],
  sticky: true,
  closable: true,
  closeLabel: undefined,
})

const emit = defineEmits<DetailHeaderEmits>()
const { t } = useLocale()
</script>

<template>
  <header class="as-detail-header" :class="{ 'as-detail-header--sticky': props.sticky }">
    <div class="as-detail-header__titles">
      <h2 class="as-detail-header__title">
        {{ props.loading ? t('detail.loading') : props.title }}
      </h2>
      <p v-if="props.subtitle && !props.loading" class="as-detail-header__subtitle">
        {{ props.subtitle }}
      </p>
    </div>

    <div v-if="$slots.default" class="as-detail-header__center"><slot /></div>

    <ul v-if="props.tags.length && !props.loading" class="as-detail-header__tags">
      <li v-for="tag in props.tags" :key="tag.label" class="as-detail-header__tag">
        <ASIcon v-if="tag.icon" :path="tag.icon" :size="14" />
        {{ tag.label }}
      </li>
    </ul>

    <div v-if="$slots.actions" class="as-detail-header__actions"><slot name="actions" /></div>

    <ASIconButton
      v-if="props.closable"
      class="as-detail-header__close"
      :icon="ICONS.close"
      :label="props.closeLabel ?? t('detail.close')"
      @click="emit('close')"
    />
  </header>
</template>

<style scoped>
.as-detail-header {
  display: flex;
  flex-wrap: wrap;
  gap: var(--as-space-2, 8px) var(--as-space-4, 16px);
  align-items: center;
  padding: var(--as-space-4, 16px);
  border-radius: var(--as-radius-sm, 4px) var(--as-radius-sm, 4px) 0 0;
  background-color: var(--as-app-chrome, #1d283a);
  color: var(--as-app-chrome-text, #ffffff);
  font-family: var(--as-font-family, system-ui, sans-serif);
}

.as-detail-header--sticky {
  position: sticky;
  top: 0;
  z-index: var(--as-z-sticky, 1200);
}

.as-detail-header__titles {
  flex: none;
  min-width: 0;
}

.as-detail-header__title {
  margin: 0;
  font-size: var(--as-font-size-xl, 1.25rem);
  font-weight: var(--as-font-weight-bold, 700);
  line-height: var(--as-line-height-tight, 1.25);
}

.as-detail-header__subtitle {
  margin: 2px 0 0;
  font-size: var(--as-font-size-xs, 0.75rem);
  color: var(--as-app-chrome-text-muted, rgba(255, 255, 255, 0.72));
}

.as-detail-header__center {
  display: flex;
  flex: 1;
  justify-content: center;
  min-width: 0;
}

.as-detail-header__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--as-space-2, 8px);
  margin: 0 0 0 auto;
  padding: 0;
  list-style: none;
}

.as-detail-header__center + .as-detail-header__tags {
  margin-left: 0;
}

.as-detail-header__tag {
  display: inline-flex;
  gap: var(--as-space-1, 4px);
  align-items: center;
  height: 22px;
  padding: 0 var(--as-space-2, 8px);
  border-radius: var(--as-radius-full, 9999px);
  background-color: var(--as-app-chrome-active, rgba(255, 255, 255, 0.16));
  font-size: var(--as-font-size-xs, 0.75rem);
  white-space: nowrap;
}

.as-detail-header__actions {
  display: flex;
  gap: var(--as-space-1, 4px);
  align-items: center;
}

.as-detail-header__close {
  margin-left: auto;
}

.as-detail-header__tags ~ .as-detail-header__close,
.as-detail-header__actions ~ .as-detail-header__close {
  margin-left: 0;
}
</style>
