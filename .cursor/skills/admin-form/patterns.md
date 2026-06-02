# admin-form 补充模式

本文档承载中等自由度的表单模式。核心流程见 [SKILL.md](SKILL.md)。

## 登录 / 简洁表单

适用：独立路由（如 `/login`），无 Layout，无 label。

```vue
<div class="form-page form-page--login">
  <div class="form-login-card">
    <h1 class="form-login-title">AI Admin Pro</h1>
    <p class="form-login-subtitle">后台管理系统</p>
    <el-form ref="formRef" :model="form" :rules="rules" size="large">
      <el-form-item prop="username">
        <el-input v-model="form.username" placeholder="用户名" :prefix-icon="User" />
      </el-form-item>
      <el-form-item prop="password">
        <el-input
          v-model="form.password"
          type="password"
          placeholder="密码"
          show-password
          :prefix-icon="Lock"
          @keyup.enter="handleSubmit"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" class="form-login-btn" :loading="loading" @click="handleSubmit">
          登 录
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</div>
```

要点：

- 引入 `@use '@/styles/form-page.scss'`
- 参考 [`src/views/login/index.vue`](../../src/views/login/index.vue)
- Enter 触发提交；主按钮 `class="form-login-btn"` 全宽

## 复杂联动

### watch 清空依赖字段

```typescript
watch(
  () => formModel.type,
  () => {
    formModel.subType = ''
    formModel.extraField = ''
    formRef.value?.clearValidate(['subType', 'extraField'])
  },
)
```

### 条件显示表单项

```vue
<el-form-item v-if="formModel.type === 'enterprise'" label="企业名称" prop="companyName">
  <el-input v-model="formModel.companyName" />
</el-form-item>
```

切换 type 时若隐藏字段有校验，须同步清空值并 `clearValidate`。

### 上传与表单协同

```typescript
async function handleUpload(options: UploadRequestOptions) {
  uploading.value = true
  try {
    const { url } = await uploadFile(options.file as File)
    formModel.avatar = url
    options.onSuccess?.({ url })
    ElMessage.success('上传成功')
  } catch {
    options.onError?.(new Error('上传失败') as never)
  } finally {
    uploading.value = false
  }
}
```

```vue
<el-upload
  :show-file-list="false"
  accept="image/*"
  :disabled="uploading"
  :http-request="handleUpload"
>
  <el-button size="small" :loading="uploading">更换头像</el-button>
</el-upload>
```

参考 [`src/views/profile/index.vue`](../../src/views/profile/index.vue) 双栏 + 上传。

### 分步校验字段子集

同一 `formRef` 时按步校验：

```typescript
const STEP1_PROPS = ['name', 'type'] as const

async function validateStep1() {
  if (!formRef.value) return false
  try {
    await formRef.value.validateField([...STEP1_PROPS])
    return true
  } catch {
    return false
  }
}
```

多 `formRef`（每步一个）见 [template-wizard.vue](template-wizard.vue)。

## 配置页（非 el-form）

**不要**强行套 `el-form` + `FormRules`。

适用：列表式配置、即时改选项、底部统一保存（如用户权限）。

- 使用 `@role-management.md` 或 `.cursor/prompts/role-management.md`
- 参考 [`src/views/role/index.vue`](../../src/views/role/index.vue)
- 控件变更写入 reactive 状态，点击「保存」一次性 PUT

决策：若页面是「搜索用户 + 模块权限下拉列表」，走 role-management，不走 admin-form。

## 双栏布局（可选）

查看/编辑页可在 `form-body` 内增加 `form-aside`：

```vue
<div class="form-body">
  <aside class="form-aside">
    <!-- 头像、摘要、上传 -->
  </aside>
  <main class="form-main">
    <!-- descriptions 或 el-form -->
  </main>
</div>
```

样式已由 `form-page.scss` 提供；`<768px` 自动单列堆叠。

## 与 CRUD 弹窗的边界

| 需求 | 使用 |
|------|------|
| 列表 + 720px 弹窗增改 | `@admin-crud-table` |
| 全页表单 / 查看编辑 / 向导 | `@admin-form` |

CRUD 弹窗的 `@closed` 重置、`editFormSnapshot` 等语义见 admin-crud-table，**不要**在本 Skill 重复实现。
