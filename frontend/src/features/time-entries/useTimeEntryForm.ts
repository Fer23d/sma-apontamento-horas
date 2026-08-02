import { useCallback, useEffect, useState } from 'react'
import { demoActivities, demoClients } from '../../mocks/demoData'
import { dayApprovalService } from '../../services/dayApprovalService'
import { entryDateAvailabilityService } from '../../services/entryDateAvailabilityService'
import { timeEntryService } from '../../services/timeEntryService'
import type { CreateTimeEntryData, TimeEntry, TimeEntryValidationErrors } from './types'
import { getCorporateToday, isIsoDate } from '../../shared/utils/date'
import { useSession } from '../session/useSession'
import { areValidDurationParts, hoursAndMinutesToMinutes, periodsOverlap, timeToMinutes, validateTimeEntry } from './domain'

export type TimeEntryFormValues = {
  entryDate: string
  clientId: string
  projectCode: string
  activityId: string
  disciplineCode: CreateTimeEntryData['disciplineCode'] | ''
  documentTypeCode: CreateTimeEntryData['documentTypeCode'] | ''
  startTime: string
  endTime: string
  hours: string
  minutes: string
  details: string
  editReason: string
}

const emptyValues = (entryDate: string): TimeEntryFormValues => ({
  entryDate,
  clientId: '',
  projectCode: '',
  activityId: '',
  disciplineCode: '',
  documentTypeCode: '',
  startTime: '',
  endTime: '',
  hours: '',
  minutes: '',
  details: '',
  editReason: '',
})

function valuesFromEntry(entry: TimeEntry): TimeEntryFormValues {
  return {
    entryDate: entry.entryDate,
    clientId: entry.clientId,
    projectCode: entry.projectCode,
    activityId: entry.activityId,
    disciplineCode: entry.disciplineCode,
    documentTypeCode: entry.documentTypeCode,
    startTime: entry.startTime ?? '',
    endTime: entry.endTime ?? '',
    hours: String(Math.floor(entry.durationMinutes / 60)),
    minutes: String(entry.durationMinutes % 60),
    details: entry.details,
    editReason: '',
  }
}

type FormMode = 'CREATE' | 'EDIT' | 'DUPLICATE'

