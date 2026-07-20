import type { AssignmentSnapshot } from '../features/squads/types'
import type { DisciplineCode, DocumentTypeCode, TimeEntry } from '../features/time-entries/types'

export const LEGACY_V2_TIME_ENTRY_STORAGE_KEY = 'sma:time-entries:v2'

const safeLegacyAssignmentByCollaboratorId: Readonly<Record<string, AssignmentSnapshot>> = {
  'demo-collaborator-001': {
    squadId: 'squad-automation',
    squadName: 'Engenharia de Automação',
    supervisorId: 'supervisor-demo-001',
    supervisorName: 'Supervisora Demonstração',
  },
}

type V2TimeEntry = Omit<TimeEntry, 'disciplineCode' | 'documentTypeCode' | 'assignmentSnapshot'> & {
  disciplineCode?: unknown
  documentTypeCode?: unknown
  assignmentSnapshot?: unknown
}

export type TimeEntryStorageV3 = {
  version: 3
  entriesByCollaborator: Record<string, TimeEntry[]>
}

export type TimeEntryMigrationResult = {
  data: TimeEntryStorageV3
  migratedCount: number
  skippedCount: number
}

const disciplineCodes: readonly DisciplineCode[] = ['—', 'A', 'E']
const documentTypeCodes: readonly DocumentTypeCode[] = [
  '—', 'RN', 'GR', 'G', 'FD', 'DE', 'LM', 'DI', 'LC', 'LI', 'ET', 'MC', 'MO', 'MD', 'FG', 'LA', 'ES', 'CF',
]

function isV2TimeEntry(value: unknown, collaboratorId: string): value is V2TimeEntry {
  if (!value || typeof value !== 'object') return false
  const entry = value as Record<string, unknown>
  return typeof entry.id === 'string'
    && entry.collaboratorId === collaboratorId
    && typeof entry.entryDate === 'string'
    && typeof entry.clientId === 'string'
    && typeof entry.projectCode === 'string'
    && Boolean(entry.projectCode.trim())
    && entry.projectCode.trim().length <= 80
    && typeof entry.activityId === 'string'
    && Number.isInteger(entry.durationMinutes)
    && Number(entry.durationMinutes) > 0
    && typeof entry.details === 'string'
    && Boolean(entry.details.trim())
    && (entry.status === 'ACTIVE' || entry.status === 'CANCELLED')
    && Number.isInteger(entry.version)
    && typeof entry.createdAt === 'string'
    && typeof entry.updatedAt === 'string'
}

function optionalString(value: unknown) {
  return typeof value === 'string' && value ? value : undefined
}

function migrateEntry(entry: V2TimeEntry, collaboratorId: string): TimeEntry {
  return {
    id: entry.id,
    collaboratorId: entry.collaboratorId,
    entryDate: entry.entryDate,
    clientId: entry.clientId,
    projectCode: entry.projectCode.trim(),
    activityId: entry.activityId,
    disciplineCode: disciplineCodes.includes(entry.disciplineCode as DisciplineCode)
      ? entry.disciplineCode as DisciplineCode
      : '—',
    documentTypeCode: documentTypeCodes.includes(entry.documentTypeCode as DocumentTypeCode)
      ? entry.documentTypeCode as DocumentTypeCode
      : '—',
    durationMinutes: entry.durationMinutes,
    details: entry.details.trim(),
    assignmentSnapshot: safeLegacyAssignmentByCollaboratorId[collaboratorId] ?? null,
    status: entry.status,
    version: entry.version,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    lastEditReason: optionalString(entry.lastEditReason),
    sourceEntryId: optionalString(entry.sourceEntryId),
    cancelledAt: optionalString(entry.cancelledAt),
    cancelReason: optionalString(entry.cancelReason),
  }
}

export function migrateV2TimeEntries(raw: string): TimeEntryMigrationResult {
  const parsed = JSON.parse(raw) as unknown
  if (!parsed || typeof parsed !== 'object') throw new Error('Estrutura v2 inválida.')
  const candidate = parsed as { version?: unknown; entriesByCollaborator?: unknown }
  if (candidate.version !== 2 || !candidate.entriesByCollaborator || typeof candidate.entriesByCollaborator !== 'object') {
    throw new Error('Versão ou coleção v2 inválida.')
  }

  let migratedCount = 0
  let skippedCount = 0
  const entriesByCollaborator = Object.fromEntries(
    Object.entries(candidate.entriesByCollaborator).map(([collaboratorId, entries]) => {
      if (!Array.isArray(entries)) return [collaboratorId, []]
      const migratedEntries = entries.flatMap((entry) => {
        if (!isV2TimeEntry(entry, collaboratorId)) {
          skippedCount += 1
          return []
        }
        migratedCount += 1
        return [migrateEntry(entry, collaboratorId)]
      })
      return [collaboratorId, migratedEntries]
    }),
  )

  return { data: { version: 3, entriesByCollaborator }, migratedCount, skippedCount }
}
