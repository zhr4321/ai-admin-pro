export async function startMockWorker() {
  if (!import.meta.env.DEV) return

  const { worker } = await import('./browser')
  await worker.start({
    onUnhandledRequest(request) {
      if (!request.url.includes('/api/')) return
      console.warn('[MSW] Unhandled:', request.method, request.url)
    },
  })
}
