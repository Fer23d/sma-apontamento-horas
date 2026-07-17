import type { TimeEntry } from '../shared/types/domain'

export const LEGACY_TIME_ENTRY_STORAGE_KEY = 'sma:time-entries:v1'

const legacyProjectCodeById: Readonly<Record<string, string>> = {
  'project-alpha-automation': 'ALF-001',
  'project-alpha-electrical': 'ALF-002',
  'project-beta-expansion': 'BET-101',
}

type LegacyTimeEntry = Omit<TimeEntry, 'projectCode'> & { projectId: string }

export type TimeEntryStorageV2 = {
  version: 2
  entriesByCollaborator: Record<string, TimeEntry[]>
}

export type MigrationResult = {
  data: TimeEntryStorageV2
  migratedCount: number
}

function isLegacyTimeEntry(value: unknown, collaboratorId: string): value is LegacyTimeEntry {
  if (!value || typeof value !== 'object') return false
  const entry = value as Record<string, unknown>
  return typeof entry.id === 'string'
    && entry.collaboratorId === collaboratorId
    && typeof entry.entryDate === 'string'
    && typeof entry.clientId === 'string'
    && typeof entry.projectId === 'string'
    && Boolean(entry.projectId.trim())
    && entry.projectId.trim().length <= 80
    && typeof entry.activityId === 'string'
    && Number.isInteger(entry.durationMinutes)
    && typeof entry.details === 'string'
    && (entry.status === 'ACTIVE' || entry.status === 'CANCELLED')
    && Number.isInteger(entry.version)
    && typeof entry.createdAt === 'string'
    && typeof entry.updatedAt === 'string'
}

function migrateEntry(entry: LegacyTimeEntry): TimeEntry {
  const { projectId, ...unchanged } = entry
  const trimmedProjectId = projectId.trim()
  return {
    ...unchanged,
    projectCode: legacyProjectCodeById[trimmedProjectId] ?? trimmedProjectId,
  }
}

export function migrateLegacyTimeEntries(raw: string): MigrationResult {
  const parsed = JSON.parse(raw) as unknown
  if (!parsed || typeof parsed !== 'object') throw new Error('Estrutura v1 inválida')
  const candidate = parsed as { version?: unknown; entriesByCollaborator?: unknown }
  if (candidate.version !== 1 || !candidate.entriesByCollaborator || typeof candidate.entriesByCollaborator !== 'object') {
    throw new Error('Versão ou coleção v1 inválida')
  }

  let migratedCount = 0
  const entriesByCollaborator = Object.fromEntries(
    Object.entries(candidate.entriesByCollaborator).map(([collaboratorId, entries]) => {
      const migratedEntries = Array.isArray(entries)
        ? entries.filter((entry): entry is LegacyTimeEntry => isLegacyTimeEntry(entry, collaboratorId)).map((entry) => {
            migratedCount += 1
            return migrateEntry(entry)
          })
        : []
      return [collaboratorId, migratedEntries]
    }),
  )

  return { data: { version: 2, entriesByCollaborator }, migratedCount }
}
