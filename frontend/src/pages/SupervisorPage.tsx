import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark'
import { StatusBadge } from '../components/StatusBadge'
import { ThemeToggle } from '../components/ThemeToggle'
import { RejectionDialog } from '../features/supervisor/RejectionDialog'
import { SupervisorEntriesTable } from '../features/supervisor/SupervisorEntriesTable'
import { SupervisorRequestsTable } from '../features/supervisor/SupervisorRequestsTable'
import type { SupervisorPendingEntry, SupervisorTimeOffRequest } from '../features/supervisor/types'
import { useSupervisorDashboard } from '../features/supervisor/useSupervisorDashboard'
import { useSession } from '../features/session/useSession'

type ActiveView = 'entries' | 'requests' | 'history' | 'profile'
type EntryStatusFilter = 'ALL' | SupervisorPendingEntry['status']
type RejectionTarget =
  | { type: 'entry', item: SupervisorPendingEntry }
  | { type: 'time-off', item: SupervisorTimeOffRequest }

const SUPERVISOR_DISPLAY_NAME = 'Jeen Carlos E. Azevedo'
const supervisorNavigation: Array<{ id: ActiveView, label: string, shortLabel: string }> = [
  { id: 'entries', label: 'Gestão da Equipe', shortLabel: 'GE' },
  { id: 'requests', label: 'Solicitações', shortLabel: 'SO' },
  { id: 'history', label: 'Histórico', shortLabel: 'HI' },
  { id: 'profile', label: 'Meu Perfil', shortLabel: 'MP' },
]

function SummaryCard({ label, value, accent }: { label: string, value: number, accent: string }) {
  return (
    <article className="rounded-2xl border border-l-4 border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm" style={{ borderLeftColor: accent }}>
      <p className="text-sm font-bold text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-[var(--color-text)]">{value}</p>
    </article>
  )
}

function SupervisorSidebar({ activeView, onChange, onSignOut }: {
  activeView: ActiveView
  onChange: (view: ActiveView) => void
  onSignOut: () => void
}) {
  return (
    <aside className="rounded-2xl border border-[var(--color-sidebar-border)] bg-[var(--color-sidebar)] text-[var(--color-sidebar-text)] lg:sticky lg:top-24 lg:self-start" aria-label="Menu lateral do supervisor">
      <section className="border-b border-[var(--color-sidebar-border)] p-4" aria-label="Perfil atual do supervisor">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--color-sidebar-border)] bg-[var(--color-sidebar-surface)] text-sm font-extrabold">JA</span>
          <div className="min-w-0">
            <p className="text-sm font-extrabold leading-tight">{SUPERVISOR_DISPLAY_NAME}</p>
            <p className="mt-0.5 text-xs leading-tight text-[var(--color-sidebar-text-muted)]">Supervisor de Engenharia</p>
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-[var(--color-sidebar-surface)] p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-sidebar-text-muted)]">Equipe ativa</p>
          <p className="text-xs font-bold leading-tight">Engenharia de Automação</p>
        </div>
      </section>

      <nav className="space-y-2 p-4" aria-label="Navegação do supervisor">
        {supervisorNavigation.map((item) => {
          const isActive = activeView === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl border-l-4 px-3 py-3 text-left text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-sidebar-text)] ${
                isActive ? 'border-[var(--color-primary)] bg-[var(--color-navigation-active)] text-[var(--color-navigation-active-text)]' : 'border-transparent text-[var(--color-sidebar-text-muted)] hover:bg-[var(--color-navigation-hover)] hover:text-[var(--color-sidebar-text)]'
              }`}
            >
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs ${isActive ? 'bg-[var(--color-navigation-active-detail)] text-[var(--color-primary)]' : 'bg-[var(--color-sidebar-surface)]'}`}>{item.shortLabel}</span>
              <span className="flex-1">{item.label}</span>
              {isActive && <span className="text-[10px] font-extrabold uppercase" aria-label="Página atual">Atual</span>}
            </button>
          )
        })}
      </nav>

      <div className="border-t border-[var(--color-sidebar-border)] p-4">
        <button type="button" onClick={onSignOut} className="w-full rounded-xl border border-[var(--color-sidebar-border)] px-4 py-3 text-left text-sm font-bold text-[var(--color-sidebar-text)] hover:bg-[var(--color-navigation-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-sidebar-text)]">
          Sair da demonstração
        </button>
        <p className="mt-3 px-1 text-xs text-[var(--color-sidebar-text-muted)]">Dados sincronizados via localStorage.</p>
      </div>
    </aside>
  )
}

