import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { demoActivities, demoClients } from '../../mocks/demoData'
import { formatDatePtBr } from '../../shared/utils/date'
import { formatMinutes } from '../time-entries/domain'
import type { HistoryRow } from './useTimeEntryHistory'
import { useTimeEntryHistory } from './useTimeEntryHistory'
import { HistoryFilters } from './HistoryFilters'
import { fieldClassName } from '../time-entries/TimeEntryFields'
import { formatSignedMinutes } from '../time-entries/domain'
import { getCalendarVisualState } from '../calendar/domain'
import { HistoryPeriodSummary } from './HistoryPeriodSummary'
import { getHistoryEntryActions } from './entryActions'

const approvalLabels = {
  IN_PROGRESS: 'Em andamento', AVAILABLE_FOR_APPROVAL: 'Disponível para aprovação', CORRECTION_REQUESTED: 'Correção solicitada',
  APPROVED: 'Aprovado', REOPENED: 'Reaberto', NO_SUBMISSION: 'Sem apontamento enviado',
} as const

export function TimeEntryHistory() {
  const history = useTimeEntryHistory()
  const [cancelTarget, setCancelTarget] = useState<HistoryRow | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)

  const confirmCancel = async () => {
    if (!cancelTarget || !cancelReason.trim()) return
    setIsCancelling(true)
    try {
      await history.cancel(cancelTarget, cancelReason)
      setCancelTarget(null)
      setCancelReason('')
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <div className="space-y-5">
      <HistoryFilters value={history.draftFilters} onChange={history.setDraftFilters} onApply={history.applyFilters} />
      {history.feedback && <p role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">{history.feedback}</p>}
      {history.error && <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"><p>{history.error}</p><button type="button" onClick={() => void history.reload()} className="mt-2 font-bold underline">Tentar novamente</button></div>}
      {history.isLoading && <p aria-live="polite" className="rounded-2xl bg-white p-8 text-center font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">Carregando histórico…</p>}
      {!history.isLoading && history.periodSummary && <HistoryPeriodSummary summary={history.periodSummary} events={history.periodEvents} timeOffRequests={history.periodTimeOffRequests} />}
      {!history.isLoading && !history.error && history.rows.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900"><p className="font-bold text-sma-navy dark:text-white">Nenhum apontamento encontrado.</p><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Ajuste os filtros ou registre um novo apontamento.</p></div>}
      {!history.isLoading && history.rows.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">{history.total} registro(s) encontrado(s). Exibição paginada de até 10 itens.</p>
          {history.rows.map((row) => {
            const { entry, approval } = row
            const client = demoClients.find((item) => item.id === entry.clientId)?.name ?? 'Cliente não disponível'
            const activity = demoActivities.find((item) => item.id === entry.activityId)?.name ?? 'Atividade não disponível'
            const actions = getHistoryEntryActions({
              entryStatus: entry.status,
              approvalStatus: approval.status,
              canMutate: row.canMutate,
              hasIntegralEventConflict: row.summary.hasIntegralEventConflict,
            })
            return (
              <article key={entry.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-extrabold text-sma-navy dark:text-white">{formatDatePtBr(entry.entryDate)} · Projeto {entry.projectCode}</h2>
                      {entry.status === 'CANCELLED' && <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">Cancelado</span>}
                      <span className="rounded-full border border-slate-300 px-2.5 py-1 text-xs font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200">{approvalLabels[approval.status]}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{client} · {activity} · {formatMinutes(entry.durationMinutes)}</p>
                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                      <div><dt className="font-bold text-slate-500">Disciplina</dt><dd>{entry.disciplineCode}</dd></div>
                      <div><dt className="font-bold text-slate-500">Tipo de documento</dt><dd>{entry.documentTypeCode}</dd></div>
                      <div><dt className="font-bold text-slate-500">Squad registrada</dt><dd>{entry.assignmentSnapshot?.squadName ?? 'Não disponível (legado)'}</dd></div>
                      <div><dt className="font-bold text-slate-500">Supervisor registrado</dt><dd>{entry.assignmentSnapshot?.supervisorName ?? 'Não disponível (legado)'}</dd></div>
                      <div><dt className="font-bold text-slate-500">Situação da jornada</dt><dd>{getCalendarVisualState(row.summary).label}</dd></div>
                      <div><dt className="font-bold text-slate-500">Saldo do dia</dt><dd>{formatSignedMinutes(row.summary.balanceMinutes)}</dd></div>
                    </dl>
                    {(row.events.length > 0 || row.timeOffRequests.length > 0) && <p className="mt-3 text-sm text-slate-600 dark:text-slate-300"><strong>Eventos do dia:</strong> {[...row.events.map((event) => event.title), ...row.timeOffRequests.map((request) => `Folga ${request.status.toLocaleLowerCase('pt-BR')}`)].join(' · ')}</p>}
                    <p className="mt-4 text-sm leading-6 text-slate-700 dark:text-slate-300">{entry.details}</p>
                    {approval.correctionReason && <p className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"><strong>Motivo da correção:</strong> {approval.correctionReason}</p>}
                    {approval.deficitJustification && <p className="mt-3 text-sm text-slate-600 dark:text-slate-300"><strong>Justificativa de aprovação com déficit:</strong> {approval.deficitJustification}</p>}
                    {entry.cancelReason && <p className="mt-3 text-sm text-slate-500"><strong>Motivo do cancelamento:</strong> {entry.cancelReason}</p>}
                    {row.summary.hasIntegralEventConflict && <p role="alert" className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"><strong>Conflito com evento integral:</strong> registro preservado para auditoria e fora do saldo.</p>}
                    <p className="mt-3 text-xs text-slate-500">Versão {entry.version} · última alteração {new Date(entry.updatedAt).toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="flex min-w-44 flex-col gap-2">
                    {actions.edit && <Link to={`/colaborador/apontamentos/${entry.id}/editar`} className="rounded-xl border border-sma-navy px-3 py-2 text-center text-sm font-bold text-sma-navy dark:border-sma-green dark:text-sma-green">Editar</Link>}
                    {actions.duplicate && <Link to={`/colaborador/apontamentos/novo?duplicate=${entry.id}`} className="rounded-xl border border-slate-300 px-3 py-2 text-center text-sm font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200">Duplicar</Link>}
                    {actions.cancel && <button type="button" onClick={() => setCancelTarget(row)} className="rounded-xl border border-red-300 px-3 py-2 text-sm font-bold text-red-700 dark:border-red-800 dark:text-red-300">Cancelar</button>}
                    {actions.completeCorrection && <button type="button" onClick={() => void history.completeCorrection(row)} className="rounded-xl bg-amber-500 px-3 py-2 text-sm font-bold text-slate-950">Concluir correção</button>}
                    {actions.readOnly && <span className="rounded-xl bg-slate-100 px-3 py-2 text-center text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">Somente leitura</span>}
                  </div>
                </div>
              </article>
            )
          })}
          <div className="flex items-center justify-between">
            <button type="button" disabled={!history.hasPreviousPage} onClick={history.previousPage} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold disabled:opacity-40 dark:border-slate-700">Anterior</button>
            <button type="button" disabled={!history.nextCursor} onClick={history.nextPage} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold disabled:opacity-40 dark:border-slate-700">Próxima</button>
          </div>
        </div>
      )}

      <ConfirmDialog open={Boolean(cancelTarget)} title="Cancelar apontamento?" description="O registro será preservado no histórico e deixará de participar dos saldos." confirmLabel="Confirmar cancelamento" isBusy={isCancelling} onCancel={() => { setCancelTarget(null); setCancelReason('') }} onConfirm={() => void confirmCancel()}>
        <label htmlFor="cancel-reason" className="text-sm font-bold text-slate-800 dark:text-slate-200">Motivo do cancelamento</label>
        <textarea id="cancel-reason" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} rows={3} className={fieldClassName} />
      </ConfirmDialog>
    </div>
  )
}
