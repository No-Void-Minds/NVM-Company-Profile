import { nextTick, onBeforeUnmount, watch, type Ref } from 'vue'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Shared by the mobile menu, dialogs, and the lightbox: Tab stays inside,
// Escape closes, and focus returns to whatever opened the layer.
export function useFocusTrap(
  container: Ref<HTMLElement | null>,
  active: Ref<boolean>,
  onEscape: () => void,
) {
  let previous: HTMLElement | null = null

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onEscape()
      return
    }
    if (event.key !== 'Tab' || !container.value) return

    const items = Array.from(container.value.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (items.length === 0) {
      event.preventDefault()
      return
    }
    const first = items[0]
    const last = items[items.length - 1]
    const current = document.activeElement
    if (event.shiftKey && (current === first || !container.value.contains(current))) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && (current === last || !container.value.contains(current))) {
      event.preventDefault()
      first.focus()
    }
  }

  function release() {
    document.removeEventListener('keydown', onKeydown)
    document.body.style.overflow = ''
  }

  watch(active, async (isActive) => {
    if (isActive) {
      previous = document.activeElement as HTMLElement | null
      document.addEventListener('keydown', onKeydown)
      document.body.style.overflow = 'hidden'
      await nextTick()
      container.value?.querySelector<HTMLElement>(FOCUSABLE)?.focus()
    } else {
      release()
      previous?.focus()
      previous = null
    }
  })

  onBeforeUnmount(release)
}
