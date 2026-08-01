import { demoCollaborator } from '../mocks/demoData'
import { createBrowserStorage, type StorageLike } from './storage'
import type { SupervisorDashboardSummary, SupervisorPendingEntry } from '../features/supervisor/types'

export const SUPERVISOR_APPROVAL_STORAGE_KEY = 'sma:supervisor-approvals:v1'

type StoredApproval = {
  status: SupervisorPendingEntry['status']
  rejectionReason?: string
  decidedAt?: string
  decidedBy?: string
}

type SupervisorApprovalStorage = {
  version: 1
  approvalsByEntryId: Record<string, StoredApproval>
}

export interface SupervisorService {
  listEntries(): Promise<SupervisorPendingEntry[]>
  approve(entryId: string, supervisorId: string): Promise<SupervisorPendingEntry>
  reject(entryId: string, supervisorId: string, reason: string): Promise<SupervisorPendingEntry>
  getSummary(): Promise<SupervisorDashboardSummary>
}

const MOCK_TEAM_ENTRIES: readonly Omit<SupervisorPendingEntry, 'status'>[] = [
  {
    id: 'supervisor-demo-entry-001',
    collaboratorId: demoCollaborator.id,
    collaboratorName: demoCollaborator.name,
    entryDate: '2026-07-27',
    projectCode: 'SM&A-ENG-142',
    durationMinutes: 480,
    activityName: 'Elaboração de projeto',
  },
  {
    id: 'supervisor-demo-entry-002',
    collaboratorId: 'demo-collaborator-002',
    collaboratorName: 'Marina Costa',
    entryDate: '2026-07-28',
    projectCode: 'SM&A-AUT-087',
    durationMinutes: 360,
    activityName: 'Modelo 3D',
  },
  {
    id: 'supervisor-demo-entry-003',
    collaboratorId: 'demo-collaborator-003',
    collaboratorName: 'Rafael Almeida',
    entryDate: '2026-07-29',
    projectCode: 'SM&A-ELE-211',
    durationMinutes: 420,
    activityName: 'Verificação de documento',
  },
]

function emptyStorage(): SupervisorApprovalStorage {
  return { version: 1, approvalsByEntryId: {} }
}

function normalizeStorage(value: unknown): SupervisorApprovalStorage {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return emptyStorage()
  const candidate = value as Partial<SupervisorApprovalStorage>
  if (candidate.version !== 1 || !candidate.approvalsByEntryId || typeof candidate.approvalsByEntryId !== 'object') return emptyStorage()
  return {
    version: 1,
    approvalsByEntryId: Object.fromEntries(
      Object.entries(candidate.approvalsByEntryId).flatMap(([entryId, approval]) => {
        if (!approval || typeof approval !== 'object' || Array.isArray(approval)) return []
        const normalized = approval as Partial<StoredApproval>
        if (!normalized.status || !['PENDING', 'APPROVED', 'REJECTED'].includes(normalized.status)) return []
        return [[entryId, normalized as StoredApproval]]
      }),
    ),
  }
}

export class LocalStorageSupervisorService implements SupervisorService {
  private readonly storage: StorageLike
  private readonly now: () => string
  private readonly seedEntries: readonly Omit<SupervisorPendingEntry, 'status'>[]

  constructor(
    storage: StorageLike,
    now = () => new Date().toISOString(),
    seedEntries: readonly Omit<SupervisorPendingEntry, 'status'>[] = MOCK_TEAM_ENTRIES,
  ) {
    this.storage = storage
    this.now = now
    this.seedEntries = seedEntries
  }

  private read(): SupervisorApprovalStorage {
    try {
      const raw = this.storage.getItem(SUPERVISOR_APPROVAL_STORAGE_KEY)
      if (!raw) return emptyStorage()
      return normalizeStorage(JSON.parse(raw))
    } catch {
      return emptyStorage()
    }
  }

  private write(data: SupervisorApprovalStorage) {
    this.storage.setItem(SUPERVISOR_APPROVAL_STORAGE_KEY, JSON.stringify(data))
  }

  private async update(entryId: string, approval: StoredApproval) {
    const entries = await this.listEntries()
    const current = entries.find((entry) => entry.id === entryId)
    if (!current) throw new Error('Apontamento não encontrado.')
    const data = this.read()
    data.approvalsByEntryId[entryId] = approval
    this.write(data)
    return { ...current, ...approval }
  }

  async listEntries() {
    const stored = this.read().approvalsByEntryId
    return this.seedEntries
      .map((entry) => ({
        ...entry,
        status: stored[entry.id]?.status ?? 'PENDING',
        rejectionReason: stored[entry.id]?.rejectionReason,
        decidedAt: stored[entry.id]?.decidedAt,
        decidedBy: stored[entry.id]?.decidedBy,
      }))
      .sort((left, right) => left.entryDate.localeCompare(right.entryDate) || left.collaboratorName.localeCompare(right.collaboratorName))
  }

  approve(entryId: string, supervisorId: string) {
    return this.update(entryId, {
      status: 'APPROVED',
      decidedAt: this.now(),
      decidedBy: supervisorId,
    })
  }

  reject(entryId: string, supervisorId: string, reason: string) {
    const rejectionReason = reason.trim()
    if (!rejectionReason) throw new Error('Informe o motivo da rejeição.')
    return this.update(entryId, {
      status: 'REJECTED',
      rejectionReason,
      decidedAt: this.now(),
      decidedBy: supervisorId,
    })
  }

  async getSummary() {
    const entries = await this.listEntries()
    return entries.reduce<SupervisorDashboardSummary>(
      (summary, entry) => ({
        pending: summary.pending + (entry.status === 'PENDING' ? 1 : 0),
        approved: summary.approved + (entry.status === 'APPROVED' ? 1 : 0),
        rejected: summary.rejected + (entry.status === 'REJECTED' ? 1 : 0),
      }),
      { pending: 0, approved: 0, rejected: 0 },
    )
  }
}

export const supervisorService = new LocalStorageSupervisorService(createBrowserStorage())
