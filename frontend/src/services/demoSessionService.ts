import { demoCollaborator } from '../mocks/demoData'
import type { CollaboratorProfile } from '../shared/types/domain'

const SESSION_KEY = 'sma:demo-session:v1'

type StoredSession = {
  active: true
  collaboratorId: string
}

export interface DemoSessionService {
  restore(): CollaboratorProfile | null
  signIn(): CollaboratorProfile
  signOut(): void
}

export class LocalDemoSessionService implements DemoSessionService {
  restore() {
    try {
      const raw = window.localStorage.getItem(SESSION_KEY)
      if (!raw) return null
      const stored = JSON.parse(raw) as Partial<StoredSession>
      return stored.active === true && stored.collaboratorId === demoCollaborator.id ? demoCollaborator : null
    } catch (error) {
      console.error('Não foi possível restaurar a sessão demonstrativa.', error)
      return null
    }
  }

  signIn() {
    const session: StoredSession = { active: true, collaboratorId: demoCollaborator.id }
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    return demoCollaborator
  }

  signOut() {
    window.localStorage.removeItem(SESSION_KEY)
  }
}

export const demoSessionService = new LocalDemoSessionService()
