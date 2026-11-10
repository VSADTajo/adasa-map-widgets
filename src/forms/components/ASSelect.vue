<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import ASIcon from '@/core/components/ASIcon.vue'
import { ICONS } from '@/core/icons/icons'
import { useClickOutside } from '@/core/composables/useClickOutside'
import { useFieldId } from '@/core/composables/useFieldId'
import { useLocale } from '@/core/composables/useLocale'
import type { SelectGroup, SelectOption, SelectValue } from '@/forms/types/common'
import type {
  SelectChipSlotProps,
  SelectEmits,
  SelectOptionSlotProps,
  SelectProps,
} from '@/forms/types/SelectProps'
import { normalizeText } from '@/forms/utils/field'
import ASFormField from './ASFormField.vue'

/**
 * Desplegable de opciones: selección única o múltiple (con chips), búsqueda,
 * opciones agrupadas y manejo completo con teclado. Sigue el patrón
 * "combobox + listbox" de WAI-ARIA: el foco se queda en el campo y la
 * opción activa se anuncia con `aria-activedescendant`.
 *
 * Teclado: ↑/↓ abren y recorren (saltando las deshabilitadas), Inicio/Fin y
 * RePág/AvPág saltan, Intro elige, Escape cierra, Tab cierra sin elegir y
 * Retroceso quita el último chip. Sin `searchable`, escribir salta a la
 * opción que empieza por esas letras, como en un `<select>` nativo.
 *
 * Controlado: emite la selección nueva y muestra lo que devuelva el padre.
 * La lista se abre debajo, o encima si no cabe.
 *
 * @example
 * ```vue
 * <ASSelect v-model="cuenca" label="Cuenca" searchable clearable :options="cuencas" />
 * <ASSelect v-model="tipos" label="Tipos" multiple :max-chips="2" :options="tipos" />
 * ```
 */
const props = withDefaults(defineProps<SelectProps>(), {
  label: undefined,
  hint: undefined,
  error: undefined,
  size: 'md',
  id: undefined,
  theme: undefined,
  modelValue: null,
  filter: undefined,
  placeholder: undefined,
  maxChips: undefined,
  noOptionsText: undefined,
})

const emit = defineEmits<SelectEmits>()

defineSlots<{
  option?(props: SelectOptionSlotProps): unknown
  chip?(props: SelectChipSlotProps): unknown
  empty?(): unknown
}>()

const { t } = useLocale()
const id = useFieldId(() => props.id)
const labelId = computed(() => `${id.value}-label`)
const listboxId = computed(() => `${id.value}-listbox`)
const optionId = (index: number) => `${id.value}-option-${index}`

const root = ref<HTMLElement | null>(null)
const combobox = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const focused = ref(false)
const query = ref('')
const activeIndex = ref(-1)
const placement = ref<'bottom' | 'top'>('bottom')

// ── Opciones ────────────────────────────────────────────────────────────
const isGroup = (item: SelectOption | SelectGroup): item is SelectGroup => 'options' in item

const allOptions = computed(() =>
  props.options.flatMap((item) => (isGroup(item) ? item.options : [item])),
)

function matches(option: SelectOption): boolean {
  if (!props.searchable || !query.value) return true
  if (props.filter) return props.filter(option, query.value)
  return normalizeText(option.label).includes(normalizeText(query.value))
}

interface Section {
  key: string
  label?: string
  options: { option: SelectOption; index: number }[]
}

/**
 * Lo que se pinta: los grupos (con título) y las opciones sueltas seguidas,
 * ya filtradas. `index` es la posición entre las visibles, la que recorre
 * el teclado.
 */
const sections = computed<Section[]>(() => {
  const result: Section[] = []
  let index = 0
  props.options.forEach((item, position) => {
    const options = (isGroup(item) ? item.options : [item]).filter(matches)
    if (!options.length) return
    const entries = options.map((option) => ({ option, index: index++ }))
    const last = result[result.length - 1]
    if (!isGroup(item) && last && last.label === undefined) last.options.push(...entries)
    else
      result.push({
        key: `s${position}`,
        label: isGroup(item) ? item.label : undefined,
        options: entries,
      })
  })
  return result
})

const visible = computed(() =>
  sections.value.flatMap((section) => section.options.map((o) => o.option)),
)

