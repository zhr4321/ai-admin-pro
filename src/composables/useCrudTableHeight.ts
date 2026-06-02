import { nextTick, onMounted, onUnmounted, ref, useTemplateRef } from 'vue'

const MIN_TABLE_HEIGHT = 200

/** 根据 .crud-result-body 容器高度动态设置 el-table 的 height（像素） */
export function useCrudTableHeight(templateRefKey = 'crudTableBody') {
  const tableBodyRef = useTemplateRef<HTMLElement>(templateRefKey)
  const tableHeight = ref(MIN_TABLE_HEIGHT)

  let resizeObserver: ResizeObserver | null = null

  function updateTableHeight() {
    const el = tableBodyRef.value
    if (!el) return
    const h = el.clientHeight
    tableHeight.value = h > 0 ? Math.max(h, MIN_TABLE_HEIGHT) : MIN_TABLE_HEIGHT
  }

  onMounted(() => {
    resizeObserver = new ResizeObserver(() => {
      updateTableHeight()
    })

    nextTick(() => {
      if (tableBodyRef.value) {
        resizeObserver?.observe(tableBodyRef.value)
        updateTableHeight()
      }
    })

    window.addEventListener('resize', updateTableHeight)
  })

  onUnmounted(() => {
    resizeObserver?.disconnect()
    window.removeEventListener('resize', updateTableHeight)
  })

  return {
    tableHeight,
    updateTableHeight,
  }
}
