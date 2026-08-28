import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { demoActivities, demoClients, demoCollaborator } from '../mocks/demoData'
import type { DEPGerencia, DEPSquad } from '../data/mockDEP'
import type { CollaboratorProfile } from '../features/profile/types'
import { formatMinutes } from '../features/time-entries/domain'
import type { TimeEntry } from '../features/time-entries/types'
import { normalizeTimeEntry, type TimeEntryStorageV3 } from './timeEntryMigration'
import { TIME_ENTRY_STORAGE_KEY } from './timeEntryService'
import { createBrowserStorage, type StorageLike } from './storage'
import { getCorporateToday, getMonthKey } from '../shared/utils/date'

const COLLABORATOR_PROFILE_STORAGE_KEY = 'sma:collaborator-profile:v1'

type MonthScope = {
  monthKey?: string
}

type SquadExportInput = MonthScope & {
  organograma: DEPGerencia[]
  squadName: string
}

type GeneralExportInput = MonthScope & {
  organograma: DEPGerencia[]
}

type BaseReportRow = {
  colaborador: string
  cargo: string
  dataApontamento: string
  cliente: string
  projeto: string
  atividade: string
  horasLancadas: string
}

type GeneralReportRow = BaseReportRow & {
  squad: string
  supervisor: string
}

type CollaboratorMeta = {
  name: string
  jobTitle: string
}

const DEFAULT_PROFILE_META: CollaboratorMeta = {
  name: 'Colaborador',
  jobTitle: 'Projetista',
}

// Substitua pelo base64 real da logo quando quiser embutir a imagem no XLSX.
// Exemplo:
// const SMA_LOGO_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
const SMA_LOGO_BASE64 = ''

function isTimeEntryStorageV3(value: unknown): value is TimeEntryStorageV3 {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const candidate = value as Partial<TimeEntryStorageV3>
  return candidate.version === 3 && !!candidate.entriesByCollaborator && typeof candidate.entriesByCollaborator === 'object'
}

function readTimeEntryStorage(storage: StorageLike = createBrowserStorage()): TimeEntry[] {
  try {
    const raw = storage.getItem(TIME_ENTRY_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      return parsed.flatMap((entry) => {
        if (!entry || typeof entry !== 'object') return []
        const collaboratorId = (entry as Record<string, unknown>).collaboratorId
        if (typeof collaboratorId !== 'string') return []
        const normalized = normalizeTimeEntry(entry, collaboratorId)
        return normalized ? [normalized] : []
      })
    }
    if (!isTimeEntryStorageV3(parsed)) return []
    return Object.entries(parsed.entriesByCollaborator).flatMap(([collaboratorId, entries]) => {
      return Array.isArray(entries)
        ? entries.flatMap((entry) => {
            const normalized = normalizeTimeEntry(entry, collaboratorId)
            return normalized ? [normalized] : []
          })
        : []
    })
  } catch {
    return []
  }
}

function readCurrentProfileMeta(storage: StorageLike = createBrowserStorage()) {
  try {
    const raw = storage.getItem(COLLABORATOR_PROFILE_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<CollaboratorProfile>
    if (typeof parsed.id !== 'string') return null
    return {
      id: parsed.id,
      name: typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name : DEFAULT_PROFILE_META.name,
      jobTitle: typeof parsed.jobTitle === 'string' && parsed.jobTitle.trim() ? parsed.jobTitle : DEFAULT_PROFILE_META.jobTitle,
    }
  } catch {
    return null
  }
}

function flattenOrganograma(organograma: DEPGerencia[]) {
  return organograma.flatMap((gerencia) => gerencia.squads.map((squad) => ({ ...squad, gerente: gerencia.gerente })))
}

function findSquad(organograma: DEPGerencia[], squadName: string): (DEPSquad & { gerente: string }) | null {
  return flattenOrganograma(organograma).find((squad) => squad.nome === squadName) ?? null
}

function resolveClientName(clientId: string) {
  return demoClients.find((client) => client.id === clientId)?.name ?? clientId
}

function resolveActivityName(activityId: string) {
  return demoActivities.find((activity) => activity.id === activityId)?.name ?? activityId
}

function resolveCollaboratorMeta(entry: TimeEntry, storage: StorageLike = createBrowserStorage()): CollaboratorMeta {
  const currentProfile = readCurrentProfileMeta(storage)
  if (currentProfile && entry.collaboratorId === currentProfile.id) {
    return {
      name: currentProfile.name,
      jobTitle: currentProfile.jobTitle,
    }
  }
  if (entry.collaboratorId === demoCollaborator.id) {
    return {
      name: demoCollaborator.name,
      jobTitle: demoCollaborator.jobTitle,
    }
  }
  return {
    name: entry.collaboratorId,
    jobTitle: '—',
  }
}

function filterEntriesByMonth(entries: TimeEntry[], monthKey: string) {
  return entries.filter((entry) => entry.entryDate.startsWith(monthKey))
}

function filterEntriesBySquad(entries: TimeEntry[], squadName: string) {
  return entries.filter((entry) => entry.assignmentSnapshot?.squadName === squadName)
}

function getColumnLetter(columnNumber: number) {
  let dividend = columnNumber
  let columnName = ''
  while (dividend > 0) {
    const modulo = (dividend - 1) % 26
    columnName = String.fromCharCode(65 + modulo) + columnName
    dividend = Math.floor((dividend - modulo) / 26)
  }
  return columnName
}

function applyHeaderStyle(worksheet: ExcelJS.Worksheet, rowNumber: number) {
  const headerRow = worksheet.getRow(rowNumber)
  headerRow.height = 24
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3A52' } }
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF1F3A52' } },
      left: { style: 'thin', color: { argb: 'FF1F3A52' } },
      bottom: { style: 'thin', color: { argb: 'FF1F3A52' } },
      right: { style: 'thin', color: { argb: 'FF1F3A52' } },
    }
  })
}