// ── Selección ───────────────────────────────────────────────────────────
const selectedValues = computed<SelectValue[]>(() => {
  const value = props.modelValue
  if (value === null || value === undefined) return []
  if (Array.isArray(value)) return props.multiple ? value : value.slice(0, 1)
  return [value]
})

const isSelected = (value: SelectValue) => selectedValues.value.includes(value)

const selectedOptions = computed(() =>
  selectedValues.value.map(
    (value) =>
      allOptions.value.find((option) => option.value === value) ?? { value, label: String(value) },
  ),
)

const visibleChips = computed(() =>
  props.maxChips === undefined
    ? selectedOptions.value
    : selectedOptions.value.slice(0, props.maxChips),
)
const hiddenChips = computed(() => selectedOptions.value.length - visibleChips.value.length)

const placeholderText = computed(() => props.placeholder ?? t('forms.placeholder'))
const singleLabel = computed(() => (props.multiple ? undefined : selectedOptions.value[0]?.label))

/** Valor del campo de búsqueda: lo que se escribe; sin foco, la opción elegida (selección única). */
const inputValue = computed(() =>
  focused.value || isOpen.value ? query.value : (singleLabel.value ?? ''),
)

/** Con selección múltiple, id del texto oculto que enumera lo elegido (lo que dicen los chips). */
const selectionId = computed(() =>
  props.multiple && selectedOptions.value.length ? `${id.value}-selection` : undefined,
)

const showClear = computed(
  () => props.clearable && !props.disabled && selectedValues.value.length > 0,
)

function emitSelection(values: SelectValue[]): void {
  emit('update:modelValue', props.multiple ? values : (values[0] ?? null))
}

function choose(option: SelectOption): void {
  if (option.disabled) return
  if (props.multiple) {
    const values = isSelected(option.value)
      ? selectedValues.value.filter((value) => value !== option.value)
      : [...selectedValues.value, option.value]
    emitSelection(values)
    if (query.value) {
      query.value = ''
      void nextTick(() => setActive(visible.value.indexOf(option)))
    }
  } else {
    emitSelection([option.value])
    close()
  }
}

function remove(value: SelectValue): void {
  emitSelection(selectedValues.value.filter((v) => v !== value))
  combobox.value?.focus()
}

function clear(): void {
  query.value = ''
  emitSelection([])
  combobox.value?.focus()
}

// ── Apertura y opción activa ────────────────────────────────────────────
function firstEnabled(from: number, step: 1 | -1): number {
  for (let i = from; i >= 0 && i < visible.value.length; i += step) {
    if (!visible.value[i]!.disabled) return i
  }
  return -1
}

function setActive(index: number): void {
  activeIndex.value = index
  if (index < 0) return
  void nextTick(() => {
    // jsdom no implementa scrollIntoView.
    document.getElementById(optionId(index))?.scrollIntoView?.({ block: 'nearest' })
  })
}

function move(delta: number): void {
  const count = visible.value.length
  if (!count) return
  const target =
    activeIndex.value < 0
      ? delta > 0
        ? 0
        : count - 1
      : Math.min(count - 1, Math.max(0, activeIndex.value + delta))
  const step = delta > 0 ? 1 : -1
  const index = firstEnabled(target, step)
  setActive(index >= 0 ? index : firstEnabled(target, step === 1 ? -1 : 1))
}

function open(): void {
  if (props.disabled) return
  if (!isOpen.value) {
    const rect = root.value?.getBoundingClientRect()
    if (rect) {
      const below = window.innerHeight - rect.bottom
      placement.value = below < 260 && rect.top > below ? 'top' : 'bottom'
    }
    isOpen.value = true
    emit('open')
  }
  const selected = visible.value.findIndex((option) => isSelected(option.value) && !option.disabled)
  setActive(selected >= 0 ? selected : firstEnabled(0, 1))
}

function close(): void {
  if (!isOpen.value) return
  isOpen.value = false
  activeIndex.value = -1
  query.value = ''
  emit('close')
}

useClickOutside(root, close)

// ── Teclado ─────────────────────────────────────────────────────────────
let typeahead = ''
let typeaheadTimer: ReturnType<typeof setTimeout> | undefined
onBeforeUnmount(() => clearTimeout(typeaheadTimer))

