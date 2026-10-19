import type {
  AlertLevel,
  AlertTokens,
  FontSizeToken,
  SpaceToken,
  ThemeTokens,
  ZIndexLayer,
} from '@/core/types/theme'

const FONT_SIZES: FontSizeToken[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl']
const SPACES: SpaceToken[] = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16]
const SEQUENTIAL_STEPS = Array.from({ length: 13 }, (_, i) => 100 + i * 50)
const DIVERGING = ['cool-3', 'cool-2', 'cool-1', 'mid', 'warm-1', 'warm-2', 'warm-3']
const ALERT_LEVELS: AlertLevel[] = ['normal', 'amarillo', 'naranja', 'rojo']
const Z_LAYERS: Record<ZIndexLayer, string> = {
  base: 'base',
  mapControl: 'map-control',
  dropdown: 'dropdown',
  sticky: 'sticky',
  drawer: 'drawer',
  modal: 'modal',
  toast: 'toast',
  tooltip: 'tooltip',
}

/**
 * Lee los tokens de diseño (`--as-*`) **resueltos** para un elemento: los
 * colores como `rgb()`/`rgba()` según su tema (`.as-dark`, `.as-light`,
 * `.as-theme-auto` o el del documento), los espaciados en píxeles y el
 * resto tal cual. Pensado para librerías que no entienden `var(--x)` ni
 * `light-dark()`, como los motores de gráficas.
 *
 * Lee el tema **del elemento** pasado, no el del documento: si un componente
 * fuerza `.as-dark` dentro de una página clara, pásale ese componente.
 * Requiere DOM (llámalo en `onMounted` o después). Para mantenerlo al día
 * cuando cambia el tema, usa {@link useTokens}.
 *
 * @example
 * ```ts
 * const { data } = readTokens(chartContainer)
 * chart.setOption({ color: data.categorical })
 * ```
 */
export function readTokens(element: Element = document.documentElement): ThemeTokens {
  const root = getComputedStyle(element)
  // Un elemento sonda hereda el `color-scheme` y las variables de `element`;
  // asignarle `var(--x)` a una propiedad tipada (color, box-shadow...) obliga
  // al navegador a resolver `light-dark()` y las `var()` anidadas.
  const probe = document.createElement('span')
  probe.style.display = 'none'
  element.appendChild(probe)

  const has = (name: string) => root.getPropertyValue(`--as-${name}`).trim() !== ''
  const raw = (name: string) => root.getPropertyValue(`--as-${name}`).trim()
  const viaProbe = (property: 'color' | 'boxShadow' | 'paddingLeft') => (name: string) => {
    if (!has(name)) return ''
    probe.style[property] = `var(--as-${name})`
    return getComputedStyle(probe)[property]
  }
  const color = viaProbe('color')
  const shadow = viaProbe('boxShadow')
  const length = viaProbe('paddingLeft')
  const alert = (level: AlertLevel): AlertTokens => ({
    fill: color(`alert-${level}`),
    text: color(`alert-${level}-text`),
    strong: color(`alert-${level}-strong`),
  })

  try {
    return {
      colorPrimary: color('color-primary'),
      colorPrimaryContrast: color('color-primary-contrast'),
      colorSurface: color('color-surface'),
      colorSurfaceMuted: color('color-surface-muted'),
      colorText: color('color-text'),
      colorTextMuted: color('color-text-muted'),
      colorBorder: color('color-border'),
      colorDanger: color('color-danger'),
      radius: length('radius'),
      spacingUnit: length('spacing-unit'),
      fontFamily: raw('font-family'),
      shadow: shadow('shadow'),

      fontFamilyMono: raw('font-family-mono'),
      fontSize: fromKeys(FONT_SIZES, (size) => raw(`font-size-${size}`)),
      fontWeight: {
        regular: raw('font-weight-regular'),
        medium: raw('font-weight-medium'),
        semibold: raw('font-weight-semibold'),
        bold: raw('font-weight-bold'),
      },
      lineHeight: { tight: raw('line-height-tight'), normal: raw('line-height-normal') },
      space: fromKeys(SPACES, (step) => length(`space-${step}`)),
      radii: {
        sm: length('radius-sm'),
        md: length('radius-md'),
        lg: length('radius-lg'),
        full: length('radius-full'),
      },
      shadows: { sm: shadow('shadow-sm'), md: shadow('shadow-md'), lg: shadow('shadow-lg') },
      // NaN (no 0) si falta el token: un z-index 0 inventado taparía el error.
      zIndex: fromKeys(Object.keys(Z_LAYERS) as ZIndexLayer[], (layer) =>
        has(`z-${Z_LAYERS[layer]}`) ? Number(raw(`z-${Z_LAYERS[layer]}`)) : NaN,
      ),
      overlay: {
        bg: color('overlay-bg'),
        text: color('overlay-text'),
        textMuted: color('overlay-text-muted'),
        surfaceMuted: color('overlay-surface-muted'),
        border: color('overlay-border'),
      },
      app: {
        chrome: color('app-chrome'),
        chromeText: color('app-chrome-text'),
        chromeTextMuted: color('app-chrome-text-muted'),
        chromeActive: color('app-chrome-active'),
        panelBg: color('app-panel-bg'),
        panelText: color('app-panel-text'),
        panelSurface: color('app-panel-surface'),
      },
      data: {
        categorical: Array.from({ length: 8 }, (_, i) => color(`data-cat-${i + 1}`)),
        sequential: SEQUENTIAL_STEPS.map((step) => color(`data-seq-${step}`)),
        diverging: DIVERGING.map((step) => color(`data-div-${step}`)),
        grid: color('data-grid'),
        axis: color('data-axis'),
      },
      alert: fromKeys(ALERT_LEVELS, alert),
    }
  } finally {
    probe.remove()
  }
}

function fromKeys<K extends string | number, V>(keys: K[], value: (key: K) => V): Record<K, V> {
  return Object.fromEntries(keys.map((key) => [key, value(key)])) as Record<K, V>
}
