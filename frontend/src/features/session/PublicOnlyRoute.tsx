import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useSession } from './useSession'

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { profile, isLoading } = useSession()
  if (isLoading) return null
  if (profile) return <Navigate to="/colaborador" replace />
  return children
}
