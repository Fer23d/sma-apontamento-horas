import { describe, expect, it } from 'vitest'
import { demoActivities, demoClients, demoCollaborator } from '../../mocks/demoData'
import type { CreateTimeEntryData, TimeEntry } from '../../shared/types/domain'
import {
  areValidDurationParts,
  calculateDailySummary,
  formatMinutes,
  formatSignedMinutes,
  getExpectedMinutesForDate,
  isValidDuration,
  sumActiveMinutes,
  validateTimeEntry,
} from './domain'

const monday = '2026-07-13'
const saturday = '2026-07-18'

function entry(overrides: Partial<TimeEntry> = {}): TimeEntry {
  return {
    id: 'entry-1',
    collaboratorId: demoCollaborator.id,
    entryDate: monday,
    clientId: 'client-industrial-alpha',
    projectCode: 'ALF-001',
    activityId: 'activity-project-design',
    durationMinutes: 360,
    details: 'Atividade demonstrativa',
    status: 'ACTIVE',
    version: 1,
    createdAt: '2026-07-13T12:00:00.000Z',
    updatedAt: '2026-07-13T12:00:00.000Z',
    ...overrides,
  }
}

describe('regras de jornada e resumo diário', () => {
  it('define 480 minutos para uma segunda-feira', () => {
    expect(getExpectedMinutesForDate(monday, demoCollaborator.workSchedule)).toBe(480)
  })

  it('define jornada zero para sábado', () => {
    expect(getExpectedMinutesForDate(saturday, demoCollaborator.workSchedule)).toBe(0)
  })

  it('calcula 6 horas trabalhadas em uma jornada de 8 horas', () => {
    expect(calculateDailySummary(monday, demoCollaborator.workSchedule, [entry()], demoCollaborator.id)).toMatchObject({
      workedMinutes: 360,
      regularMinutes: 360,
      extraMinutes: 0,
      missingMinutes: 120,
      balanceMinutes: -120,
    })
  })

  it('calcula exatamente 8 horas sem falta ou excedente', () => {
    expect(calculateDailySummary(monday, demoCollaborator.workSchedule, [entry({ durationMinutes: 480 })], demoCollaborator.id)).toMatchObject({
      regularMinutes: 480,
      extraMinutes: 0,
      missingMinutes: 0,
      balanceMinutes: 0,
    })
  })

  it('calcula 9 horas com 1 hora de excedente', () => {
    expect(calculateDailySummary(monday, demoCollaborator.workSchedule, [entry({ durationMinutes: 540 })], demoCollaborator.id)).toMatchObject({
      regularMinutes: 480,
      extraMinutes: 60,
      missingMinutes: 0,
      balanceMinutes: 60,
    })
  })

  it('ignora apontamentos cancelados', () => {
    const summary = calculateDailySummary(monday, demoCollaborator.workSchedule, [entry({ status: 'CANCELLED' })], demoCollaborator.id)
    expect(summary.workedMinutes).toBe(0)
  })

  it('soma somente o colaborador e a data corretos', () => {
    const entries = [
      entry({ id: 'correct', durationMinutes: 60 }),
      entry({ id: 'other-user', collaboratorId: 'other', durationMinutes: 120 }),
      entry({ id: 'other-date', entryDate: '2026-07-14', durationMinutes: 180 }),
    ]
    expect(sumActiveMinutes(entries, demoCollaborator.id, monday)).toBe(60)
  })
})

describe('validações e formatação', () => {
  it('rejeita duração igual a zero', () => expect(isValidDuration(0)).toBe(false))
  it('rejeita duração negativa', () => expect(isValidDuration(-1)).toBe(false))
  it('rejeita duração superior a 24 horas', () => expect(isValidDuration(1441)).toBe(false))
  it('aceita partes válidas de horas e minutos', () => expect(areValidDurationParts(1, 30)).toBe(true))
  it('rejeita 60 no campo de minutos', () => expect(areValidDurationParts(1, 60)).toBe(false))
  it('rejeita parte fracionária no campo de horas', () => expect(areValidDurationParts(1.5, 0)).toBe(false))
  it('rejeita minutos adicionais quando as horas já atingiram 24', () => expect(areValidDurationParts(24, 1)).toBe(false))

  const validData = {
    entryDate: monday,
    clientId: 'client-industrial-alpha',
    projectCode: 'Ab-001/2.03',
    activityId: 'activity-project-design',
    durationMinutes: 60,
    details: 'Atividade demonstrativa',
  } as CreateTimeEntryData

  it('rejeita número do projeto composto somente por espaços', () => {
    const errors = validateTimeEntry(
      { ...validData, projectCode: '   ' },
      demoClients,
      demoActivities,
    )
    expect(errors.projectCode).toBe('Informe o número do projeto.')
  })

  it('aceita número do projeto com 80 caracteres após trim', () => {
    const errors = validateTimeEntry(
      { ...validData, projectCode: `  ${'A'.repeat(80)}  ` },
      demoClients,
      demoActivities,
    )
    expect(errors.projectCode).toBeUndefined()
  })

  it('rejeita número do projeto acima de 80 caracteres após trim', () => {
    const errors = validateTimeEntry(
      { ...validData, projectCode: `  ${'A'.repeat(81)}  ` },
      demoClients,
      demoActivities,
    )
    expect(errors.projectCode).toBe('O número do projeto deve ter no máximo 80 caracteres.')
  })

  it('formata minutos positivos em HH:MM', () => expect(formatMinutes(125)).toBe('02:05'))
  it('formata saldo negativo', () => expect(formatSignedMinutes(-90)).toBe('-01:30'))
})
