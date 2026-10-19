<script setup lang="ts">
/**
 * Icono SVG de 24 × 24 a partir de su trazado (interno del dominio, no se
 * exporta). Toma el color del texto (`currentColor`) y es decorativo: el
 * nombre accesible lo pone el botón que lo contiene.
 */
defineProps<{
  /** Atributo `d` del `<path>` (p. ej. de `@mdi/js`). */
  path: string
  /** Lado en px. */
  size?: number
}>()
</script>

<template>
  <svg
    class="as-app-icon"
    :width="size ?? 24"
    :height="size ?? 24"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <path :d="path" fill="currentColor" />
  </svg>
</template>

<style scoped>
.as-app-icon {
  display: block;
  flex: none;
}
</style>
