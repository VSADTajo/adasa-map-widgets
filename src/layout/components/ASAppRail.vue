<script setup lang="ts">
import { computed } from 'vue'
import { useLocale } from '@/core/composables/useLocale'
import type { AppRailEmits, AppRailProps } from '@/layout/types/AppRailProps'
import ASIcon from '@/core/components/ASIcon.vue'
import { hasBadge, sectionLabel, sectionTooltip } from '@/layout/utils/sections'

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
        <!-- Deshabilitada con aria-disabled (no disabled): sigue enfocable y con su tooltip. -->
        <button
          type="button"
          class="as-app-rail__item"
          :class="{
            'as-app-rail__item--active': section.id === props.activeSection,
            'as-app-rail__item--disabled': section.disabled,
          }"
          :aria-label="sectionLabel(section, t)"
          :title="sectionTooltip(section)"
          :aria-pressed="section.id === props.activeSection"
          :aria-disabled="section.disabled || undefined"
          :aria-controls="props.controls"
          @click="!section.disabled && emit('toggle', section.id)"
        >
          <ASIcon :icon="section.icon" />
          <span v-if="hasBadge(section)" class="as-app-rail__badge" aria-hidden="true">
            {{ section.badge }}
          </span>
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
  gap: var(--as-space-2, 8px);
  padding: var(--as-space-2, 8px) 0;
  /* Muchas secciones en una pantalla baja: la barra se desplaza en vez de cortarlas. */
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: none;
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
  /* Para colocar el contador en su esquina. */
  position: relative;
}

.as-app-rail__item:not(.as-app-rail__item--disabled):hover,
.as-app-rail__item--active {
  background: var(--as-app-chrome-active, rgba(255, 255, 255, 0.16));
  color: var(--as-app-chrome-text, #ffffff);
}

.as-app-rail__item--disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* Contador en la esquina del icono, con el color de aviso (y siempre con su número). */
.as-app-rail__badge {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  box-sizing: border-box;
  border-radius: var(--as-radius-full, 9999px);
  background: var(--as-color-danger, light-dark(#dc2626, #f87171));
  color: var(--as-color-danger-contrast, light-dark(#ffffff, #0f172a));
  font-size: 10px;
  font-weight: var(--as-font-weight-bold, 700);
  line-height: 16px;
  text-align: center;
}

/* Sobre el color corporativo, el anillo de foco es del color del texto (el azul no contrasta). */
.as-app-rail__item:focus-visible {
  outline: 2px solid var(--as-app-chrome-text, #ffffff);
  outline-offset: 2px;
}
</style>
