import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { InteractionStatus } from '@azure/msal-browser'
import { useIsAuthenticated, useMsal } from '@azure/msal-react'
import { resolveProtectedDemoRoute } from './routePolicy'
import type { DemoRole } from './types'
import { useSession } from './useSession'

const COLLABORATOR_ONLY: readonly DemoRole[] = ['COLLABORATOR']

type ProtectedRouteProps = {
  children: ReactNode
  allowedRoles?: readonly DemoRole[]
}

export function ProtectedRoute({ children, allowedRoles = COLLABORATOR_ONLY }: ProtectedRouteProps) {
  const { session, isLoading } = useSession()
  const { inProgress } = useMsal()
  const isMsalAuthenticated = useIsAuthenticated()
  const location = useLocation()

  if (isLoading || inProgress !== InteractionStatus.None) {
    return (
      <main className="flex min-h-screen items-center justify-center ui-surface-subtle" aria-busy="true">
        <p className="font-semibold ui-heading">Carregando ambiente corporativo…</p>
      </main>
    )
  }

  if (!session && !isMsalAuthenticated) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}${location.hash}` }} />
  }

  const redirect = resolveProtectedDemoRoute(session, allowedRoles, location)
  if (redirect) return <Navigate to={redirect.to} replace state={redirect.state} />
  return children
}
