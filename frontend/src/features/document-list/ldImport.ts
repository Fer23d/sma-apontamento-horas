import type { DisciplineCode, LdDocumentSnapshot } from '../time-entries/types'
import { isDocumentAcronym, isLdDocumentSnapshot } from '../time-entries/documentCatalog'

export interface LdDocument extends LdDocumentSnapshot {
  rowNumber: number
  clientName: string
  contractorNumber: string
  disciplineCode: DisciplineCode
}
export interface LdImportResult {
  headerRow: number
  columns: Record<'valeNumber' | 'contractorNumber' | 'documentTypeCode' | 'disciplineName' | 'title', number>
  documents: LdDocument[]
  issues: Array<{ rowNumber: number; message: string }>
}
const normalize = (value: unknown) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '')
const text = (value: unknown) => typeof value === 'string' || typeof value === 'number' ? String(value).trim() : ''
const headers = { valeNumber: ['NVALE', 'NOVALE', 'NUMEROVALE'], contractorNumber: ['NCONTRATADA', 'NOCONTRATADA', 'NUMEROCONTRATADA'], documentTypeCode: ['SIGLADEDESENHO'], disciplineName: ['ESPECIALIDADESDEENGENHARIA'], title: ['TITULO'] } as const
const disciplineByName: Record<string, DisciplineCode> = { GERAL: 'G', ELETRICA: 'E', AUTOMACAO: 'A', MECANICA: 'M' }
const VALE_CLIENT_NAME = 'VALE'

export function validateLdFile(file: { name: string; size: number }) {
  if (!/\.(xlsx|xlsm)$/i.test(file.name)) throw new Error('Selecione uma LD em .xlsx ou .xlsm.')
  if (!file.size) throw new Error('O arquivo está vazio.')
  if (file.size > 10 * 1024 * 1024) throw new Error('A LD deve ter no máximo 10 MB.')
}

export function parseLdRows(rows: readonly (readonly unknown[])[], fileName: string): LdImportResult {
  let columns: LdImportResult['columns'] | undefined
  let headerIndex = -1
  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].map(normalize)
    const found = Object.entries(headers).map(([key, aliases]) => [key, cells.findIndex((cell) => (aliases as readonly string[]).includes(cell))] as const)
    if (found.every(([, index]) => index >= 0)) {
      columns = Object.fromEntries(found) as LdImportResult['columns']
      headerIndex = i
      break
    }
  }
  if (!columns) throw new Error('Não foram encontrados os cabeçalhos Nº VALE, Nº CONTRATADA, SIGLA DE DESENHO, ESPECIALIDADES DE ENGENHARIA e TÍTULO na aba LD.')
  const documents: LdDocument[] = []
  const issues: LdImportResult['issues'] = []
  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i]
    const valeNumber = text(row[columns.valeNumber])
    const contractorNumber = text(row[columns.contractorNumber])
    if (!valeNumber && !contractorNumber) continue
    if (headers.valeNumber.some((name) => name === normalize(valeNumber))) continue
    const documentTypeCode = text(row[columns.documentTypeCode])
    const disciplineName = text(row[columns.disciplineName])
    const title = text(row[columns.title])
    const disciplineCode = disciplineByName[normalize(disciplineName)]
    const snapshot = { valeNumber, title, documentTypeCode, disciplineName, fileName }
    let message = ''
    if (!isDocumentAcronym(documentTypeCode)) message = 'Sigla de desenho ausente ou inválida.'
    else if (!disciplineCode) message = `Disciplina desconhecida: ${disciplineName || 'não informada'}.`
    else if (!valeNumber || !contractorNumber || !title || contractorNumber.length > 160 || !isLdDocumentSnapshot(snapshot)) message = 'Linha incompleta ou com identificação/título acima do limite.'
    if (message) { issues.push({ rowNumber: i + 1, message }); continue }
    documents.push({ ...snapshot, clientName: VALE_CLIENT_NAME, contractorNumber, disciplineCode, rowNumber: i + 1 })
  }
  if (!documents.length) throw new Error(`A LD não contém documentos válidos.${issues.length ? ` ${issues.length} linha(s) inválida(s). ${issues[0].message}` : ''}`)
  return { headerRow: headerIndex + 1, columns, documents, issues }
}

export function applyLdDocument<T extends object>(values: T, document: LdDocument) {
  const { valeNumber, title, documentTypeCode, disciplineName, fileName } = document
  return { ...values, clientName: document.clientName, contractorNumber: document.contractorNumber, disciplineCode: document.disciplineCode, documentTypeCode,
    ldDocument: { valeNumber, title, documentTypeCode, disciplineName, fileName } }
}

export async function importLd(file: File): Promise<LdImportResult> {
  validateLdFile(file)
  const signature = new Uint8Array(await file.slice(0, 4).arrayBuffer())
  if (signature[0] !== 0x50 || signature[1] !== 0x4b || signature[2] !== 3 || signature[3] !== 4) throw new Error('O arquivo não é uma planilha Excel válida.')
  let rows: unknown[][]
  try {
    const { readSheet } = await import('read-excel-file/browser')
    rows = await readSheet(file, 'LD')
  } catch (error) {
    if (error instanceof Error && (error.name === 'SheetNotFoundError' || /sheet.*not found/i.test(error.message))) throw new Error('A planilha não possui a aba LD.')
    throw new Error('Não foi possível ler a planilha. Verifique se o arquivo é válido e não está protegido por senha.')
  }
  return parseLdRows(rows, file.name)
}
