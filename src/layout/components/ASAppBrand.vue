<script setup lang="ts">
import { computed } from 'vue'
import { useAppShellContext } from '@/layout/composables/useAppShellContext'
import type { AppBrandProps } from '@/layout/types/AppBrandProps'

/**
 * Marca de la aplicación en la barra corporativa (los logos de la `TopBar`
 * de los visores SAIH): logos (con enlace opcional), nombre y subtítulo.
 * Dentro de un `ASAppShell` en móvil se reduce sola: logos más bajos y sin
 * los marcados `hideOnMobile` ni el subtítulo (`compact` lo fuerza).
 *
 * Va en el slot `brand` de `ASAppShell` o de `ASAppTopBar`.
 *
 * @example
 * ```vue
 * <ASAppShell :sections="secciones">
 *   <template #brand>
 *     <ASAppBrand :logos="[{ src: '/logo.svg', alt: 'SAIH Tajo', href: '/' }]" title="Visor" />
 *   </template>
 * </ASAppShell>
 * ```
 */
const props = withDefaults(defineProps<AppBrandProps>(), {
  logos: () => [],
  title: undefined,
  subtitle: undefined,
  compact: undefined,
})

const shell = useAppShellContext()
const isCompact = computed(() => props.compact ?? shell.mobile.value)
const logos = computed(() =>
  props.logos
    .filter((logo) => !(isCompact.value && logo.hideOnMobile))
    .map((logo) => ({
      ...logo,
      shownHeight: isCompact.value ? (logo.mobileHeight ?? 32) : (logo.height ?? 40),
    })),
)
</script>

<template>
  <div class="as-app-brand" :class="{ 'as-app-brand--compact': isCompact }">
    <template v-for="logo in logos" :key="logo.src">
      <a v-if="logo.href" class="as-app-brand__link" :href="logo.href">
        <img
          class="as-app-brand__logo"
          :src="logo.src"
          :alt="logo.alt"
          :height="logo.shownHeight"
        />
      </a>
      <img
        v-else
        class="as-app-brand__logo"
        :src="logo.src"
        :alt="logo.alt"
        :height="logo.shownHeight"
      />
    </template>
    <div v-if="props.title" class="as-app-brand__titles">
      <span class="as-app-brand__title">{{ props.title }}</span>
      <span v-if="props.subtitle && !isCompact" class="as-app-brand__subtitle">
        {{ props.subtitle }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.as-app-brand {
  display: flex;
  gap: var(--as-space-4, 16px);
  align-items: center;
  min-width: 0;
  color: var(--as-app-chrome-text, #ffffff);
}

.as-app-brand--compact {
  gap: var(--as-space-2, 8px);
}

.as-app-brand__link {
  display: flex;
  border-radius: var(--as-radius-sm, 4px);
}

.as-app-brand__link:focus-visible {
  outline: 2px solid var(--as-app-chrome-text, #ffffff);
  outline-offset: 2px;
}

.as-app-brand__logo {
  display: block;
  width: auto;
  max-width: 100%;
  object-fit: contain;
}

.as-app-brand__titles {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: var(--as-line-height-tight, 1.25);
}

.as-app-brand__title {
  overflow: hidden;
  font-size: var(--as-font-size-lg, 1.125rem);
  font-weight: var(--as-font-weight-bold, 700);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.as-app-brand--compact .as-app-brand__title {
  font-size: var(--as-font-size-md, 1rem);
}

.as-app-brand__subtitle {
  font-size: var(--as-font-size-xs, 0.75rem);
  color: var(--as-app-chrome-text-muted, rgba(255, 255, 255, 0.72));
}
</style>
