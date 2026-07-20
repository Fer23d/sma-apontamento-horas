import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { demoActivities, demoClients } from '../../mocks/demoData'
import { timeEntryService } from '../../services/timeEntryService'
import type { CreateTimeEntryData, TimeEntryValidationErrors } from '../../shared/types/domain'
import { getTodayIsoDate } from '../../shared/utils/date'
import { useSession } from '../session/useSession'
import { areValidDurationParts, hoursAndMinutesToMinutes, validateTimeEntry } from './domain'

const fieldClassName = 'mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sma-green-dark focus:ring-2 focus:ring-sma-green/30 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:disabled:bg-slate-900'

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return <p id={id} className="mt-1.5 text-sm font-medium text-red-700 dark:text-red-300">{message}</p>
}

export function TimeEntryForm() {
  const { profile } = useSession()
  const [searchParams] = useSearchParams()
  const [entryDate, setEntryDate] = useState(searchParams.get('date') ?? getTodayIsoDate())
  const [clientId, setClientId] = useState('')
  const [projectCode, setProjectCode] = useState('')
  const [activityId, setActivityId] = useState('')
  const [disciplineCode, setDisciplineCode] = useState<CreateTimeEntryData['disciplineCode'] | ''>('')
  const [documentTypeCode, setDocumentTypeCode] = useState<CreateTimeEntryData['documentTypeCode'] | ''>('')
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [details, setDetails] = useState('')
  const [errors, setErrors] = useState<TimeEntryValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [savedDate, setSavedDate] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!profile || isSubmitting) return
    setSubmitError(null)
    setSavedDate(null)

    const durationHours = Number(hours || 0)
    const durationRemainderMinutes = Number(minutes || 0)
    const data: CreateTimeEntryData = {
      entryDate,
      clientId,
      projectCode: projectCode.trim(),
      activityId,
      disciplineCode: disciplineCode as CreateTimeEntryData['disciplineCode'],
      documentTypeCode: documentTypeCode as CreateTimeEntryData['documentTypeCode'],
      durationMinutes: hoursAndMinutesToMinutes(durationHours, durationRemainderMinutes),
      details,
    }
    const validationErrors = validateTimeEntry(data, demoClients, demoActivities)
    if (!areValidDurationParts(durationHours, durationRemainderMinutes)) {
      validationErrors.durationMinutes = 'Informe horas inteiras entre 0 e 24 e minutos inteiros entre 0 e 59, com total máximo de 24 horas.'
    }
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setIsSubmitting(true)
    try {
      await timeEntryService.create(profile.id, data)
      setSavedDate(entryDate)
      setClientId('')
      setProjectCode('')
      setActivityId('')
      setDisciplineCode('')
      setDocumentTypeCode('')
      setHours('')
      setMinutes('')
      setDetails('')
      setErrors({})
    } catch (error) {
      console.error('Falha ao salvar apontamento.', error)
      setSubmitError('Não foi possível salvar o apontamento localmente. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {savedDate && (
        <div role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
          <p className="font-bold">Apontamento salvo com sucesso.</p>
          <Link className="mt-2 inline-block font-bold underline" to={`/colaborador?date=${savedDate}`}>Ver resumo atualizado do dia</Link>
        </div>
      )}
      {submitError && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-semibold text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">{submitError}</p>}

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="entry-date" className="text-sm font-bold text-slate-800 dark:text-slate-200">Data</label>
          <input id="entry-date" type="date" value={entryDate} onChange={(event) => setEntryDate(event.target.value)} className={fieldClassName} aria-invalid={Boolean(errors.entryDate)} aria-describedby={errors.entryDate ? 'entry-date-error' : undefined} />
          <FieldError id="entry-date-error" message={errors.entryDate} />
        </div>

        <div>
          <label htmlFor="client" className="text-sm font-bold text-slate-800 dark:text-slate-200">Cliente</label>
          <select
            id="client"
            value={clientId}
            onChange={(event) => setClientId(event.target.value)}
            className={fieldClassName}
            aria-invalid={Boolean(errors.clientId)}
            aria-describedby={errors.clientId ? 'client-error' : undefined}
          >
            <option value="">Selecione um cliente</option>
            {demoClients.filter((client) => client.active).map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
          </select>
          <FieldError id="client-error" message={errors.clientId} />
        </div>

        <div>
          <label htmlFor="project-code" className="text-sm font-bold text-slate-800 dark:text-slate-200">Número do projeto</label>
          <input
            id="project-code"
            type="text"
            value={projectCode}
            onChange={(event) => setProjectCode(event.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className={fieldClassName}
            aria-invalid={Boolean(errors.projectCode)}
            aria-describedby={errors.projectCode ? 'project-code-help project-code-error' : 'project-code-help'}
          />
          <p id="project-code-help" className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">* Escreva exatamente a numeração do projeto atual, caso já possua.</p>
          <FieldError id="project-code-error" message={errors.projectCode} />
        </div>

        <div>
          <label htmlFor="activity" className="text-sm font-bold text-slate-800 dark:text-slate-200">Atividade</label>
          <select id="activity" value={activityId} onChange={(event) => setActivityId(event.target.value)} className={fieldClassName} aria-invalid={Boolean(errors.activityId)} aria-describedby={errors.activityId ? 'activity-error' : undefined}>
            <option value="">Selecione uma atividade</option>
            {demoActivities.filter((activity) => activity.active).map((activity) => <option key={activity.id} value={activity.id}>{activity.name}</option>)}
          </select>
          <FieldError id="activity-error" message={errors.activityId} />
        </div>

        <div>
          <label htmlFor="discipline" className="text-sm font-bold text-slate-800 dark:text-slate-200">Disciplina</label>
          <select id="discipline" value={disciplineCode} onChange={(event) => setDisciplineCode(event.target.value as CreateTimeEntryData['disciplineCode'])} className={fieldClassName} aria-invalid={Boolean(errors.disciplineCode)} aria-describedby={errors.disciplineCode ? 'discipline-error' : undefined}>
            <option value="">Selecione uma disciplina</option>
            <option value="—">— — Não se aplica</option>
            <option value="A">A — Automação</option>
            <option value="E">E — Elétrica</option>
          </select>
          <FieldError id="discipline-error" message={errors.disciplineCode} />
        </div>

        <div>
          <label htmlFor="document-type" className="text-sm font-bold text-slate-800 dark:text-slate-200">Tipo de documento</label>
          <select id="document-type" value={documentTypeCode} onChange={(event) => setDocumentTypeCode(event.target.value as CreateTimeEntryData['documentTypeCode'])} className={fieldClassName} aria-invalid={Boolean(errors.documentTypeCode)} aria-describedby={errors.documentTypeCode ? 'document-type-error' : undefined}>
            <option value="">Selecione um tipo</option>
            {[
              ['—', '— — Não se aplica'], ['RN', 'RN — Reunião'], ['GR', 'GR — Gerenciamento'], ['G', 'G — Geral'],
              ['FD', 'FD — Folha de Dados'], ['DE', 'DE — Desenho'], ['LM', 'LM — Lista de Material'], ['DI', 'DI — Diagrama'],
              ['LC', 'LC — Lista de Cabos'], ['LI', 'LI — Lista de Instrumentos'], ['ET', 'ET — Especificação Técnica'],
              ['MC', 'MC — Memória de Cálculo'], ['MO', 'MO — Modelo 3D'], ['MD', 'MD — Memorial Descritivo'],
              ['FG', 'FG — Fluxograma'], ['LA', 'LA — Lista de Cargas'], ['ES', 'ES — Relação de Entradas e Saídas'],
              ['CF', 'CF — Arquitetura de Rede'],
            ].map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <FieldError id="document-type-error" message={errors.documentTypeCode} />
        </div>
      </div>

      <fieldset>
        <legend className="text-sm font-bold text-slate-800 dark:text-slate-200">Duração</legend>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Informe horas e minutos dedicados, com limite provisório de 24 horas.</p>
        <div className="mt-2 grid max-w-sm grid-cols-2 gap-3">
          <div>
            <label htmlFor="duration-hours" className="text-xs font-semibold text-slate-600 dark:text-slate-400">Horas</label>
            <input id="duration-hours" type="number" min="0" max="24" step="1" inputMode="numeric" value={hours} onChange={(event) => setHours(event.target.value)} className={fieldClassName} aria-invalid={Boolean(errors.durationMinutes)} aria-describedby={errors.durationMinutes ? 'duration-error' : undefined} />
          </div>
          <div>
            <label htmlFor="duration-minutes" className="text-xs font-semibold text-slate-600 dark:text-slate-400">Minutos</label>
            <input id="duration-minutes" type="number" min="0" max="59" step="1" inputMode="numeric" value={minutes} onChange={(event) => setMinutes(event.target.value)} className={fieldClassName} aria-invalid={Boolean(errors.durationMinutes)} aria-describedby={errors.durationMinutes ? 'duration-error' : undefined} />
          </div>
        </div>
        <FieldError id="duration-error" message={errors.durationMinutes} />
      </fieldset>

      <div>
        <label htmlFor="details" className="text-sm font-bold text-slate-800 dark:text-slate-200">Detalhamento</label>
        <textarea id="details" rows={5} value={details} onChange={(event) => setDetails(event.target.value)} className={fieldClassName} placeholder="Descreva objetivamente o trabalho realizado" aria-invalid={Boolean(errors.details)} aria-describedby={errors.details ? 'details-error' : 'details-help'} />
        <p id="details-help" className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">Não inclua senhas, dados pessoais ou informações sensíveis.</p>
        <FieldError id="details-error" message={errors.details} />
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end dark:border-slate-800">
        <Link to={`/colaborador?date=${entryDate}`} className="rounded-xl border border-slate-300 px-5 py-3 text-center text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Voltar à visão geral</Link>
        <button type="submit" disabled={isSubmitting} className="rounded-xl bg-sma-navy px-6 py-3 text-sm font-bold text-white hover:bg-sma-navy-dark disabled:cursor-not-allowed disabled:opacity-60 dark:bg-sma-green dark:text-sma-navy">
          {isSubmitting ? 'Salvando…' : 'Salvar apontamento'}
        </button>
      </div>
    </form>
  )
}
