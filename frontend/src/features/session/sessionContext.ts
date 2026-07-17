import { createContext } from 'react'
import type { CollaboratorProfile } from '../../shared/types/domain'

export type SessionContextValue = {
  profile: CollaboratorProfile | null
  isLoading: boolean
  signIn: () => void
  signOut: () => void
}

export const SessionContext = createContext<SessionContextValue | undefined>(undefined)
