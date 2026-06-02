<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getCurrentPermissions,
  getUserPermissionConfig,
  suggestUsers,
  updateUserPermissions,
} from '@/api/role'
import {
  PERMISSION_LEVEL_OPTIONS,
  type PermissionLevel,
  type UserAccountItem,
  type UserModulePermission,
  type UserSuggestItem,
} from '@/types/role'

interface HighlightSegment {
  text: string
  match: boolean
}

const searchInput = ref('')
const suggestKeyword = ref('')
const selectedUser = ref<UserAccountItem | null>(null)
const isLocked = ref(false)

const moduleKeyword = ref('')
const permLoading = ref(false)
const saving = ref(false)
const allPermissions = ref<UserModulePermission[]>([])

const canEdit = ref(false)

const filteredPermissions = computed(() => {
  const kw = moduleKeyword.value.trim().toLowerCase()
  if (!kw) return allPermissions.value
  return allPermissions.value.filter(
    (p) =>
      p.moduleName.toLowerCase().includes(kw) ||
      p.moduleKey.toLowerCase().includes(kw),
  )
})

function formatUserLabel(user: Pick<UserAccountItem, 'realName' | 'username'>) {
  return `${user.realName}（${user.username}）`
}

function highlightSegments(text: string, keyword: string): HighlightSegment[] {
  const kw = keyword.trim().toLowerCase()
  if (!kw) return [{ text, match: false }]

  const lower = text.toLowerCase()
  const segments: HighlightSegment[] = []
  let start = 0
  let idx = lower.indexOf(kw, start)

  while (idx !== -1) {
    if (idx > start) {
      segments.push({ text: text.slice(start, idx), match: false })
    }
    segments.push({ text: text.slice(idx, idx + kw.length), match: true })
    start = idx + kw.length
    idx = lower.indexOf(kw, start)
  }

  if (start < text.length) {
    segments.push({ text: text.slice(start), match: false })
  }

  return segments.length > 0 ? segments : [{ text, match: false }]
}

async function loadCanEdit() {
  try {
    const data = await getCurrentPermissions()
    const rolePerm = data.permissions.find((p) => p.moduleKey === 'role')
    canEdit.value = !!rolePerm?.edit
  } catch {
    canEdit.value = false
  }
}

async function fetchSuggestions(
  query: string,
  cb: (items: UserSuggestItem[]) => void,
) {
  const keyword = query.trim()
  suggestKeyword.value = keyword
  if (!keyword) {
    cb([])
    return
  }
  try {
    const data = await suggestUsers({ keyword, limit: 10 })
    cb(data)
  } catch {
    cb([])
  }
}

function clearSelection() {
  selectedUser.value = null
  allPermissions.value = []
  isLocked.value = false
}

function handleSearchInput(val: string) {
  if (!selectedUser.value) return
  if (val !== formatUserLabel(selectedUser.value)) {
    clearSelection()
  }
}

async function handleUserSelect(item: UserSuggestItem) {
  searchInput.value = formatUserLabel(item)
  moduleKeyword.value = ''
  await loadPermissionConfig(item.id)
}

async function loadPermissionConfig(userId: number) {
  permLoading.value = true
  try {
    const data = await getUserPermissionConfig(userId)
    selectedUser.value = data.user
    allPermissions.value = data.permissions
    isLocked.value = data.isLocked
  } catch {
    clearSelection()
    searchInput.value = ''
  } finally {
    permLoading.value = false
  }
}

function handleLevelChange(row: UserModulePermission, level: PermissionLevel) {
  row.level = level
}

async function handleSave() {
  if (!selectedUser.value || isLocked.value) return
  saving.value = true
  try {
    await updateUserPermissions(selectedUser.value.id, allPermissions.value)
    ElMessage.success('权限保存成功')
  } catch {
    // 错误由拦截器处理
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadCanEdit()
})
</script>

