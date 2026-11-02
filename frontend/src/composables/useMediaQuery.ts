import { onBeforeUnmount, onMounted, ref } from 'vue'

// The query is read after mount so the first client render matches the prerendered HTML.
export function useMediaQuery(query: string, initial: boolean) {
  const matches = ref(initial)
  let list: MediaQueryList | null = null

  function update() {
    matches.value = list?.matches ?? initial
  }

  onMounted(() => {
    list = window.matchMedia(query)
    update()
    list.addEventListener('change', update)
  })
  onBeforeUnmount(() => list?.removeEventListener('change', update))

  return matches
}
