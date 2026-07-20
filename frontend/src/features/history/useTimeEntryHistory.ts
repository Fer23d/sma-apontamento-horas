import { useCallback, useEffect, useState } from 'react'
import { dayApprovalService } from '../../services/dayApprovalService'
import { timeEntryService } from '../../services/timeEntryService'
import type { DayApproval } from '../approvals/types'
import type { DisciplineCode, TimeEntry } from '../time-entries/types'
import { getCorporateToday, getMonthKey } from '../../shared/utils/date'
import { useSession } from '../session/useSession'
import { resolveHistoryPeriod, type HistoryPeriodMode } from './domain'

export type HistoryFiltersValue = {
  mode: HistoryPeriodMode
  day: string
  month: string
  startDate: string
  endDate: string
  clientId: string
  projectCode: string
  activityId: string
  disciplineCode: DisciplineCode | ''
  status: TimeEntry['status'] | ''
}

export type HistoryRow = {
  entry: TimeEntry
  approval: DayApproval
  canMutate: boolean
}

const today = getCorporateToday()
const initialFilters: HistoryFiltersValue = {
  mode: 'MONTH', day: today, month: getMonthKey(today), startDate: `${getMonthKey(today)}-01`, endDate: today,
  clientId: '', projectCode: '', activityId: '', disciplineCode: '', status: '',
}

export function useTimeEntryHistory() {
  const { profile } = useSession()
  const [draftFilters, setDraftFilters] = useState(initialFilters)
  const [filters, setFilters] = useState(initialFilters)
  const [rows, setRows] = useState<HistoryRow[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [cursor, setCursor] = useState<string | undefined>()
  const [cursorHistory, setCursorHistory] = useState<string[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!profile) return
    setIsLoading(true)
    setError(null)
    try {
      const period = resolveHistoryPeriod({ ...filters, firstAvailableDate: '2020-01-01', today })
      const page = await timeEntryService.list({
        collaboratorId: profile.id,
        ...period,
        pageSize: 10,
        cursor,
        filters: {
          clientId: filters.clientId || undefined,
          projectCode: filters.projectCode.trim() || undefined,
          activityId: filters.activityId || undefined,
          disciplineCode: filters.disciplineCode || undefined,
          status: filters.status || undefined,
        },
      })
      const enriched = await Promise.all(page.items.map(async (entry) => {
        const entriesOfDay = await timeEntryService.listByDate(profile.id, entry.entryDate)
        const approval = await dayApprovalService.getForDate(profile.id, entry.entryDate, entriesOfDay.some((item) => item.status === 'ACTIVE'), entry.assignmentSnapshot)
        return { entry, approval, canMutate: await dayApprovalService.canMutate(profile.id, entry.entryDate) }
      }))
      setRows(enriched)
      setNextCursor(page.nextCursor)
      setTotal(page.total)
    } catch (loadError) {
      setRows([])
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar o histórico.')
    } finally {
      setIsLoading(false)
    }
  }, [cursor, filters, profile])

  useEffect(() => { void load() }, [load])

  const applyFilters = () => {
    setCursor(undefined)
    setCursorHistory([])
    setFilters(draftFilters)
  }

  const nextPage = () => {
    if (!nextCursor) return
    setCursorHistory((history) => [...history, cursor ?? '0'])
    setCursor(nextCursor)
  }

  const previousPage = () => {
    const previous = cursorHistory.at(-1)
    if (previous === undefined) return
    setCursorHistory((history) => history.slice(0, -1))
    setCursor(previous === '0' ? undefined : previous)
  }

  const cancel = async (row: HistoryRow, reason: string) => {
    if (!profile) return
    await timeEntryService.cancel(profile.id, row.entry.id, row.entry.version, reason)
    setFeedback('Apontamento cancelado. O registro foi preservado no histórico.')
    await load()
  }

  const completeCorrection = async (row: HistoryRow) => {
    if (!profile) return
    await dayApprovalService.completeCorrection(profile.id, row.entry.entryDate)
    setFeedback('Correção concluída. O dia voltou a ficar disponível para aprovação.')
    await load()
  }

  return {
    draftFilters, setDraftFilters, applyFilters, rows, total, isLoading, error, feedback,
    nextCursor, hasPreviousPage: cursorHistory.length > 0, nextPage, previousPage, cancel, completeCorrection, reload: load,
  }
}
