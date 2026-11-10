<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import ASIcon from '@/core/components/ASIcon.vue'
import { ICONS } from '@/core/icons/icons'
import { useClickOutside } from '@/core/composables/useClickOutside'
import { useFieldId } from '@/core/composables/useFieldId'
import { useResolvedTheme } from '@/core/composables/useTheme'
import type { MenuEmits, MenuEntry, MenuItem, MenuProps } from '@/forms/types/MenuProps'
import { normalizeText } from '@/forms/utils/field'
import ASButton from './ASButton.vue'

/**
 * Botón que despliega un menú: acciones, casillas (varias marcadas, el menú
 * sigue abierto) y radios (una del grupo, cierra el menú). Sigue el patrón
 * "menu button" de WAI-ARIA: el foco entra en el menú al abrirlo, ↑/↓
 * recorren las opciones (saltando las deshabilitadas), Inicio/Fin van a los
 * extremos, una letra salta a la opción que empieza por ella, Intro o
 * Espacio eligen, y Escape cierra y devuelve el foco al botón.
 *
 * Controlado: emite la opción elegida y el padre actualiza el `checked` de
 * casillas y radios.
 *
 * @example
 * ```vue
 * <ASMenu
 *   label="Previsiones"
 *   :icon="mdiLayers"
 *   :badge="seleccionadas.length"
 *   :items="fuentes.map((f) => ({ id: f.id, label: f.name, type: 'checkbox', checked: seleccionadas.includes(f.id) }))"
 *   @select="alternar($event.id)"
 * />
 * ```
 */
const props = withDefaults(defineProps<MenuProps>(), {
  icon: undefined,
  badge: undefined,
  variant: 'ghost',
  size: 'md',
  disabledReason: undefined,
  align: 'start',
  theme: undefined,
})

const emit = defineEmits<MenuEmits>()

defineSlots<{
  /** Contenido del botón, en lugar del icono, el texto y el contador (p. ej. un avatar). */
  trigger?(): unknown
  /** Cabecera fija arriba del menú, no elegible (p. ej. el nombre y el correo del usuario). */
  header?(): unknown
}>()
const theme = useResolvedTheme(() => props.theme, null)
const menuId = useFieldId(() => undefined, 'as-menu')

const root = ref<HTMLElement | null>(null)
const trigger = ref<InstanceType<typeof ASButton> | null>(null)
const menu = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const placement = ref<'bottom' | 'top'>('bottom')
const activeIndex = ref(-1)

/** Opciones elegibles (sin separadores), en el orden en que se pintan. */
const selectable = computed(() =>
  props.items.filter((entry): entry is MenuItem => entry.type !== 'separator'),
)

const triggerEl = () => (trigger.value?.$el as HTMLElement | undefined) ?? null

function roleOf(entry: MenuItem): string {
  if (entry.type === 'checkbox') return 'menuitemcheckbox'
  if (entry.type === 'radio') return 'menuitemradio'
  return 'menuitem'
}

function isChecked(entry: MenuEntry): boolean | undefined {
  return entry.type === 'checkbox' || entry.type === 'radio' ? entry.checked : undefined
}

/** Siguiente opción habilitada desde `from` en el sentido `step`, dando la vuelta. */
function enabledFrom(from: number, step: 1 | -1): number {
  const count = selectable.value.length
  for (let i = 0; i < count; i++) {
    const index = (((from + step * i) % count) + count) % count
    if (!selectable.value[index]!.disabled) return index
  }
  return -1
}

function focusItem(index: number): void {
  activeIndex.value = index
  if (index < 0) return
  void nextTick(() =>
    menu.value?.querySelectorAll<HTMLElement>('[role^="menuitem"]')[index]?.focus(),
  )
}

function open(focus: 'first' | 'last' = 'first'): void {
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
  const count = selectable.value.length
  focusItem(focus === 'first' ? enabledFrom(0, 1) : enabledFrom(count - 1, -1))
}

function close(restoreFocus = true): void {
  if (!isOpen.value) return
  isOpen.value = false
  activeIndex.value = -1
  emit('close')
  if (restoreFocus) triggerEl()?.focus()
}

useClickOutside(root, () => close(false))

function toggle(): void {
  if (isOpen.value) close()
  else open()
}

function activate(entry: MenuItem): void {
  if (entry.disabled) return
  emit('select', entry)
  // Las casillas se marcan de una en una: el menú sigue abierto.
  if (entry.type !== 'checkbox') close()
}

