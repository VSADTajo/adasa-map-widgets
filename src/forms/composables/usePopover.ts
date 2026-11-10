import { nextTick, ref, type Ref } from 'vue'
import { useClickOutside } from '@/core/composables/useClickOutside'

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex="0"]'

/**
 * Panel flotante tipo diálogo bajo un campo (calendarios): abrir y cerrar,
 * colocarlo encima si no cabe debajo, cerrarlo con un clic fuera o con
 * Escape, y mantener el foco dentro con Tab mientras está abierto. Al
 * cerrarlo con el teclado, el foco vuelve a `returnFocus`.
 */
export function usePopover(
  root: Ref<HTMLElement | null>,
  panel: Ref<HTMLElement | null>,
  returnFocus: () => HTMLElement | null | undefined,
  { height = 380, onClose }: { height?: number; onClose?: () => void } = {},
) {
  const isOpen = ref(false)
  const placement = ref<'bottom' | 'top'>('bottom')

  function open(): void {
    if (isOpen.value) return
    const rect = root.value?.getBoundingClientRect()
    if (rect) {
      const below = window.innerHeight - rect.bottom
      placement.value = below < height && rect.top > below ? 'top' : 'bottom'
    }
    isOpen.value = true
  }

  function close(restoreFocus = true): void {
    if (!isOpen.value) return
    isOpen.value = false
    onClose?.()
    if (restoreFocus) void nextTick(() => returnFocus()?.focus())
  }

  useClickOutside(root, () => close(false))

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      // Que no cierre también el panel que contiene el campo (p. ej. ASAppShell).
      event.preventDefault()
      event.stopPropagation()
      close()
    } else if (event.key === 'Tab' && panel.value) {
      const items = [...panel.value.querySelectorAll<HTMLElement>(FOCUSABLE)]
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
  }

  return { isOpen, placement, open, close, onKeydown }
}
