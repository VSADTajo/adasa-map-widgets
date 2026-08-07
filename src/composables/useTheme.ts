import { computed, inject, provide, ref, type InjectionKey, type Ref } from 'vue'
import type { ThemeMode } from '@/types/theme'

export interface ThemeContext {
  /** Modo configurado explícitamente (`'auto'` sigue al sistema operativo). */
  mode: Ref<ThemeMode>
  /** Modo final aplicado, ya resuelto a `'light'` o `'dark'`. */
  resolvedMode: Readonly<Ref<'light' | 'dark'>>
  /** Cambia el modo de tema. */
  setMode: (mode: ThemeMode) => void
}

const THEME_INJECTION_KEY: InjectionKey<ThemeContext> = Symbol('amw-theme')

function resolveSystemPreference(): 'light' | 'dark' {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Crea y provee el contexto de tema para el árbol de componentes descendiente.
 * Llámalo una vez en la raíz de tu app (o en el contenedor de un widget usado
 * de forma aislada). Los widgets leen `resolvedMode` con {@link useTheme} para
 * decidir qué clase de tema aplicar (ver `src/styles/tokens.css`).
 */
export function provideTheme(initialMode: ThemeMode = 'auto'): ThemeContext {
  const mode = ref<ThemeMode>(initialMode) as Ref<ThemeMode>
  const systemPreference = ref<'light' | 'dark'>(resolveSystemPreference())

  if (typeof window !== 'undefined' && window.matchMedia) {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', (event) => {
      systemPreference.value = event.matches ? 'dark' : 'light'
    })
  }

  const resolvedMode = computed<'light' | 'dark'>(() =>
    mode.value === 'auto' ? systemPreference.value : mode.value,
  )

  const context: ThemeContext = {
    mode,
    resolvedMode,
    setMode: (next) => {
      mode.value = next
    },
  }

  provide(THEME_INJECTION_KEY, context)
  return context
}

/**
 * Consume el contexto de tema provisto por un ancestro con {@link provideTheme}.
 * Si no hay ninguno en el árbol (widget usado de forma aislada), crea uno local
 * en modo `'auto'` para que el componente siga funcionando de forma autónoma.
 */
export function useTheme(): ThemeContext {
  return inject(THEME_INJECTION_KEY) ?? provideTheme('auto')
}
