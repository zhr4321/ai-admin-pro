import { computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { canEditModule, canViewModule, getModuleLevel } from '@/utils/permission'

export function useModulePermission(moduleKey: string) {
  const userStore = useUserStore()

  const level = computed(() =>
    getModuleLevel(userStore.userInfo?.permissions, moduleKey),
  )
  const canView = computed(() => canViewModule(level.value))
  const canEdit = computed(() => canEditModule(level.value))

  return { level, canView, canEdit }
}
