<script lang="ts">
/** Contador para ids únicos (`useId` llega en Vue 3.5 y la librería admite 3.4). */
let instanceCount = 0
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useLocale } from '@/core/composables/useLocale'
import { useResolvedTheme } from '@/core/composables/useTheme'
import type {
  AppSection,
  AppShellEmits,
  AppShellProps,
  AppShellSectionSlotProps,
} from '@/layout/types/AppShellProps'
import { ICONS } from '@/core/icons/icons'
import ASIcon from '@/core/components/ASIcon.vue'
import ASAppBottomSheet from './ASAppBottomSheet.vue'
import ASAppDetailPanel from './ASAppDetailPanel.vue'
import ASAppDrawer from './ASAppDrawer.vue'
import ASAppMobileMenu from './ASAppMobileMenu.vue'
import ASAppRail from './ASAppRail.vue'
import ASAppTopBar from './ASAppTopBar.vue'
import { provideAppShellContext } from '@/layout/composables/useAppShellContext'

/**
 * Layout de aplicación de mapa: el contenido principal (el mapa) ocupa
 * todo, con una barra superior corporativa, una barra de iconos a la
 * izquierda que abre los paneles de cada sección, y un panel de detalle que
 * entra por la derecha.
 *
 * Cómo se abren y cierran (igual que en los visores SAIH):
 * - **Panel lateral** (escritorio): junto a la barra de iconos, empuja el
 *   contenido (no lo tapa). Pulsar la sección abierta lo cierra; pulsar
 *   otra lo cierra y lo vuelve a abrir con la nueva (`switchDelay`).
 * - **Detalle**: entra por la derecha y tapa el contenido desde el borde de
 *   los menús; si el panel lateral se abre o se cierra, se ajusta sin cerrarse.
 * - **Móvil** (por debajo de `breakpoint`, medido sobre el propio layout):
 *   la barra va abajo; su botón de menú despliega las secciones encima de
 *   ella, y cada sección sube desde abajo (con un asa para ampliarla). El
 *   detalle ocupa toda la pantalla, siempre con su botón de cerrar.
 *
 * Es controlado: la sección abierta y el detalle van por `v-model`, así que
 * el proyecto decide si los enlaza con la URL (ver el README).
 *
 * Coordina piezas que también se pueden usar sueltas para montar un layout
 * propio: `ASAppTopBar`, `ASAppRail`, `ASAppDrawer` (panel de sección),
 * `ASAppDetailPanel`, y en móvil `ASAppMobileMenu` y `ASAppBottomSheet`.
 *
 * @example
 * ```vue
 * <ASAppShell :sections="secciones" v-model:active-section="seccion" v-model:detail-open="detalle">
 *   <template #brand><img src="/logo.svg" alt="SAIH Tajo" /></template>
 *   <template #section="{ section, close, mobile }">
 *     <ASAppPanelHeader :title="section.label" :direction="mobile ? 'down' : 'left'" @close="close" />
 *     <PanelCapas v-if="section.id === 'capas'" />
 *   </template>
 *   <template #detail><FichaEstacion /></template>
 *   <ASMap :layers="capas" />
 * </ASAppShell>
 * ```
 */
const props = withDefaults(defineProps<AppShellProps>(), {
  activeSection: null,
  detailOpen: false,
  breakpoint: 960,
  railWidth: 56,
  drawerWidth: 320,
  switchDelay: 280,
  detailCloseButton: true,
  detailLabel: undefined,
  height: '100%',
  theme: undefined,
})

const emit = defineEmits<AppShellEmits>()

defineSlots<{
  /** Contenido principal: normalmente el mapa. */
  default?: () => unknown
  /** Logos o nombre de la aplicación, en la barra. */
  brand?: () => unknown
  /** Buscador: en la barra en escritorio; en móvil, tras el botón de buscar. */
  search?: () => unknown
  /** A la derecha de la barra: menú de usuario, logos secundarios... */
  actions?: () => unknown
  /** Contenido del panel de la sección abierta. */
  section?: (props: AppShellSectionSlotProps) => unknown
  /** Contenido del panel de detalle. */
  detail?: () => unknown
}>()

const { t } = useLocale()
const theme = useResolvedTheme(() => props.theme, null)
const id = `as-app-shell-${++instanceCount}`

