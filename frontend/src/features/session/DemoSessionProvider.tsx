import { useEffect, useState, type ReactNode } from 'react'
import { demoSessionService } from '../../services/demoSessionService'
import type { CollaboratorProfile } from '../../shared/types/domain'
import { SessionContext } from './sessionContext'

export function DemoSessionProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<CollaboratorProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setProfile(demoSessionService.restore())
    setIsLoading(false)
  }, [])

  const signIn = () => setProfile(demoSessionService.signIn())
  const signOut = () => {
    demoSessionService.signOut()
    setProfile(null)
  }

  return <SessionContext.Provider value={{ profile, isLoading, signIn, signOut }}>{children}</SessionContext.Provider>
}
