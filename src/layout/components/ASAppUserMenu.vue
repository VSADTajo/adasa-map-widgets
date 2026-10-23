<script setup lang="ts">
import { computed } from 'vue'
import ASIcon from '@/core/components/ASIcon.vue'
import { ICONS } from '@/core/icons/icons'
import { useLocale } from '@/core/composables/useLocale'
import { useTheme } from '@/core/composables/useTheme'
import ASMenu from '@/forms/components/ASMenu.vue'
import type { MenuEntry, MenuItem } from '@/forms/types/MenuProps'
import type { AppUserMenuEmits, AppUserMenuProps } from '@/layout/types/AppUserMenuProps'

/**
 * Menú del usuario en la barra corporativa (el `UserMenu` de los visores
 * SAIH): un avatar (foto o iniciales) que despliega la cabecera con el
 * nombre y el correo, el interruptor de tema oscuro, el idioma, las
 * opciones propias del proyecto y "Cerrar sesión".
 *
 * El tema y el idioma funcionan solos con `provideTheme` / `provideLocale`;
 * con `v-model:theme` / `v-model:locale`, los controla el proyecto (p. ej.
 * para guardarlos). "Cerrar sesión" solo emite `logout`: borrar la sesión y
 * redirigir es cosa del proyecto.
 *
 * Es un `ASMenu`: se maneja con el teclado igual (flechas, Intro, Escape).
 *
 * @example
 * ```vue
 * <ASAppShell :sections="secciones">
 *   <template #actions>
 *     <ASAppUserMenu :user="{ name: 'Ana Pérez', email: 'ana@chtajo.es' }" @logout="cerrarSesion" />
 *   </template>
 * </ASAppShell>
 * ```
 */
const props = withDefaults(defineProps<AppUserMenuProps>(), {
  user: () => ({}),
  theme: undefined,
  locale: undefined,
  languages: () => [
    { code: 'es', label: 'Español' },
    { code: 'en', label: 'English' },
  ],
  showTheme: true,
  showLocale: true,
  items: () => [],
  showLogout: true,
  label: undefined,
})

const emit = defineEmits<AppUserMenuEmits>()
const localeContext = useLocale()
const { t } = localeContext
const themeContext = useTheme()

const THEME_ID = '__as-dark-theme'
const LOGOUT_ID = '__as-logout'
const LOCALE_PREFIX = '__as-locale:'

const currentTheme = computed(() => props.theme ?? themeContext.resolvedMode.value)
const currentLocale = computed(() => props.locale ?? localeContext.locale.value)

/** Iniciales del nombre (o la primera letra del correo) para el avatar sin foto. */
const initials = computed(() => {
  const source = props.user.name?.trim() || props.user.email?.trim() || ''
  const words = source.split(/[\s@._-]+/).filter(Boolean)
  return words
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join('')
})

const entries = computed<MenuEntry[]>(() => {
  const result: MenuEntry[] = []
  const separator = (id: string) => {
    if (result.length) result.push({ type: 'separator', id })
  }
  if (props.showTheme) {
    result.push({
      id: THEME_ID,
      label: t('layout.darkTheme'),
      type: 'checkbox',
      checked: currentTheme.value === 'dark',
    })
  }
  if (props.showLocale && props.languages.length > 1) {
    separator('__as-sep-locale')
    for (const language of props.languages) {
      result.push({
        id: `${LOCALE_PREFIX}${language.code}`,
        label: language.label,
        type: 'radio',
        checked: currentLocale.value === language.code,
      })
    }
  }
  if (props.items.length) {
    separator('__as-sep-items')
    result.push(...props.items)
  }
  if (props.showLogout) {
    separator('__as-sep-logout')
    result.push({ id: LOGOUT_ID, label: t('layout.logout'), icon: ICONS.logout })
  }
  return result
})

function onSelect(item: MenuItem): void {
  if (item.id === THEME_ID) {
    const next = currentTheme.value === 'dark' ? 'light' : 'dark'
    if (props.theme === undefined) themeContext.setMode(next)
    emit('update:theme', next)
  } else if (item.id.startsWith(LOCALE_PREFIX)) {
    const code = item.id.slice(LOCALE_PREFIX.length)
    if (props.locale === undefined) localeContext.setLocale(code)
    emit('update:locale', code)
  } else if (item.id === LOGOUT_ID) {
    emit('logout')
  } else {
    emit('select', item)
  }
}
</script>

<template>
  <ASMenu
    class="as-app-user-menu"
    :label="props.label ?? t('layout.userMenu')"
    icon-only
    align="end"
    :items="entries"
    @select="onSelect"
  >
    <template #trigger>
      <span class="as-app-user-menu__avatar" aria-hidden="true">
        <img v-if="props.user.avatar" :src="props.user.avatar" alt="" />
        <template v-else-if="initials">{{ initials }}</template>
        <ASIcon v-else :path="ICONS.account" :size="22" />
      </span>
    </template>
    <template v-if="props.user.name || props.user.email" #header>
      <div class="as-app-user-menu__header">
        <span class="as-app-user-menu__avatar as-app-user-menu__avatar--large" aria-hidden="true">
          <img v-if="props.user.avatar" :src="props.user.avatar" alt="" />
          <template v-else-if="initials">{{ initials }}</template>
          <ASIcon v-else :path="ICONS.account" :size="28" />
        </span>
        <span class="as-app-user-menu__identity">
          <strong v-if="props.user.name">{{ props.user.name }}</strong>
          <span v-if="props.user.email" class="as-app-user-menu__email">
            {{ props.user.email }}
          </span>
        </span>
      </div>
    </template>
  </ASMenu>
</template>

<style scoped>
/* Botón redondo sobre la barra corporativa: el avatar ocupa todo el botón. */
.as-app-user-menu :deep(.as-menu__trigger) {
  width: auto;
  height: auto;
  padding: 2px;
  border-radius: var(--as-radius-full, 9999px);
  color: var(--as-app-chrome-text, #ffffff);
}

.as-app-user-menu__avatar {
  display: grid;
  flex: none;
  place-items: center;
  width: 36px;
  height: 36px;
  overflow: hidden;
  border-radius: 50%;
  background: #ffffff;
  color: var(--as-app-chrome, #1d283a);
  font-size: var(--as-font-size-sm, 0.875rem);
  font-weight: var(--as-font-weight-bold, 700);
  letter-spacing: 0.02em;
}

.as-app-user-menu__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.as-app-user-menu__avatar--large {
  width: 48px;
  height: 48px;
  font-size: var(--as-font-size-lg, 1.125rem);
}

/* Cabecera con el color corporativo, como en el UserMenu de los visores SAIH. */
.as-app-user-menu__header {
  display: flex;
  gap: var(--as-space-3, 12px);
  align-items: center;
  min-width: 260px;
  padding: var(--as-space-4, 16px);
  border-radius: var(--as-radius, 8px) var(--as-radius, 8px) 0 0;
  background: var(--as-app-chrome, #1d283a);
  color: var(--as-app-chrome-text, #ffffff);
}

.as-app-user-menu__identity {
  display: flex;
  flex-direction: column;
  min-width: 0;
  white-space: normal;
}

.as-app-user-menu__email {
  overflow: hidden;
  font-size: var(--as-font-size-sm, 0.875rem);
  color: var(--as-app-chrome-text-muted, rgba(255, 255, 255, 0.72));
  text-overflow: ellipsis;
}
</style>
