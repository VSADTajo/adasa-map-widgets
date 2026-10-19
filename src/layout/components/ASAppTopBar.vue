<script setup lang="ts">
import type { AppTopBarProps } from '@/layout/types/AppTopBarProps'

/**
 * Barra superior de la aplicación con el color corporativo
 * (`--as-app-chrome`): marca a la izquierda, buscador, y acciones (p. ej.
 * el menú de usuario) a la derecha. En móvil, `ASAppShell` la coloca abajo.
 *
 * Solo pone el marco: su contenido llega por slots.
 *
 * @example
 * ```vue
 * <ASAppTopBar>
 *   <template #brand><img src="/logo.svg" alt="SAIH Tajo" /></template>
 *   <template #search><MiBuscador /></template>
 *   <template #actions><MiMenuUsuario /></template>
 * </ASAppTopBar>
 * ```
 */
const props = withDefaults(defineProps<AppTopBarProps>(), {
  position: 'top',
  height: 64,
})

defineSlots<{
  /** Antes de la marca (p. ej. el botón de menú en móvil). */
  start?: () => unknown
  /** Logos o nombre de la aplicación. */
  brand?: () => unknown
  /** Buscador. */
  search?: () => unknown
  /** A la derecha: menú de usuario, logos secundarios... */
  actions?: () => unknown
}>()
</script>

<template>
  <header
    class="as-app-top-bar"
    :class="`as-app-top-bar--${props.position}`"
    :style="{ height: `${props.height}px` }"
  >
    <slot name="start" />
    <div v-if="$slots.brand" class="as-app-top-bar__brand"><slot name="brand" /></div>
    <div v-if="$slots.search" class="as-app-top-bar__search"><slot name="search" /></div>
    <div class="as-app-top-bar__spacer" />
    <div v-if="$slots.actions" class="as-app-top-bar__actions"><slot name="actions" /></div>
  </header>
</template>

<style scoped>
.as-app-top-bar {
  display: flex;
  align-items: center;
  gap: var(--as-space-4, 16px);
  flex: none;
  box-sizing: border-box;
  padding: 0 var(--as-space-4, 16px);
  background: var(--as-app-chrome, #1d283a);
  color: var(--as-app-chrome-text, #ffffff);
  min-width: 0;
}

.as-app-top-bar--bottom {
  /* En móvil, encima de la barra del sistema (iPhone con "home indicator"). */
  padding-bottom: env(safe-area-inset-bottom, 0px);
  box-sizing: content-box;
}

.as-app-top-bar__brand,
.as-app-top-bar__actions {
  display: flex;
  align-items: center;
  gap: var(--as-space-3, 12px);
  flex: none;
}

.as-app-top-bar__search {
  flex: 0 1 480px;
  min-width: 0;
}

.as-app-top-bar__spacer {
  flex: 1 1 0;
}
</style>
