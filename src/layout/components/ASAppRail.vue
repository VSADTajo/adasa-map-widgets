<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '@/core/composables/useLocale'
import type { AppRailEmits, AppRailProps } from '@/layout/types/AppRailProps'
import AppIcon from './AppIcon.vue'

/**
 * Barra vertical de iconos con el color corporativo: una sección por
 * icono, en dos grupos (arriba y abajo del todo). Pulsar un icono emite
 * `toggle`; quien la usa decide si abre la sección o la cierra (lo hace
 * `ASAppShell`).
 *
 * Cada icono lleva el nombre de su sección como tooltip y nombre accesible,
 * y `aria-pressed` indica cuál está abierta.
 *
 * @example
 * ```vue
 * <ASAppRail :sections="secciones" :active-section="activa" @toggle="alternar" />
 * ```
 */
const props = withDefaults(defineProps<AppRailProps>(), {
  activeSection: null,
  width: 56,
  controls: undefined,
})

const emit = defineEmits<AppRailEmits>()
const { t } = useLocale()

const visible = computed(() => props.sections.filter((section) => !section.hidden))
const groups = computed(() => [
  visible.value.filter((section) => section.position !== 'bottom'),
  visible.value.filter((section) => section.position === 'bottom'),
])
</script>

<template>
  <nav
    class="as-app-rail"
    :style="{ width: `${props.width}px` }"
    :aria-label="t('layout.sections')"
  >
    <ul
      v-for="(group, index) in groups"
      :key="index"
      class="as-app-rail__group"
      :class="{ 'as-app-rail__group--bottom': index === 1 }"
    >
      <li v-for="section in group" :key="section.id">
        <button
          type="button"
          class="as-app-rail__item"
          :class="{ 'as-app-rail__item--active': section.id === props.activeSection }"
          :aria-label="section.label"
          :title="section.label"
          :aria-pressed="section.id === props.activeSection"
          :aria-controls="props.controls"
          @click="emit('toggle', section.id)"
        >
          <AppIcon :path="section.icon" />
        </button>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.as-app-rail {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: none;
  box-sizing: border-box;
  height: 100%;
  padding: var(--as-space-2, 8px) 0;
  background: var(--as-app-chrome, #1d283a);
  color: var(--as-app-chrome-text-muted, rgba(255, 255, 255, 0.72));
}

.as-app-rail__group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--as-space-2, 8px);
  margin: 0;
  padding: 0;
  list-style: none;
}

.as-app-rail__item {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: var(--as-radius-sm, 4px);
  background: transparent;
  color: inherit;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.as-app-rail__item:hover,
.as-app-rail__item--active {
  background: var(--as-app-chrome-active, rgba(255, 255, 255, 0.16));
  color: var(--as-app-chrome-text, #ffffff);
}

/* Sobre el color corporativo, el anillo de foco es del color del texto (el azul no contrasta). */
.as-app-rail__item:focus-visible {
  outline: 2px solid var(--as-app-chrome-text, #ffffff);
  outline-offset: 2px;
}
</style>
