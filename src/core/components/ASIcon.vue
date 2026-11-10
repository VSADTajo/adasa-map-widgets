<script lang="ts">
/** Nombres ya avisados como sin resolver: un aviso por nombre en toda la aplicación. */
const warned = new Set<string>()
</script>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import { isSvgPath, useIconResolver } from '@/core/composables/useIcons'
import type { IconComponentValue, IconValue, ResolvedIcon } from '@/core/types/icon'
import type { IconProps } from '@/core/types/IconProps'

/**
 * Icono con el color del texto (`currentColor`), venga de donde venga:
 * un trazado SVG (`@mdi/js`), un componente de cualquier librería (Lucide,
 * Iconify, Font Awesome...) o un nombre (`'mdi:layers'`) que traduce el
 * resolvedor de `provideIcons`. Es como pintan sus iconos todos los
 * componentes de la librería, así que cualquier prop de icono acepta lo mismo.
 *
 * Decorativo por defecto: el nombre accesible lo pone el control que lo
 * contiene. Con `label`, se anuncia como imagen.
 *
 * @example
 * ```vue
 * <ASIcon :icon="mdiAlert" label="Aviso" size="1em" />
 * <ASIcon icon="tabler:map" />
 * ```
 */
const props = withDefaults(defineProps<IconProps>(), {
  icon: undefined,
  path: undefined,
  size: 24,
  label: undefined,
})

const resolve = useIconResolver()
const side = computed(() => (typeof props.size === 'number' ? `${props.size}px` : props.size))

/**
 * Lo que hay que pintar: un trazado, un componente o las clases de una
 * fuente. Sin icono (o sin resolver), un hueco del mismo tamaño, para no
 * mover el diseño. (Sin comentarios entre los v-if de la plantilla: harían
 * de la raíz un fragmento y no le llegarían las clases del padre.)
 */
const resolved = computed<ResolvedIcon | null>(() => {
  const value: IconValue | undefined = props.icon ?? props.path
  if (!value) return null
  if (typeof value === 'string') {
    if (isSvgPath(value)) return { path: value }
    const found = resolve?.(value)
    if (!found && !warned.has(value)) {
      warned.add(value)
      console.warn(
        `[adasa-ui] Icono "${value}" sin resolver: regístralo con provideIcons() o usa un trazado o un componente.`,
      )
    }
    return found ?? null
  }
  if (typeof value === 'object' && 'component' in value) {
    const { component, props: extra } = value as IconComponentValue
    return { component, props: extra }
  }
  return { component: value as Component }
})

const a11y = computed(() =>
  props.label ? { role: 'img', 'aria-label': props.label } : { 'aria-hidden': 'true' as const },
)
</script>

<template>
  <svg
    v-if="resolved && 'path' in resolved"
    class="as-icon"
    :width="side"
    :height="side"
    viewBox="0 0 24 24"
    focusable="false"
    v-bind="a11y"
  >
    <path :d="resolved.path" fill="currentColor" />
  </svg>
  <component
    :is="resolved.component"
    v-else-if="resolved && 'component' in resolved"
    v-bind="{ ...resolved.props, ...a11y }"
    class="as-icon"
    :width="side"
    :height="side"
    :style="{ width: side, height: side }"
  />
  <i
    v-else-if="resolved && 'class' in resolved"
    class="as-icon as-icon--font"
    :class="resolved.class"
    :style="{ width: side, height: side, fontSize: side, lineHeight: side }"
    v-bind="a11y"
  />
  <span v-else class="as-icon" :style="{ width: side, height: side }" aria-hidden="true" />
</template>

<style scoped>
.as-icon {
  display: block;
  flex: none;
}

/* Las fuentes de iconos traen su propio ::before con márgenes: se centran en la caja. */
.as-icon--font {
  display: grid;
  place-items: center;
  font-style: normal;
}
</style>
