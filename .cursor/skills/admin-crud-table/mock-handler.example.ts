/**
 * 启用导入导出时，将以下 handler 合并到 src/mocks/handlers/{module}.ts
 * 路径需带 /api 前缀（见 api-mock.mdc）
 */
import { http, HttpResponse } from 'msw'

// http.get('/api/xxx/export', ({ request }) => { ... 返回全量列表 data })
// http.post('/api/xxx/import', async ({ request }) => {
//   const form = await request.formData()
//   const file = form.get('file')
//   // 解析 xlsx、写入 mock 存储
//   return HttpResponse.json({ code: 0, message: 'success', data: { imported: 0 } })
// })

export const xxxImportExportHandlers = [
  http.post('/api/xxx/import', async () => {
    return HttpResponse.json({
      code: 0,
      message: 'success',
      data: { imported: 0 },
    })
  }),
]
