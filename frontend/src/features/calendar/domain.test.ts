import { describe, expect, it } from 'vitest'
import type { CalendarEvent } from './types'
import type { TimeEntry } from '../time-entries/types'
import type { TimeOffRequest } from '../time-off/types'
import type { WorkloadVersion } from '../workloads/types'
import { calculateDaySummary, calculatePeriodSummary, getCalendarVisualState, getMonthGridDates, shiftMonth } from './domain'

const collaboratorId = 'collaborator-1'
const workloadVersions: WorkloadVersion[] = [{
  id: 'workload-1',
  collaboratorId,
  dailyMinutes: 480,
  effectiveFrom: '2026-01-01',
  status: 'APPROVED',
  createdAt: '2025-12-01T12:00:00.000Z',
  approvedAt: '2025-12-02T12:00:00.000Z',
}]

function entry(date: string, durationMinutes: number, overrides: Partial<TimeEntry> = {}): TimeEntry {
  return {
    id: `entry-${date}-${durationMinutes}`,
    collaboratorId,
    entryDate: date,
    clientId: 'client-1',
    projectCode: 'SMA-001',
    activityId: 'activity-1',
    disciplineCode: '—',
    documentTypeCode: '—',
    durationMinutes,
    details: 'Atividade executada',
    assignmentSnapshot: null,
    status: 'ACTIVE',
    version: 1,
    createdAt: `${date}T12:00:00.000Z`,
    updatedAt: `${date}T12:00:00.000Z`,
    ...overrides,
  }
}

function event(type: CalendarEvent['type'], date: string, justifiedMinutes?: number): CalendarEvent {
  return {
    id: `event-${type}-${date}`,
    collaboratorId,
    type,
    startDate: date,
    endDate: date,
    justifiedMinutes,
    title: type,
    source: 'DEMO',
    createdAt: `${date}T10:00:00.000Z`,
  }
}

function timeOff(date: string): TimeOffRequest {
  return {
    id: `time-off-${date}`,
    collaboratorId,
    date,
    reason: 'Compromisso pessoal',
    status: 'APPROVED',
    assignmentSnapshot: null,
    createdAt: '2026-07-01T12:00:00.000Z',
    updatedAt: '2026-07-02T12:00:00.000Z',
  }
}

describe('saldos diários e eventos', () => {
  it.each([
    [540, 60, 480, 60, 0],
    [480, 0, 480, 0, 0],
    [360, -120, 360, 0, 120],
  ])('calcula %i minutos trabalhados com saldo %i', (worked, balance, regular, extra, missing) => {
    const summary = calculateDaySummary({
      date: '2026-07-20',
      today: '2026-07-20',
      collaboratorId,
      entries: [entry('2026-07-20', worked)],
      events: [],
      timeOffRequests: [],
      workloadVersions,
    })
    expect(summary).toMatchObject({ balanceMinutes: balance, regularMinutes: regular, extraMinutes: extra, missingMinutes: missing })
  })

  it.each(['HOLIDAY', 'VACATION', 'MEDICAL_LEAVE_FULL'] as const)('%s neutraliza integralmente a jornada', (type) => {
    const summary = calculateDaySummary({
      date: '2026-07-20', today: '2026-07-20', collaboratorId, entries: [],
      events: [event(type, '2026-07-20')], timeOffRequests: [], workloadVersions,
    })
    expect(summary).toMatchObject({ baseExpectedMinutes: 480, expectedMinutes: 0, justifiedMinutes: 480, balanceMinutes: 0 })
  })

  it('afastamento parcial reduz somente a jornada justificada', () => {
    const summary = calculateDaySummary({
      date: '2026-07-20', today: '2026-07-20', collaboratorId,
      entries: [entry('2026-07-20', 300)],
      events: [event('MEDICAL_LEAVE_PARTIAL', '2026-07-20', 180)],
      timeOffRequests: [], workloadVersions,
    })
    expect(summary).toMatchObject({ expectedMinutes: 300, justifiedMinutes: 180, workedMinutes: 300, balanceMinutes: 0 })
  })

  it('folga aprovada debita a carga e torna saldo negativo ainda mais negativo', () => {
    const ordinary = calculateDaySummary({
      date: '2026-07-20', today: '2026-07-20', collaboratorId, entries: [], events: [], timeOffRequests: [], workloadVersions,
    })
    const withTimeOff = calculateDaySummary({
      date: '2026-07-21', today: '2026-07-21', collaboratorId, entries: [], events: [], timeOffRequests: [timeOff('2026-07-21')], workloadVersions,
    })
    expect(ordinary.balanceMinutes).toBe(-480)
    expect(withTimeOff.balanceMinutes).toBe(-480)
    expect(withTimeOff.visualState).toBe('TIME_OFF')
  })

  it('ignora apontamento cancelado', () => {
    const summary = calculateDaySummary({
      date: '2026-07-20', today: '2026-07-20', collaboratorId,
      entries: [entry('2026-07-20', 480, { status: 'CANCELLED' })], events: [], timeOffRequests: [], workloadVersions,
    })
    expect(summary.workedMinutes).toBe(0)
  })
})

describe('saldos por período e calendário', () => {
  it('agrega mês, intervalo e total a partir dos resumos diários', () => {
    const result = calculatePeriodSummary({
      startDate: '2026-07-20', endDate: '2026-07-22', today: '2026-07-22', collaboratorId,
      entries: [entry('2026-07-20', 480), entry('2026-07-21', 540), entry('2026-07-22', 360)],
      events: [], timeOffRequests: [], workloadVersions,
    })
    expect(result).toMatchObject({ expectedMinutes: 1440, workedMinutes: 1380, realBalanceMinutes: -60, projectedBalanceMinutes: 0 })
  })

  it('exclui datas futuras do saldo real e apresenta projeção separada', () => {
    const result = calculatePeriodSummary({
      startDate: '2026-07-20', endDate: '2026-07-21', today: '2026-07-20', collaboratorId,
      entries: [entry('2026-07-20', 480)], events: [], timeOffRequests: [timeOff('2026-07-21')], workloadVersions,
    })
    expect(result.realBalanceMinutes).toBe(0)
    expect(result.projectedBalanceMinutes).toBe(-480)
  })

  it('mantém status de completude separado do status de aprovação', () => {
    const summary = calculateDaySummary({
      date: '2026-07-20', today: '2026-07-20', collaboratorId,
      entries: [entry('2026-07-20', 540)], events: [], timeOffRequests: [], workloadVersions,
    })
    expect(getCalendarVisualState(summary)).toEqual({ state: 'EXCEEDED', label: 'Jornada excedida' })
    expect('approvalStatus' in getCalendarVisualState(summary)).toBe(false)
  })

  it('gera grade mensal completa de seis semanas iniciada na segunda-feira', () => {
    const dates = getMonthGridDates('2026-07')
    expect(dates).toHaveLength(42)
    expect(dates[0]).toBe('2026-06-29')
    expect(dates.at(-1)).toBe('2026-08-09')
  })

  it('navega entre meses atravessando o ano', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
  })
})
