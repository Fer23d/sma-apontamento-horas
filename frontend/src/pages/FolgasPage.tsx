import { useState } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { PageContainer } from '../components/PageContainer'
import { addDays } from '../shared/utils/date'
import { TimeOffRequestForm } from '../features/time-off/TimeOffRequestForm'
import { TimeOffRequestList } from '../features/time-off/TimeOffRequestList'
import { useTimeOffRequests } from '../features/time-off/useTimeOffRequests'
import type { TimeOffRequest } from '../features/time-off/types'
import { fieldClassName } from '../features/time-entries/TimeEntryFields'

export function FolgasPage() {
  const controller = useTimeOffRequests()
  const [removeTarget, setRemoveTarget] = useState<TimeOffRequest | null>(null)
  const [cancelTarget, setCancelTarget] = useState<TimeOffRequest | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  return (
    <PageContainer title="Folgas" description="Solicite folgas futuras e acompanhe o encaminhamento para a supervisão da sua squad." contained={false}>
      <div className="space-y-6">
        <TimeOffRequestForm date={controller.date} reason={controller.reason} minDate={addDays(controller.today, 1)} isSubmitting={controller.isSubmitting} onDateChange={controller.setDate} onReasonChange={controller.setReason} onSubmit={() => void controller.create()} />
        {controller.feedback && <p role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">{controller.feedback}</p>}
        {controller.error && <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"><p>{controller.error}</p><button type="button" onClick={() => void controller.reload()} className="mt-2 font-bold underline">Tentar novamente</button></div>}
        {controller.isLoading ? <p aria-live="polite" className="rounded-2xl ui-surface p-8 text-center">Carregando folgas…</p> : <TimeOffRequestList requests={controller.requests} today={controller.today} onRemovePending={setRemoveTarget} onCancelApproved={setCancelTarget} />}
      </div>
      <ConfirmDialog open={Boolean(removeTarget)} title="Excluir solicitação pendente?" description="A solicitação será retirada, preservada na auditoria e não seguirá para aprovação." confirmLabel="Excluir solicitação" onCancel={() => setRemoveTarget(null)} onConfirm={() => { if (removeTarget) void controller.removePending(removeTarget).then(() => setRemoveTarget(null)) }} />
      <ConfirmDialog open={Boolean(cancelTarget)} title="Cancelar folga aprovada?" description="A solicitação será atualizada e a supervisão será notificada." confirmLabel="Cancelar folga" onCancel={() => { setCancelTarget(null); setCancelReason('') }} onConfirm={() => { if (cancelTarget && cancelReason.trim()) void controller.cancelApproved(cancelTarget, cancelReason).then(() => { setCancelTarget(null); setCancelReason('') }) }}>
        <label htmlFor="time-off-cancel-reason" className="text-sm font-bold ui-text">Motivo do cancelamento</label><textarea id="time-off-cancel-reason" rows={3} value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} className={fieldClassName} />
      </ConfirmDialog>
    </PageContainer>
  )
}
