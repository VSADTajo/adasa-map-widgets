import { computed, inject, provide, type ComputedRef, type InjectionKey } from 'vue'

/** Lo que `ASAppShell` comparte con las piezas que van en sus slots. */
export interface AppShellContext {
  /** El shell está en diseño móvil (por debajo de su `breakpoint`). */
  mobile: ComputedRef<boolean>
}

const APP_SHELL_KEY: InjectionKey<AppShellContext> = Symbol('as-app-shell')

/** Lo llama `ASAppShell` para que `ASAppBrand`, `ASAppSearch`... sepan si está en móvil. */
export function provideAppShellContext(context: AppShellContext): void {
  provide(APP_SHELL_KEY, context)
}

/**
 * Contexto del `ASAppShell` que contiene al componente. Fuera de un shell,
 * `mobile` es siempre `false` (o lo que diga la prop del componente).
 */
export function useAppShellContext(): AppShellContext {
  return inject(APP_SHELL_KEY, null) ?? { mobile: computed(() => false) }
}
