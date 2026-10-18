<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from 'vue'
import { readTokens } from '@/core/utils/readTokens'
import { contrastRatio, parseColor } from '@/core/utils/contrast'
import type { AlertLevel, ThemeTokens } from '@/core/types/theme'

/**
 * Muestra los tokens de color de un tema concreto (forzado con `.as-light` /
 * `.as-dark` en su raíz), leídos con `readTokens()` sobre su propio
 * elemento: así la página es también una prueba en vivo de `readTokens`.
 */
const props = defineProps<{ scheme: 'light' | 'dark' }>()

const root = ref<HTMLElement | null>(null)
const tokens = shallowRef<ThemeTokens | null>(null)

onMounted(() => {
  if (root.value) tokens.value = readTokens(root.value)
})

function toHex(color: string): string {
  if (!color) return '—'
  return (
    '#' +
    parseColor(color)
      .map((c) => c.toString(16).padStart(2, '0'))
      .join('')
  )
}

function ratio(a: string, b: string): number {
  return a && b ? contrastRatio(a, b) : 0
}

const interfaceColors = computed(() => {
  const t = tokens.value
  if (!t) return []
  return [
    { name: 'color-text', value: t.colorText, min: 4.5 },
    { name: 'color-text-muted', value: t.colorTextMuted, min: 4.5 },
    { name: 'color-primary', value: t.colorPrimary, min: 4.5 },
    { name: 'color-danger', value: t.colorDanger, min: 4.5 },
    { name: 'color-border', value: t.colorBorder, min: 0 },
    { name: 'color-surface-muted', value: t.colorSurfaceMuted, min: 0 },
  ]
})

const alertLevels: AlertLevel[] = ['normal', 'amarillo', 'naranja', 'rojo']
const sequentialLabels = Array.from({ length: 13 }, (_, i) => 100 + i * 50)
const divergingLabels = ['frío 3', 'frío 2', 'frío 1', 'neutro', 'cálido 1', 'cálido 2', 'cálido 3']
</script>

<template>
  <section
    ref="root"
    class="tk-panel"
    :class="props.scheme === 'dark' ? 'as-dark' : 'as-light'"
    :aria-label="`Tokens en tema ${props.scheme === 'dark' ? 'oscuro' : 'claro'}`"
  >
    <h2 class="tk-panel__title">
      {{ props.scheme === 'dark' ? 'Oscuro' : 'Claro' }}
      <code class="tk-panel__surface">surface {{ toHex(tokens?.colorSurface ?? '') }}</code>
    </h2>

    <template v-if="tokens">
      <h3 class="tk-panel__heading">Interfaz</h3>
      <p class="tk-panel__note">Textos ≥ 4.5:1 contra la superficie.</p>
      <ul class="tk-list">
        <li v-for="color in interfaceColors" :key="color.name" class="tk-row">
          <span class="tk-swatch" :style="{ background: color.value }" />
          <code class="tk-row__name">--as-{{ color.name }}</code>
          <code class="tk-row__hex">{{ toHex(color.value) }}</code>
          <span
            v-if="color.min"
            class="tk-badge"
            :class="{ 'tk-badge--fail': ratio(color.value, tokens.colorSurface) < color.min }"
          >
            {{ ratio(color.value, tokens.colorSurface).toFixed(2) }}:1
          </span>
        </li>
      </ul>

      <h3 class="tk-panel__heading">Datos · categórica</h3>
      <p class="tk-panel__note">Identidad de series, en este orden y sin ciclar. Marcas ≥ 3:1.</p>
      <ol class="tk-categorical">
        <li v-for="(color, i) in tokens.data.categorical" :key="i" class="tk-categorical__item">
          <span class="tk-categorical__swatch" :style="{ background: color }">{{ i + 1 }}</span>
          <code>{{ toHex(color) }}</code>
          <span
            class="tk-badge"
            :class="{ 'tk-badge--fail': ratio(color, tokens.colorSurface) < 3 }"
          >
            {{ ratio(color, tokens.colorSurface).toFixed(2) }}:1
          </span>
        </li>
      </ol>

      <h3 class="tk-panel__heading">Datos · secuencial</h3>
      <p class="tk-panel__note">Magnitud: 100 ≈ cero (se funde con la superficie) → 700 máximo.</p>
      <div class="tk-ramp">
        <div
          v-for="(color, i) in tokens.data.sequential"
          :key="i"
          class="tk-ramp__step"
          :style="{ background: color }"
          :title="`--as-data-seq-${sequentialLabels[i]} ${toHex(color)}`"
        />
      </div>
      <div class="tk-ramp__labels">
        <span>100</span>
        <span>400</span>
        <span>700</span>
      </div>

      <h3 class="tk-panel__heading">Datos · divergente</h3>
      <p class="tk-panel__note">Polaridad respecto a una referencia: frío ↔ neutro ↔ cálido.</p>
      <div class="tk-ramp">
        <div
          v-for="(color, i) in tokens.data.diverging"
          :key="i"
          class="tk-ramp__step"
          :style="{ background: color }"
          :title="`${divergingLabels[i]} ${toHex(color)}`"
        />
      </div>
      <div class="tk-ramp__labels">
        <span>frío</span>
        <span>neutro</span>
        <span>cálido</span>
      </div>

      <h3 class="tk-panel__heading">Niveles de aviso</h3>
      <p class="tk-panel__note">
        Relleno con su texto (≥ 4.5:1) y variante <code>strong</code> para líneas sobre la
        superficie (≥ 3:1). Siempre con texto o icono, nunca solo color.
      </p>
      <ul class="tk-list">
        <li v-for="level in alertLevels" :key="level" class="tk-row">
          <span
            class="tk-pill"
            :style="{ background: tokens.alert[level].fill, color: tokens.alert[level].text }"
          >
            {{ level }}
          </span>
          <span class="tk-badge">
            {{ ratio(tokens.alert[level].text, tokens.alert[level].fill).toFixed(2) }}:1
          </span>
          <span class="tk-line" :style="{ background: tokens.alert[level].strong }" />
          <span
            class="tk-badge"
            :class="{
              'tk-badge--fail': ratio(tokens.alert[level].strong, tokens.colorSurface) < 3,
            }"
          >
            {{ ratio(tokens.alert[level].strong, tokens.colorSurface).toFixed(2) }}:1
          </span>
        </li>
      </ul>

      <h3 class="tk-panel__heading">Rejilla, eje y sombras</h3>
      <div class="tk-chrome">
        <div
          class="tk-chrome__plot"
          :style="{
            backgroundImage: `linear-gradient(${tokens.data.grid} 1px, transparent 1px)`,
            borderColor: tokens.data.axis,
          }"
        />
        <div
          v-for="size in ['sm', 'md', 'lg'] as const"
          :key="size"
          class="tk-shadow"
          :style="{ boxShadow: tokens.shadows[size] }"
        >
          {{ size }}
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.tk-panel {
  padding: 20px;
  border-radius: var(--as-radius-lg);
  background: var(--as-color-surface);
  color: var(--as-color-text);
  font-family: var(--as-font-family);
  border: 1px solid var(--as-color-border);
}

