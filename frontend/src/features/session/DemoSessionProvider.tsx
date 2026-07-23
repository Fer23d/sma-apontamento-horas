import { useEffect, useState, type ReactNode } from 'react'
import { demoSessionService } from '../../services/demoSessionService'
import { demoCollaborator } from '../../mocks/demoData'
import { SessionContext } from './sessionContext'
import type { DemoRole, DemoSession } from './types'

export function DemoSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<DemoSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setSession(demoSessionService.restore())
    setIsLoading(false)
  }, [])

  const signIn = (role: DemoRole) => {
    const created = demoSessionService.signIn(role)
    setSession(created)
    return created
  }
  const signOut = () => {
    demoSessionService.signOut()
    setSession(null)
  }
  const profile = session?.role === 'COLLABORATOR' ? demoCollaborator : null

  return <SessionContext.Provider value={{ session, profile, isLoading, signIn, signOut }}>{children}</SessionContext.Provider>
}
