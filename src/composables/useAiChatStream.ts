import { ref, type Ref } from 'vue'
import { streamChat } from '@/api/aiChat'
import type { StreamChatParams } from '@/types/aiChat'

export function useAiChatStream() {
  const abortController = ref<AbortController | null>(null)
  const isStreaming = ref(false)

  async function startStream(
    params: StreamChatParams,
    onChunk: (content: string) => void,
  ): Promise<{ status: 'done' | 'aborted' | 'error'; message?: string }> {
    abortController.value?.abort()
    const controller = new AbortController()
    abortController.value = controller
    isStreaming.value = true

    return new Promise((resolve) => {
      streamChat(params, {
        signal: controller.signal,
        onChunk,
        onError: (message) => {
          isStreaming.value = false
          abortController.value = null
          if (controller.signal.aborted) {
            resolve({ status: 'aborted' })
          } else {
            resolve({ status: 'error', message })
          }
        },
        onDone: () => {
          isStreaming.value = false
          abortController.value = null
          resolve({ status: 'done' })
        },
      }).catch(() => {
        isStreaming.value = false
        abortController.value = null
        resolve({ status: controller.signal.aborted ? 'aborted' : 'error' })
      })
    })
  }

  function stopStream() {
    abortController.value?.abort()
    abortController.value = null
    isStreaming.value = false
  }

  return {
    isStreaming: isStreaming as Ref<boolean>,
    startStream,
    stopStream,
  }
}