/** Salta a la opción que empieza por lo tecleado en el último medio segundo. */
function jumpTo(char: string): void {
  typeahead += char
  clearTimeout(typeaheadTimer)
  typeaheadTimer = setTimeout(() => (typeahead = ''), 500)
  const count = visible.value.length
  const current = isOpen.value
    ? activeIndex.value
    : visible.value.findIndex((o) => isSelected(o.value))
  // Repetir la misma letra pasa a la siguiente opción que empieza por ella.
  const start = typeahead.length === 1 ? current + 1 : Math.max(current, 0)
  const prefix = normalizeText(typeahead)
  for (let i = 0; i < count; i++) {
    const index = (start + i) % count
    const option = visible.value[index]!
    if (!option.disabled && normalizeText(option.label).startsWith(prefix)) {
      if (isOpen.value) setActive(index)
      else if (props.multiple) {
        open()
        setActive(index)
      } else emitSelection([option.value])
      return
    }
  }
}

function onKeydown(event: KeyboardEvent): void {
  if (props.disabled) return
  const active = visible.value[activeIndex.value]
  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowUp':
      event.preventDefault()
      if (!isOpen.value) open()
      else if (!event.altKey) move(event.key === 'ArrowDown' ? 1 : -1)
      return
    case 'PageDown':
    case 'PageUp':
      if (!isOpen.value) return
      event.preventDefault()
      move(event.key === 'PageDown' ? 10 : -10)
      return
    case 'Home':
    case 'End':
      // En el campo de búsqueda, Inicio y Fin mueven el cursor del texto.
      if (!isOpen.value || props.searchable) return
      event.preventDefault()
      setActive(
        event.key === 'Home' ? firstEnabled(0, 1) : firstEnabled(visible.value.length - 1, -1),
      )
      return
    case 'Enter':
      if (isOpen.value && active) {
        event.preventDefault()
        choose(active)
      } else if (!isOpen.value && !props.searchable) {
        event.preventDefault()
        open()
      }
      return
    case 'Escape':
      if (isOpen.value) {
        // Que no cierre también el panel que contiene el campo (p. ej. ASAppShell).
        event.preventDefault()
        event.stopPropagation()
        close()
      }
      return
    case 'Tab':
      close()
      return
    case 'Backspace':
      if (props.multiple && !query.value && selectedValues.value.length) {
        event.preventDefault()
        remove(selectedValues.value[selectedValues.value.length - 1]!)
      }
      return
  }
  if (props.searchable) return
  if (event.key === ' ' && !typeahead) {
    event.preventDefault()
    if (isOpen.value && active) choose(active)
    else open()
    return
  }
  if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault()
    jumpTo(event.key)
  }
}

function onInput(event: Event): void {
  query.value = (event.target as HTMLInputElement).value
  emit('search', query.value)
  if (!isOpen.value) open()
  setActive(firstEnabled(0, 1))
}

/** Clic en el marco: enfoca el campo y abre o cierra la lista (salvo en los botones). */
function onBoxClick(event: MouseEvent): void {
  if (props.disabled || (event.target as Element).closest('button')) return
  combobox.value?.focus()
  if (isOpen.value && !props.searchable) close()
  else open()
}

defineExpose({
  /** Enfoca el campo. */
  focus: () => combobox.value?.focus(),
  /** Abre la lista. */
  open,
  /** Cierra la lista. */
  close,
})
</script>