function onTriggerKeydown(event: KeyboardEvent): void {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    open(event.key === 'ArrowDown' ? 'first' : 'last')
  }
}

function onMenuKeydown(event: KeyboardEvent): void {
  const count = selectable.value.length
  const current = activeIndex.value
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      focusItem(enabledFrom(current + 1, 1))
      return
    case 'ArrowUp':
      event.preventDefault()
      focusItem(enabledFrom(current - 1 + count, -1))
      return
    case 'Home':
      event.preventDefault()
      focusItem(enabledFrom(0, 1))
      return
    case 'End':
      event.preventDefault()
      focusItem(enabledFrom(count - 1, -1))
      return
    case 'Enter':
    case ' ': {
      event.preventDefault()
      const entry = selectable.value[current]
      if (entry) activate(entry)
      return
    }
    case 'Escape':
      // Que no cierre también el panel que contiene el menú.
      event.preventDefault()
      event.stopPropagation()
      close()
      return
    case 'Tab':
      close(false)
      return
  }
  if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
    const char = normalizeText(event.key)
    for (let i = 1; i <= count; i++) {
      const index = (current + i) % count
      const entry = selectable.value[index]!
      if (!entry.disabled && normalizeText(entry.label).startsWith(char)) {
        focusItem(index)
        return
      }
    }
  }
}

defineExpose({
  /** Abre el menú con el foco en la primera opción. */
  open: () => open(),
  /** Cierra el menú. */
  close: () => close(false),
})
</script>

<template>
  <div
    ref="root"
    class="as-menu"
    :class="theme && `as-menu--${theme}`"
    :title="props.disabled ? props.disabledReason : undefined"
  >
    <ASButton
      ref="trigger"
      class="as-menu__trigger"
      :class="{ 'as-menu__trigger--active': props.active }"
      :variant="props.variant"
      :size="props.size"
      :icon="props.icon"
      :disabled="props.disabled"
      aria-haspopup="menu"
      :aria-expanded="isOpen"
      :aria-controls="menuId"
      :aria-label="props.iconOnly ? props.label : undefined"
      :title="props.iconOnly && !props.disabled ? props.label : undefined"
      @click="toggle"
      @keydown="onTriggerKeydown"
    >
      <template v-if="$slots.trigger" #default><slot name="trigger" /></template>
      <template v-else-if="!props.iconOnly || props.badge !== undefined" #default>
        <span v-if="!props.iconOnly">{{ props.label }}</span>
        <!-- Espacio real: separa nombre y contador también para los lectores de pantalla. -->
        {{ !props.iconOnly && props.badge !== undefined ? ' ' : '' }}
        <span v-if="props.badge !== undefined" class="as-menu__badge">{{ props.badge }}</span>
      </template>
    </ASButton>

    <ul
      v-show="isOpen"
      :id="menuId"
      ref="menu"
      class="as-menu__list"
      :class="[`as-menu__list--${placement}`, `as-menu__list--${props.align}`]"
      role="menu"
      :aria-label="props.label"
      @keydown="onMenuKeydown"
    >
      <li v-if="$slots.header" class="as-menu__header" role="presentation">
        <slot name="header" />
      </li>
      <template v-for="entry in props.items" :key="entry.id">
        <li v-if="entry.type === 'separator'" class="as-menu__separator" role="separator" />
        <li
          v-else
          class="as-menu__item"
          :class="{ 'as-menu__item--disabled': entry.disabled }"
          :role="roleOf(entry)"
          tabindex="-1"
          :aria-checked="isChecked(entry)"
          :aria-disabled="entry.disabled || undefined"
          @click="activate(entry)"
          @mouseenter="!entry.disabled && focusItem(selectable.indexOf(entry))"
        >
          <span
            v-if="entry.type === 'checkbox' || entry.type === 'radio'"
            class="as-menu__mark"
            :class="[`as-menu__mark--${entry.type}`, { 'as-menu__mark--checked': entry.checked }]"
            aria-hidden="true"
          >
            <ASIcon
              v-if="entry.type === 'checkbox' && entry.checked"
              :path="ICONS.check"
              size="100%"
            />
          </span>
          <ASIcon v-if="entry.icon" class="as-menu__icon" :icon="entry.icon" :size="18" />
          <span class="as-menu__text">
            {{ entry.label }}
            <small v-if="entry.description" class="as-menu__description">
              {{ entry.description }}
            </small>
          </span>
        </li>
      </template>
    </ul>
  </div>
