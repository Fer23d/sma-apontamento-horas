import type { TimeOffRequest } from './types'
import { formatDatePtBr } from '../../shared/utils/date'

const statusLabels: Record<TimeOffRequest['status'], string> = {
  PENDING: 'Pendente de aprovação', APPROVED: 'Aprovada', REJECTED: 'Rejeitada', CANCELLED: 'Cancelada',
}

export function TimeOffRequestList({ requests, today, onRemovePending, onCancelApproved }: {
  requests: TimeOffRequest[]
  today: string
  onRemovePending: (request: TimeOffRequest) => void
  onCancelApproved: (request: TimeOffRequest) => void
}) {
  if (requests.length === 0) return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900"><p className="font-bold text-sma-navy dark:text-white">Nenhuma solicitação de folga.</p><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Suas solicitações futuras e anteriores aparecerão aqui.</p></div>
  return (
    <section className="space-y-3" aria-labelledby="time-off-list-title">
      <h2 id="time-off-list-title" className="text-lg font-extrabold text-sma-navy dark:text-white">Minhas solicitações</h2>
      {requests.map((request) => {
        const isFuture = request.date > today
        return (
          <article key={request.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div><div className="flex flex-wrap items-center gap-2"><h3 className="font-extrabold text-sma-navy dark:text-white">{formatDatePtBr(request.date)}</h3><span className="rounded-full border border-slate-300 px-2.5 py-1 text-xs font-bold dark:border-slate-700">{statusLabels[request.status]}</span></div><p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{request.reason}</p><p className="mt-2 text-xs text-slate-500">Squad registrada: {request.assignmentSnapshot?.squadName ?? 'Não disponível'} · Supervisor: {request.assignmentSnapshot?.supervisorName ?? 'Não disponível'}</p>{request.cancellationReason && <p className="mt-2 text-xs text-slate-500">Motivo do cancelamento: {request.cancellationReason}</p>}</div>
              <div className="shrink-0">{request.status === 'PENDING' && isFuture && <button type="button" onClick={() => onRemovePending(request)} className="rounded-xl border border-red-300 px-3 py-2 text-sm font-bold text-red-700 dark:border-red-800 dark:text-red-300">Excluir solicitação</button>}{request.status === 'APPROVED' && isFuture && <button type="button" onClick={() => onCancelApproved(request)} className="rounded-xl border border-red-300 px-3 py-2 text-sm font-bold text-red-700 dark:border-red-800 dark:text-red-300">Cancelar folga</button>}</div>
            </div>
          </article>
        )
      })}
    </section>
  )
}
