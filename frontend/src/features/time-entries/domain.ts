import type {
  Activity,
  Client,
  CollaboratorProfile,
  CreateTimeEntryData,
  DailySummary,
  TimeEntry,
  TimeEntryValidationErrors,
  WorkSchedule,
} from '../../shared/types/domain'

export const MAX_ENTRY_MINUTES = 24 * 60
export const MAX_PROJECT_CODE_LENGTH = 80

export function hoursAndMinutesToMinutes(hours: number, minutes: number) {
  return hours * 60 + minutes
}

export function areValidDurationParts(hours: number, minutes: number) {
  return Number.isInteger(hours)
    && Number.isInteger(minutes)
    && hours >= 0
    && hours <= 24
    && minutes >= 0
    && minutes <= 59
    && isValidDuration(hoursAndMinutesToMinutes(hours, minutes))
}

export function formatMinutes(totalMinutes: number) {
  const absoluteMinutes = Math.abs(Math.trunc(totalMinutes))
  const hours = Math.floor(absoluteMinutes / 60).toString().padStart(2, '0')
  const minutes = (absoluteMinutes % 60).toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

export function formatSignedMinutes(totalMinutes: number) {
  if (totalMinutes === 0) return '00:00'
  return `${totalMinutes > 0 ? '+' : '-'}${formatMinutes(totalMinutes)}`
}

export function isValidDuration(durationMinutes: number) {
  return Number.isInteger(durationMinutes) && durationMinutes > 0 && durationMinutes <= MAX_ENTRY_MINUTES
}

function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day, 12)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

export function getExpectedMinutesForDate(date: string, schedule: WorkSchedule) {
  if (!isValidIsoDate(date)) return 0
  const [year, month, day] = date.split('-').map(Number)
  const weekday = new Date(year, month - 1, day, 12).getDay()
  const minutesByDay = [
    schedule.sundayMinutes,
    schedule.mondayMinutes,
    schedule.tuesdayMinutes,
    schedule.wednesdayMinutes,
    schedule.thursdayMinutes,
    schedule.fridayMinutes,
    schedule.saturdayMinutes,
  ]
  return minutesByDay[weekday]
}

export function sumActiveMinutes(entries: TimeEntry[], collaboratorId: string, date: string) {
  return entries.reduce((total, entry) => {
    if (entry.status !== 'ACTIVE' || entry.collaboratorId !== collaboratorId || entry.entryDate !== date) return total
    return total + entry.durationMinutes
  }, 0)
}

export function calculateDailySummary(
  date: string,
  schedule: WorkSchedule,
  entries: TimeEntry[],
  collaboratorId: string,
): DailySummary {
  const expectedMinutes = getExpectedMinutesForDate(date, schedule)
  const workedMinutes = sumActiveMinutes(entries, collaboratorId, date)
  const regularMinutes = Math.min(workedMinutes, expectedMinutes)
  const extraMinutes = Math.max(workedMinutes - expectedMinutes, 0)
  const missingMinutes = Math.max(expectedMinutes - workedMinutes, 0)

  return {
    date,
    expectedMinutes,
    workedMinutes,
    regularMinutes,
    extraMinutes,
    missingMinutes,
    balanceMinutes: workedMinutes - expectedMinutes,
  }
}

export function validateTimeEntry(
  data: CreateTimeEntryData,
  clients: Client[],
  activities: Activity[],
): TimeEntryValidationErrors {
  const errors: TimeEntryValidationErrors = {}
  if (!isValidIsoDate(data.entryDate)) errors.entryDate = 'Informe uma data válida.'
  if (!clients.some((client) => client.id === data.clientId && client.active)) errors.clientId = 'Selecione um cliente ativo.'
  const projectCode = data.projectCode.trim()
  if (!projectCode) errors.projectCode = 'Informe o número do projeto.'
  else if (projectCode.length > MAX_PROJECT_CODE_LENGTH) errors.projectCode = 'O número do projeto deve ter no máximo 80 caracteres.'
  if (!activities.some((activity) => activity.id === data.activityId && activity.active)) errors.activityId = 'Selecione uma atividade ativa.'
  if (!isValidDuration(data.durationMinutes)) errors.durationMinutes = 'A duração deve ser maior que zero e de no máximo 24 horas.'
  if (!data.details.trim()) errors.details = 'Descreva o trabalho realizado.'
  return errors
}

export function getDailyTargetLabel(profile: CollaboratorProfile) {
  return formatMinutes(profile.workSchedule.mondayMinutes)
}
