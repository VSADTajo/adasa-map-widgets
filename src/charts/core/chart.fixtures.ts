import { ref } from 'vue'
import { es } from '@/core/i18n/messages'
import { formatDate, formatNumber, formatUnit } from '@/core/utils/format'
import type { ThemeTokens } from '@/core/types/theme'
import type { SpecLocale } from './resolveSpec'

/**
 * Datos de prueba de los tests de gráficas (no se publican: los
 * `*.fixtures.ts` quedan fuera del build, como los `*.spec.ts`).
 */

export const CATEGORICAL = ['#c1', '#c2', '#c3', '#c4', '#c5', '#c6', '#c7', '#c8']

/** Tokens con colores reconocibles, para comprobar de dónde sale cada uno. */
export function fakeTokens(surface = '#ffffff'): ThemeTokens {
  const alert = (level: string) => ({
    fill: `#fill-${level}`,
    text: `#text-${level}`,
    strong: `#strong-${level}`,
  })
  return {
    colorPrimary: '#primary',
    colorPrimaryContrast: '#fff',
    colorSurface: surface,
    colorSurfaceMuted: '#f1f5f9',
    colorText: '#0f172a',
    colorTextMuted: '#64748b',
    colorBorder: '#cbd5e1',
    colorDanger: '#dc2626',
    colorDangerContrast: '#fff',
    controlHeight: { sm: '28px', md: '36px', lg: '44px' },
    radius: '8px',
    spacingUnit: '4px',
    fontFamily: 'system-ui',
    shadow: '',
    fontFamilyMono: 'monospace',
    fontSize: { xs: '', sm: '', md: '', lg: '', xl: '', '2xl': '', '3xl': '' },
    fontWeight: { regular: '400', medium: '500', semibold: '600', bold: '700' },
    lineHeight: { tight: '1.25', normal: '1.5' },
    space: { 1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 8: '', 10: '', 12: '', 16: '' },
    radii: { sm: '', md: '', lg: '', full: '' },
    shadows: { sm: '', md: '', lg: '' },
    zIndex: {
      base: 0,
      mapControl: 1000,
      dropdown: 0,
      sticky: 0,
      drawer: 0,
      modal: 0,
      toast: 0,
      tooltip: 0,
    },
    overlay: { bg: '', text: '', textMuted: '', surfaceMuted: '', border: '' },
    app: {
      chrome: '',
      chromeText: '',
      chromeTextMuted: '',
      chromeActive: '',
      panelBg: '',
      panelText: '',
      panelSurface: '',
    },
    data: {
      categorical: CATEGORICAL,
      sequential: [],
      diverging: [],
      grid: '#grid',
      axis: '#axis',
    },
    alert: {
      normal: alert('normal'),
      amarillo: alert('amarillo'),
      naranja: alert('naranja'),
      rojo: alert('rojo'),
    },
  }
}

/** Idioma de prueba: español de España, como el valor por defecto de la librería. */
export const fakeLocale: SpecLocale = {
  t: (key, params) =>
    es[key].replace(/\{(\w+)\}/g, (match, name: string) =>
      params && name in params ? String(params[name]) : match,
    ),
  formatDate: (date, format) => formatDate(date, format),
  formatNumber: (value, options) => formatNumber(value, options),
  formatUnit: (value, unit, options) => formatUnit(value, unit, options),
  intlLocale: ref('es-ES'),
}

const HOUR = 3_600_000
export const T0 = new Date(2026, 9, 18, 0, 0)
export const at = (hours: number) => new Date(T0.getTime() + hours * HOUR)