</template>

<style scoped>
.as-menu {
  position: relative;
  display: inline-flex;
}

.as-menu--dark {
  color-scheme: dark;
}

.as-menu--light {
  color-scheme: light;
}

.as-menu__trigger--active {
  --as-button-bg: color-mix(
    in srgb,
    var(--as-color-primary, light-dark(#2563eb, #60a5fa)) 18%,
    transparent
  );
  --as-button-fg: var(--as-color-primary, light-dark(#2563eb, #60a5fa));
}

.as-menu__badge {
  min-width: 1.4em;
  padding: 0 4px;
  border-radius: var(--as-radius-full, 9999px);
  background-color: var(--as-color-surface-muted, light-dark(#f1f5f9, #334155));
  color: var(--as-color-text, light-dark(#0f172a, #f1f5f9));
  font-size: var(--as-font-size-xs, 0.75rem);
  font-variant-numeric: tabular-nums;
  line-height: 1.5;
  text-align: center;
}

.as-menu__list {
  position: absolute;
  z-index: var(--as-z-dropdown, 1100);
  box-sizing: border-box;
  min-width: 180px;
  max-height: 320px;
  margin: 0;
  padding: var(--as-space-1, 4px);
  overflow-y: auto;
  border: 1px solid var(--as-color-border, light-dark(#cbd5e1, #475569));
  border-radius: var(--as-radius, 8px);
  background-color: var(--as-color-surface, light-dark(#ffffff, #1e293b));
  color: var(--as-color-text, light-dark(#0f172a, #f1f5f9));
  box-shadow: var(--as-shadow-lg, 0 8px 24px rgba(15, 23, 42, 0.16));
  font-family: var(--as-font-family, system-ui, sans-serif);
  font-size: var(--as-font-size-sm, 0.875rem);
  list-style: none;
}

.as-menu__list--bottom {
  top: calc(100% + 4px);
}

.as-menu__list--top {
  bottom: calc(100% + 4px);
}

.as-menu__list--start {
  left: 0;
}

.as-menu__list--end {
  right: 0;
}

.as-menu__item {
  display: flex;
  gap: var(--as-space-2, 8px);
  align-items: center;
  padding: var(--as-space-2, 8px);
  border-radius: var(--as-radius-sm, 4px);
  white-space: nowrap;
  cursor: pointer;
}

/* El foco es real (patrón menú): se marca con fondo y una barra, no solo color. */
.as-menu__item:focus {
  outline: none;
  background-color: var(--as-color-surface-muted, light-dark(#f1f5f9, #334155));
  box-shadow: inset 3px 0 0 var(--as-color-primary, light-dark(#2563eb, #60a5fa));
}

.as-menu__item--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.as-menu__header {
  margin: calc(var(--as-space-1, 4px) * -1) calc(var(--as-space-1, 4px) * -1) var(--as-space-1, 4px);
}

.as-menu__separator {
  height: 1px;
  margin: var(--as-space-1, 4px) 0;
  background-color: var(--as-color-border, light-dark(#cbd5e1, #475569));
}

.as-menu__mark {
  display: grid;
  flex: none;
  box-sizing: border-box;
  width: 16px;
  height: 16px;
  padding: 1px;
  border: 2px solid var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
  color: var(--as-color-primary-contrast, light-dark(#ffffff, #0f172a));
}

.as-menu__mark--checkbox {
  border-radius: var(--as-radius-sm, 4px);
}

.as-menu__mark--checkbox.as-menu__mark--checked {
  border-color: var(--as-color-primary, light-dark(#2563eb, #60a5fa));
  background-color: var(--as-color-primary, light-dark(#2563eb, #60a5fa));
}

.as-menu__mark--radio {
  border-radius: 50%;
}

.as-menu__mark--radio.as-menu__mark--checked {
  border-width: 5px;
  border-color: var(--as-color-primary, light-dark(#2563eb, #60a5fa));
}

.as-menu__icon {
  color: var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
}

.as-menu__text {
  display: flex;
  flex: 1;
  flex-direction: column;
}

.as-menu__description {
  font-size: var(--as-font-size-xs, 0.75rem);
  color: var(--as-color-text-muted, light-dark(#64748b, #94a3b8));
}
</style>