function HistoryView({ entries }: { entries: SupervisorPendingEntry[] }) {
  const treatedEntries = entries.filter((entry) => entry.status !== 'PENDING')
  if (treatedEntries.length === 0) {
    return <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center text-sm font-semibold text-[var(--color-text-muted)]">Nenhum apontamento tratado até o momento.</div>
  }
  return (
    <section className="ui-card rounded-2xl p-5" aria-labelledby="supervisor-history-title">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-secondary)]">Consolidado</p>
        <h2 id="supervisor-history-title" className="mt-1 text-xl font-extrabold text-[var(--color-text)]">Histórico de validações</h2>
      </div>
      <div className="max-h-[600px] space-y-3 overflow-y-auto">
        {treatedEntries.map((entry) => (
          <article key={entry.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-extrabold text-[var(--color-text)]">{entry.collaboratorName}</p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">{entry.entryDate} · {entry.projectCode} · {entry.activityName}</p>
                {entry.rejectionReason && <p className="mt-2 text-sm text-[var(--color-text-muted)]">Motivo: {entry.rejectionReason}</p>}
              </div>
              <StatusBadge tone={entry.status === 'APPROVED' ? 'success' : 'danger'}>{entry.status === 'APPROVED' ? 'Aprovado' : 'Rejeitado'}</StatusBadge>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function SupervisorProfileView() {
  return (
    <section className="ui-card rounded-2xl p-6" aria-labelledby="supervisor-profile-title">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-secondary)]">Meu Perfil</p>
      <h2 id="supervisor-profile-title" className="mt-1 text-2xl font-extrabold text-[var(--color-primary)]">{SUPERVISOR_DISPLAY_NAME}</h2>
      <dl className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <dt className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Cargo</dt>
          <dd className="mt-1 font-bold text-[var(--color-text)]">Supervisor de Engenharia</dd>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <dt className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">E-mail</dt>
          <dd className="mt-1 font-bold text-[var(--color-text)]">jeen.azevedo@sma.local</dd>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <dt className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Squad</dt>
          <dd className="mt-1 font-bold text-[var(--color-text)]">Engenharia de Automação</dd>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <dt className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Permissões</dt>
          <dd className="mt-1 font-bold text-[var(--color-text)]">Aprovar apontamentos e folgas</dd>
        </div>
      </dl>
    </section>
  )
}

export function SupervisorPage() {
  const { session, signOut } = useSession()
  const navigate = useNavigate()
  const dashboard = useSupervisorDashboard(session?.id)
  const [activeView, setActiveView] = useState<ActiveView>('entries')
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
            <span className="hidden text-right text-xs font-semibold text-[var(--color-text-muted)] md:block">{SUPERVISOR_DISPLAY_NAME}</span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:px-8">
        <SupervisorSidebar activeView={activeView} onChange={setActiveView} onSignOut={exitDemo} />

        <div className="min-w-0">
          <div className="mb-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-secondary)]">SM&A</p>
            <h1 className="text-2xl font-extrabold text-[var(--color-primary)] sm:text-3xl">{supervisorNavigation.find((item) => item.id === activeView)?.label}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
              Consulte dados sincronizados do localStorage, valide pendências e acompanhe o histórico da equipe.
            </p>
          </div>

          <div className="space-y-6">
            {dashboard.error && (
              <div role="alert" className="rounded-2xl border border-[var(--color-danger)] bg-[var(--color-surface)] p-4 text-sm font-semibold text-[var(--color-danger)]">
                {dashboard.error}
              </div>
            )}

            {activeView === 'entries' && (
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

            {activeView === 'requests' && (
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

            {activeView === 'history' && <HistoryView entries={dashboard.entries} />}
            {activeView === 'profile' && <SupervisorProfileView />}
          </div>
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
