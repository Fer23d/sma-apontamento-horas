import { canMutateDay, deriveDayApprovalStatus } from '../features/approvals/domain'
import type { CompetencyState, DayApproval } from '../features/approvals/types'
import { getCorporateToday, getMonthKey } from '../shared/utils/date'
import { createBrowserStorage, type StorageLike } from './storage'

const APPROVAL_STORAGE_KEY = 'sma:day-approvals:v1'
const COMPETENCY_STORAGE_KEY = 'sma:competencies:v1'

export class LocalDayApprovalService {
  private readonly storage: StorageLike
  private readonly today: () => string

  constructor(storage: StorageLike, today: () => string = getCorporateToday) {
    this.storage = storage
    this.today = today
  }

  private readRecord<T>(key: string): Record<string, T> {
    try {
      const raw = this.storage.getItem(key)
      if (!raw) return {}
      const parsed = JSON.parse(raw) as unknown
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, T> : {}
    } catch (error) {
      console.error('Não foi possível ler o estado diário local.', error)
      return {}
    }
  }

  private approvalKey(collaboratorId: string, date: string) {
    return `${collaboratorId}:${date}`
  }

  getCompetency(monthKey: string) {
    const stored = this.readRecord<CompetencyState>(COMPETENCY_STORAGE_KEY)[monthKey]
    if (stored) return stored
    return {
      monthKey,
      status: monthKey === getMonthKey(this.today()) ? 'OPEN' : 'CLOSED',
      reopenedDates: [],
    } satisfies CompetencyState
  }

  async getForDate(collaboratorId: string, date: string, hasEntries: boolean, assignmentSnapshot: DayApproval['assignmentSnapshot'] = null) {
    const stored = this.readRecord<DayApproval>(APPROVAL_STORAGE_KEY)[this.approvalKey(collaboratorId, date)]
    if (stored) return stored
    const competency = this.getCompetency(getMonthKey(date))
    return {
      id: `day:${collaboratorId}:${date}`,
      collaboratorId,
      entryDate: date,
      assignmentSnapshot,
      status: deriveDayApprovalStatus({
        date,
        today: this.today(),
        competencyClosed: competency.status === 'CLOSED',
        hasEntries,
      }),
      version: 1,
      updatedAt: new Date().toISOString(),
    } satisfies DayApproval
  }

  async canMutate(collaboratorId: string, date: string) {
    const today = this.today()
    if (date > today) return false
    const competency = this.getCompetency(getMonthKey(date))
    const stored = this.readRecord<DayApproval>(APPROVAL_STORAGE_KEY)[this.approvalKey(collaboratorId, date)] ?? null
    return canMutateDay(stored, competency)
  }

  async save(approval: DayApproval) {
    const current = this.readRecord<DayApproval>(APPROVAL_STORAGE_KEY)
    current[this.approvalKey(approval.collaboratorId, approval.entryDate)] = approval
    this.storage.setItem(APPROVAL_STORAGE_KEY, JSON.stringify(current))
  }

  async listByRange(collaboratorId: string, startDate: string, endDate: string) {
    return Object.values(this.readRecord<DayApproval>(APPROVAL_STORAGE_KEY))
      .filter((approval) => approval.collaboratorId === collaboratorId && approval.entryDate >= startDate && approval.entryDate <= endDate)
  }
}

export const dayApprovalService = new LocalDayApprovalService(createBrowserStorage())
