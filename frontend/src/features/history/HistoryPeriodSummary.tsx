import { formatDatePtBr } from '../../shared/utils/date'
import type { CalendarEvent, PeriodSummary } from '../calendar/types'
import type { TimeOffRequest } from '../time-off/types'
import { formatMinutes, formatSignedMinutes } from '../time-entries/domain'

const eventLabels: Record<CalendarEvent['type'], string> = {
  HOLIDAY: 'Feriado', VACATION: 'Férias', MEDICAL_LEAVE_FULL: 'Afastamento integral', MEDICAL_LEAVE_PARTIAL: 'Afastamento parcial',
}

export function HistoryPeriodSummary({ summary, events, timeOffRequests }: { summary: PeriodSummary; events: CalendarEvent[]; timeOffRequests: TimeOffRequest[] }) {
  const visibleTimeOff = timeOffRequests.filter((request) => request.status !== 'CANCELLED')
  return (
    <section className="space-y-4" aria-labelledby="history-period-title">
      <h2 id="history-period-title" className="sr-only">Resumo do período consultado</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><p className="text-sm font-bold text-slate-500">Saldo real do período</p><p className="mt-2 text-2xl font-extrabold text-sma-navy dark:text-white">{formatSignedMinutes(summary.realBalanceMinutes)}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><p className="text-sm font-bold text-slate-500">Projeção futura</p><p className="mt-2 text-2xl font-extrabold text-sma-navy dark:text-white">{formatSignedMinutes(summary.projectedBalanceMinutes)}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><p className="text-sm font-bold text-slate-500">Jornada ajustada</p><p className="mt-2 text-2xl font-extrabold text-sma-navy dark:text-white">{formatMinutes(summary.expectedMinutes)}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><p className="text-sm font-bold text-slate-500">Horas apontadas</p><p className="mt-2 text-2xl font-extrabold text-sma-navy dark:text-white">{formatMinutes(summary.workedMinutes)}</p></article>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-extrabold text-sma-navy dark:text-white">Eventos do período</h3>
        {events.length === 0 && visibleTimeOff.length === 0 ? <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Nenhum evento encontrado no período.</p> : (
          <ul className="mt-3 grid gap-2 md:grid-cols-2">
            {events.map((event) => <li key={event.id} className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800"><strong>{eventLabels[event.type]}:</strong> {event.title} · {formatDatePtBr(event.startDate)}{event.endDate !== event.startDate ? ` a ${formatDatePtBr(event.endDate)}` : ''}</li>)}
            {visibleTimeOff.map((request) => <li key={request.id} className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800"><strong>{request.status === 'APPROVED' ? 'Folga aprovada' : request.status === 'PENDING' ? 'Folga pendente' : 'Folga rejeitada'}:</strong> {formatDatePtBr(request.date)} · {request.reason}</li>)}
          </ul>
        )}
      </div>
    </section>
  )
}
