import type { DayApproval } from '../approvals/types'
import type { CalendarEvent, DailySummary } from './types'
import { formatDatePtBr } from '../../shared/utils/date'
import { formatMinutes, formatSignedMinutes } from '../time-entries/domain'
import type { TimeOffRequest } from '../time-off/types'
import { CalendarStateBadge } from './CalendarStateBadge'

const approvalLabels: Record<DayApproval['status'], string> = {
  IN_PROGRESS: 'Em andamento', AVAILABLE_FOR_APPROVAL: 'Disponível para aprovação', CORRECTION_REQUESTED: 'Correção solicitada',
  APPROVED: 'Aprovado', REOPENED: 'Reaberto', NO_SUBMISSION: 'Sem apontamento enviado',
}

const eventLabels: Record<CalendarEvent['type'], string> = {
  HOLIDAY: 'Feriado', VACATION: 'Férias', MEDICAL_LEAVE_FULL: 'Afastamento integral', MEDICAL_LEAVE_PARTIAL: 'Afastamento parcial',
}

export function DayDetails({ summary, events, approval, timeOffRequests = [] }: { summary: DailySummary; events: CalendarEvent[]; approval: DayApproval; timeOffRequests?: TimeOffRequest[] }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900" aria-labelledby="day-details-title">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-wider text-sma-green-dark dark:text-sma-green">Detalhes do dia</p><h2 id="day-details-title" className="mt-1 text-lg font-extrabold text-sma-navy dark:text-white">{formatDatePtBr(summary.date)}</h2></div>
        <div className="flex flex-wrap items-center gap-2">
          <CalendarStateBadge state={summary.visualState} />
          <span className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200">{approvalLabels[approval.status]}</span>
        </div>
      </div>
      <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Apontado', formatMinutes(summary.workedMinutes)], ['Jornada esperada', formatMinutes(summary.expectedMinutes)],
          ['Horas justificadas', formatMinutes(summary.justifiedMinutes)], ['Saldo do dia', formatSignedMinutes(summary.balanceMinutes)],
        ].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><dt className="text-xs font-bold uppercase text-slate-500">{label}</dt><dd className="mt-1 font-extrabold text-sma-navy dark:text-white">{value}</dd></div>)}
      </dl>
      {summary.hasIntegralEventConflict && <p role="alert" className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"><strong>Conflito com evento integral:</strong> o apontamento foi preservado para auditoria, não participa do saldo e permanece somente leitura até futura resolução pela supervisão.</p>}
      {events.length > 0 && <div className="mt-4"><h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Eventos do dia</h3><ul className="mt-2 space-y-2">{events.map((event) => <li key={event.id} className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700"><strong>{eventLabels[event.type]}:</strong> {event.title}{event.justifiedMinutes ? ` · ${formatMinutes(event.justifiedMinutes)} justificadas` : ''}</li>)}</ul></div>}
      {timeOffRequests.length > 0 && <div className="mt-4"><h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Folga</h3>{timeOffRequests.map((request) => <p key={request.id} className="mt-2 rounded-xl border border-slate-300 bg-slate-100 p-3 text-sm dark:border-slate-700 dark:bg-slate-800"><strong>{request.status === 'APPROVED' ? 'Folga confirmada' : 'Solicitação de folga'}:</strong> {request.reason}</p>)}</div>}
      {approval.correctionReason && <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"><strong>Correção solicitada:</strong> {approval.correctionReason}</p>}
      {approval.deficitJustification && <p className="mt-4 text-sm text-slate-600 dark:text-slate-300"><strong>Justificativa da aprovação com déficit:</strong> {approval.deficitJustification}</p>}
    </section>
  )
}
