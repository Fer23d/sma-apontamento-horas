import { demoActivities, demoClients } from '../../mocks/demoData'
import type { TimeEntry } from '../../shared/types/domain'
import { formatMinutes } from '../time-entries/domain'

export function DailyEntryList({ entries }: { entries: TimeEntry[] }) {
  const activeEntries = entries.filter((entry) => entry.status === 'ACTIVE')

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900" aria-labelledby="daily-entries-title">
      <div className="border-b border-slate-200 p-5 dark:border-slate-800">
        <div>
          <h2 id="daily-entries-title" className="text-lg font-extrabold text-sma-navy dark:text-white">Apontamentos do dia</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Somente seus registros ativos para a data selecionada.</p>
        </div>
      </div>

      {activeEntries.length === 0 ? (
        <div className="p-8 text-center">
          <p className="font-bold text-slate-700 dark:text-slate-200">Nenhum apontamento registrado neste dia.</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Registre a primeira atividade para atualizar o resumo.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {activeEntries.map((entry) => {
            const client = demoClients.find((item) => item.id === entry.clientId)
            const activity = demoActivities.find((item) => item.id === entry.activityId)
            return (
              <li key={entry.id} className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-bold text-sma-navy dark:text-white">Número do projeto: {entry.projectCode}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{client?.name} · {activity?.name}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">{entry.details}</p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-slate-100 px-3 py-2 text-sm font-extrabold text-sma-navy dark:bg-slate-800 dark:text-sma-green">{formatMinutes(entry.durationMinutes)}</span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