// ── Escritorio o móvil: según el ancho del propio layout ──
const root = ref<HTMLElement | null>(null)
const width = ref(Infinity)
const mobile = computed(() => width.value < props.breakpoint)
// Las piezas de los slots (marca, buscador, menú de usuario) se adaptan solas al móvil.
provideAppShellContext({ mobile })
let observer: ResizeObserver | undefined
onMounted(() => {
  if (!root.value || typeof ResizeObserver === 'undefined') return
  width.value = root.value.clientWidth || Infinity
  observer = new ResizeObserver(([entry]) => {
    if (entry) width.value = entry.contentRect.width
  })
  observer.observe(root.value)
})

// ── Panel de sección ──
// Lo que se ve (`shownSection`, `panelOpen`) va un paso por detrás de la
// prop: al cambiar de sección, el panel se cierra y se reabre con la nueva.
const shownSection = ref<string | null>(props.activeSection)
const panelOpen = ref(props.activeSection !== null)
let switchTimer: ReturnType<typeof setTimeout> | undefined

watch(
  () => props.activeSection,
  (next, previous) => {
    clearTimeout(switchTimer)
    if (next === null) {
      // El contenido se queda mientras el panel sale.
      panelOpen.value = false
      return
    }
    if (previous !== null && next !== previous && panelOpen.value) {
      panelOpen.value = false
      switchTimer = setTimeout(() => {
        shownSection.value = next
        panelOpen.value = true
      }, props.switchDelay)
      return
    }
    shownSection.value = next
    panelOpen.value = true
  },
)

const currentSection = computed<AppSection | undefined>(() =>
  props.sections.find((section) => section.id === shownSection.value),
)

function toggleSection(sectionId: string): void {
  emit('update:activeSection', sectionId === props.activeSection ? null : sectionId)
}
function closeSection(): void {
  emit('update:activeSection', null)
}

// ── Detalle ──
function closeDetail(): void {
  emit('update:detailOpen', false)
}
/** Borde izquierdo del detalle en escritorio: tras la barra de iconos y, si está abierto, el panel. */
const detailLeft = computed(() =>
  mobile.value ? 0 : props.railWidth + (panelOpen.value ? props.drawerWidth : 0),
)

// ── Móvil: menú y buscador ──
const menuOpen = ref(false)
const searchOpen = ref(false)

function chooseFromMenu(sectionId: string): void {
  menuOpen.value = false
  toggleSection(sectionId)
}
watch(mobile, () => {
  menuOpen.value = false
  searchOpen.value = false
})

/** Escape cierra lo que esté encima: menú o buscador, luego el detalle y por último el panel. */
function onKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Escape') return
  if (menuOpen.value) menuOpen.value = false
  else if (searchOpen.value) searchOpen.value = false
  else if (props.detailOpen) closeDetail()
  else if (props.activeSection !== null) closeSection()
  else return
  event.stopPropagation()
}

onBeforeUnmount(() => {
  clearTimeout(switchTimer)
  observer?.disconnect()
})

const sectionSlotProps = computed<AppShellSectionSlotProps | null>(() =>
  currentSection.value
    ? { section: currentSection.value, close: closeSection, mobile: mobile.value }
    : null,
)
</script>

