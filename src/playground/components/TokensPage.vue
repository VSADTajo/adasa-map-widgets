<script setup lang="ts">
import { onMounted, ref, shallowRef } from 'vue'
import TokenPanel from './TokenPanel.vue'
import { readTokens } from '@/core/utils/readTokens'
import type { FontSizeToken, SpaceToken, ThemeTokens, ZIndexLayer } from '@/core/types/theme'

/**
 * Página "Tokens" del playground: los colores de ambos temas uno al lado del
 * otro (cada panel fuerza el suyo), y debajo los tokens que no dependen del
 * tema (tipografía, espaciado, radios, capas).
 */
const tokens = shallowRef<ThemeTokens | null>(null)
const root = ref<HTMLElement | null>(null)

onMounted(() => {
  if (root.value) tokens.value = readTokens(root.value)
})

const fontSizes: FontSizeToken[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl']
const spaces: SpaceToken[] = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16]
const radii = ['sm', 'md', 'lg', 'full'] as const
const zLayers: ZIndexLayer[] = [
  'base',
  'mapControl',
  'dropdown',
  'sticky',
  'drawer',
  'modal',
  'toast',
  'tooltip',
]
</script>

<template>
  <div ref="root" class="tk-page">
    <header class="tk-page__header">
      <h1 class="tk-page__title">Tokens de diseño</h1>
      <p class="tk-page__intro">
        Variables <code>--as-*</code> de <code>src/core/styles/tokens.css</code>, leídas en vivo con
        <code>readTokens()</code>. Los contrastes se calculan contra
        <code>--as-color-surface</code> de cada tema; en rojo, lo que no llega al mínimo WCAG AA.
      </p>
    </header>

    <div class="tk-page__themes">
      <TokenPanel scheme="light" />
      <TokenPanel scheme="dark" />
    </div>

    <section v-if="tokens" class="tk-page__shared" aria-label="Tokens comunes a ambos temas">
      <div class="tk-block">
        <h2 class="tk-block__title">Tipografía</h2>
        <p
          v-for="size in fontSizes"
          :key="size"
          class="tk-type"
          :style="{ fontSize: tokens.fontSize[size] }"
        >
          <code class="tk-type__name">{{ size }} · {{ tokens.fontSize[size] }}</code>
          Caudal 12,4 m³/s
        </p>
        <p class="tk-type" :style="{ fontFamily: tokens.fontFamilyMono }">
          <code class="tk-type__name">mono</code> 2026-10-18T06:00Z
        </p>
      </div>

      <div class="tk-block">
        <h2 class="tk-block__title">Espaciado</h2>
        <div v-for="step in spaces" :key="step" class="tk-space">
          <code class="tk-type__name">space-{{ step }} · {{ tokens.space[step] }}</code>
          <span class="tk-space__bar" :style="{ width: tokens.space[step] }" />
        </div>
      </div>

      <div class="tk-block">
        <h2 class="tk-block__title">Radios</h2>
        <div class="tk-radii">
          <div
            v-for="radius in radii"
            :key="radius"
            class="tk-radii__box"
            :style="{ borderRadius: tokens.radii[radius] }"
          >
            {{ radius }}
          </div>
        </div>
        <h2 class="tk-block__title">Capas (z-index)</h2>
        <ul class="tk-z">
          <li v-for="layer in zLayers" :key="layer">
            <code>{{ layer }}</code> <span>{{ tokens.zIndex[layer] }}</span>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<style scoped>
.tk-page {
  display: grid;
  align-content: start;
  gap: 20px;
  padding: 20px 28px 40px;
  font-family: var(--as-font-family);
  color: var(--pg-text);
}

.tk-page__title {
  margin: 0;
  font-size: var(--as-font-size-2xl);
}

.tk-page__intro {
  margin: 4px 0 0;
  max-width: 820px;
  color: var(--pg-text-muted);
  font-size: var(--as-font-size-sm);
}

.tk-page__themes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 20px;
}

.tk-page__shared {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
}

.tk-block {
  padding: 20px;
  border-radius: var(--as-radius-lg);
  background: var(--pg-surface);
  border: 1px solid var(--pg-border);
}

.tk-block__title {
  margin: 0 0 10px;
  font-size: var(--as-font-size-sm);
}

.tk-type {
  margin: 0 0 6px;
  line-height: var(--as-line-height-tight);
}

.tk-type__name {
  display: inline-block;
  min-width: 120px;
  font-size: var(--as-font-size-xs);
  color: var(--pg-text-muted);
}

.tk-space {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.tk-space__bar {
  height: 10px;
  background: var(--as-data-seq-450);
  border-radius: 2px;
}

.tk-radii {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.tk-radii__box {
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  border: 2px solid var(--as-data-seq-450);
  font-size: var(--as-font-size-xs);
}

.tk-z {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px 12px;
  font-size: var(--as-font-size-xs);
}

.tk-z li {
  display: flex;
  justify-content: space-between;
}
</style>