function applyCorporateHeader(
  workbook: ExcelJS.Workbook,
  worksheet: ExcelJS.Worksheet,
  title: string,
  lastDataColumnNumber: number,
) {
  const titleRangeEnd = getColumnLetter(Math.max(3, lastDataColumnNumber))
  worksheet.getRow(1).height = 60
  worksheet.mergeCells(`C1:${titleRangeEnd}1`)
  worksheet.getCell('C1').value = title
  worksheet.getCell('C1').font = { bold: true, size: 16, color: { argb: 'FF0F172A' } }
  worksheet.getCell('C1').alignment = { vertical: 'middle', horizontal: 'center' }
  worksheet.getCell('C1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }

  worksheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
  worksheet.getCell('B1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }

  if (SMA_LOGO_BASE64) {
    const imageId = workbook.addImage({
      base64: SMA_LOGO_BASE64,
      extension: 'png',
    })
    worksheet.addImage(imageId, {
      tl: { col: 0.15, row: 0.1 },
      ext: { width: 140, height: 44 },
    })
  } else {
    worksheet.getCell('A1').value = 'SM&A'
    worksheet.mergeCells(1, 1, 1, 2)
    worksheet.getCell('A1').font = { bold: true, size: 18, color: { argb: 'FF1F3A52' } }
    worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' }
  }
}

function applyBodyStyle(worksheet: ExcelJS.Worksheet, centeredColumns: number[], firstDataRow = 3) {
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber < firstDataRow) return
    row.height = 21
    row.eachCell((cell, columnNumber) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      }
      cell.alignment = {
        vertical: 'middle',
        horizontal: centeredColumns.includes(columnNumber) ? 'center' : 'left',
        wrapText: true,
      }
    })
  })
}

function autoFitColumns(worksheet: ExcelJS.Worksheet) {
  worksheet.columns.forEach((column) => {
    if (!column) return
    let maxLength = 12
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const rawValue = cell.value
      const text = rawValue == null ? '' : String(typeof rawValue === 'object' && rawValue !== null && 'text' in rawValue ? (rawValue as { text?: unknown }).text ?? '' : rawValue)
      maxLength = Math.max(maxLength, text.length)
    })
    const baseWidth = typeof column.header === 'string' ? column.header.length + 2 : maxLength + 2
    column.width = Math.min(Math.max(baseWidth, maxLength + 2, 12), 42)
  })
}

async function writeWorkbook(workbook: ExcelJS.Workbook, fileName: string) {
  const buffer = await workbook.xlsx.writeBuffer()
  saveAs(new Blob([buffer]), fileName)
}

