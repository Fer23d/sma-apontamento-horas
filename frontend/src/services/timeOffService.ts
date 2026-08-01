import type { AuditEvent, SupervisorNotification } from '../features/audit/types'
import type { AssignmentSnapshot } from '../features/squads/types'
import type { TimeOffRequest } from '../features/time-off/types'
import { getCorporateToday, isIsoDate } from '../shared/utils/date'
import { auditService } from './auditService'
import { notificationService } from './notificationService'
import { profileService } from './profileService'
import { createBrowserStorage, type StorageLike } from './storage'
import { defaultPostCommitErrorHandler, runPostCommitEffect, type PostCommitErrorHandler } from './postCommit'

export const TIME_OFF_STORAGE_KEY = 'sma:time-off-requests:v1'

export type TimeOffStorage = {
  version: 1
  requests: TimeOffRequest[]
}

type TimeOffDependencies = {
  storage: StorageLike
  createId?: () => string
  now?: () => string
  today?: () => string
  resolveAssignment?: (collaboratorId: string) => AssignmentSnapshot | null
  audit?: { record(event: AuditEvent): Promise<void> }
  notifications?: { record(notification: SupervisorNotification): Promise<void> }
  onPostCommitError?: PostCommitErrorHandler
}

function isAssignmentSnapshot(value: unknown): value is AssignmentSnapshot {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return typeof item.squadId === 'string' && typeof item.squadName === 'string'
    && typeof item.supervisorId === 'string' && typeof item.supervisorName === 'string'
}

function isTimeOffRequest(value: unknown): value is TimeOffRequest {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return typeof item.id === 'string'
    && typeof item.collaboratorId === 'string'
    && isIsoDate(String(item.date))
    && typeof item.reason === 'string'
    && ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].includes(String(item.status))
    && (item.assignmentSnapshot === null || isAssignmentSnapshot(item.assignmentSnapshot))
    && typeof item.createdAt === 'string'
    && typeof item.updatedAt === 'string'
}

export class LocalTimeOffService {
  private readonly storage: StorageLike
  private readonly createId: () => string
  private readonly now: () => string
  private readonly today: () => string
  private readonly resolveAssignment: (collaboratorId: string) => AssignmentSnapshot | null
  private readonly audit?: { record(event: AuditEvent): Promise<void> }
  private readonly notifications?: { record(notification: SupervisorNotification): Promise<void> }
  private readonly onPostCommitError: PostCommitErrorHandler

  constructor({ storage, createId, now, today, resolveAssignment, audit, notifications, onPostCommitError }: TimeOffDependencies) {
    this.storage = storage
    this.createId = createId ?? (() => crypto.randomUUID())
    this.now = now ?? (() => new Date().toISOString())
    this.today = today ?? getCorporateToday
    this.resolveAssignment = resolveAssignment ?? (() => null)
    this.audit = audit
    this.notifications = notifications
    this.onPostCommitError = onPostCommitError ?? defaultPostCommitErrorHandler
  }

  private read(): TimeOffStorage {
    try {
      const raw = this.storage.getItem(TIME_OFF_STORAGE_KEY)
      if (!raw) return { version: 1, requests: [] }
      const parsed = JSON.parse(raw) as unknown
      if (!parsed || typeof parsed !== 'object') throw new Error('Estrutura de folgas inválida.')
      const candidate = parsed as Partial<TimeOffStorage>
      if (candidate.version !== 1 || !Array.isArray(candidate.requests)) throw new Error('Versão de folgas inválida.')
      return { version: 1, requests: candidate.requests.filter(isTimeOffRequest) }
    } catch (error) {
      console.error('Não foi possível ler as solicitações de folga.', error)
      return { version: 1, requests: [] }
    }
  }

  private write(data: TimeOffStorage) {
    const serialized = JSON.stringify(data)
    this.storage.setItem(TIME_OFF_STORAGE_KEY, serialized)
    if (this.storage.getItem(TIME_OFF_STORAGE_KEY) !== serialized) throw new Error('Não foi possível confirmar a gravação da folga.')
  }

  private async recordAudit(type: AuditEvent['type'], collaboratorId: string, request: TimeOffRequest, previousValue?: TimeOffRequest) {
    if (!this.audit) return
    await runPostCommitEffect('Não foi possível registrar a auditoria da folga confirmada.', () => this.audit!.record({
      id: crypto.randomUUID(), type, occurredAt: this.now(), actorId: collaboratorId, actorRole: 'COLLABORATOR',
      entityType: 'TimeOffRequest', entityId: request.id, previousValue, newValue: request,
      justification: request.cancellationReason ?? request.reason,
    }), this.onPostCommitError)
  }

  private async notify(type: SupervisorNotification['type'], request: TimeOffRequest) {
    const supervisorId = request.assignmentSnapshot?.supervisorId
    if (!supervisorId) return
    if (!this.notifications) return
    await runPostCommitEffect('Não foi possível registrar a notificação da folga confirmada.', () => this.notifications!.record({
      id: crypto.randomUUID(), supervisorId, type, relatedEntityId: request.id, createdAt: this.now(),
    }), this.onPostCommitError)
  }

  async listByRange(collaboratorId: string, startDate: string, endDate: string) {
    return this.read().requests
      .filter((request) => request.collaboratorId === collaboratorId && request.date >= startDate && request.date <= endDate)
      .sort((left, right) => left.date.localeCompare(right.date))
  }

  async listApprovedByRange(collaboratorId: string, startDate: string, endDate: string) {
    return (await this.listByRange(collaboratorId, startDate, endDate)).filter((request) => request.status === 'APPROVED')
  }

