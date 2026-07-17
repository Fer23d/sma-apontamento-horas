import { useEffect, useState } from 'react'
import { profileService } from '../../services/profileService'
import type { CollaboratorProfile } from '../../shared/types/domain'
import { useSession } from '../session/useSession'

export function useProfile() {
  const { profile: sessionProfile } = useSession()
  const [profile, setProfile] = useState<CollaboratorProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionProfile) return
    setIsLoading(true)
    profileService.getById(sessionProfile.id)
      .then((result) => {
        setProfile(result)
        setError(result ? null : 'Perfil profissional não encontrado.')
      })
      .catch((loadError: unknown) => {
        console.error('Falha ao carregar perfil.', loadError)
        setError('Não foi possível carregar o perfil profissional.')
      })
      .finally(() => setIsLoading(false))
  }, [sessionProfile])

  return { profile, isLoading, error }
}
