import type { AuditEvent } from '../features/audit/types'
import type { CollaboratorProfile } from '../features/profile/types'
import type { AssignmentSnapshot } from '../features/squads/types'
import { demoCollaborator, demoSquads, demoSupervisors } from '../mocks/demoData'
import { auditService } from './auditService'
import { createBrowserStorage, type StorageLike } from './storage'

const PROFILE_STORAGE_KEY = 'sma:collaborator-profile:v1'

export interface ProfileService {
  getById(collaboratorId: string): Promise<CollaboratorProfile | null>
  changeActiveSquad(collaboratorId: string, squadId: string): Promise<CollaboratorProfile>
  resolveAssignment(collaboratorId: string): AssignmentSnapshot | null
}

type ProfileDependencies = {
  storage: StorageLike
  now?: () => string
  audit?: { record(event: AuditEvent): Promise<void> }
}

function isProfile(value: unknown): value is CollaboratorProfile {
  if (!value || typeof value !== 'object') return false
  const profile = value as Record<string, unknown>
  const location = profile.location as Record<string, unknown> | undefined
  return typeof profile.id === 'string' && typeof profile.name === 'string' && typeof profile.email === 'string'
    && typeof profile.jobTitle === 'string' && typeof profile.active === 'boolean' && typeof profile.activeSquadId === 'string'
    && Boolean(location) && location?.countryCode === 'BR' && typeof location.stateCode === 'string'
    && typeof location.city === 'string' && typeof location.timeZone === 'string'
}

export class LocalProfileService implements ProfileService {
  private readonly storage: StorageLike
  private readonly now: () => string
  private readonly audit?: { record(event: AuditEvent): Promise<void> }

  constructor({ storage, now, audit }: ProfileDependencies) {
    this.storage = storage
    this.now = now ?? (() => new Date().toISOString())
    this.audit = audit
  }

  private read() {
    try {
      const raw = this.storage.getItem(PROFILE_STORAGE_KEY)
      if (!raw) return demoCollaborator
      const parsed = JSON.parse(raw) as unknown
      return isProfile(parsed) ? parsed : demoCollaborator
    } catch (error) {
      console.error('Não foi possível ler o perfil local.', error)
      return demoCollaborator
    }
  }

  async getById(collaboratorId: string) {
    const profile = this.read()
    return profile.id === collaboratorId ? profile : null
  }

  resolveAssignment(collaboratorId: string) {
    const profile = this.read()
    if (profile.id !== collaboratorId || !profile.active) return null
    const squad = demoSquads.find((item) => item.id === profile.activeSquadId && item.active)
    const supervisor = squad ? demoSupervisors.find((item) => item.id === squad.supervisorId && item.active) : null
    if (!squad || !supervisor) return null
    return { squadId: squad.id, squadName: squad.name, supervisorId: supervisor.id, supervisorName: supervisor.name }
  }

  async changeActiveSquad(collaboratorId: string, squadId: string) {
    const current = this.read()
    if (current.id !== collaboratorId) throw new Error('Perfil profissional não encontrado.')
    const squad = demoSquads.find((item) => item.id === squadId && item.active)
    const supervisor = squad ? demoSupervisors.find((item) => item.id === squad.supervisorId && item.active) : null
    if (!squad || !supervisor) throw new Error('A squad selecionada não está disponível.')
    if (current.activeSquadId === squadId) return current
    const updated = { ...current, activeSquadId: squadId }
    this.storage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated))
    await this.audit?.record({
      id: crypto.randomUUID(), type: 'SQUAD_CHANGED', occurredAt: this.now(), actorId: collaboratorId, actorRole: 'COLLABORATOR',
      entityType: 'CollaboratorProfile', entityId: collaboratorId, previousValue: current.activeSquadId, newValue: squadId,
      metadata: { supervisorId: supervisor.id },
    })
    return updated
  }
}

export const profileService = new LocalProfileService({ storage: createBrowserStorage(), audit: auditService })
