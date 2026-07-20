import {
  approveDay as approveDayTransition,
  canMutateDay,
  completeCorrection,
  deriveDayApprovalStatus,
  reopenCompetency as reopenCompetencyTransition,
  reopenDay as reopenDayTransition,
  requestCorrection as requestCorrectionTransition,
} from '../features/approvals/domain'
import type { CompetencyState, DayApproval } from '../features/approvals/types'
import type { AuditEvent } from '../features/audit/types'
import { getCorporateToday, getMonthKey } from '../shared/utils/date'
import { createBrowserStorage, type StorageLike } from './storage'
import { auditService } from './auditService'

const APPROVAL_STORAGE_KEY = 'sma:day-approvals:v1'
const COMPETENCY_STORAGE_KEY = 'sma:competencies:v1'

export class LocalDayApprovalService {
  private readonly storage: StorageLike
  private readonly today: () => string
  private readonly now: () => string
  private readonly audit?: { record(event: AuditEvent): Promise<void> }

  constructor(storage: StorageLike, today: () => string = getCorporateToday, audit?: { record(event: AuditEvent): Promise<void> }, now: () => string = () => new Date().toISOString()) {
    this.storage = storage
    this.today = today
    this.audit = audit
    this.now = now
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
      updatedAt: this.now(),
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

  private getStoredApproval(collaboratorId: string, date: string) {
    const stored = this.readRecord<DayApproval>(APPROVAL_STORAGE_KEY)[this.approvalKey(collaboratorId, date)]
    if (!stored) throw new Error('O conjunto diário não foi encontrado.')
    return stored
  }

  private assertResponsibleSupervisor(approval: DayApproval, supervisorId: string) {
    if (approval.assignmentSnapshot && approval.assignmentSnapshot.supervisorId !== supervisorId) {
      throw new Error('Somente o supervisor associado ao conjunto diário pode executar esta operação.')
    }
  }

  private async recordSupervisorAction(type: AuditEvent['type'], supervisorId: string, previous: DayApproval, next: DayApproval, justification?: string) {
    await this.audit?.record({
      id: crypto.randomUUID(), type, occurredAt: next.updatedAt, actorId: supervisorId, actorRole: 'SUPERVISOR',
      entityType: 'DayApproval', entityId: next.id, previousValue: previous, newValue: next, justification,
    })
  }

  async approveDay(command: { supervisorId: string; collaboratorId: string; date: string; balanceMinutes: number; justification: string }) {
    const current = this.getStoredApproval(command.collaboratorId, command.date)
    this.assertResponsibleSupervisor(current, command.supervisorId)
    const timestamp = this.now()
    const approved = {
      ...approveDayTransition(current, { today: this.today(), balanceMinutes: command.balanceMinutes, justification: command.justification }),
      approvedAt: timestamp,
      updatedAt: timestamp,
    }
    await this.save(approved)
    await this.recordSupervisorAction(command.balanceMinutes < 0 ? 'DAY_APPROVED_WITH_DEFICIT' : 'DAY_APPROVED', command.supervisorId, current, approved, approved.deficitJustification)
    return approved
  }

  async requestCorrection(supervisorId: string, collaboratorId: string, date: string, reason: string) {
    const current = this.getStoredApproval(collaboratorId, date)
    this.assertResponsibleSupervisor(current, supervisorId)
    const requested = { ...requestCorrectionTransition(current, reason), updatedAt: this.now() }
    await this.save(requested)
    await this.recordSupervisorAction('CORRECTION_REQUESTED', supervisorId, current, requested, requested.correctionReason)
    return requested
  }

  async closeCompetency(monthKey: string) {
    if (!/^\d{4}-\d{2}$/.test(monthKey)) throw new Error('Competência inválida.')
    const competencies = this.readRecord<CompetencyState>(COMPETENCY_STORAGE_KEY)
    competencies[monthKey] = { ...this.getCompetency(monthKey), status: 'CLOSED' }
    this.storage.setItem(COMPETENCY_STORAGE_KEY, JSON.stringify(competencies))
    return competencies[monthKey]
  }

  async reopenDay(supervisorId: string, collaboratorId: string, date: string, justification: string) {
    const current = this.readRecord<DayApproval>(APPROVAL_STORAGE_KEY)[this.approvalKey(collaboratorId, date)]
      ?? await this.getForDate(collaboratorId, date, false)
    this.assertResponsibleSupervisor(current, supervisorId)
    const reopened = { ...reopenDayTransition(current, justification), updatedAt: this.now() }
    await this.save(reopened)
    await this.recordSupervisorAction('DAY_REOPENED', supervisorId, current, reopened, reopened.reopenJustification)
    return reopened
  }

  async reopenCompetency(supervisorId: string, monthKey: string, justification: string) {
    const current = this.getCompetency(monthKey)
    const reopened = {
      ...reopenCompetencyTransition(current, justification),
      reopenedBy: supervisorId,
      reopenedAt: this.now(),
    }
    const competencies = this.readRecord<CompetencyState>(COMPETENCY_STORAGE_KEY)
    competencies[monthKey] = reopened
    this.storage.setItem(COMPETENCY_STORAGE_KEY, JSON.stringify(competencies))
    await this.audit?.record({
      id: crypto.randomUUID(), type: 'COMPETENCY_REOPENED', occurredAt: reopened.reopenedAt,
      actorId: supervisorId, actorRole: 'SUPERVISOR', entityType: 'CompetencyState', entityId: monthKey,
      previousValue: current, newValue: reopened, justification: reopened.reopenJustification,
    })
    return reopened
  }

  async completeCorrection(collaboratorId: string, date: string) {
    const stored = this.readRecord<DayApproval>(APPROVAL_STORAGE_KEY)[this.approvalKey(collaboratorId, date)]
    if (!stored) throw new Error('Não existe solicitação de correção para esta data.')
    const timestamp = this.now()
    const completed = { ...completeCorrection(stored), correctionCompletedAt: timestamp, updatedAt: timestamp }
    await this.save(completed)
    await this.audit?.record({
      id: crypto.randomUUID(),
      type: 'CORRECTION_COMPLETED',
      occurredAt: completed.updatedAt,
      actorId: collaboratorId,
      actorRole: 'COLLABORATOR',
      entityType: 'DayApproval',
      entityId: completed.id,
      previousValue: stored,
      newValue: completed,
    })
    return completed
  }

  async listByRange(collaboratorId: string, startDate: string, endDate: string) {
    return Object.values(this.readRecord<DayApproval>(APPROVAL_STORAGE_KEY))
      .filter((approval) => approval.collaboratorId === collaboratorId && approval.entryDate >= startDate && approval.entryDate <= endDate)
  }
}

export const dayApprovalService = new LocalDayApprovalService(createBrowserStorage(), getCorporateToday, auditService)
