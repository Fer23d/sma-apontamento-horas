export type TimeEntryStatus = 'ACTIVE' | 'CANCELLED'

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

export interface TimeEntry {
  id: string
  collaboratorId: string
  entryDate: string
  clientId: string
  projectCode: string
  activityId: string
  durationMinutes: number
  details: string
  status: TimeEntryStatus
  version: number
  createdAt: string
  updatedAt: string
}

export type CreateTimeEntryData = Pick<
  TimeEntry,
  'entryDate' | 'clientId' | 'projectCode' | 'activityId' | 'durationMinutes' | 'details'
>

export interface DailySummary {
  date: string
  expectedMinutes: number
  workedMinutes: number
  regularMinutes: number
  extraMinutes: number
  missingMinutes: number
  balanceMinutes: number
}

export type TimeEntryValidationErrors = Partial<Record<keyof CreateTimeEntryData, string>>
