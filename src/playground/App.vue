<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import Sidebar from './components/Sidebar.vue'
import PropsEditor from './components/PropsEditor.vue'
import CodePreview from './components/CodePreview.vue'
import DocsPanel from './components/DocsPanel.vue'
import EventLog, { type LogEntry } from './components/EventLog.vue'
import WidgetPlayground from './components/WidgetPlayground.vue'
import { registry, getEntry } from './registry'
import { buildSnippet } from './propTypes'
import { provideTheme } from '@/composables/useTheme'
import type { ThemeMode } from '@/types/theme'

const { mode, resolvedMode, setMode } = provideTheme('auto')
const modes: ThemeMode[] = ['light', 'dark', 'auto']

/** Alterna entre la galería de un solo componente y el compositor de widgets sobre un mapa. */
const viewMode = ref<'gallery' | 'composer'>('gallery')

const activeId = ref<string>(registry[0]!.id)
const entry = computed(() => getEntry(activeId.value) ?? registry[0]!)

/**
 * Valores de props del preview. Las claves declaradas en `propsSchema` son
 * primitivas y editables desde `PropsEditor`; `staticProps` puede añadir
 * además claves complejas no editables (arrays, objetos, `Date`...) que los
 * `bindings` del registro sincronizan en vivo con lo que emite el widget.
 */
const propValues = reactive<Record<string, unknown>>({})
const slotContent = ref('')
const logEntries = ref<LogEntry[]>([])

function resetState(): void {
  for (const key of Object.keys(propValues)) delete propValues[key]
  for (const field of entry.value.propsSchema) {
    propValues[field.key] = field.default
  }
  Object.assign(propValues, entry.value.staticProps ?? {})
  slotContent.value = entry.value.slotDefault ?? ''
  logEntries.value = []
}

watch(activeId, resetState, { immediate: true })

function updateField(key: string, value: string | number | boolean): void {
  propValues[key] = value
}

function logEvent(name: string, payload?: unknown): void {
  logEntries.value = [
    { name, payload, time: new Date().toLocaleTimeString('es-ES') },
    ...logEntries.value,
  ].slice(0, 20)
}

const liveListeners = computed(() => entry.value.bindings?.(propValues, logEvent) ?? {})

const previewProps = computed(() => ({
  ...propValues,
  ...liveListeners.value,
}))

const code = computed(() =>
  buildSnippet(
    entry.value.name,
    entry.value.propsSchema,
    propValues,
    entry.value.slotDefault !== undefined ? slotContent.value : undefined,
  ),
)
</script>

<template>
  <div class="pg-app" :class="{ 'amw-dark': resolvedMode === 'dark' }">
    <nav class="pg-view-switch" aria-label="Modo del playground">
      <button
        type="button"
        class="pg-view-switch__button"
        :class="{ 'pg-view-switch__button--active': viewMode === 'gallery' }"
        :aria-pressed="viewMode === 'gallery'"
        @click="viewMode = 'gallery'"
      >
        Galería de componentes
      </button>
      <button
        type="button"
        class="pg-view-switch__button"
        :class="{ 'pg-view-switch__button--active': viewMode === 'composer' }"
        :aria-pressed="viewMode === 'composer'"
        @click="viewMode = 'composer'"
      >
        Compositor sobre mapa
      </button>
    </nav>

    <div class="pg-app__body">
      <template v-if="viewMode === 'gallery'">
        <Sidebar :active-id="activeId" @select="activeId = $event" />

        <main class="pg-main">
          <header class="pg-main__header">
            <div>
              <h1 class="pg-main__title">{{ entry.name }}</h1>
              <p class="pg-main__category">{{ entry.category }}</p>
            </div>
            <div class="pg-theme-toggle" role="group" aria-label="Tema">
              <button
                v-for="m in modes"
                :key="m"
                type="button"
                class="pg-theme-toggle__button"
                :class="{ 'pg-theme-toggle__button--active': mode === m }"
                :aria-pressed="mode === m"
                @click="setMode(m)"
              >
                {{ m }}
              </button>
            </div>
          </header>

          <div class="pg-main__grid">
            <section class="pg-card pg-card--preview" aria-label="Vista previa en vivo">
              <h2 class="pg-card__heading">Vista previa</h2>
              <div class="pg-preview__stage">
                <component :is="entry.component" v-bind="previewProps">
                  <template v-if="entry.slotDefault !== undefined" #default>{{
                    slotContent
                  }}</template>
                </component>
              </div>
              <h3 class="pg-card__subheading">Eventos emitidos</h3>
              <EventLog :entries="logEntries" />
            </section>

            <section class="pg-card" aria-label="Editor de props">
              <h2 class="pg-card__heading">Props</h2>
              <PropsEditor
                :schema="entry.propsSchema"
                :values="propValues"
                @update-field="updateField"
              />
              <div v-if="entry.slotDefault !== undefined" class="pg-slot-editor">
                <label class="pg-slot-editor__label" for="slot-content">Contenido (slot)</label>
                <input
                  id="slot-content"
                  v-model="slotContent"
                  type="text"
                  class="pg-slot-editor__input"
                />
              </div>
            </section>

            <section class="pg-card" aria-label="Documentación">
              <h2 class="pg-card__heading">Documentación</h2>
              <DocsPanel :entry="entry" />
            </section>

            <section class="pg-card" aria-label="Código">
              <h2 class="pg-card__heading">Código</h2>
              <CodePreview :code="code" />
            </section>
          </div>
        </main>
      </template>

      <WidgetPlayground v-else class="pg-app__composer" />
    </div>
  </div>