.tk-panel__title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin: 0 0 4px;
  font-size: var(--as-font-size-xl);
  color: var(--as-color-text);
}

.tk-panel__surface,
.tk-panel__note {
  color: var(--as-color-text-muted);
  font-size: var(--as-font-size-xs);
}

.tk-panel__heading {
  margin: 20px 0 2px;
  font-size: var(--as-font-size-sm);
  color: var(--as-color-text);
}

.tk-panel__note {
  margin: 0 0 8px;
}

.tk-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 6px;
}

.tk-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--as-font-size-xs);
}

.tk-row__name {
  flex: 1;
}

.tk-row__hex {
  color: var(--as-color-text-muted);
}

.tk-swatch {
  width: 22px;
  height: 22px;
  border-radius: var(--as-radius-sm);
  border: 1px solid var(--as-color-border);
}

.tk-badge {
  font-size: var(--as-font-size-xs);
  font-variant-numeric: tabular-nums;
  padding: 1px 6px;
  border-radius: var(--as-radius-full);
  background: var(--as-color-surface-muted);
  color: var(--as-color-text);
}

.tk-badge--fail {
  background: var(--as-color-danger);
  color: var(--as-color-surface);
}

.tk-categorical {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.tk-categorical__item {
  display: grid;
  justify-items: start;
  gap: 3px;
  font-size: var(--as-font-size-xs);
}

.tk-categorical__swatch {
  justify-self: stretch;
  height: 36px;
  border-radius: var(--as-radius-sm);
  display: grid;
  place-items: center;
  color: #ffffff;
  font-weight: var(--as-font-weight-bold);
}

.tk-ramp {
  display: flex;
  height: 28px;
  border-radius: var(--as-radius-sm);
  overflow: hidden;
}

.tk-ramp__step {
  flex: 1;
}

.tk-ramp__labels {
  display: flex;
  justify-content: space-between;
  font-size: var(--as-font-size-xs);
  color: var(--as-color-text-muted);
  margin-top: 2px;
}

.tk-pill {
  min-width: 84px;
  text-align: center;
  padding: 3px 10px;
  border-radius: var(--as-radius-full);
  font-weight: var(--as-font-weight-semibold);
  text-transform: capitalize;
}

.tk-line {
  flex: 1;
  height: 3px;
  border-radius: 2px;
}

.tk-chrome {
  display: flex;
  gap: 12px;
  align-items: center;
}

.tk-chrome__plot {
  flex: 1;
  height: 64px;
  background-size: 100% 16px;
  border-left: 1px solid;
  border-bottom: 1px solid;
}

.tk-shadow {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: var(--as-radius-md);
  background: var(--as-color-surface);
  font-size: var(--as-font-size-xs);
  color: var(--as-color-text-muted);
}
</style>
