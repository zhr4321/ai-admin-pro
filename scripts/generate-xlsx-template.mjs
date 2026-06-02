import * as XLSX from 'xlsx'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'static')
mkdirSync(outDir, { recursive: true })

function writeTemplate(filename, headers, exampleRow) {
  const sheet = XLSX.utils.aoa_to_sheet([headers, exampleRow])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, sheet, '导入模板')
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  writeFileSync(join(outDir, filename), buf)
  console.log(`Wrote public/static/${filename}`)
}

writeTemplate(
  'campaign-import-template.xlsx',
  ['活动名称', '状态', '推广渠道', '是否置顶', '开始日期', '结束日期'],
  ['示例活动', '进行中', '站内', '否', '2026-03-01', '2026-03-31'],
)

writeTemplate(
  'notice-import-template.xlsx',
  ['公告标题', '发布人', '状态', '内容'],
  ['示例公告', '运营团队', '草稿', '这是一条示例公告内容'],
)

// 保留占位模板供 skill 参考
writeTemplate('xxx-import-template.xlsx', ['名称', '状态'], ['示例名称', 'enabled'])
