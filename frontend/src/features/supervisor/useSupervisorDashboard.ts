import { useCallback, useEffect, useState } from 'react'
import { supervisorService } from '../../services/supervisorService'
import type { SupervisorDashboardSummary, SupervisorPendingEntry } from './types'

type SupervisorDashboardState = {
  entries: SupervisorPendingEntry[]
  summary: SupervisorDashboardSummary
}

const emptySummary: SupervisorDashboardSummary = { pending: 0, approved: 0, rejected: 0 }

export function useSupervisorDashboard() {
  const [data, setData] = useState<SupervisorDashboardState>({ entries: [], summary: emptySummary })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setLoading] = useState(true)
  const [isMutating, setMutating] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [entries, summary] = await Promise.all([
        supervisorService.listEntries(),
        supervisorService.getSummary(),
      ])
      setData({ entries, summary })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar as pendências.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const approve = async (entry: SupervisorPendingEntry, supervisorId: string) => {
    setMutating(true)
    setError(null)
    try {
      await supervisorService.approve(entry.id, supervisorId)
      await reload()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível aprovar o apontamento.')
    } finally {
      setMutating(false)
    }
  }

  const reject = async (entry: SupervisorPendingEntry, supervisorId: string, reason: string) => {
    setMutating(true)
    setError(null)
    try {
      await supervisorService.reject(entry.id, supervisorId, reason)
      await reload()
    } finally {
      setMutating(false)
    }
  }

  return {
    ...data,
    error,
    isLoading,
    isMutating,
    approve,
    reject,
    reload,
  }
}
