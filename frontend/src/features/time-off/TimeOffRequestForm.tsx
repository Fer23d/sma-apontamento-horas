import type { FormEvent } from 'react'
import { fieldClassName } from '../time-entries/TimeEntryFields'

type TimeOffRequestFormProps = {
  date: string
  reason: string
  minDate: string
  isSubmitting: boolean
  onDateChange: (date: string) => void
  onReasonChange: (reason: string) => void
  onSubmit: () => void
}

export function TimeOffRequestForm({ date, reason, minDate, isSubmitting, onDateChange, onReasonChange, onSubmit }: TimeOffRequestFormProps) {
  const handleSubmit = (event: FormEvent) => { event.preventDefault(); onSubmit() }
  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border ui-border ui-surface p-5 shadow-sm">
      <div className="flex flex-col gap-1"><h2 className="text-lg font-extrabold ui-heading">Solicitar folga futura</h2><p className="text-sm ui-text-subtle">A solicitação será vinculada à sua squad atual e começará como <strong>Pendente de aprovação</strong>.</p></div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div><label htmlFor="time-off-date" className="text-sm font-bold ui-text">Data da folga</label><input id="time-off-date" type="date" min={minDate} value={date} onChange={(event) => onDateChange(event.target.value)} className={fieldClassName} required /></div>
        <div><label htmlFor="time-off-reason" className="text-sm font-bold ui-text">Justificativa</label><textarea id="time-off-reason" rows={3} value={reason} onChange={(event) => onReasonChange(event.target.value)} className={fieldClassName} required /></div>
      </div>
      <div className="mt-5 flex justify-end"><button type="submit" disabled={isSubmitting} className="rounded-xl ui-button-primary px-5 py-3 text-sm font-bold disabled:opacity-60">{isSubmitting ? 'Enviando…' : 'Solicitar folga'}</button></div>
    </form>
  )
}
