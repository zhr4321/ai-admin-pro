import * as XLSX from 'xlsx'
import { downloadBlob } from './download'

export interface ExcelColumn<T extends Record<string, unknown>> {
  /** 表头文案 */
  label: string
  /** 行字段 key */
  key: keyof T & string
  /** 导出时的单元格格式化 */
  format?: (row: T) => string | number
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

/** 生成「{类型名}-yyyyMMddHHmmss.xlsx」文件名 */
export function formatExportFilename(exportTypeName: string): string {
  const d = new Date()
  const ts =
    `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}` +
    `${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`
  return `${exportTypeName}-${ts}.xlsx`
}

export function exportRowsToXlsx<T extends Record<string, unknown>>(
  rows: T[],
  columns: ExcelColumn<T>[],
  filename: string,
): void {
  const header = columns.map((c) => c.label)
  const data = rows.map((row) =>
    columns.map((col) => {
      const raw = row[col.key]
      if (col.format) return col.format(row)
      if (raw == null) return ''
      return raw as string | number
    }),
  )
  const sheet = XLSX.utils.aoa_to_sheet([header, ...data])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Sheet1')
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  downloadBlob(blob, filename)
}

/** 读取上传的 xlsx 第一个 sheet 为 JSON 行（首行为表头） */
export function parseXlsxFile<T extends Record<string, unknown>>(file: File): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        if (!data) {
          reject(new Error('文件读取失败'))
          return
        }
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        if (!sheetName) {
          resolve([])
          return
        }
        const sheet = workbook.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json<T>(sheet, { defval: '' })
        resolve(rows)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsArrayBuffer(file)
  })
}