<template>
  <ASFormField
    :id="id"
    v-slot="{ describedBy, invalid }"
    class="as-select"
    :label="props.label"
    :hint="props.hint"
    :error="props.error"
    :required="props.required"
    :disabled="props.disabled"
    :size="props.size"
    :theme="props.theme"
  >
    <div ref="root" class="as-select__anchor">
      <div
        class="as-control-box as-select__box"
        :class="[
          `as-control-box--${props.size}`,
          {
            'as-control-box--invalid': invalid,
            'as-control-box--disabled': props.disabled,
            'as-select__box--open': isOpen,
            'as-select__box--chips': props.multiple && selectedOptions.length > 0,
          },
        ]"
        @click="onBoxClick"
      >
        <ul
          v-if="props.multiple && selectedOptions.length"
          class="as-select__chips"
          aria-hidden="true"
        >
          <li v-for="option in visibleChips" :key="option.value" class="as-select__chip">
            <slot name="chip" :option="option" :remove="() => remove(option.value)">
              <span class="as-select__chip-label">{{ option.label }}</span>
              <button
                v-if="!props.disabled"
                type="button"
                class="as-select__chip-remove"
                tabindex="-1"
                :title="t('forms.removeOption', { label: option.label })"
                @mousedown.prevent
                @click="remove(option.value)"
              >
                <ASIcon :path="ICONS.close" :size="14" />
              </button>
            </slot>
          </li>
          <li
            v-if="hiddenChips"
            class="as-select__chip"
            :title="t('forms.moreSelected', { count: hiddenChips })"
          >
            +{{ hiddenChips }}
          </li>
        </ul>

        <input
          v-if="props.searchable"
          :id="id"
          ref="combobox"
          class="as-select__combobox as-select__input"
          type="text"
          role="combobox"
          autocomplete="off"
          aria-autocomplete="list"
          :value="inputValue"
          :placeholder="
            selectedOptions.length && props.multiple ? undefined : (singleLabel ?? placeholderText)
          "
          :disabled="props.disabled"
          :aria-expanded="isOpen"
          :aria-controls="listboxId"
          aria-haspopup="listbox"
          :aria-activedescendant="isOpen && activeIndex >= 0 ? optionId(activeIndex) : undefined"
          :aria-describedby="[describedBy, selectionId].filter(Boolean).join(' ') || undefined"
          :aria-invalid="invalid || undefined"
          :aria-required="props.required || undefined"
          @input="onInput"
          @keydown="onKeydown"
          @focus="focused = true"
          @blur="focused = false"
        />
        <div
          v-else
          :id="id"
          ref="combobox"
          class="as-select__combobox"
          role="combobox"
          :tabindex="props.disabled ? -1 : 0"
          :aria-labelledby="props.label ? labelId : undefined"
          :aria-expanded="isOpen"
          :aria-controls="listboxId"
          aria-haspopup="listbox"
          :aria-activedescendant="isOpen && activeIndex >= 0 ? optionId(activeIndex) : undefined"
          :aria-describedby="[describedBy, selectionId].filter(Boolean).join(' ') || undefined"
          :aria-invalid="invalid || undefined"
          :aria-required="props.required || undefined"
          :aria-disabled="props.disabled || undefined"
          @keydown="onKeydown"
        >
          <template v-if="!selectedOptions.length">
            <span class="as-control-box__placeholder">{{ placeholderText }}</span>
          </template>
          <template v-else-if="!props.multiple">{{ singleLabel }}</template>
        </div>

        <!-- Los chips son solo visuales: lo elegido se anuncia desde aquí. -->
        <span v-if="selectionId" :id="selectionId" class="as-control-box__sr-only">
          {{ selectedOptions.map((option) => option.label).join(', ') }}
        </span>
        <button
          v-if="showClear"
          type="button"
          class="as-control-box__button"
          :aria-label="t('forms.clear')"
          :title="t('forms.clear')"
          @click="clear"
        >
          <ASIcon :path="ICONS.close" :size="16" />
        </button>
        <ASIcon class="as-control-box__icon as-select__chevron" :path="ICONS.chevronDown" />
      </div>

      <ul
        v-show="isOpen"
        :id="listboxId"
        class="as-listbox"
        :class="`as-listbox--${placement}`"
        role="listbox"
        :aria-labelledby="props.label ? labelId : undefined"
        :aria-label="props.label ? undefined : t('forms.options')"
        :aria-multiselectable="props.multiple || undefined"
        @mousedown.prevent
      >
        <li v-for="section in sections" :key="section.key" role="presentation">
          <ul
            class="as-listbox__group"
            :role="section.label ? 'group' : 'presentation'"
            :aria-labelledby="section.label ? `${listboxId}-${section.key}` : undefined"
          >
            <li
              v-if="section.label"
              :id="`${listboxId}-${section.key}`"
              class="as-listbox__group-label"
              role="presentation"
            >
              {{ section.label }}
            </li>
            <li
              v-for="{ option, index } in section.options"
              :id="optionId(index)"
              :key="option.value"
              class="as-listbox__option"
              :class="{
                'as-listbox__option--active': index === activeIndex,
                'as-listbox__option--selected': isSelected(option.value),
                'as-listbox__option--disabled': option.disabled,
              }"
              role="option"
              :aria-selected="isSelected(option.value)"
              :aria-disabled="option.disabled || undefined"
              @click="choose(option)"
              @mousemove="index !== activeIndex && !option.disabled && (activeIndex = index)"
            >
              <slot
                name="option"
                :option="option"
                :selected="isSelected(option.value)"
                :active="index === activeIndex"
              >
                <span v-if="props.multiple" class="as-select__check" aria-hidden="true">
                  <ASIcon v-if="isSelected(option.value)" :path="ICONS.check" size="100%" />
                </span>
                <ASIcon
                  v-if="option.icon"
                  class="as-listbox__option-icon"
                  :icon="option.icon"
                  :size="18"
                />
                <span class="as-listbox__option-text">
                  {{ option.label }}
                  <small v-if="option.description" class="as-listbox__description">
                    {{ option.description }}
                  </small>
                </span>
                <ASIcon
                  v-if="!props.multiple && isSelected(option.value)"
                  class="as-select__tick"
                  :path="ICONS.check"
                  :size="18"
                />
              </slot>
            </li>
          </ul>
        </li>
        <li v-if="!visible.length" class="as-listbox__empty" role="presentation">
          <slot name="empty">{{ props.noOptionsText ?? t('forms.noOptions') }}</slot>
        </li>
      </ul>
    </div>
  </ASFormField>
