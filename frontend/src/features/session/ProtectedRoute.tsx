import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSession } from './useSession'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { profile, isLoading } = useSession()
  const location = useLocation()

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950" aria-busy="true">
        <p className="font-semibold text-sma-navy dark:text-white">Carregando ambiente de demonstração…</p>
      </main>
    )
  }

  if (!profile) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}
