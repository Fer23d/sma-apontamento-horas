import { formatDatePtBr } from '../../shared/utils/date'
import { formatMinutes } from '../time-entries/domain'
import type { WorkloadChangeRequest, WorkloadVersion } from './types'

type WorkloadHistoryProps = {
  versions: WorkloadVersion[]
  requests: WorkloadChangeRequest[]
}

const requestStatus: Record<WorkloadChangeRequest['status'], string> = {
  PENDING: 'Pendente', APPROVED: 'Aprovada', REJECTED: 'Rejeitada', CANCELLED: 'Cancelada',
}

export function WorkloadHistory({ versions, requests }: WorkloadHistoryProps) {
  return (
    <section className="grid gap-6 xl:grid-cols-2" aria-label="Cargas e solicitações">
      <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
        <h2 className="text-lg font-extrabold text-sma-navy dark:text-white">Histórico de cargas</h2>
        {versions.length === 0 ? <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Nenhuma carga cadastrada.</p> : (
          <ul className="mt-4 space-y-3">
            {[...versions].sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom)).map((version) => (
              <li key={version.id} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
                <strong className="text-sma-navy dark:text-white">{formatMinutes(version.dailyMinutes)} por dia</strong>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Vigente desde {formatDatePtBr(version.effectiveFrom)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
        <h2 className="text-lg font-extrabold text-sma-navy dark:text-white">Solicitações de alteração</h2>
        {requests.length === 0 ? <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Nenhuma solicitação enviada.</p> : (
          <ul className="mt-4 space-y-3">
            {requests.map((request) => (
              <li key={request.id} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-sma-navy dark:text-white">{formatMinutes(request.requestedDailyMinutes)} por dia</strong>
                  <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-800 dark:bg-slate-700 dark:text-slate-100">{requestStatus[request.status]}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Início pretendido: {formatDatePtBr(request.requestedEffectiveFrom)}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Justificativa: {request.justification}</p>
                {request.rejectionReason && <p className="mt-2 text-sm font-semibold text-red-700 dark:text-red-300">Motivo: {request.rejectionReason}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
