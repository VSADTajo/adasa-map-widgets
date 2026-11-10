<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import ASIcon from '@/core/components/ASIcon.vue'
import { ICONS } from '@/core/icons/icons'
import { useClickOutside } from '@/core/composables/useClickOutside'
import { useFieldId } from '@/core/composables/useFieldId'
import { useLocale } from '@/core/composables/useLocale'
import type {
  SearchInputEmits,
  SearchInputProps,
  SearchSuggestion,
  SearchSuggestionSlotProps,
} from '@/forms/types/SearchInputProps'
import { normalizeText, readableTextOn } from '@/forms/utils/field'
import ASFormField from './ASFormField.vue'

/**
 * Buscador con sugerencias asíncronas (estaciones, municipios,
 * direcciones...): las pide a `fetchSuggestions`, que aporta el proyecto,
 * cuando el usuario deja de escribir (`debounce`) y con al menos `minChars`
 * caracteres. Cancela la petición anterior si se sigue escribiendo, y una
 * respuesta que llega tarde nunca pisa a una más reciente.
 *
 * Sigue el patrón combobox de WAI-ARIA con lista de sugerencias: ↑/↓
 * recorren, Intro elige (o, sin sugerencia activa, emite `submit` con el
 * texto), Escape cierra la lista y, con ella cerrada, vacía el campo. Un
 * texto oculto anuncia "Buscando…" y el número de resultados.
 *
 * Cada sugerencia puede traer etiquetas (`tags`), botones de acción
 * (`actions`, p. ej. "Centrar en el mapa"; Mayús + Intro ejecuta la primera)
 * y un aviso de no disponible (`unavailable`). Para un diseño libre, el slot
 * `suggestion`.
 *
 * @example
 * ```vue
 * <ASSearchInput
 *   v-model="texto"
 *   label="Buscar estación o municipio"
 *   :fetch-suggestions="(q, signal) => api.buscar(q, { signal })"
 *   @select="centrarEn($event.data)"
 * />
 * ```
 */
const props = withDefaults(defineProps<SearchInputProps>(), {
  label: undefined,
  hint: undefined,
  error: undefined,
  size: 'md',
  id: undefined,
  theme: undefined,
  modelValue: '',
  debounce: 300,
  minChars: 2,
  placeholder: undefined,
  clearable: true,
  noResultsText: undefined,
})

defineSlots<{
  /** Contenido de una sugerencia, a medida (sustituye etiqueta, descripción, etiquetas y acciones). */
  suggestion?(props: SearchSuggestionSlotProps): unknown
}>()

const emit = defineEmits<SearchInputEmits>()
const { t } = useLocale()
const id = useFieldId(() => props.id)
const listboxId = computed(() => `${id.value}-listbox`)
const optionId = (index: number) => `${id.value}-option-${index}`

const root = ref<HTMLElement | null>(null)
const input = ref<HTMLInputElement | null>(null)
const text = ref(props.modelValue)
watch(
  () => props.modelValue,
  (value) => (text.value = value),
)

type Status = 'idle' | 'loading' | 'done' | 'error'
const status = ref<Status>('idle')
const suggestions = ref<SearchSuggestion[]>([])
const query = ref('')
const isOpen = ref(false)
const activeIndex = ref(-1)

// ── Búsqueda ────────────────────────────────────────────────────────────
let timer: ReturnType<typeof setTimeout> | undefined
let controller: AbortController | undefined
let requestId = 0

function cancel(): void {
  clearTimeout(timer)
  controller?.abort()
  controller = undefined
}

onBeforeUnmount(cancel)

async function search(value: string): Promise<void> {
  cancel()
  const request = ++requestId
  controller = new AbortController()
  const { signal } = controller
  query.value = value
  status.value = 'loading'
  isOpen.value = true
  try {
    const result = await props.fetchSuggestions(value, signal)
    // Solo cuenta la respuesta de la última búsqueda.
    if (request !== requestId || signal.aborted) return
    suggestions.value = result
    status.value = 'done'
    activeIndex.value = -1
  } catch (error) {
    if (request !== requestId || signal.aborted) return
    suggestions.value = []
    status.value = 'error'
    emit('error', error)
  }
}

