import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark'
import { ThemeToggle } from '../components/ThemeToggle'
import { RejectionDialog } from '../features/supervisor/RejectionDialog'
import { SupervisorEntriesTable } from '../features/supervisor/SupervisorEntriesTable'
import type { SupervisorPendingEntry } from '../features/supervisor/types'
import { useSupervisorDashboard } from '../features/supervisor/useSupervisorDashboard'
import { useSession } from '../features/session/useSession'

function SummaryCard({ label, value, accent }: { label: string, value: number, accent: string }) {
  return (
    <article className="rounded-2xl border border-l-4 border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm" style={{ borderLeftColor: accent }}>
      <p className="text-sm font-bold text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-[var(--color-text)]">{value}</p>
    </article>
  )
}

export function SupervisorPage() {
  const { session, signOut } = useSession()
  const navigate = useNavigate()
  const dashboard = useSupervisorDashboard()
  const [entryToReject, setEntryToReject] = useState<SupervisorPendingEntry | null>(null)
  const [rejectionError, setRejectionError] = useState<string | null>(null)

  const exitDemo = () => {
    signOut()
    navigate('/login', { replace: true })
  }

  const rejectEntry = async (reason: string) => {
    if (!entryToReject || !session) return
    setRejectionError(null)
    try {
      await dashboard.reject(entryToReject, session.id, reason)
      setEntryToReject(null)
    } catch (requestError) {
      setRejectionError(requestError instanceof Error ? requestError.message : 'Não foi possível rejeitar o apontamento.')
    }
  }

  const approveEntry = (entry: SupervisorPendingEntry) => {
    if (!session) return
    void dashboard.approve(entry, session.id)
  }

  return (
    <main className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)]">
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-header)] px-4 py-4 shadow-sm sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <BrandMark variant="compact" />
            <div className="hidden min-w-0 sm:block">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-secondary)]">Área do supervisor</p>
              <p className="truncate text-sm text-[var(--color-text-muted)]">Validação de apontamentos da equipe</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-right text-xs font-semibold text-[var(--color-text-muted)] md:block">{session?.name}</span>
            <ThemeToggle />
            <button type="button" onClick={exitDemo} className="ui-button-secondary">
              Sair
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-secondary)]">SM&A</p>
          <h1 className="text-2xl font-extrabold text-[var(--color-primary)] sm:text-3xl">Gestão de apontamentos</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
            Acompanhe os apontamentos enviados pela equipe e registre aprovações ou rejeições com justificativa.
          </p>
        </div>

        <div className="space-y-6">
          {dashboard.error && (
            <div role="alert" className="rounded-2xl border border-[var(--color-danger)] bg-[var(--color-surface)] p-4 text-sm font-semibold text-[var(--color-danger)]">
              {dashboard.error}
            </div>
          )}

          <section className="grid gap-4 md:grid-cols-3" aria-label="Resumo das validações">
            <SummaryCard label="Pendentes" value={dashboard.summary.pending} accent="#C9A66B" />
            <SummaryCard label="Aprovados" value={dashboard.summary.approved} accent="var(--color-primary)" />
            <SummaryCard label="Rejeitados" value={dashboard.summary.rejected} accent="#C99393" />
          </section>

          {dashboard.isLoading ? (
            <p className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center font-semibold text-[var(--color-text-muted)]" aria-live="polite">
              Carregando apontamentos da equipe…
            </p>
          ) : (
            <SupervisorEntriesTable
              entries={dashboard.entries}
              isMutating={dashboard.isMutating}
              onApprove={approveEntry}
              onReject={(entry) => {
                setRejectionError(null)
                setEntryToReject(entry)
              }}
            />
          )}
        </div>
      </section>

      <RejectionDialog
        entry={entryToReject}
        error={rejectionError}
        isSubmitting={dashboard.isMutating}
        onClose={() => setEntryToReject(null)}
        onConfirm={(reason) => void rejectEntry(reason)}
      />
    </main>
  )
}