export function useTimeEntryForm({ initialDate, entryId, duplicateId }: { initialDate: string; entryId?: string; duplicateId?: string }) {
  const { profile } = useSession()
  const mode: FormMode = entryId ? 'EDIT' : duplicateId ? 'DUPLICATE' : 'CREATE'
  const sourceId = entryId ?? duplicateId
  const [source, setSource] = useState<TimeEntry | null>(null)
  const [values, setValues] = useState<TimeEntryFormValues>(() => emptyValues(initialDate))
  const [errors, setErrors] = useState<TimeEntryValidationErrors>({})
  const [editReasonError, setEditReasonError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(sourceId))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!profile || !sourceId) return
    let active = true
    setIsLoading(true)
    timeEntryService.getById(profile.id, sourceId)
      .then((entry) => {
        if (!active) return
        if (!entry) {
          setSubmitError('O apontamento solicitado não foi encontrado.')
          return
        }
        setSource(entry)
        setValues(valuesFromEntry(entry))
      })
      .catch(() => active && setSubmitError('Não foi possível carregar o apontamento.'))
      .finally(() => active && setIsLoading(false))
    return () => { active = false }
  }, [profile, sourceId])

  const setField = useCallback(<Key extends keyof TimeEntryFormValues>(field: Key, value: TimeEntryFormValues[Key]) => {
    setValues((current) => {
      const next = { ...current, [field]: value }
      if (field === 'startTime' || field === 'endTime') {
        const start = timeToMinutes(next.startTime)
        const end = timeToMinutes(next.endTime)
        if (start !== null && end !== null && end > start) {
          const duration = end - start
          next.hours = String(Math.floor(duration / 60))
          next.minutes = String(duration % 60)
        }
      }
      return next
    })
    if (field === 'editReason') setEditReasonError(null)
    else setErrors((current) => ({ ...current, [field]: undefined }))
  }, [])

  const submit = async () => {
    if (!profile || isSubmitting) return false
    setSubmitError(null)
    setSuccessMessage(null)
    const durationHours = Number(values.hours || 0)
    const durationRemainderMinutes = Number(values.minutes || 0)
    const data: CreateTimeEntryData = {
      entryDate: values.entryDate,
      clientId: values.clientId,
      projectCode: values.projectCode,
      activityId: values.activityId,
      disciplineCode: values.disciplineCode as CreateTimeEntryData['disciplineCode'],
      documentTypeCode: values.documentTypeCode as CreateTimeEntryData['documentTypeCode'],
      startTime: values.startTime,
      endTime: values.endTime,
      durationMinutes: hoursAndMinutesToMinutes(durationHours, durationRemainderMinutes),
      details: values.details,
    }
    let canMutateDate = true
    let dateBlock = { blocked: false } as Awaited<ReturnType<typeof entryDateAvailabilityService.getBlock>>
    if (isIsoDate(data.entryDate)) {
      try {
        [canMutateDate, dateBlock] = await Promise.all([
          dayApprovalService.canMutate(profile.id, data.entryDate),
          entryDateAvailabilityService.getBlock(profile.id, data.entryDate),
        ])
      } catch {
        setSubmitError('Não foi possível verificar os eventos desta data. Tente novamente.')
        return false
      }
    }
    const validationErrors = validateTimeEntry(data, demoClients, demoActivities, { today: getCorporateToday(), canMutateDate })
    if (dateBlock.blocked) validationErrors.entryDate = dateBlock.message
    if (!areValidDurationParts(durationHours, durationRemainderMinutes)) {
      validationErrors.durationMinutes = 'Informe horas inteiras entre 0 e 24 e minutos inteiros entre 0 e 59, com total máximo de 24 horas.'
    }
    const reasonError = mode === 'EDIT' && !values.editReason.trim() ? 'Informe o motivo da edição.' : null
    setErrors(validationErrors)
    setEditReasonError(reasonError)
    if (Object.keys(validationErrors).length > 0 || reasonError) return false
    const newStart = timeToMinutes(data.startTime ?? '')
    const newEnd = timeToMinutes(data.endTime ?? '')
    if (newStart === null || newEnd === null) return false
    try {
      const existingEntries = await timeEntryService.listByDate(profile.id, data.entryDate)
      const hasCollision = existingEntries
        .filter((entry) => entry.status !== 'CANCELLED' && entry.id !== source?.id && entry.startTime && entry.endTime)
        .some((entry) => {
          const existingStart = timeToMinutes(entry.startTime!)
          const existingEnd = timeToMinutes(entry.endTime!)
          return existingStart !== null && existingEnd !== null && periodsOverlap(newStart, newEnd, existingStart, existingEnd)
        })
      if (hasCollision) {
        setSubmitError('Conflito de horários: Você já possui horas registradas neste período.')
        return false
      }
    } catch {
      setSubmitError('Não foi possível validar conflitos de horário. Tente novamente.')
      return false
    }
    if ((mode === 'EDIT' || mode === 'DUPLICATE') && !source) {
      setSubmitError('O apontamento de origem não está disponível.')
      return false
    }

    setIsSubmitting(true)
    try {
      if (mode === 'EDIT' && source) {
        const updated = await timeEntryService.update(profile.id, source.id, source.version, data, values.editReason)
        setSource(updated)
        setValues(valuesFromEntry(updated))
        setSuccessMessage('Apontamento atualizado com sucesso.')
      } else if (mode === 'DUPLICATE' && source) {
        await timeEntryService.duplicate(profile.id, source.id, source.version, data)
        setSuccessMessage('Apontamento duplicado com sucesso.')
      } else {
        await timeEntryService.create(profile.id, data)
        setSuccessMessage('Apontamento salvo com sucesso.')
      }
      setErrors({})
      setEditReasonError(null)
      if (mode !== 'EDIT') setValues(emptyValues(data.entryDate))
      return true
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Não foi possível salvar o apontamento localmente.')
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    mode,
    values,
    errors,
    editReasonError,
    isLoading,
    isSubmitting,
    submitError,
    successMessage,
    setField,
    submit,
  }
}
