<script setup lang="ts">
import type { IconButtonEmits, IconButtonProps } from '@/forms/types/IconButtonProps'
import ASButton from './ASButton.vue'

/**
 * Botón cuadrado solo con icono (cerrar, filtros, acciones de una barra de
 * herramientas). Como no tiene texto, `label` es obligatorio: es su nombre
 * accesible y su tooltip nativo.
 *
 * Con `pressed` actúa de interruptor (`aria-pressed`) y se usa con
 * `v-model:pressed`: es controlado, solo emite el estado nuevo.
 *
 * @example
 * ```vue
 * <ASIconButton :icon="mdiFilter" label="Filtros" v-model:pressed="filtrosVisibles" />
 * ```
 */
const props = withDefaults(defineProps<IconButtonProps>(), {
  variant: 'ghost',
  size: 'md',
  type: 'button',
  pressed: undefined,
  theme: undefined,
})

const emit = defineEmits<IconButtonEmits>()

function onClick(event: MouseEvent): void {
  emit('click', event)
  if (props.pressed !== undefined) emit('update:pressed', !props.pressed)
}
</script>

<template>
  <ASButton
    class="as-icon-button"
    :class="{ 'as-icon-button--pressed': props.pressed }"
    :variant="props.variant"
    :size="props.size"
    :type="props.type"
    :icon="props.icon"
    :loading="props.loading"
    :disabled="props.disabled"
    :theme="props.theme"
    :aria-label="props.label"
    :title="props.label"
    :aria-pressed="props.pressed"
    @click="onClick"
  />
</template>

<style scoped>
/* Doble clase: gana a la variante de ASButton sea cual sea el orden de las hojas. */
.as-icon-button.as-icon-button--pressed {
  --as-button-bg: color-mix(
    in srgb,
    var(--as-color-primary, light-dark(#2563eb, #60a5fa)) 18%,
    transparent
  );
  --as-button-fg: var(--as-color-primary, light-dark(#2563eb, #60a5fa));
}
</style>
