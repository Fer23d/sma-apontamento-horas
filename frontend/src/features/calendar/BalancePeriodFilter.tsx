import type { FormEvent } from 'react'

type BalancePeriodFilterProps = {
  startDate: string
  endDate: string
  isCustomRange: boolean
  onChange: (field: 'startDate' | 'endDate', value: string) => void
  onApply: () => void
  onClear: () => void
}

export function BalancePeriodFilter({ startDate, endDate, isCustomRange, onChange, onApply, onClear }: BalancePeriodFilterProps) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onApply()
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto] dark:border-slate-800 dark:bg-slate-900" aria-label="Selecionar período dos saldos">
      <label htmlFor="balance-start-date" className="text-sm font-bold text-slate-700 dark:text-slate-200">Data inicial<input id="balance-start-date" type="date" value={startDate} onChange={(event) => onChange('startDate', event.target.value)} className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-normal text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" required /></label>
      <label htmlFor="balance-end-date" className="text-sm font-bold text-slate-700 dark:text-slate-200">Data final<input id="balance-end-date" type="date" value={endDate} onChange={(event) => onChange('endDate', event.target.value)} className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-normal text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" required /></label>
      <button type="submit" className="self-end rounded-xl bg-sma-navy px-4 py-2.5 text-sm font-bold text-white dark:bg-sma-green dark:text-sma-navy">Aplicar intervalo</button>
      <button type="button" onClick={onClear} disabled={!isCustomRange} className="self-end rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200">Usar mês do calendário</button>
    </form>
  )
}
