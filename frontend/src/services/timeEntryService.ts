import { calculateDailySummary } from '../features/time-entries/domain'
import type { CreateTimeEntryData, DailySummary, TimeEntry, WorkSchedule } from '../shared/types/domain'
import { LEGACY_TIME_ENTRY_STORAGE_KEY, migrateLegacyTimeEntries, type TimeEntryStorageV2 } from './timeEntryMigration'

const STORAGE_KEY = 'sma:time-entries:v2'

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export interface TimeEntryService {
  listByDate(collaboratorId: string, date: string): Promise<TimeEntry[]>
  listByRange(collaboratorId: string, startDate: string, endDate: string): Promise<TimeEntry[]>
  create(collaboratorId: string, data: CreateTimeEntryData): Promise<TimeEntry>
  getDailySummary(collaboratorId: string, date: string, schedule: WorkSchedule): Promise<DailySummary>
}

type ServiceDependencies = {
  storage: StorageLike
  createId?: () => string
  now?: () => string
  onStorageError?: (message: string, error: unknown) => void
}

type ReadResult = {
  data: TimeEntryStorageV2
  canWrite: boolean
}

function isTimeEntry(value: unknown): value is TimeEntry {
  if (!value || typeof value !== 'object') return false
  const entry = value as Record<string, unknown>
  return typeof entry.id === 'string'
    && typeof entry.collaboratorId === 'string'
    && typeof entry.entryDate === 'string'
    && typeof entry.clientId === 'string'
    && typeof entry.projectCode === 'string'
    && Boolean(entry.projectCode)
    && entry.projectCode === entry.projectCode.trim()
    && entry.projectCode.length <= 80
    && typeof entry.activityId === 'string'
    && Number.isInteger(entry.durationMinutes)
    && typeof entry.details === 'string'
    && (entry.status === 'ACTIVE' || entry.status === 'CANCELLED')
    && Number.isInteger(entry.version)
    && typeof entry.createdAt === 'string'
    && typeof entry.updatedAt === 'string'
}

export class LocalStorageTimeEntryService implements TimeEntryService {
  private readonly storage: StorageLike
  private readonly createId: () => string
  private readonly now: () => string
  private readonly onStorageError: (message: string, error: unknown) => void

  constructor({ storage, createId, now, onStorageError }: ServiceDependencies) {
    this.storage = storage
    this.createId = createId ?? (() => crypto.randomUUID())
    this.now = now ?? (() => new Date().toISOString())
    this.onStorageError = onStorageError ?? ((message, error) => console.error(message, error))
  }

  private parseV2(raw: string): TimeEntryStorageV2 {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') throw new Error('Estrutura v2 inválida')
    const candidate = parsed as Partial<TimeEntryStorageV2>
    if (candidate.version !== 2 || !candidate.entriesByCollaborator || typeof candidate.entriesByCollaborator !== 'object') {
      throw new Error('Versão ou coleção v2 inválida')
    }
    const entriesByCollaborator = Object.fromEntries(
      Object.entries(candidate.entriesByCollaborator).map(([collaboratorId, entries]) => [
        collaboratorId,
        Array.isArray(entries)
          ? entries.filter((entry): entry is TimeEntry => isTimeEntry(entry) && entry.collaboratorId === collaboratorId)
          : [],
      ]),
    )
    return { version: 2, entriesByCollaborator }
  }

  private read(): ReadResult {
    const empty: TimeEntryStorageV2 = { version: 2, entriesByCollaborator: {} }
    try {
      const raw = this.storage.getItem(STORAGE_KEY)
      if (raw !== null) return { data: this.parseV2(raw), canWrite: true }

      const legacyRaw = this.storage.getItem(LEGACY_TIME_ENTRY_STORAGE_KEY)
      if (legacyRaw === null) return { data: empty, canWrite: true }
      const migration = migrateLegacyTimeEntries(legacyRaw)
      const serialized = JSON.stringify(migration.data)
      this.storage.setItem(STORAGE_KEY, serialized)
      const persistedRaw = this.storage.getItem(STORAGE_KEY)
      if (persistedRaw === null) throw new Error('A v2 não foi encontrada após a migração')
      const persisted = this.parseV2(persistedRaw)
      if (JSON.stringify(persisted) !== serialized) throw new Error('A v2 gravada diverge dos dados migrados')
      return { data: persisted, canWrite: true }
    } catch (error) {
      this.onStorageError('Não foi possível ler os apontamentos locais. Uma coleção vazia será utilizada.', error)
      return { data: empty, canWrite: false }
    }
  }

  private write(data: TimeEntryStorageV2) {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  async listByDate(collaboratorId: string, date: string) {
    return (this.read().data.entriesByCollaborator[collaboratorId] ?? [])
      .filter((entry) => entry.entryDate === date)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  async listByRange(collaboratorId: string, startDate: string, endDate: string) {
    return (this.read().data.entriesByCollaborator[collaboratorId] ?? [])
      .filter((entry) => entry.entryDate >= startDate && entry.entryDate <= endDate)
      .sort((a, b) => a.entryDate.localeCompare(b.entryDate) || a.createdAt.localeCompare(b.createdAt))
  }

  async create(collaboratorId: string, data: CreateTimeEntryData) {
    const readResult = this.read()
    if (!readResult.canWrite) throw new Error('Não foi possível preparar o armazenamento local para gravação.')
    const stored = readResult.data
    const timestamp = this.now()
    const entry: TimeEntry = {
      id: this.createId(),
      collaboratorId,
      ...data,
      projectCode: data.projectCode.trim(),
      details: data.details.trim(),
      status: 'ACTIVE',
      version: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    const currentEntries = stored.entriesByCollaborator[collaboratorId] ?? []
    stored.entriesByCollaborator[collaboratorId] = [...currentEntries, entry]
    this.write(stored)
    return entry
  }

  async getDailySummary(collaboratorId: string, date: string, schedule: WorkSchedule) {
    const entries = await this.listByDate(collaboratorId, date)
    return calculateDailySummary(date, schedule, entries, collaboratorId)
  }
}

const fallbackStorage: StorageLike = {
  getItem: () => null,
  setItem: () => undefined,
}

export const timeEntryService = new LocalStorageTimeEntryService({
  storage: typeof window === 'undefined' ? fallbackStorage : window.localStorage,
})
