import type { ReactNode } from 'react'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  isBusy?: boolean
  children?: ReactNode
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDialog({ open, title, description, confirmLabel, isBusy, children, onCancel, onConfirm }: ConfirmDialogProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <h2 id="confirm-title" className="text-xl font-extrabold text-sma-navy dark:text-white">{title}</h2>
        <p id="confirm-description" className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} disabled={isBusy} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200">Voltar</button>
          <button type="button" onClick={onConfirm} disabled={isBusy} className="rounded-xl bg-red-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{isBusy ? 'Processando…' : confirmLabel}</button>
        </div>
      </section>
    </div>
  )
}