<template>
  <div class="user-perm-page">
    <el-card class="user-card" shadow="never">
      <template #header>
        <span class="card-title">用户搜索</span>
      </template>
      <el-autocomplete
        v-model="searchInput"
        :debounce="300"
        :fetch-suggestions="fetchSuggestions"
        clearable
        placeholder="输入账号或用户姓名搜索"
        style="width: 360px"
        value-key="id"
        @input="handleSearchInput"
        @select="handleUserSelect"
        @clear="clearSelection"
      >
        <template #default="{ item }">
          <span class="suggest-item">
            <span
              v-for="(seg, idx) in highlightSegments(item.realName, suggestKeyword)"
              :key="`name-${idx}`"
              :class="{ 'match-highlight': seg.match }"
            >{{ seg.text }}</span>（<span
              v-for="(seg, idx) in highlightSegments(item.username, suggestKeyword)"
              :key="`user-${idx}`"
              :class="{ 'match-highlight': seg.match }"
            >{{ seg.text }}</span>）
          </span>
        </template>
      </el-autocomplete>

      <el-descriptions
        v-if="selectedUser"
        :column="3"
        border
        size="small"
        class="user-info"
      >
        <el-descriptions-item label="账号">{{ selectedUser.username }}</el-descriptions-item>
        <el-descriptions-item label="用户姓名">{{ selectedUser.realName }}</el-descriptions-item>
        <el-descriptions-item label="所属角色">{{ selectedUser.roleName }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card class="perm-card" shadow="never">
      <template #header>
        <div class="perm-header">
          <span class="card-title">
            <template v-if="selectedUser">
              {{ selectedUser.realName }}（{{ selectedUser.username }}）的权限配置
            </template>
            <template v-else>用户权限配置</template>
          </span>
          <el-input
            v-if="selectedUser"
            v-model="moduleKeyword"
            placeholder="搜索功能模块"
            clearable
            style="width: 200px"
            size="small"
          />
        </div>
      </template>

      <el-empty v-if="!selectedUser" description="请先搜索并选择用户" />

      <template v-else>
        <el-alert
          v-if="isLocked"
          title="超级管理员拥有全部模块可修改权限，不可变更"
          type="info"
          :closable="false"
          show-icon
          class="perm-alert"
        />
        <el-alert
          v-else-if="!canEdit"
          title="当前账号无「用户权限-可修改」权限，仅可查看"
          type="info"
          :closable="false"
          show-icon
          class="perm-alert"
        />
        <div v-loading="permLoading" class="perm-list">
          <div
            v-for="item in filteredPermissions"
            :key="item.moduleKey"
            class="perm-row"
          >
            <span class="perm-module-name">{{ item.moduleName }}</span>
            <el-select
              :model-value="item.level"
              :disabled="!canEdit || isLocked"
              size="small"
              style="width: 140px"
              @update:model-value="(v: PermissionLevel) => handleLevelChange(item, v)"
            >
              <el-option
                v-for="opt in PERMISSION_LEVEL_OPTIONS"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </div>
          <el-empty
            v-if="!permLoading && filteredPermissions.length === 0"
            description="无匹配的功能模块"
          />
        </div>
        <div class="perm-footer">
          <el-button
            type="primary"
            :loading="saving"
            :disabled="!canEdit || isLocked"
            @click="handleSave"
          >
            保存权限
          </el-button>
        </div>
      </template>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.user-perm-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: calc(100vh - 120px);
  min-height: 480px;
}

.user-card {
  flex: 0 0 auto;
  border-radius: var(--radius-base);
}

.perm-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-radius: var(--radius-base);

  :deep(.el-card__body) {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }
}

.card-title {
  font-size: var(--font-size-title);
  font-weight: 600;
  color: var(--text-dark);
}

.match-highlight {
  color: var(--el-color-danger);
  font-weight: 600;
}

.suggest-item {
  line-height: 1.5;
}

.user-info {
  margin-top: 16px;
  max-width: 720px;
}

.perm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.perm-alert {
  margin-bottom: 12px;
  flex-shrink: 0;
}

.perm-list {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}

.perm-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: var(--bg-primary);
  }
}

.perm-module-name {
  font-size: var(--font-size-body);
  color: var(--text-dark);
}

.perm-footer {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}
</style>
