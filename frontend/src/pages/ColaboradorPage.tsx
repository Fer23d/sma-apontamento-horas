import { Link, useSearchParams } from 'react-router-dom'
import { PageContainer } from '../components/PageContainer'
import { DailyEntryList } from '../features/collaborator/DailyEntryList'
import { SummaryCard } from '../features/collaborator/SummaryCard'
import { useCollaboratorDashboard } from '../features/collaborator/useCollaboratorDashboard'
import { MonthlyCalendar } from '../features/calendar/MonthlyCalendar'
import { DayDetails } from '../features/calendar/DayDetails'
import { useSession } from '../features/session/useSession'
import { formatMinutes, formatSignedMinutes } from '../features/time-entries/domain'
import { demoAssignmentSnapshot, demoWorkloadVersions } from '../mocks/demoData'
import { getCorporateToday, getMonthKey } from '../shared/utils/date'

export function ColaboradorPage() {
  const { profile } = useSession()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedDate = searchParams.get('date') ?? getCorporateToday()
  const monthKey = getMonthKey(selectedDate)
  const dashboard = useCollaboratorDashboard(selectedDate, monthKey)

  if (!profile) return null
  const dailyMinutes = demoWorkloadVersions.at(-1)?.dailyMinutes ?? 0

  return (
    <PageContainer
      title={`Olá, ${profile.name}`}
      description={`${profile.jobTitle} · ${demoAssignmentSnapshot.squadName} · Supervisão: ${demoAssignmentSnapshot.supervisorName}. Carga vigente ${formatMinutes(dailyMinutes)}.`}
      contained={false}
    >
      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <Link to="/colaborador/apontamentos/novo" className="rounded-xl bg-sma-navy px-4 py-3 text-center text-sm font-bold text-white dark:bg-sma-green dark:text-sma-navy">Novo apontamento</Link>
          <Link to="/colaborador/historico" className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-bold text-sma-navy dark:border-slate-700 dark:bg-slate-900 dark:text-white">Consultar histórico</Link>
          <Link to="/colaborador/folgas" className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-bold text-sma-navy dark:border-slate-700 dark:bg-slate-900 dark:text-white">Minhas folgas</Link>
        </div>

        {dashboard.isLoading && <p className="rounded-2xl bg-white p-8 text-center font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300" aria-live="polite">Carregando visão geral…</p>}
        {dashboard.error && <div role="alert" className="rounded-2xl border border-red-300 bg-red-50 p-5 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"><p>{dashboard.error}</p><button type="button" onClick={() => void dashboard.reload()} className="mt-3 font-bold underline">Tentar novamente</button></div>}
        {dashboard.data && !dashboard.isLoading && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard label="Saldo de hoje" value={formatSignedMinutes(dashboard.data.todaySummary.balanceMinutes)} helper="Resultado real até o dia corporativo atual." tone={dashboard.data.todaySummary.balanceMinutes >= 0 ? 'positive' : 'warning'} />
              <SummaryCard label="Saldo do mês" value={formatSignedMinutes(dashboard.data.monthSummary.realBalanceMinutes)} helper={`${formatMinutes(dashboard.data.monthSummary.workedMinutes)} apontadas no período.`} tone={dashboard.data.monthSummary.realBalanceMinutes >= 0 ? 'positive' : 'warning'} />
              <SummaryCard label="Saldo total acumulado" value={formatSignedMinutes(dashboard.data.totalSummary.realBalanceMinutes)} helper="Acumulado desde a primeira carga demonstrativa vigente." tone={dashboard.data.totalSummary.realBalanceMinutes >= 0 ? 'positive' : 'warning'} />
              <SummaryCard label="Projeção futura" value={formatSignedMinutes(dashboard.data.monthSummary.projectedBalanceMinutes)} helper="Separada do saldo real; considera datas futuras visíveis." />
            </div>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Pendências e ações">
              <article className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30"><p className="text-sm font-bold text-red-900 dark:text-red-100">Dias pendentes</p><p className="mt-2 text-2xl font-extrabold">{dashboard.data.attention.pendingDays}</p></article>
              <article className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30"><p className="text-sm font-bold text-blue-900 dark:text-blue-100">Disponíveis para aprovação</p><p className="mt-2 text-2xl font-extrabold">{dashboard.data.attention.availableForApprovalDays}</p></article>
              <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30"><p className="text-sm font-bold text-amber-900 dark:text-amber-100">Correções solicitadas</p><p className="mt-2 text-2xl font-extrabold">{dashboard.data.attention.correctionRequestedDays}</p></article>
              <article className="rounded-2xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950/30"><p className="text-sm font-bold text-violet-900 dark:text-violet-100">Folgas pendentes</p><p className="mt-2 text-2xl font-extrabold">{dashboard.data.pendingTimeOffRequests}</p></article>
            </section>

            {dashboard.data.approvals.some((approval) => approval.status === 'CORRECTION_REQUESTED') && (
              <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/40" aria-labelledby="corrections-title">
                <h2 id="corrections-title" className="font-extrabold text-amber-950 dark:text-amber-100">Correções que exigem sua atenção</h2>
                <ul className="mt-3 space-y-2 text-sm text-amber-900 dark:text-amber-100">
                  {dashboard.data.approvals.filter((approval) => approval.status === 'CORRECTION_REQUESTED').map((approval) => (
                    <li key={approval.id}><strong>{approval.entryDate}:</strong> {approval.correctionReason ?? 'Consulte os detalhes do dia.'}</li>
                  ))}
                </ul>
              </section>
            )}

            <MonthlyCalendar
              monthKey={monthKey}
              selectedDate={selectedDate}
              days={dashboard.data.calendarDays}
              onMonthChange={(nextMonth) => setSearchParams({ date: `${nextMonth}-01` })}
              onSelectDate={(date) => setSearchParams({ date })}
            />
            <DayDetails summary={dashboard.data.selectedSummary} events={dashboard.data.selectedEvents} timeOffRequests={dashboard.data.selectedTimeOffRequests} approval={dashboard.data.selectedApproval} />
            <DailyEntryList entries={dashboard.data.selectedEntries} date={selectedDate} />
          </>
        )}
      </div>
    </PageContainer>
  )
}
