import { Navigate } from 'react-router-dom'
import { useSession } from './useSession'

export function ManagerNoticesRedirect() {
  const { session } = useSession()

  if (session?.role === 'SUPERVISOR') return <Navigate to="/supervisor?view=avisos" replace />
  if (session?.role === 'DIRECTOR_ADMIN') return <Navigate to="/administracao?view=avisos" replace />

  return <Navigate to="/login" replace />
}
