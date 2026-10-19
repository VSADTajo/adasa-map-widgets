<script setup lang="ts">
import { useLocale } from '@/core/composables/useLocale'
import type { AppPanelHeaderEmits, AppPanelHeaderProps } from '@/layout/types/AppPanelHeaderProps'
import { ICONS } from '@/layout/utils/icons'
import AppIcon from './AppIcon.vue'

/**
 * Cabecera de un panel de sección: título y botón redondo para cerrarlo,
 * con una flecha hacia donde se va el panel (izquierda en escritorio, abajo
 * en móvil). Va dentro del slot `section` de `ASAppShell`, que da `close` y
 * `mobile`.
 *
 * @example
 * ```vue
 * <template #section="{ section, close, mobile }">
 *   <ASAppPanelHeader :title="section.label" :direction="mobile ? 'down' : 'left'" @close="close" />
 * </template>
 * ```
 */
const props = withDefaults(defineProps<AppPanelHeaderProps>(), {
  direction: 'left',
  closeLabel: undefined,
})

const emit = defineEmits<AppPanelHeaderEmits>()
const { t } = useLocale()
</script>

<template>
  <div class="as-app-panel-header">
    <h2 class="as-app-panel-header__title">{{ props.title }}</h2>
    <button
      type="button"
      class="as-app-panel-header__close"
      :aria-label="props.closeLabel ?? t('layout.closePanel')"
      :title="props.closeLabel ?? t('layout.closePanel')"
      @click="emit('close')"
    >
      <AppIcon :path="props.direction === 'down' ? ICONS.arrowDown : ICONS.arrowLeft" :size="22" />
    </button>
  </div>
</template>

<style scoped>
.as-app-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--as-space-3, 12px);
  padding: var(--as-space-4, 16px);
}

.as-app-panel-header__title {
  margin: 0;
  font-size: var(--as-font-size-xl, 1.5rem);
  font-weight: var(--as-font-weight-bold, 700);
  line-height: var(--as-line-height-tight, 1.25);
  color: var(--as-app-panel-text, light-dark(#0f172a, #f1f5f9));
}

.as-app-panel-header__close {
  display: grid;
  place-items: center;
  flex: none;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--as-app-chrome, #1d283a);
  color: var(--as-app-chrome-text, #ffffff);
  cursor: pointer;
}

.as-app-panel-header__close:focus-visible {
  outline: none;
  box-shadow: var(--as-focus-ring, 0 0 0 2px #2563eb);
}
</style>