  async create(collaboratorId: string, input: { date: string; reason: string }) {
    const reason = input.reason.trim()
    if (!isIsoDate(input.date) || input.date <= this.today()) throw new Error('A folga deve ser solicitada para uma data futura.')
    if (!reason) throw new Error('Informe a justificativa da solicitação de folga.')
    const assignmentSnapshot = this.resolveAssignment(collaboratorId)
    if (!assignmentSnapshot) throw new Error('Não existe squad ativa para encaminhar a solicitação.')
    const storage = this.read()
    const timestamp = this.now()
    const request: TimeOffRequest = {
      id: this.createId(), collaboratorId, date: input.date, reason, status: 'PENDING', assignmentSnapshot,
      createdAt: timestamp, updatedAt: timestamp,
    }
    storage.requests.push(request)
    this.write(storage)
    await this.recordAudit('TIME_OFF_REQUESTED', collaboratorId, request)
    await this.notify('TIME_OFF_REQUESTED', request)
    return request
  }

  async approve(supervisorId: string, id: string) {
    const storage = this.read()
    const index = storage.requests.findIndex((request) => request.id === id)
    if (index < 0) throw new Error('Solicitação de folga não encontrada.')
    const current = storage.requests[index]
    if (current.status !== 'PENDING') throw new Error('A solicitação de folga não está pendente.')
    if (!current.assignmentSnapshot || current.assignmentSnapshot.supervisorId !== supervisorId) {
      throw new Error('Somente o supervisor associado à solicitação pode aprovar a folga.')
    }
    const timestamp = this.now()
    const approved: TimeOffRequest = { ...current, status: 'APPROVED', decidedAt: timestamp, updatedAt: timestamp }
    storage.requests[index] = approved
    this.write(storage)
    if (this.audit) await runPostCommitEffect('Não foi possível registrar a auditoria da folga confirmada.', () => this.audit!.record({
      id: crypto.randomUUID(), type: 'TIME_OFF_APPROVED', occurredAt: timestamp, actorId: supervisorId, actorRole: 'SUPERVISOR',
      entityType: 'TimeOffRequest', entityId: approved.id, previousValue: current, newValue: approved,
    }), this.onPostCommitError)
    return approved
  }

  async reject(supervisorId: string, id: string, reason: string) {
    const rejectionReason = reason.trim()
    if (!rejectionReason) throw new Error('Informe o motivo da rejeição da folga.')
    const storage = this.read()
    const index = storage.requests.findIndex((request) => request.id === id)
    if (index < 0) throw new Error('Solicitação de folga não encontrada.')
    const current = storage.requests[index]
    if (current.status !== 'PENDING') throw new Error('A solicitação de folga não está pendente.')
    if (!current.assignmentSnapshot || current.assignmentSnapshot.supervisorId !== supervisorId) {
      throw new Error('Somente o supervisor associado à solicitação pode rejeitar a folga.')
    }
    const timestamp = this.now()
    const rejected: TimeOffRequest = { ...current, status: 'REJECTED', rejectionReason, decidedAt: timestamp, updatedAt: timestamp }
    storage.requests[index] = rejected
    this.write(storage)
    if (this.audit) await runPostCommitEffect('Não foi possível registrar a auditoria da folga confirmada.', () => this.audit!.record({
      id: crypto.randomUUID(), type: 'TIME_OFF_REJECTED', occurredAt: timestamp, actorId: supervisorId, actorRole: 'SUPERVISOR',
      entityType: 'TimeOffRequest', entityId: rejected.id, previousValue: current, newValue: rejected, justification: rejectionReason,
    }), this.onPostCommitError)
    return rejected
  }

  async removePending(collaboratorId: string, id: string) {
    const storage = this.read()
    const index = storage.requests.findIndex((request) => request.id === id && request.collaboratorId === collaboratorId)
    if (index < 0) throw new Error('Solicitação de folga não encontrada.')
    const current = storage.requests[index]
    if (current.status !== 'PENDING') throw new Error('Somente uma solicitação pendente pode ser excluída diretamente.')
    if (current.date <= this.today()) throw new Error('A data da solicitação já ocorreu.')
    const cancelled: TimeOffRequest = { ...current, status: 'CANCELLED', cancellationReason: 'Solicitação retirada pelo colaborador', cancelledAt: this.now(), updatedAt: this.now() }
    storage.requests[index] = cancelled
    this.write(storage)
    await this.recordAudit('TIME_OFF_CANCELLED', collaboratorId, cancelled, current)
    return cancelled
  }

  async cancelApproved(collaboratorId: string, id: string, reason: string) {
    const cancellationReason = reason.trim()
    if (!cancellationReason) throw new Error('Informe o motivo do cancelamento da folga.')
    const storage = this.read()
    const index = storage.requests.findIndex((request) => request.id === id && request.collaboratorId === collaboratorId)
    if (index < 0) throw new Error('Folga não encontrada.')
    const current = storage.requests[index]
    if (current.status !== 'APPROVED') throw new Error('Somente uma folga aprovada pode ser cancelada por esta ação.')
    if (current.date <= this.today()) throw new Error('A data da folga já ocorreu e não permite cancelamento direto.')
    const cancelled: TimeOffRequest = { ...current, status: 'CANCELLED', cancellationReason, cancelledAt: this.now(), updatedAt: this.now() }
    storage.requests[index] = cancelled
    this.write(storage)
    await this.recordAudit('TIME_OFF_CANCELLED', collaboratorId, cancelled, current)
    await this.notify('TIME_OFF_CANCELLED', cancelled)
    return cancelled
  }
}

export const timeOffService = new LocalTimeOffService({
  storage: createBrowserStorage(),
  resolveAssignment: (collaboratorId) => profileService.resolveAssignment(collaboratorId),
  audit: auditService,
  notifications: notificationService,
})
