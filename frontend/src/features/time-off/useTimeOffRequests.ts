import { useCallback, useEffect, useState } from 'react'
import { timeOffService } from '../../services/timeOffService'
import { addDays, getCorporateToday } from '../../shared/utils/date'
import { useSession } from '../session/useSession'
import type { TimeOffRequest } from './types'

export function useTimeOffRequests() {
  const { profile } = useSession()
  const today = getCorporateToday()
  const [requests, setRequests] = useState<TimeOffRequest[]>([])
  const [date, setDate] = useState('')
  const [reason, setReason] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!profile) return
    setIsLoading(true)
    setError(null)
    try {
      setRequests(await timeOffService.listByRange(profile.id, addDays(today, -365), addDays(today, 730)))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar as folgas.')
    } finally {
      setIsLoading(false)
    }
  }, [profile, today])

  useEffect(() => { void load() }, [load])

  const create = async () => {
    if (!profile || isSubmitting) return
    setIsSubmitting(true); setError(null); setFeedback(null)
    try {
      await timeOffService.create(profile.id, { date, reason })
      setDate(''); setReason(''); setFeedback('Solicitação criada e encaminhada à supervisão da squad registrada.')
      await load()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Não foi possível criar a solicitação.')
    } finally { setIsSubmitting(false) }
  }

  const removePending = async (request: TimeOffRequest) => {
    if (!profile) return
    await timeOffService.removePending(profile.id, request.id)
    setFeedback('Solicitação pendente retirada e preservada no histórico local.')
    await load()
  }

  const cancelApproved = async (request: TimeOffRequest, cancellationReason: string) => {
    if (!profile) return
    await timeOffService.cancelApproved(profile.id, request.id, cancellationReason)
    setFeedback('Folga cancelada. A supervisão foi notificada e a projeção foi recalculada.')
    await load()
  }

  return { today, requests, date, setDate, reason, setReason, isLoading, isSubmitting, error, feedback, create, removePending, cancelApproved, reload: load }
}