<template>
  <div
    ref="root"
    class="as-app-shell"
    :class="[theme ? `as-${theme}` : undefined, { 'as-app-shell--mobile': mobile }]"
    :style="{
      height: props.height,
    }"
    @keydown="onKeydown"
  >
    <ASAppTopBar :position="mobile ? 'bottom' : 'top'">
      <template v-if="mobile" #start>
        <button
          type="button"
          class="as-app-shell__bar-button"
          :aria-label="t('layout.menu')"
          :title="t('layout.menu')"
          :aria-expanded="menuOpen"
          :aria-controls="`${id}-menu`"
          @click="menuOpen = !menuOpen"
        >
          <ASIcon :path="ICONS.menu" />
        </button>
      </template>
      <template v-if="$slots.brand" #brand><slot name="brand" /></template>
      <template v-if="$slots.search && !mobile" #search><slot name="search" /></template>
      <template v-if="$slots.actions || ($slots.search && mobile)" #actions>
        <button
          v-if="$slots.search && mobile"
          type="button"
          class="as-app-shell__bar-button"
          :aria-label="t('layout.search')"
          :title="t('layout.search')"
          :aria-expanded="searchOpen"
          @click="searchOpen = !searchOpen"
        >
          <ASIcon :path="ICONS.magnify" />
        </button>
        <slot name="actions" />
      </template>
    </ASAppTopBar>

    <div class="as-app-shell__body">
      <!-- Escritorio: barra de iconos y panel de la sección, que empuja el contenido -->
      <template v-if="!mobile">
        <ASAppRail
          :sections="props.sections"
          :active-section="props.activeSection"
          :width="props.railWidth"
          :controls="`${id}-panel`"
          @toggle="toggleSection"
        />
        <ASAppDrawer
          :id="`${id}-panel`"
          :open="panelOpen"
          :width="props.drawerWidth"
          :label="currentSection?.label"
        >
          <slot v-if="sectionSlotProps" name="section" v-bind="sectionSlotProps" />
        </ASAppDrawer>
      </template>

      <main class="as-app-shell__main">
        <slot />
      </main>

      <!-- Móvil: menú de secciones encima de la barra, y el panel que sube -->
      <template v-if="mobile">
        <ASAppMobileMenu
          :id="`${id}-menu`"
          v-model:open="menuOpen"
          :sections="props.sections"
          :active-section="props.activeSection"
          @select="chooseFromMenu"
        />
        <ASAppBottomSheet :id="`${id}-panel`" :open="panelOpen" :label="currentSection?.label">
          <slot v-if="sectionSlotProps" name="section" v-bind="sectionSlotProps" />
        </ASAppBottomSheet>
        <div v-if="searchOpen" class="as-app-shell__mobile-search">
          <div class="as-app-shell__mobile-search-field"><slot name="search" /></div>
          <button
            type="button"
            class="as-app-shell__bar-button"
            :aria-label="t('layout.closeSearch')"
            :title="t('layout.closeSearch')"
            @click="searchOpen = false"
          >
            <ASIcon :path="ICONS.close" />
          </button>
        </div>
      </template>

      <!-- Detalle: tapa el contenido desde el borde de los menús -->
      <ASAppDetailPanel
        :open="props.detailOpen"
        :offset="detailLeft"
        :label="props.detailLabel"
        :close-button="props.detailCloseButton"
        @close="closeDetail"
      >
        <slot name="detail" />
      </ASAppDetailPanel>
    </div>
  </div>
</template>

<style scoped>
.as-app-shell {
  /* Duración de todas las aperturas y cierres de las piezas (la de los visores SAIH). */
  --as-app-transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: hidden;
  font-family: var(--as-font-family, system-ui, sans-serif);
  background: var(--as-app-panel-bg, light-dark(#e7e7e7, #212121));
  color: var(--as-app-panel-text, light-dark(#0f172a, #f1f5f9));
}

/* En móvil la barra va abajo, al alcance del pulgar. */
.as-app-shell--mobile {
  flex-direction: column-reverse;
}

.as-app-shell__body {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  /* Lo de dentro del mapa (controles de Leaflet, z-index 1000) no puede tapar los paneles. */
  isolation: isolate;
}

.as-app-shell__main {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  isolation: isolate;
  z-index: 0;
}

/* ── Botones de la barra (menú y buscador en móvil) ── */
.as-app-shell__bar-button {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: 50%;
  cursor: pointer;
}

.as-app-shell__bar-button {
  flex: none;
  background: transparent;
  color: var(--as-app-chrome-text, #ffffff);
}

.as-app-shell__bar-button:hover {
  background: var(--as-app-chrome-active, rgba(255, 255, 255, 0.16));
}

.as-app-shell__bar-button:focus-visible {
  outline: 2px solid var(--as-app-chrome-text, #ffffff);
  outline-offset: 2px;
}

/* ── Móvil: buscador, encima de la barra ── */
.as-app-shell__mobile-search {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: var(--as-space-2, 8px);
  padding: var(--as-space-2, 8px) var(--as-space-3, 12px);
  background: var(--as-app-chrome, #1d283a);
}

.as-app-shell__mobile-search-field {
  flex: 1 1 auto;
  min-width: 0;
}

@media (prefers-reduced-motion: reduce) {
  .as-app-shell {
    --as-app-transition: 0s;
  }
}
</style>
