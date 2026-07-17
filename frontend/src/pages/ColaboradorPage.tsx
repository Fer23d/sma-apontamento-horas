import { useSearchParams } from 'react-router-dom'
import { PageContainer } from '../components/PageContainer'
import { DailyEntryList } from '../features/collaborator/DailyEntryList'
import { SummaryCard } from '../features/collaborator/SummaryCard'
import { useDailyDashboard } from '../features/collaborator/useDailyDashboard'
import { useSession } from '../features/session/useSession'
import { formatMinutes, formatSignedMinutes, getExpectedMinutesForDate } from '../features/time-entries/domain'
import { formatDatePtBr, getTodayIsoDate } from '../shared/utils/date'

export function ColaboradorPage() {
  const { profile } = useSession()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedDate = searchParams.get('date') ?? getTodayIsoDate()
  const { entries, summary, isLoading, error, reload } = useDailyDashboard(selectedDate)

  if (!profile) return null
  const expectedToday = getExpectedMinutesForDate(selectedDate, profile.workSchedule)

  return (
    <PageContainer
      title={`Olá, ${profile.name}`}
      description={`${profile.jobTitle} · Squad ${profile.squadName}. Resumo provisório de ${formatDatePtBr(selectedDate)}.`}
      contained={false}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
          <label htmlFor="summary-date" className="text-sm font-bold text-sma-navy dark:text-white">Data do resumo</label>
          <input
            id="summary-date"
            type="date"
            value={selectedDate}
            onChange={(event) => setSearchParams({ date: event.target.value })}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {isLoading && <p className="rounded-2xl bg-white p-6 text-center font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300" aria-live="polite">Carregando resumo diário…</p>}
        {error && (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-5 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200" role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => void reload()} className="mt-3 font-bold underline">Tentar novamente</button>
          </div>
        )}
        {!isLoading && !error && summary && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard label="Jornada prevista" value={formatMinutes(summary.expectedMinutes)} helper={expectedToday === 0 ? 'Sem jornada prevista para este dia.' : 'Jornada demonstrativa do perfil.'} />
              <SummaryCard label="Horas apontadas" value={formatMinutes(summary.workedMinutes)} helper={`${formatMinutes(summary.regularMinutes)} regulares · ${formatMinutes(summary.extraMinutes)} excedentes`} />
              <SummaryCard
                label={summary.extraMinutes > 0 ? 'Excedente do dia' : 'Horas faltantes do dia'}
                value={formatMinutes(summary.extraMinutes > 0 ? summary.extraMinutes : summary.missingMinutes)}
                helper={summary.balanceMinutes === 0 ? 'Jornada prevista atingida.' : summary.balanceMinutes > 0 ? 'Tempo acima da jornada prevista.' : 'Tempo necessário para completar a jornada.'}
                tone={summary.balanceMinutes === 0 ? 'positive' : 'warning'}
              />
              <SummaryCard label="Saldo provisório" value={formatSignedMinutes(summary.balanceMinutes)} helper="Prévia local, ainda não oficial ou homologada." tone={summary.balanceMinutes >= 0 ? 'positive' : 'warning'} />
            </div>
            <DailyEntryList entries={entries} date={selectedDate} />
          </>
        )}
      </div>
    </PageContainer>
  )
}
