import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

export function useInView(target: Ref<Element | null>, options: { once?: boolean } = {}) {
  const inView = ref(false)
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    if (!target.value) return
    observer = new IntersectionObserver(([entry]) => {
      inView.value = entry.isIntersecting
      if (entry.isIntersecting && options.once) observer?.disconnect()
    })
    observer.observe(target.value)
  })
  onBeforeUnmount(() => observer?.disconnect())

  return inView
}
