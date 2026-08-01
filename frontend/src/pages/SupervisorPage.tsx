import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark'
import { ThemeToggle } from '../components/ThemeToggle'
import { RejectionDialog } from '../features/supervisor/RejectionDialog'
import { SupervisorEntriesTable } from '../features/supervisor/SupervisorEntriesTable'
import { SupervisorRequestsTable } from '../features/supervisor/SupervisorRequestsTable'
import type { SupervisorPendingEntry, SupervisorTimeOffRequest } from '../features/supervisor/types'
import { useSupervisorDashboard } from '../features/supervisor/useSupervisorDashboard'
import { useSession } from '../features/session/useSession'

type ActiveTab = 'entries' | 'requests'
type EntryStatusFilter = 'ALL' | SupervisorPendingEntry['status']
type RejectionTarget =
  | { type: 'entry', item: SupervisorPendingEntry }
  | { type: 'time-off', item: SupervisorTimeOffRequest }

function SummaryCard({ label, value, accent }: { label: string, value: number, accent: string }) {
  return (
    <article className="rounded-2xl border border-l-4 border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm" style={{ borderLeftColor: accent }}>
      <p className="text-sm font-bold text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-[var(--color-text)]">{value}</p>
    </article>
  )
}

function TabButton({ active, children, onClick }: { active: boolean, children: string, onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 px-1 pb-3 text-sm font-extrabold transition ${
        active
          ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
          : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
      }`}
    >
      {children}
    </button>
  )
}

export function SupervisorPage() {
  const { session, signOut } = useSession()
  const navigate = useNavigate()
  const dashboard = useSupervisorDashboard(session?.id)
  const [activeTab, setActiveTab] = useState<ActiveTab>('entries')
  const [collaboratorFilter, setCollaboratorFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState<EntryStatusFilter>('ALL')
  const [rejectionTarget, setRejectionTarget] = useState<RejectionTarget | null>(null)
  const [rejectionError, setRejectionError] = useState<string | null>(null)

  const filteredEntries = useMemo(() => dashboard.entries.filter((entry) => {
    const matchesCollaborator = collaboratorFilter === 'ALL' || entry.collaboratorId === collaboratorFilter
    const matchesStatus = statusFilter === 'ALL' || entry.status === statusFilter
    return matchesCollaborator && matchesStatus
  }), [collaboratorFilter, dashboard.entries, statusFilter])

  const exitDemo = () => {
    signOut()
    navigate('/login', { replace: true })
  }

  const rejectTarget = async (reason: string) => {
    if (!rejectionTarget) return
    setRejectionError(null)
    try {
      if (rejectionTarget.type === 'entry') {
        await dashboard.reject(rejectionTarget.item, reason)
      } else {
        await dashboard.rejectTimeOff(rejectionTarget.item, reason)
      }
      setRejectionTarget(null)
    } catch (requestError) {
      setRejectionError(requestError instanceof Error ? requestError.message : 'Não foi possível registrar a rejeição.')
    }
  }

  const rejectionDescription = rejectionTarget
    ? `Informe o motivo para ${rejectionTarget.item.collaboratorName}. Esse texto fica registrado no localStorage e aparecerá no histórico correspondente.`
    : undefined

  return (
    <main className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)]">
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-header)] px-4 py-4 shadow-sm sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <BrandMark variant="compact" />
            <div className="hidden min-w-0 sm:block">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-secondary)]">Área do supervisor</p>
              <p className="truncate text-sm text-[var(--color-text-muted)]">Validação de apontamentos e solicitações da equipe</p>
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
          <h1 className="text-2xl font-extrabold text-[var(--color-primary)] sm:text-3xl">Gestão da equipe</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
            Consulte o histórico completo de apontamentos, aprove pendências e acompanhe pedidos de folga em um fluxo único de supervisão.
          </p>
        </div>

        <div className="space-y-6">
          {dashboard.error && (
            <div role="alert" className="rounded-2xl border border-[var(--color-danger)] bg-[var(--color-surface)] p-4 text-sm font-semibold text-[var(--color-danger)]">
              {dashboard.error}
            </div>
          )}

          <div className="border-b border-[var(--color-border)]">
            <nav className="flex gap-6" aria-label="Seções do supervisor">
              <TabButton active={activeTab === 'entries'} onClick={() => setActiveTab('entries')}>Apontamentos da Equipe</TabButton>
              <TabButton active={activeTab === 'requests'} onClick={() => setActiveTab('requests')}>Solicitações</TabButton>
            </nav>
          </div>

          {activeTab === 'entries' && (
            <>
              <section className="grid gap-4 md:grid-cols-3" aria-label="Resumo dos apontamentos">
                <SummaryCard label="Pendentes" value={dashboard.summary.pending} accent="#C9A66B" />
                <SummaryCard label="Aprovados" value={dashboard.summary.approved} accent="var(--color-primary)" />
                <SummaryCard label="Rejeitados" value={dashboard.summary.rejected} accent="#C99393" />
              </section>

              <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4" aria-label="Filtros de apontamentos">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm font-bold text-[var(--color-text)]">
                    Colaborador
                    <select value={collaboratorFilter} onChange={(event) => setCollaboratorFilter(event.target.value)} className="ui-field mt-2 w-full rounded-xl px-3 py-3 text-sm">
                      <option value="ALL">Todos da Equipe</option>
                      {dashboard.collaborators.map((collaborator) => (
                        <option key={collaborator.id} value={collaborator.id}>{collaborator.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-bold text-[var(--color-text)]">
                    Status
                    <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as EntryStatusFilter)} className="ui-field mt-2 w-full rounded-xl px-3 py-3 text-sm">
                      <option value="ALL">Todos</option>
                      <option value="PENDING">Pendentes</option>
                      <option value="APPROVED">Aprovados</option>
                      <option value="REJECTED">Rejeitados</option>
                    </select>
                  </label>
                </div>
              </section>

              {dashboard.isLoading ? (
                <p className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center font-semibold text-[var(--color-text-muted)]" aria-live="polite">
                  Carregando apontamentos da equipe...
                </p>
              ) : (
                <SupervisorEntriesTable
                  entries={filteredEntries}
                  isMutating={dashboard.isMutating}
                  onApprove={(entry) => void dashboard.approve(entry)}
                  onReject={(entry) => {
                    setRejectionError(null)
                    setRejectionTarget({ type: 'entry', item: entry })
                  }}
                />
              )}
            </>
          )}

          {activeTab === 'requests' && (
            <>
              <section className="grid gap-4 md:grid-cols-3" aria-label="Resumo das solicitações">
                <SummaryCard label="Folgas pendentes" value={dashboard.requestSummary.pending} accent="#C9A66B" />
                <SummaryCard label="Folgas aprovadas" value={dashboard.requestSummary.approved} accent="var(--color-primary)" />
                <SummaryCard label="Folgas rejeitadas" value={dashboard.requestSummary.rejected} accent="#C99393" />
              </section>
              {dashboard.isLoading ? (
                <p className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center font-semibold text-[var(--color-text-muted)]" aria-live="polite">
                  Carregando solicitações da equipe...
                </p>
              ) : (
                <SupervisorRequestsTable
                  requests={dashboard.requests}
                  isMutating={dashboard.isMutating}
                  onApprove={(request) => void dashboard.approveTimeOff(request)}
                  onReject={(request) => {
                    setRejectionError(null)
                    setRejectionTarget({ type: 'time-off', item: request })
                  }}
                />
              )}
            </>
          )}
        </div>
      </section>

      <RejectionDialog
        entry={rejectionTarget?.item ?? null}
        error={rejectionError}
        isSubmitting={dashboard.isMutating}
        title={rejectionTarget?.type === 'time-off' ? 'Rejeitar solicitação de folga' : 'Rejeitar apontamento'}
        description={rejectionDescription}
        onClose={() => setRejectionTarget(null)}
        onConfirm={(reason) => void rejectTarget(reason)}
      />
    </main>
  )
}
