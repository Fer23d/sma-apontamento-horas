import type { TimeOffRequest } from './types'
import { formatDatePtBr } from '../../shared/utils/date'
import { StatusBadge } from '../../components/StatusBadge'
import { timeOffStatusPresentation } from '../status/presentation'

export function TimeOffRequestList({ requests, today, onRemovePending, onCancelApproved }: {
  requests: TimeOffRequest[]
  today: string
  onRemovePending: (request: TimeOffRequest) => void
  onCancelApproved: (request: TimeOffRequest) => void
}) {
  if (requests.length === 0) return <div className="rounded-2xl border border-dashed ui-border ui-surface p-10 text-center"><p className="font-bold ui-heading">Nenhuma solicitação de folga.</p><p className="mt-2 text-sm ui-text-subtle">Suas solicitações futuras e anteriores aparecerão aqui.</p></div>
  return (
    <section className="space-y-3" aria-labelledby="time-off-list-title">
      <h2 id="time-off-list-title" className="text-lg font-extrabold ui-heading">Minhas solicitações</h2>
      {requests.map((request) => {
        const isFuture = request.date > today
        const statusPresentation = timeOffStatusPresentation[request.status]
        return (
          <article key={request.id} className="rounded-2xl border ui-border ui-surface p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div><div className="flex flex-wrap items-center gap-2"><h3 className="font-extrabold ui-heading">{formatDatePtBr(request.date)}</h3><StatusBadge tone={statusPresentation.tone}>{statusPresentation.label}</StatusBadge></div><p className="mt-2 text-sm ui-text">{request.reason}</p><p className="mt-2 text-xs ui-text-subtle">Squad registrada: {request.assignmentSnapshot?.squadName ?? 'Não disponível'} · Supervisor: {request.assignmentSnapshot?.supervisorName ?? 'Não disponível'}</p>{request.rejectionReason && <p className="mt-2 text-xs ui-text-subtle">Motivo da rejeição: {request.rejectionReason}</p>}{request.cancellationReason && <p className="mt-2 text-xs ui-text-subtle">Motivo do cancelamento: {request.cancellationReason}</p>}</div>
              <div className="shrink-0">{request.status === 'PENDING' && isFuture && <button type="button" onClick={() => onRemovePending(request)} className="rounded-xl border border-red-300 px-3 py-2 text-sm font-bold text-red-700 dark:border-red-800 dark:text-red-300">Excluir solicitação</button>}{request.status === 'APPROVED' && isFuture && <button type="button" onClick={() => onCancelApproved(request)} className="rounded-xl border border-red-300 px-3 py-2 text-sm font-bold text-red-700 dark:border-red-800 dark:text-red-300">Cancelar folga</button>}</div>
            </div>
          </article>
        )
      })}
    </section>
  )
}
