/** 空闲时预加载常用表单页 chunk，减轻首次进入卡顿 */
export function preloadFormRouteChunks() {
  const preload = () => {
    void import('@/views/settings/index.vue')
    void import('@/views/merchant/onboarding/index.vue')
  }

  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(preload)
  } else {
    setTimeout(preload, 200)
  }
}
