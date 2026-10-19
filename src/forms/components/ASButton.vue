<script setup lang="ts">
import { computed, useSlots } from 'vue'
import ASIcon from '@/core/components/ASIcon.vue'
import { useLocale } from '@/core/composables/useLocale'
import { useResolvedTheme } from '@/core/composables/useTheme'
import type { ButtonEmits, ButtonProps } from '@/forms/types/ButtonProps'

/**
 * Botón de la librería: `<button>` nativo con las variantes `primary`,
 * `secondary`, `ghost` y `danger`, tres tamaños, icono opcional y estado de
 * carga. Los colores salen de los tokens (`--as-color-primary`,
 * `--as-color-danger`...), así que sigue el tema y la marca del proyecto.
 *
 * Mientras `loading`, mantiene el foco y el ancho, anuncia `aria-busy` y no
 * emite `click`. Sin texto y con icono, se vuelve cuadrado (para eso está
 * `ASIconButton`, que exige el nombre accesible).
 *
 * @example
 * ```vue
 * <ASButton variant="primary" :icon="mdiContentSave" :loading="guardando" @click="guardar">
 *   Guardar
 * </ASButton>
 * ```
 */
const props = withDefaults(defineProps<ButtonProps>(), {
  variant: 'secondary',
  size: 'md',
  type: 'button',
  icon: undefined,
  iconPosition: 'start',
  theme: undefined,
})

const emit = defineEmits<ButtonEmits>()
const slots = useSlots()
const { t } = useLocale()
const theme = useResolvedTheme(() => props.theme, null)

const hasIcon = computed(() => Boolean(props.icon || slots.icon))
const iconOnly = computed(() => !slots.default && hasIcon.value)

function onClick(event: MouseEvent): void {
  if (props.disabled || props.loading) {
    event.preventDefault()
    return
  }
  emit('click', event)
}
</script>

<template>
  <button
    class="as-button"
    :class="[
      `as-button--${props.variant}`,
      `as-button--${props.size}`,
      theme && `as-button--${theme}`,
      {
        'as-button--block': props.block,
        'as-button--loading': props.loading,
        'as-button--icon-only': iconOnly,
      },
    ]"
    :type="props.type"
    :disabled="props.disabled"
    :aria-busy="props.loading || undefined"
    :aria-disabled="props.loading || undefined"
    @click="onClick"
  >
    <span class="as-button__content">
      <template v-if="hasIcon && props.iconPosition === 'start'">
        <slot name="icon"><ASIcon class="as-button__icon" :path="props.icon!" /></slot>
      </template>
      <span v-if="slots.default" class="as-button__label"><slot /></span>
      <template v-if="hasIcon && props.iconPosition === 'end'">
        <slot name="icon"><ASIcon class="as-button__icon" :path="props.icon!" /></slot>
      </template>
    </span>
    <span v-if="props.loading" class="as-button__spinner">
      <span class="as-button__sr-only">{{ t('forms.loading') }}</span>
    </span>
  </button>
</template>

<style scoped>
.as-button {
  --as-button-surface: var(--as-color-surface, light-dark(#ffffff, #1e293b));
  --as-button-ring: var(--as-color-primary, light-dark(#2563eb, #60a5fa));
  --as-button-height: var(--as-control-height-md, 36px);
  --as-button-icon: 18px;
  position: relative;
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  height: var(--as-button-height);
  min-width: var(--as-button-height);
  padding: 0 var(--as-space-3, 12px);
  border: 1px solid var(--as-button-border);
  border-radius: var(--as-radius, 8px);
  background-color: var(--as-button-bg);
  color: var(--as-button-fg);
  font-family: var(--as-font-family, system-ui, sans-serif);
  font-size: var(--as-font-size-sm, 0.875rem);
  font-weight: var(--as-font-weight-medium, 500);
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color 0.15s,
    box-shadow 0.15s;
}

.as-button--dark {
  color-scheme: dark;
}

.as-button--light {
  color-scheme: light;
}

/* ── Variantes ─────────────────────────────────────────────────────── */
.as-button--primary {
  --as-button-bg: var(--as-color-primary, light-dark(#2563eb, #60a5fa));
  --as-button-fg: var(--as-color-primary-contrast, light-dark(#ffffff, #0f172a));
  --as-button-border: transparent;
}

.as-button--secondary {
  --as-button-bg: var(--as-color-surface, light-dark(#ffffff, #1e293b));
  --as-button-fg: var(--as-color-text, light-dark(#0f172a, #f1f5f9));
  --as-button-border: var(--as-color-border, light-dark(#cbd5e1, #475569));
}

.as-button--ghost {
  --as-button-bg: transparent;
  /* El color del contenedor: sirve igual en un panel que en la barra corporativa. */
  --as-button-fg: currentColor;
  --as-button-border: transparent;
}

.as-button--danger {
  --as-button-bg: var(--as-color-danger, light-dark(#dc2626, #f87171));
  --as-button-fg: var(--as-color-danger-contrast, light-dark(#ffffff, #0f172a));
  --as-button-border: transparent;
}

/* Hover y pulsado: el fondo se mezcla con el color del texto, así oscurece
   en claro y aclara en oscuro sin un token por estado. */
.as-button:not(:disabled, .as-button--loading):hover {
  background-color: color-mix(in srgb, var(--as-button-bg) 88%, currentColor);
}

.as-button:not(:disabled, .as-button--loading):active {
  background-color: color-mix(in srgb, var(--as-button-bg) 78%, currentColor);
}

/* Anillo separado del botón por la superficie: sobre un botón primary, el
   anillo pegado (--as-focus-ring) no se distinguiría de su fondo. */
.as-button:focus-visible {
  outline: 2px solid transparent;
  box-shadow:
    0 0 0 2px var(--as-button-surface),
    0 0 0 4px var(--as-button-ring);
}

.as-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.as-button--loading {
  cursor: progress;
}

/* ── Tamaños ───────────────────────────────────────────────────────── */
.as-button--sm {
  --as-button-height: var(--as-control-height-sm, 28px);
  --as-button-icon: 16px;
  padding: 0 var(--as-space-2, 8px);
  font-size: var(--as-font-size-xs, 0.75rem);
}

.as-button--lg {
  --as-button-height: var(--as-control-height-lg, 44px);
  --as-button-icon: 20px;
  padding: 0 var(--as-space-4, 16px);
  font-size: var(--as-font-size-md, 1rem);
}

.as-button--icon-only {
  width: var(--as-button-height);
  padding: 0;
}

.as-button--block {
  display: flex;
  width: 100%;
}

/* ── Contenido ─────────────────────────────────────────────────────── */
.as-button__content {
  display: inline-flex;
  gap: var(--as-space-2, 8px);
  align-items: center;
  min-width: 0;
}

.as-button--loading .as-button__content {
  visibility: hidden;
}

.as-button__label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.as-button__icon {
  width: var(--as-button-icon);
  height: var(--as-button-icon);
}

.as-button__spinner {
  position: absolute;
  inset: 0;
  margin: auto;
  width: var(--as-button-icon);
  height: var(--as-button-icon);
  box-sizing: border-box;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: as-button-spin 0.7s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .as-button__spinner {
    animation-duration: 2s;
  }
}

@keyframes as-button-spin {
  to {
    transform: rotate(360deg);
  }
}

.as-button__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
