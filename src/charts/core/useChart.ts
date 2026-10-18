import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
  type Ref,
} from 'vue'
import { useResolvedTheme } from '@/core/composables/useTheme'
import { useLocale } from '@/core/composables/useLocale'
import { readTokens } from '@/core/utils/readTokens'
import type { ThemeTokens } from '@/core/types/theme'
import { ENGINE_PACKAGES, loadChartEngine, type ChartEngineInstance } from '@/charts/engines'
import type { ChartEmits, ChartProps } from '@/charts/types/chart'
import { resolveSpec } from './resolveSpec'

type Emit = <K extends keyof ChartEmits>(event: K, ...args: ChartEmits[K]) => void

/**
 * Ciclo de vida de una gráfica, común a todos los motores: lee los tokens
 * del tema sobre el propio componente, resuelve la especificación, carga el
 * motor elegido, y lo mantiene al día (datos, tema, idioma, tamaño).
 *
 * @param root     Elemento raíz del componente: de él se leen los tokens (su tema).
 * @param canvas   Contenedor donde dibuja el motor.
 */
export function useChart(
  props: ChartProps,
  root: Ref<HTMLElement | null>,
  canvas: Ref<HTMLElement | null>,
  emit: Emit,
) {
  const locale = useLocale()
  /** Tema forzado (prop o provideTheme), o `null` para heredar el de la página. */
  const theme = useResolvedTheme(() => props.theme, null)
  const tokens = shallowRef<ThemeTokens | null>(null)
  const instance = shallowRef<ChartEngineInstance | null>(null)
  const loadError = ref<string | null>(null)

  const spec = computed(() => (tokens.value ? resolveSpec(props, tokens.value, locale) : null))

  function refreshTokens(): void {
    if (root.value) tokens.value = readTokens(root.value)
  }

  let mountId = 0
  async function mount(): Promise<void> {
    const current = ++mountId
    instance.value?.dispose()
    instance.value = null
    loadError.value = null
    const library = props.chartLibrary ?? 'echarts'
    if (!canvas.value || !spec.value) return
    try {
      const engine = await loadChartEngine(library)
      if (current !== mountId || !canvas.value || !spec.value) return
      const created = await engine.mount(
        canvas.value,
        spec.value,
        {
          onPointClick: (event) => emit('point-click', event),
          onXClick: (x) => emit('x-click', { x }),
          onRangeChange: (event) => emit('range-change', event),
        },
        props.nativeOptions,
      )
      // Si mientras cargaba se pidió otro motor, este ya no vale.
      if (current !== mountId) {
        created.dispose()
        return
      }
      instance.value = created
      emit('ready', { library, instance: created.native })
    } catch (error) {
      if (current !== mountId) return
      loadError.value = locale.t('chart.loadError', {
        library,
        packages: ENGINE_PACKAGES[library].join(' '),
      })
      console.error('[ASChart]', error)
    }
  }

  let observer: ResizeObserver | undefined
  let frame = 0
  onMounted(() => {
    refreshTokens()
    void mount()
    if (canvas.value && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        cancelAnimationFrame(frame)
        frame = requestAnimationFrame(() => instance.value?.resize())
      })
      observer.observe(canvas.value)
    }
  })
  onBeforeUnmount(() => {
    mountId++
    observer?.disconnect()
    cancelAnimationFrame(frame)
    instance.value?.dispose()
    instance.value = null
  })

  watch(
    () => props.chartLibrary,
    () => void mount(),
  )
  watch(spec, (next) => {
    if (next) instance.value?.update(next)
  })
  // La clase de tema se aplica en el render que sigue al cambio: leer después.
  watch(theme, () => nextTick(refreshTokens))

  return {
    theme,
    loadError,
    /** Vuelve a leer los tokens (si el tema de la página cambió por una vía que no es provideTheme). */
    refresh: refreshTokens,
    exportImage: () => instance.value?.exportImage() ?? Promise.resolve(''),
    resetZoom: () => instance.value?.resetZoom(),
    getInstance: () => instance.value?.native,
  }
}