</template>

<style scoped src="../styles/control-box.css"></style>
<style scoped src="../styles/listbox.css"></style>

<style scoped>
.as-select__anchor {
  position: relative;
}

.as-select__box:not(.as-control-box--disabled) {
  cursor: pointer;
}

/* Con chips el marco crece en alto en vez de recortarlos. */
.as-select__box--chips {
  flex-wrap: wrap;
  height: auto;
  min-height: var(--as-control-height);
  padding-block: 3px;
}

.as-select__combobox {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  outline: none;
}

.as-select__box--chips .as-select__combobox {
  min-width: 4em;
}

.as-select__input {
  height: 100%;
  min-height: 1.5em;
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: inherit;
}

.as-select__input::placeholder {
  color: var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
  opacity: 1;
}

/* Con una opción elegida, el placeholder es esa opción: se ve como texto normal. */
.as-select__input:not(:focus)::placeholder {
  color: inherit;
}

.as-select__chevron {
  color: var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
  transition: transform 0.15s;
}

.as-select__box--open .as-select__chevron {
  transform: rotate(180deg);
}

/* ── Chips ─────────────────────────────────────────────────────────── */
.as-select__chips {
  display: contents;
  margin: 0;
  padding: 0;
  list-style: none;
}

.as-select__chip {
  display: inline-flex;
  gap: 2px;
  align-items: center;
  max-width: 12em;
  height: calc(var(--as-control-height) - 10px);
  padding: 0 4px 0 8px;
  border-radius: var(--as-radius-sm, 4px);
  background-color: var(--as-color-surface-muted, light-dark(#f1f5f9, #334155));
  font-size: 0.9em;
  white-space: nowrap;
}

.as-select__chip:last-child:not(:has(button)) {
  padding-right: 8px;
}

.as-select__chip-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.as-select__chip-remove {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  padding: 0;
  border: none;
  border-radius: var(--as-radius-full, 9999px);
  background: transparent;
  color: var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
  cursor: pointer;
}

.as-select__chip-remove:hover {
  color: var(--as-color-text, light-dark(#0f172a, #f1f5f9));
}

.as-select__tick {
  color: var(--as-color-primary, light-dark(#2563eb, #60a5fa));
}

.as-select__check {
  display: grid;
  flex: none;
  box-sizing: border-box;
  width: 16px;
  height: 16px;
  padding: 1px;
  border: 2px solid var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
  border-radius: var(--as-radius-sm, 4px);
  color: var(--as-color-primary-contrast, light-dark(#ffffff, #0f172a));
}

.as-listbox__option--selected .as-select__check {
  border-color: var(--as-color-primary, light-dark(#2563eb, #60a5fa));
  background-color: var(--as-color-primary, light-dark(#2563eb, #60a5fa));
}

@media (prefers-reduced-motion: reduce) {
  .as-select__chevron {
    transition: none;
  }
}
</style>
