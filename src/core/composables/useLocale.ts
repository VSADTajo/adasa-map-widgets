import { computed, inject, provide, ref, type InjectionKey, type Ref } from 'vue'
import type { Locale as DateFnsLocale } from 'date-fns'
import { enGB as dateFnsEnGB, es as dateFnsEs } from 'date-fns/locale'
import { en, es, type MessageKey, type Messages } from '@/core/i18n/messages'
import {
  formatDate,
  formatDuration,
  formatNumber,
  formatUnit,
  type DateFormat,
  type FormatDurationOptions,
  type FormatNumberOptions,
  type MeasureUnit,
} from '@/core/utils/format'

/** Código de idioma: `'es'` y `'en'` vienen incluidos; el resto los define el proyecto. */
export type LocaleCode = 'es' | 'en' | 'ca' | 'eu' | 'gl' | (string & {})

/** Todo lo que necesita un idioma. */
export interface LocaleDefinition {
  /** Etiqueta BCP 47 para `Intl` (p. ej. `'ca-ES'`). */
  intl: string
  /** Textos; las claves que falten caen al español. */
  messages: Partial<Messages>
  /** Locale de date-fns, para los patrones `{ pattern }` de `formatDate`. Sin él, inglés. */
  dateFns?: DateFnsLocale
}

const BUILT_IN_LOCALES: Record<'es' | 'en', LocaleDefinition> = {
  es: { intl: 'es-ES', messages: es, dateFns: dateFnsEs },
  // en-GB y no en-US: día antes que mes y reloj de 24 horas, como en el resto de Europa.
  en: { intl: 'en-GB', messages: en, dateFns: dateFnsEnGB },
}

export interface LocaleContext {
  /** Idioma activo. */
  locale: Readonly<Ref<LocaleCode>>
  /** Etiqueta BCP 47 del idioma activo (p. ej. `'es-ES'`), para usar `Intl` directamente. */
  intlLocale: Readonly<Ref<string>>
  /**
   * Locale de date-fns del idioma activo (`undefined` si el idioma no lo
   * define), para leer o interpretar fechas con sus patrones (`P`, `p`...) y
   * saber en qué día empieza la semana.
   */
  dateFnsLocale: Readonly<Ref<DateFnsLocale | undefined>>
  /** Cambia el idioma; uno no definido cae al español. */
  setLocale: (locale: LocaleCode) => void
  /** Texto de la librería en el idioma activo, con `{parámetros}` sustituidos. */
  t: (key: MessageKey, params?: Record<string, string | number>) => string
  formatNumber: (
    value: number | null | undefined,
    options?: Omit<FormatNumberOptions, 'locale'>,
  ) => string
  formatDate: (
    date: Date | number | null | undefined,
    format?: DateFormat,
    options?: { timeZone?: string },
  ) => string
  formatDuration: (
    milliseconds: number | null | undefined,
    options?: Omit<FormatDurationOptions, 'locale'>,
  ) => string
  formatUnit: (
    value: number | null | undefined,
    unit: MeasureUnit | (string & {}),
    options?: Omit<FormatNumberOptions, 'locale'>,
  ) => string
}

const LOCALE_INJECTION_KEY: InjectionKey<LocaleContext> = Symbol('as-locale')

function createLocaleContext(
  initial: LocaleCode,
  locales: Record<string, LocaleDefinition>,
): LocaleContext {
  const locale = ref<LocaleCode>(initial)
  const definition = computed(() => locales[locale.value] ?? BUILT_IN_LOCALES.es)
  const intlLocale = computed(() => definition.value.intl)

  return {
    locale,
    intlLocale,
    dateFnsLocale: computed(() => definition.value.dateFns),
    setLocale: (next) => {
      locale.value = next
    },
    t: (key, params) => {
      const template = definition.value.messages[key] ?? es[key] ?? key
      return params
        ? template.replace(/\{(\w+)\}/g, (match, name: string) =>
            name in params ? String(params[name]) : match,
          )
        : template
    },
    formatNumber: (value, options) => formatNumber(value, { ...options, locale: intlLocale.value }),
    formatDate: (date, format, options) =>
      formatDate(date, format, {
        ...options,
        locale: intlLocale.value,
        dateFnsLocale: definition.value.dateFns,
      }),
    formatDuration: (milliseconds, options) =>
      formatDuration(milliseconds, { ...options, locale: intlLocale.value }),
    formatUnit: (value, unit, options) =>
      formatUnit(value, unit, { ...options, locale: intlLocale.value }),
  }
}

/**
 * Crea y provee el idioma de los componentes descendientes. Llámalo una vez
 * en la raíz de la app. `es` y `en` vienen incluidos; otro idioma (ca, eu,
 * gl...) se añade con `locales`, y las claves que no traduzca caen al español.
 *
 * @example
 * ```ts
 * import { ca } from 'date-fns/locale'
 * provideLocale('ca', {
 *   locales: { ca: { intl: 'ca-ES', dateFns: ca, messages: { 'legend.title': 'Llegenda' } } },
 * })
 * ```
 */
export function provideLocale(
  initial: LocaleCode = 'es',
  options: { locales?: Record<string, LocaleDefinition> } = {},
): LocaleContext {
  const context = createLocaleContext(initial, { ...BUILT_IN_LOCALES, ...options.locales })
  provide(LOCALE_INJECTION_KEY, context)
  return context
}

/** Contexto por defecto (español) para componentes usados sin `provideLocale`. */
let defaultContext: LocaleContext | undefined

/**
 * Idioma activo y formateadores ligados a él. Sin `provideLocale` en el
 * árbol, devuelve un contexto fijo en español: los componentes funcionan
 * igual sin configurar nada.
 */
export function useLocale(): LocaleContext {
  const provided = inject(LOCALE_INJECTION_KEY, null)
  if (provided) return provided
  defaultContext ??= createLocaleContext('es', BUILT_IN_LOCALES)
  return defaultContext
}