function onInput(event: Event): void {
  text.value = (event.target as HTMLInputElement).value
  emit('update:modelValue', text.value)
  cancel()
  ++requestId
  if (text.value.trim().length < props.minChars) {
    suggestions.value = []
    status.value = 'idle'
    isOpen.value = false
    return
  }
  const value = text.value.trim()
  timer = setTimeout(() => void search(value), props.debounce)
}

// ── Lista ───────────────────────────────────────────────────────────────
interface Section {
  key: string
  label?: string
  items: { suggestion: SearchSuggestion; index: number }[]
}

/** Sugerencias agrupadas por `group`, en el orden en que llega cada grupo. */
const sections = computed<Section[]>(() => {
  const result: Section[] = []
  suggestions.value.forEach((suggestion, index) => {
    const key = suggestion.group ?? ''
    let section = result.find((s) => s.key === `g:${key}`)
    if (!section) {
      section = { key: `g:${key}`, label: suggestion.group, items: [] }
      result.push(section)
    }
    section.items.push({ suggestion, index })
  })
  return result
})

/** Orden visual (por grupos), que es el que recorre el teclado. */
const ordered = computed(() => sections.value.flatMap((section) => section.items))

const showList = computed(() => isOpen.value && status.value !== 'idle')

const announcement = computed(() => {
  if (status.value === 'loading') return t('search.loading')
  if (status.value === 'error') return t('search.error')
  if (status.value !== 'done') return ''
  const count = suggestions.value.length
  if (!count) return props.noResultsText ?? t('search.noResults', { query: query.value })
  return count === 1 ? t('search.oneResult') : t('search.results', { count })
})

function setActive(position: number): void {
  activeIndex.value = position
  void nextTick(() =>
    document.getElementById(optionId(position))?.scrollIntoView?.({ block: 'nearest' }),
  )
}

function choose(suggestion: SearchSuggestion): void {
  cancel()
  ++requestId
  text.value = suggestion.label
  emit('update:modelValue', suggestion.label)
  emit('select', suggestion)
  close()
}

function close(): void {
  isOpen.value = false
  activeIndex.value = -1
}

useClickOutside(root, close)

function onKeydown(event: KeyboardEvent): void {
  const count = ordered.value.length
  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowUp': {
      if (!count) return
      event.preventDefault()
      if (!isOpen.value) {
        isOpen.value = true
        setActive(event.key === 'ArrowDown' ? 0 : count - 1)
        return
      }
      const step = event.key === 'ArrowDown' ? 1 : -1
      // Desde la última vuelve al campo (-1), como en el patrón de WAI-ARIA.
      const next = activeIndex.value + step
      setActive(next < -1 ? count - 1 : next >= count ? -1 : next)
      return
    }
    case 'Enter': {
      const item = isOpen.value ? ordered.value[activeIndex.value] : undefined
      event.preventDefault()
      const action = item?.suggestion.actions?.find((a) => !a.disabled)
      if (item && event.shiftKey && action) runAction(action.id, item.suggestion)
      else if (item) choose(item.suggestion)
      else {
        close()
        emit('submit', text.value)
      }
      return
    }
    case 'Escape':
      if (showList.value) {
        // Que no cierre también el panel que contiene el buscador.
        event.preventDefault()
        event.stopPropagation()
        close()
      } else if (text.value) {
        event.preventDefault()
        event.stopPropagation()
        clear()
      }
      return
    case 'Tab':
      close()
  }
}

function runAction(actionId: string, suggestion: SearchSuggestion): void {
  emit('suggestion-action', { actionId, suggestion })
}

function clear(): void {
  cancel()
  ++requestId
  text.value = ''
  suggestions.value = []
  status.value = 'idle'
  close()
  emit('update:modelValue', '')
  input.value?.focus()
}

