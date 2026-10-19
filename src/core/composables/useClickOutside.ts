import { onBeforeUnmount, onMounted, type Ref } from 'vue'

/**
 * Ejecuta `onOutside` cuando se detecta un click fuera de `target`. Pensado para
 * cerrar paneles, tooltips o menús flotantes. Se limpia automáticamente al desmontar.
 */
export function useClickOutside(target: Ref<HTMLElement | null>, onOutside: () => void): void {
  function handleClick(event: MouseEvent): void {
    const el = target.value
    if (el && event.target instanceof Node && !el.contains(event.target)) {
      onOutside()
    }
  }

  onMounted(() => {
    document.addEventListener('click', handleClick, true)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('click', handleClick, true)
  })
}
