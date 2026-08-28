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

function applyHeaderStyle(worksheet: ExcelJS.Worksheet) {
  const headerRow = worksheet.getRow(1)
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

function applyBodyStyle(worksheet: ExcelJS.Worksheet, centeredColumns: number[]) {
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
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
    { header: 'Squad', key: 'squad', width: 24 },
    { header: 'Supervisor', key: 'supervisor', width: 26 },
    { header: 'Colaborador', key: 'colaborador', width: 30 },
    { header: 'Cargo', key: 'cargo', width: 20 },
    { header: 'Data do Apontamento', key: 'dataApontamento', width: 18 },
    { header: 'Cliente', key: 'cliente', width: 26 },
    { header: 'Projeto', key: 'projeto', width: 30 },
    { header: 'Atividade', key: 'atividade', width: 34 },
    { header: 'Horas Lançadas', key: 'horasLancadas', width: 16 },
  ]
  rows.forEach((row, index) => {
    const addedRow = worksheet.addRow(row)
    if (index % 2 === 1) {
      addedRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
      })
    }
  })
  applyHeaderStyle(worksheet)
  applyBodyStyle(worksheet, [5, 9])
  autoFitColumns(worksheet)
  worksheet.autoFilter = 'A1:I1'
  worksheet.views = [{ state: 'frozen', ySplit: 1 }]

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
    { header: 'Colaborador', key: 'colaborador', width: 30 },
    { header: 'Cargo', key: 'cargo', width: 20 },
    { header: 'Data do Apontamento', key: 'dataApontamento', width: 18 },
    { header: 'Cliente', key: 'cliente', width: 26 },
    { header: 'Projeto', key: 'projeto', width: 30 },
    { header: 'Atividade', key: 'atividade', width: 34 },
    { header: 'Horas Lançadas', key: 'horasLancadas', width: 16 },
  ]
  rows.forEach((row, index) => {
    const addedRow = worksheet.addRow(row)
    if (index % 2 === 1) {
      addedRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
      })
    }
  })
  applyHeaderStyle(worksheet)
  applyBodyStyle(worksheet, [3, 7])
  autoFitColumns(worksheet)
  worksheet.autoFilter = 'A1:G1'
  worksheet.views = [{ state: 'frozen', ySplit: 1 }]

  const safeSquadName = squad?.nome ?? squadName
  await writeWorkbook(workbook, `Relatorio_Horas_${safeSquadName.replace(/[^a-z0-9]+/gi, '_')}_${monthKey}.xlsx`)
}