export async function exportGeneralHoursReport({ organograma, monthKey = getMonthKey(getCorporateToday()) }: GeneralExportInput) {
  const storage = createBrowserStorage()
  const knownSquads = flattenOrganograma(organograma)
  if (knownSquads.length === 0) {
    // O organograma pode estar vazio em ambientes de teste; seguimos exportando somente o que existir no storage.
  }
  const entries = filterEntriesByMonth(readTimeEntryStorage(storage), monthKey)
  const rows: GeneralReportRow[] = entries.map((entry) => {
    const squad = entry.assignmentSnapshot?.squadName ?? '—'
    const supervisor = entry.assignmentSnapshot?.supervisorName ?? '—'
    const collaborator = resolveCollaboratorMeta(entry, storage)
    return {
      squad,
      supervisor,
      colaborador: collaborator.name,
      cargo: collaborator.jobTitle,
      dataApontamento: entry.entryDate,
      cliente: resolveClientName(entry.clientId),
      projeto: entry.projectCode,
      atividade: resolveActivityName(entry.activityId),
      horasLancadas: formatMinutes(entry.durationMinutes),
    }
  })

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'SM&A Apontamento de Horas'
  workbook.created = new Date()

  const worksheet = workbook.addWorksheet('Base de Dados')
  worksheet.columns = [
    { key: 'squad', width: 24 },
    { key: 'supervisor', width: 26 },
    { key: 'colaborador', width: 30 },
    { key: 'cargo', width: 20 },
    { key: 'dataApontamento', width: 18 },
    { key: 'cliente', width: 26 },
    { key: 'projeto', width: 30 },
    { key: 'atividade', width: 34 },
    { key: 'horasLancadas', width: 16 },
  ]
  applyCorporateHeader(workbook, worksheet, 'Apontamento de Horas', 9)
  worksheet.getRow(2).values = [null, 'Squad', 'Supervisor', 'Colaborador', 'Cargo', 'Data do Apontamento', 'Cliente', 'Projeto', 'Atividade', 'Horas Lançadas']
  worksheet.getRow(2).height = 26
  rows.forEach((row, index) => {
    const addedRow = worksheet.addRow(row)
    if (index % 2 === 1) {
      addedRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
      })
    }
  })
  applyHeaderStyle(worksheet, 2)
  applyBodyStyle(worksheet, [5, 9], 3)
  autoFitColumns(worksheet)
  worksheet.autoFilter = 'A2:I2'
  worksheet.views = [{ state: 'frozen', ySplit: 2 }]

  await writeWorkbook(workbook, `Relatorio_Horas_Geral_${monthKey}.xlsx`)
}

export async function exportSquadHoursReport({ organograma, squadName, monthKey = getMonthKey(getCorporateToday()) }: SquadExportInput) {
  const storage = createBrowserStorage()
  const entries = filterEntriesByMonth(readTimeEntryStorage(storage), monthKey)
  const squad = findSquad(organograma, squadName)
  const filteredEntries = filterEntriesBySquad(entries, squadName)
  const rows = filteredEntries.map((entry) => {
    const collaborator = resolveCollaboratorMeta(entry, storage)
    return {
      colaborador: collaborator.name,
      cargo: collaborator.jobTitle,
      dataApontamento: entry.entryDate,
      cliente: resolveClientName(entry.clientId),
      projeto: entry.projectCode,
      atividade: resolveActivityName(entry.activityId),
      horasLancadas: formatMinutes(entry.durationMinutes),
    }
  })

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'SM&A Apontamento de Horas'
  workbook.created = new Date()

  const worksheet = workbook.addWorksheet('Apontamentos da Equipe')
  worksheet.columns = [
    { key: 'colaborador', width: 30 },
    { key: 'cargo', width: 20 },
    { key: 'dataApontamento', width: 18 },
    { key: 'cliente', width: 26 },
    { key: 'projeto', width: 30 },
    { key: 'atividade', width: 34 },
    { key: 'horasLancadas', width: 16 },
  ]
  applyCorporateHeader(workbook, worksheet, 'Apontamento de Horas', 7)
  worksheet.getRow(2).values = [null, 'Colaborador', 'Cargo', 'Data do Apontamento', 'Cliente', 'Projeto', 'Atividade', 'Horas Lançadas']
  worksheet.getRow(2).height = 26
  rows.forEach((row, index) => {
    const addedRow = worksheet.addRow(row)
    if (index % 2 === 1) {
      addedRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
      })
    }
  })
  applyHeaderStyle(worksheet, 2)
  applyBodyStyle(worksheet, [3, 7], 3)
  autoFitColumns(worksheet)
  worksheet.autoFilter = 'A2:G2'
  worksheet.views = [{ state: 'frozen', ySplit: 2 }]

  const safeSquadName = squad?.nome ?? squadName
  await writeWorkbook(workbook, `Relatorio_Horas_${safeSquadName.replace(/[^a-z0-9]+/gi, '_')}_${monthKey}.xlsx`)
}
