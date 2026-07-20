import { addDays, compareIsoDates, eachIsoDate } from '../../shared/utils/date'
import type { TimeEntry } from '../time-entries/types'
import type { TimeOffRequest } from '../time-off/types'
import { getBaseExpectedMinutes } from '../workloads/domain'
import type { WorkloadVersion } from '../workloads/types'
import type { CalendarEvent, CalendarVisualState, DailySummary, PeriodSummary } from './types'

type DaySummaryInput = {
  date: string
  today: string
  collaboratorId: string
  entries: TimeEntry[]
  events: CalendarEvent[]
  timeOffRequests: TimeOffRequest[]
  workloadVersions: WorkloadVersion[]
}

function eventApplies(event: CalendarEvent, collaboratorId: string, date: string) {
  return event.collaboratorId === collaboratorId && event.startDate <= date && event.endDate >= date
}

function calculateAdjustedExpectation(baseExpectedMinutes: number, events: CalendarEvent[]) {
  const hasFullNeutralizer = events.some((event) =>
    event.type === 'HOLIDAY' || event.type === 'VACATION' || event.type === 'MEDICAL_LEAVE_FULL')
  if (hasFullNeutralizer) return { expectedMinutes: 0, justifiedMinutes: baseExpectedMinutes }
  const partialMinutes = events
    .filter((event) => event.type === 'MEDICAL_LEAVE_PARTIAL')
    .reduce((total, event) => total + Math.max(0, event.justifiedMinutes ?? 0), 0)
  const justifiedMinutes = Math.min(baseExpectedMinutes, partialMinutes)
  return { expectedMinutes: baseExpectedMinutes - justifiedMinutes, justifiedMinutes }
}

function deriveVisualState(
  events: CalendarEvent[],
  hasApprovedTimeOff: boolean,
  expectedMinutes: number,
  workedMinutes: number,
): CalendarVisualState {
  if (events.some((event) => event.type === 'VACATION')) return 'VACATION'
  if (events.some((event) => event.type === 'HOLIDAY')) return 'HOLIDAY'
  if (events.some((event) => event.type.startsWith('MEDICAL_LEAVE'))) return 'MEDICAL_LEAVE'
  if (hasApprovedTimeOff) return 'TIME_OFF'
  if (expectedMinutes === 0 && workedMinutes === 0) return 'NO_SCHEDULE'
  if (workedMinutes === 0) return 'NO_ENTRY'
  if (workedMinutes < expectedMinutes) return 'INCOMPLETE'
  if (workedMinutes === expectedMinutes) return 'COMPLETE'
  return 'EXCEEDED'
}

export function calculateDaySummary(input: DaySummaryInput): DailySummary {
  const applicableEvents = input.events.filter((event) => eventApplies(event, input.collaboratorId, input.date))
  const baseExpectedMinutes = getBaseExpectedMinutes(input.date, input.workloadVersions)
  const { expectedMinutes, justifiedMinutes } = calculateAdjustedExpectation(baseExpectedMinutes, applicableEvents)
  const workedMinutes = input.entries.reduce((total, entry) => {
    if (entry.collaboratorId !== input.collaboratorId || entry.entryDate !== input.date || entry.status !== 'ACTIVE') return total
    return total + entry.durationMinutes
  }, 0)
  const regularMinutes = Math.min(workedMinutes, expectedMinutes)
  const extraMinutes = Math.max(workedMinutes - expectedMinutes, 0)
  const missingMinutes = Math.max(expectedMinutes - workedMinutes, 0)
  const hasApprovedTimeOff = input.timeOffRequests.some((request) =>
    request.collaboratorId === input.collaboratorId && request.date === input.date && request.status === 'APPROVED')

  return {
    date: input.date,
    baseExpectedMinutes,
    expectedMinutes,
    justifiedMinutes,
    workedMinutes,
    regularMinutes,
    extraMinutes,
    missingMinutes,
    balanceMinutes: workedMinutes - expectedMinutes,
    isFuture: compareIsoDates(input.date, input.today) > 0,
    visualState: deriveVisualState(applicableEvents, hasApprovedTimeOff, expectedMinutes, workedMinutes),
  }
}

type PeriodSummaryInput = Omit<DaySummaryInput, 'date'> & { startDate: string; endDate: string }

export function calculatePeriodSummary(input: PeriodSummaryInput): PeriodSummary {
  const days = eachIsoDate(input.startDate, input.endDate).map((date) => calculateDaySummary({ ...input, date }))
  return days.reduce<PeriodSummary>((summary, day) => {
    summary.expectedMinutes += day.expectedMinutes
    summary.workedMinutes += day.workedMinutes
    summary.regularMinutes += day.regularMinutes
    summary.extraMinutes += day.extraMinutes
    summary.missingMinutes += day.missingMinutes
    summary.justifiedMinutes += day.justifiedMinutes
    if (day.isFuture) summary.projectedBalanceMinutes += day.balanceMinutes
    else summary.realBalanceMinutes += day.balanceMinutes
    return summary
  }, {
    startDate: input.startDate,
    endDate: input.endDate,
    expectedMinutes: 0,
    workedMinutes: 0,
    regularMinutes: 0,
    extraMinutes: 0,
    missingMinutes: 0,
    justifiedMinutes: 0,
    realBalanceMinutes: 0,
    projectedBalanceMinutes: 0,
    days,
  })
}

const visualLabels: Record<CalendarVisualState, string> = {
  NO_SCHEDULE: 'Sem jornada prevista',
  NO_ENTRY: 'Sem apontamento',
  INCOMPLETE: 'Jornada incompleta',
  COMPLETE: 'Jornada atingida',
  EXCEEDED: 'Jornada excedida',
  VACATION: 'Férias',
  TIME_OFF: 'Folga',
  MEDICAL_LEAVE: 'Afastamento',
  HOLIDAY: 'Feriado',
}

export function getCalendarVisualState(summary: DailySummary) {
  return { state: summary.visualState, label: visualLabels[summary.visualState] }
}

export function shiftMonth(monthKey: string, amount: number) {
  const [year, month] = monthKey.split('-').map(Number)
  const shifted = new Date(Date.UTC(year, month - 1 + amount, 1, 12))
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}`
}

export function getMonthGridDates(monthKey: string) {
  const firstDate = `${monthKey}-01`
  const firstWeekday = new Date(`${firstDate}T12:00:00.000Z`).getUTCDay()
  const mondayOffset = firstWeekday === 0 ? 6 : firstWeekday - 1
  const gridStart = addDays(firstDate, -mondayOffset)
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index))
}
