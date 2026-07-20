import type {
  CreateTimeEntryData,
  TimeEntry,
  TimeEntryStatus,
  TimeEntryValidationErrors,
} from '../../features/time-entries/types'

export type {
  CreateTimeEntryData,
  DisciplineCode,
  DocumentTypeCode,
  TimeEntry,
  TimeEntryStatus,
  TimeEntryValidationErrors,
} from '../../features/time-entries/types'

export interface WorkSchedule {
  mondayMinutes: number
  tuesdayMinutes: number
  wednesdayMinutes: number
  thursdayMinutes: number
  fridayMinutes: number
  saturdayMinutes: number
  sundayMinutes: number
}

export interface CollaboratorProfile {
  id: string
  name: string
  email: string
  jobTitle: string
  squadName: string
  workSchedule: WorkSchedule
}

export interface Client {
  id: string
  name: string
  active: boolean
}

export interface Activity {
  id: string
  name: string
  active: boolean
}

export interface DailySummary {
  date: string
  expectedMinutes: number
  workedMinutes: number
  regularMinutes: number
  extraMinutes: number
  missingMinutes: number
  balanceMinutes: number
}

export type CurrentTimeEntry = TimeEntry
export type CurrentTimeEntryStatus = TimeEntryStatus
export type CurrentCreateTimeEntryData = CreateTimeEntryData
export type CurrentTimeEntryValidationErrors = TimeEntryValidationErrors
