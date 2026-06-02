import { nextTick, onMounted, ref, watch, type Ref } from 'vue'

const BOTTOM_THRESHOLD = 80

export function useChatScroll(
  messageCount: Ref<number>,
  contentVersion: Ref<number>,
  containerRef?: Ref<HTMLElement | null>,
) {
  const innerRef = containerRef ?? ref<HTMLElement | null>(null)
  const isAtBottom = ref(true)
  const showScrollToBottom = ref(false)
  let resizeObserver: ResizeObserver | null = null

  function hasScrollbar(el: HTMLElement): boolean {
    return el.scrollHeight > el.clientHeight + 1
  }

  function updateScrollState() {
    const el = innerRef.value
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    isAtBottom.value = distance <= BOTTOM_THRESHOLD
    showScrollToBottom.value = !isAtBottom.value && hasScrollbar(el)
  }

  function scrollToBottom(smooth = false) {
    const el = innerRef.value
    if (!el) return
    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    })
    isAtBottom.value = true
    showScrollToBottom.value = false
  }

  function handleScroll() {
    updateScrollState()
  }

  function observeResize() {
    const el = innerRef.value
    if (!el || resizeObserver) return

    resizeObserver = new ResizeObserver(() => {
      updateScrollState()
    })
    resizeObserver.observe(el)
    updateScrollState()
  }

  function unobserveResize() {
    resizeObserver?.disconnect()
    resizeObserver = null
  }

  watch(contentVersion, async () => {
    await nextTick()
    if (isAtBottom.value) {
      scrollToBottom(false)
    } else {
      updateScrollState()
    }
  })

  watch(messageCount, async () => {
    await nextTick()
    if (isAtBottom.value) {
      scrollToBottom(false)
    } else {
      updateScrollState()
    }
  })

  onMounted(async () => {
    await nextTick()
    updateScrollState()
  })

  return {
    containerRef: innerRef,
    isAtBottom,
    showScrollToBottom,
    scrollToBottom,
    updateScrollState,
    handleScroll,
    observeResize,
    unobserveResize,
  }
}