</template>

<style scoped>
.pg-app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.pg-view-switch {
  display: flex;
  gap: 8px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--pg-border);
}

.pg-view-switch__button {
  border: 1px solid var(--pg-border);
  background: none;
  color: var(--pg-text);
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 0.8rem;
  cursor: pointer;
}

.pg-view-switch__button--active {
  background-color: var(--pg-primary);
  border-color: var(--pg-primary);
  color: var(--pg-primary-contrast);
}

.pg-app__body {
  flex: 1;
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: 0;
}

.pg-app__composer {
  grid-column: 1 / -1;
  padding: 20px 28px 40px;
  min-height: 0;
}

.pg-main {
  padding: 20px 28px 40px;
  overflow-y: auto;
}

.pg-main__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 16px;
  flex-wrap: wrap;
}

.pg-main__title {
  margin: 0;
  font-size: 1.5rem;
}

.pg-main__category {
  margin: 2px 0 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--pg-text-muted);
}

.pg-theme-toggle {
  display: inline-flex;
  border: 1px solid var(--pg-border);
  border-radius: 8px;
  overflow: hidden;
}

.pg-theme-toggle__button {
  border: none;
  background: none;
  color: var(--pg-text);
  padding: 6px 12px;
  font-size: 0.75rem;
  cursor: pointer;
  text-transform: capitalize;
}

.pg-theme-toggle__button--active {
  background-color: var(--pg-primary);
  color: var(--pg-primary-contrast);
}

.pg-main__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  align-items: start;
}

.pg-card {
  background-color: var(--pg-surface);
  border: 1px solid var(--pg-border);
  border-radius: 12px;
  padding: 16px 18px;
}

.pg-card--preview {
  grid-row: span 2;
}

.pg-card__heading {
  margin: 0 0 12px;
  font-size: 0.95rem;
}

.pg-card__subheading {
  margin: 16px 0 8px;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--pg-text-muted);
}

.pg-preview__stage {
  position: relative;
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  border-radius: 8px;
  background-image:
    linear-gradient(45deg, var(--pg-surface-muted) 25%, transparent 25%),
    linear-gradient(-45deg, var(--pg-surface-muted) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--pg-surface-muted) 75%),
    linear-gradient(-45deg, transparent 75%, var(--pg-surface-muted) 75%);
  background-size: 20px 20px;
  background-position:
    0 0,
    0 10px,
    10px -10px,
    -10px 0px;
}

.pg-slot-editor {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 16px;
}

.pg-slot-editor__label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--pg-text-muted);
}

.pg-slot-editor__input {
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid var(--pg-border);
  background-color: var(--pg-surface);
  color: var(--pg-text);
  font-size: 0.85rem;
}

@media (max-width: 900px) {
  .pg-app__body {
    grid-template-columns: 1fr;
  }
  .pg-main__grid {
    grid-template-columns: 1fr;
  }
  .pg-card--preview {
    grid-row: auto;
  }
}
</style>