/** Partes del texto de una sugerencia, con lo buscado marcado (sin mayúsculas ni tildes). */
function highlight(label: string): { text: string; match: boolean }[] {
  const chars = [...label]
  const normalized = chars.map((char) => normalizeText(char))
  // Solo si cada carácter normaliza a uno: así los índices coinciden con el original.
  const needle = normalizeText(query.value)
  if (!needle || normalized.some((char) => char.length !== 1))
    return [{ text: label, match: false }]
  const at = normalized.join('').indexOf(needle)
  if (at < 0) return [{ text: label, match: false }]
  return [
    { text: chars.slice(0, at).join(''), match: false },
    { text: chars.slice(at, at + needle.length).join(''), match: true },
    { text: chars.slice(at + needle.length).join(''), match: false },
  ].filter((part) => part.text)
}

defineExpose({
  /** Enfoca el campo. */
  focus: () => input.value?.focus(),
})
</script>

<template>
  <ASFormField
    :id="id"
    v-slot="{ describedBy, invalid }"
    class="as-search-input"
    :label="props.label"
    :hide-label="props.hideLabel"
    :hint="props.hint"
    :error="props.error"
    :required="props.required"
    :disabled="props.disabled"
    :size="props.size"
    :theme="props.theme"
  >
    <div ref="root" class="as-search-input__anchor">
      <div
        class="as-control-box as-search-input__box"
        :class="[
          `as-control-box--${props.size}`,
          { 'as-control-box--invalid': invalid, 'as-control-box--disabled': props.disabled },
        ]"
      >
        <ASIcon class="as-control-box__icon as-search-input__icon" :path="ICONS.magnify" />
        <input
          :id="id"
          ref="input"
          class="as-search-input__control"
          type="text"
          role="combobox"
          autocomplete="off"
          aria-autocomplete="list"
          :value="text"
          :placeholder="props.placeholder"
          :disabled="props.disabled"
          :aria-expanded="showList"
          :aria-controls="listboxId"
          :aria-busy="status === 'loading' || undefined"
          :aria-activedescendant="
            showList && activeIndex >= 0 ? optionId(ordered[activeIndex]!.index) : undefined
          "
          :aria-describedby="describedBy"
          :aria-invalid="invalid || undefined"
          :aria-required="props.required || undefined"
          @input="onInput"
          @keydown="onKeydown"
        />
        <span v-if="status === 'loading'" class="as-search-input__spinner" aria-hidden="true" />
        <button
          v-if="props.clearable && text && !props.disabled"
          type="button"
          class="as-control-box__button"
          :aria-label="t('forms.clear')"
          :title="t('forms.clear')"
          @click="clear"
        >
          <ASIcon :path="ICONS.close" :size="16" />
        </button>
      </div>

      <ul
        v-show="showList"
        :id="listboxId"
        class="as-listbox as-listbox--bottom"
        role="listbox"
        :aria-label="props.label ?? t('search.suggestions')"
        @mousedown.prevent
      >
        <li v-for="(section, position) in sections" :key="section.key" role="presentation">
          <ul
            class="as-listbox__group"
            :role="section.label ? 'group' : 'presentation'"
            :aria-labelledby="section.label ? `${listboxId}-group-${position}` : undefined"
          >
            <li
              v-if="section.label"
              :id="`${listboxId}-group-${position}`"
              class="as-listbox__group-label"
              role="presentation"
            >
              {{ section.label }}
            </li>
            <li
              v-for="{ suggestion, index } in section.items"
              :id="optionId(index)"
              :key="suggestion.id"
              class="as-listbox__option"
              :class="{
                'as-listbox__option--active': ordered[activeIndex]?.index === index,
                'as-search-input__option--unavailable': suggestion.unavailable,
              }"
              role="option"
              :aria-selected="ordered[activeIndex]?.index === index"
              @click="choose(suggestion)"
            >
              <slot
                name="suggestion"
                :suggestion="suggestion"
                :active="ordered[activeIndex]?.index === index"
                :parts="highlight(suggestion.label)"
              >
                <ASIcon
                  v-if="suggestion.icon"
                  class="as-listbox__option-icon"
                  :icon="suggestion.icon"
                  :size="18"
                />
                <span class="as-listbox__option-text">
                  <span class="as-search-input__label">
                    <span>
                      <template v-for="(part, i) in highlight(suggestion.label)" :key="i">
                        <mark v-if="part.match" class="as-search-input__match">{{
                          part.text
                        }}</mark>
                        <template v-else>{{ part.text }}</template>
                      </template>
                    </span>
                    <span
                      v-for="tag in suggestion.tags ?? []"
                      :key="tag.label"
                      class="as-search-input__tag"
                      :style="
                        tag.color
                          ? { background: tag.color, color: readableTextOn(tag.color) }
                          : undefined
                      "
                    >
                      {{ tag.label }}
                    </span>
                  </span>
                  <small v-if="suggestion.description" class="as-listbox__description">
                    {{ suggestion.description }}
                  </small>
                </span>
                <span
                  v-if="suggestion.unavailable"
                  class="as-search-input__unavailable"
                  :title="suggestion.unavailableReason"
                >
                  <ASIcon :path="ICONS.alertCircle" :size="16" />
                  <span v-if="suggestion.unavailableReason" class="as-control-box__sr-only">
                    {{ suggestion.unavailableReason }}
                  </span>
                </span>
                <!-- Atajos para el ratón: con el teclado, Mayús + Intro ejecuta la primera. -->
                <button
                  v-for="action in suggestion.actions ?? []"
                  :key="action.id"
                  type="button"
                  class="as-control-box__button as-search-input__action"
                  tabindex="-1"
                  :aria-label="action.label"
                  :title="action.label"
                  :disabled="action.disabled"
                  @mousedown.prevent
                  @click.stop="runAction(action.id, suggestion)"
                >
                  <ASIcon :icon="action.icon" :size="16" />
                </button>
              </slot>
            </li>
          </ul>
        </li>
        <li
          v-if="status !== 'done' || !suggestions.length"
          class="as-listbox__empty"
          role="presentation"
        >
          {{ announcement }}
        </li>
      </ul>
      <!-- Anuncia "Buscando…" y el número de resultados sin mover el foco. -->
      <span class="as-control-box__sr-only" role="status">{{ showList ? announcement : '' }}</span>
    </div>
  </ASFormField>
