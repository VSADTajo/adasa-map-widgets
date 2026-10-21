<script setup lang="ts">
import { computed } from 'vue'
import ASIcon from '@/core/components/ASIcon.vue'
import { useLocale } from '@/core/composables/useLocale'
import type { AppMobileMenuEmits, AppMobileMenuProps } from '@/layout/types/AppPanelsProps'

/**
 * Menú de secciones del móvil (el `mobile-navigation-menu` de los visores
 * SAIH): sube desde abajo, encima de la barra, con el color corporativo, y
 * un fondo transparente que lo cierra al tocar fuera (`v-model:open`).
 * Cada sección es un botón con `aria-pressed` si es la abierta.
 *
 * Emite `select` con la sección elegida; quien lo usa decide si se cierra
 * (`ASAppShell` lo cierra y abre la sección). Cerrado, es inerte.
 *
 * @example
 * ```vue
 * <ASAppMobileMenu
 *   v-model:open="menu"
 *   :sections="secciones"
 *   :active-section="seccion"
 *   @select="(id) => { menu = false; seccion = id }"
 * />
 * ```
 */
const props = withDefaults(defineProps<AppMobileMenuProps>(), {
  activeSection: null,
  id: undefined,
})

const emit = defineEmits<AppMobileMenuEmits>()
const { t } = useLocale()
const visibleSections = computed(() => props.sections.filter((section) => !section.hidden))
</script>

<template>
  <div v-if="props.open" class="as-app-mobile-menu__backdrop" @click="emit('update:open', false)" />
  <nav
    :id="props.id"
    class="as-app-mobile-menu"
    :class="{ 'as-app-mobile-menu--open': props.open }"
    :aria-label="t('layout.sections')"
    :inert="!props.open || undefined"
  >
    <ul class="as-app-mobile-menu__list">
      <li v-for="section in visibleSections" :key="section.id">
        <button
          type="button"
          class="as-app-mobile-menu__item"
          :class="{ 'as-app-mobile-menu__item--active': section.id === props.activeSection }"
          :aria-pressed="section.id === props.activeSection"
          @click="emit('select', section.id)"
        >
          <ASIcon :path="section.icon" />
          {{ section.label }}
        </button>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.as-app-mobile-menu__backdrop {
  position: absolute;
  inset: 0;
  z-index: 3;
}

.as-app-mobile-menu {
  --as-app-menu-transition: var(--as-app-transition, 0.2s cubic-bezier(0.4, 0, 0.2, 1));
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 4;
  max-height: 100%;
  overflow-y: auto;
  background: var(--as-app-chrome, #1d283a);
  color: var(--as-app-chrome-text, #ffffff);
  box-shadow: var(--as-shadow-md, 0 4px 12px rgba(0, 0, 0, 0.2));
  transform: translateY(100%);
  visibility: hidden;
  transition:
    transform var(--as-app-menu-transition),
    visibility 0s linear 0.2s;
}

.as-app-mobile-menu--open {
  transform: none;
  visibility: visible;
  transition: transform var(--as-app-menu-transition);
}

.as-app-mobile-menu__list {
  margin: 0;
  padding: var(--as-space-2, 8px);
  list-style: none;
}

.as-app-mobile-menu__item {
  display: flex;
  gap: var(--as-space-4, 16px);
  align-items: center;
  width: 100%;
  min-height: 48px;
  padding: 0 var(--as-space-3, 12px);
  border: none;
  border-radius: var(--as-radius-sm, 4px);
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: var(--as-font-weight-semibold, 600);
  text-align: left;
  cursor: pointer;
}

.as-app-mobile-menu__item:hover,
.as-app-mobile-menu__item--active {
  background: var(--as-app-chrome-active, rgba(255, 255, 255, 0.16));
}

.as-app-mobile-menu__item:focus-visible {
  outline: 2px solid var(--as-app-chrome-text, #ffffff);
  outline-offset: -2px;
}

@media (prefers-reduced-motion: reduce) {
  .as-app-mobile-menu {
    --as-app-menu-transition: 0s;
  }
}
</style>
