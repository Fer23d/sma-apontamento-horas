import type { FormEvent } from 'react'

export type WorkloadFormField = 'hours' | 'minutes' | 'effectiveFrom' | 'justification'

type WorkloadRequestFormProps = {
  hours: string
  minutes: string
  effectiveFrom: string
  justification: string
  minDate: string
  isSubmitting: boolean
  isInitial?: boolean
  onFieldChange: (field: WorkloadFormField, value: string) => void
  onSubmit: () => void
}

export function WorkloadRequestForm({ hours, minutes, effectiveFrom, justification, minDate, isSubmitting, isInitial = false, onFieldChange, onSubmit }: WorkloadRequestFormProps) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit()
  }

  return (
    <section className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700" aria-labelledby="workload-form-title">
      <h2 id="workload-form-title" className="text-lg font-extrabold text-sma-navy dark:text-white">
        {isInitial ? 'Cadastrar carga diária inicial' : 'Solicitar alteração de carga'}
      </h2>
      <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
        <fieldset className="sm:col-span-2">
          <legend className="text-sm font-bold text-slate-700 dark:text-slate-200">Nova carga diária</legend>
          <div className="mt-2 flex max-w-sm gap-3">
            <label className="flex-1 text-sm text-slate-600 dark:text-slate-300">
              Horas
              <input aria-label="Horas da carga diária" type="number" min="0" max="24" inputMode="numeric" value={hours} onChange={(event) => onFieldChange('hours', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white" required />
            </label>
            <label className="flex-1 text-sm text-slate-600 dark:text-slate-300">
              Minutos
              <input aria-label="Minutos da carga diária" type="number" min="0" max="59" inputMode="numeric" value={minutes} onChange={(event) => onFieldChange('minutes', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white" required />
            </label>
          </div>
        </fieldset>
        <label htmlFor="workload-effective-from" className="text-sm font-bold text-slate-700 dark:text-slate-200">
          Início pretendido
          <input id="workload-effective-from" type="date" min={minDate} value={effectiveFrom} onChange={(event) => onFieldChange('effectiveFrom', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white" required />
        </label>
        <label htmlFor="workload-justification" className="text-sm font-bold text-slate-700 dark:text-slate-200">
          {isInitial ? 'Observação' : 'Justificativa'}
          <textarea id="workload-justification" value={justification} onChange={(event) => onFieldChange('justification', event.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white" required={!isInitial} />
        </label>
        <div className="sm:col-span-2">
          <button type="submit" disabled={isSubmitting} className="rounded-xl bg-sma-navy px-5 py-3 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60 dark:bg-sma-green dark:text-sma-navy">
            {isSubmitting ? 'Salvando…' : isInitial ? 'Cadastrar carga' : 'Enviar solicitação'}
          </button>
        </div>
      </form>
    </section>
  )
}
