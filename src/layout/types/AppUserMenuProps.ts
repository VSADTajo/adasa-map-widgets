import type { MenuEntry, MenuItem } from '@/forms/types/MenuProps'

/** Usuario que muestra `ASAppUserMenu`. */
export interface AppUser {
  name?: string
  email?: string
  /** URL de la foto. Sin ella, las iniciales del nombre (o del correo). */
  avatar?: string
}

/** Idioma que ofrece `ASAppUserMenu`. */
export interface AppLanguage {
  /** Código de `provideLocale` (`'es'`, `'en'`, `'ca'`...). */
  code: string
  /** Nombre en su propio idioma ("Español", "English", "Català"). */
  label: string
}

/**
 * Props de `ASAppUserMenu`: avatar en la barra con el menú del usuario.
 *
 * @example
 * ```vue
 * <ASAppUserMenu :user="{ name: 'Ana Pérez', email: 'ana@chtajo.es' }" @logout="cerrarSesion" />
 * ```
 */
export interface AppUserMenuProps {
  user?: AppUser
  /**
   * Tema (`v-model:theme`). Sin él, el interruptor cambia el de `provideTheme`.
   */
  theme?: 'light' | 'dark'
  /**
   * Idioma (`v-model:locale`). Sin él, el selector cambia el de `provideLocale`.
   */
  locale?: string
  /**
   * Idiomas a elegir.
   * @default [{ code: 'es', label: 'Español' }, { code: 'en', label: 'English' }]
   */
  languages?: AppLanguage[]
  /**
   * Interruptor de tema oscuro.
   * @default true
   */
  showTheme?: boolean
  /**
   * Selector de idioma (solo si hay más de un idioma).
   * @default true
   */
  showLocale?: boolean
  /** Opciones propias, entre el idioma y "Cerrar sesión" (emiten `select`). */
  items?: MenuEntry[]
  /**
   * Opción "Cerrar sesión" (emite `logout`).
   * @default true
   */
  showLogout?: boolean
  /** Nombre accesible del botón. Por defecto, "Menú de usuario". */
  label?: string
}

/** Eventos de `ASAppUserMenu`. */
export interface AppUserMenuEmits {
  /** Se cambió el tema con el interruptor (para `v-model:theme`). */
  'update:theme': [theme: 'light' | 'dark']
  /** Se eligió otro idioma (para `v-model:locale`). */
  'update:locale': [locale: string]
  /** Se eligió una opción propia (`items`). */
  select: [item: MenuItem]
  /**
   * Se pulsó "Cerrar sesión". Borrar la sesión y redirigir es cosa del
   * proyecto: el componente solo avisa.
   */
  logout: []
}
