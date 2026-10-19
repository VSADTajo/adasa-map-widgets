<script setup lang="ts">
import { computed } from 'vue'
import type { IconProps } from '@/core/types/IconProps'

/**
 * Icono SVG a partir de su trazado, con el color del texto (`currentColor`).
 * Es como pintan sus iconos todos los componentes de la librería, y los
 * proyectos lo usan para que los suyos casen con ellos.
 *
 * Decorativo por defecto: el nombre accesible lo pone el control que lo
 * contiene. Con `label`, se anuncia como imagen.
 *
 * @example
 * ```vue
 * <ASIcon :path="mdiAlert" label="Aviso" size="1em" />
 * ```
 */
const props = withDefaults(defineProps<IconProps>(), {
  size: 24,
  label: undefined,
})

const side = computed(() => (typeof props.size === 'number' ? `${props.size}px` : props.size))
</script>

<template>
  <svg
    class="as-icon"
    :width="side"
    :height="side"
    viewBox="0 0 24 24"
    focusable="false"
    :role="props.label ? 'img' : undefined"
    :aria-label="props.label"
    :aria-hidden="props.label ? undefined : 'true'"
  >
    <path :d="props.path" fill="currentColor" />
  </svg>
</template>

<style scoped>
.as-icon {
  display: block;
  flex: none;
}
</style>