</template>

<style scoped src="../styles/control-box.css"></style>
<style scoped src="../styles/listbox.css"></style>

<style scoped>
.as-search-input__anchor {
  position: relative;
}

.as-search-input__box:not(.as-control-box--disabled) {
  cursor: text;
}

.as-search-input__icon {
  color: var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
}

.as-search-input__control {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  color: inherit;
  font: inherit;
}

.as-search-input__control::placeholder {
  color: var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
  opacity: 1;
}

/* Lo buscado, en negrita y sin el fondo amarillo del navegador. */
.as-search-input__match {
  background: none;
  color: inherit;
  font-weight: var(--as-font-weight-bold, 700);
}

.as-search-input__label {
  display: flex;
  flex-wrap: wrap;
  gap: 2px var(--as-space-2, 8px);
  align-items: center;
}

.as-search-input__tag {
  padding: 0 6px;
  border-radius: var(--as-radius-full, 9999px);
  background: var(--as-color-surface-muted, light-dark(#f1f5f9, #334155));
  font-size: var(--as-font-size-xs, 0.75rem);
  font-weight: var(--as-font-weight-semibold, 600);
  line-height: 1.6;
}

/* No disponible: se puede elegir, pero se ve atenuada y con el aviso. */
.as-search-input__option--unavailable .as-listbox__option-text {
  opacity: 0.6;
}

.as-search-input__unavailable {
  display: flex;
  color: var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
}

.as-search-input__action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.as-search-input__spinner {
  flex: none;
  width: 14px;
  height: 14px;
  border: 2px solid var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
  border-right-color: transparent;
  border-radius: 50%;
  animation: as-search-spin 0.7s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .as-search-input__spinner {
    animation-duration: 2s;
  }
}

@keyframes as-search-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
