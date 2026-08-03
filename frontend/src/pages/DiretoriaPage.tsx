import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BrandMark } from '../components/BrandMark'
import { ThemeToggle } from '../components/ThemeToggle'
import { TIME_OFF_STORAGE_KEY } from '../services/timeOffService'
import { TIME_ENTRY_STORAGE_KEY } from '../services/timeEntryService'
import { getMonthKey } from '../shared/utils/date'
import { useSession } from '../features/session/useSession'
import { organogramaDEP, type DEPColaborador, type DEPGerencia, type DEPSquad } from '../data/mockDEP'

type DiretoriaEntry = {
  id: string
  collaboratorId: string
  entryDate: string
  projectCode: string
  durationMinutes: number
  status: string
}

type DiretoriaAbsence = {
  id: string
  status: string
}

type ProjectHoursRow = {
  projeto: string
  horas: number
}

const fallbackProjectHours: ProjectHoursRow[] = [
  { projeto: 'SM&A-ENG-142', horas: 128 },
  { projeto: 'SM&A-AUT-087', horas: 96 },
  { projeto: 'SM&A-ELE-211', horas: 74 },
]

const ORGANOGRAMA_STORAGE_KEY = 'organograma_editavel_sma'
const cargoOptions = ['Engenheiro', 'Projetista', 'Desenhista', 'Estagiário', 'Estagiário 4h']

function cloneOrganograma(data: DEPGerencia[]) {
  return data.map((gerencia) => ({
    ...gerencia,
    squads: gerencia.squads.map((squad) => ({
      ...squad,
      colaboradores: squad.colaboradores.map((colaborador) => ({ ...colaborador })),
    })),
  }))
}

function getSquads(data: DEPGerencia[]) {
  return data.flatMap((gerencia) => gerencia.squads.map((squad) => ({ ...squad, gerente: gerencia.gerente })))
}

function getFirstSquadName(data: DEPGerencia[]) {
  return data[0]?.squads[0]?.nome ?? ''
}

function findSquad(data: DEPGerencia[], squadName: string): DEPSquad | null {
  return getSquads(data).find((squad) => squad.nome === squadName) ?? null
}

function isOrganograma(value: unknown): value is DEPGerencia[] {
  if (!Array.isArray(value)) return false
  return value.every((gerencia) => {
    if (!gerencia || typeof gerencia !== 'object') return false
    const item = gerencia as Record<string, unknown>
    return typeof item.gerente === 'string' && Array.isArray(item.squads)
  })
}

function loadEditableOrganograma() {
  if (typeof window === 'undefined') return cloneOrganograma(organogramaDEP)
  try {
    const raw = window.localStorage.getItem(ORGANOGRAMA_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as unknown
      if (isOrganograma(parsed)) return cloneOrganograma(parsed)
    }
  } catch {
    // Fallback to the official source below.
  }
  const initial = cloneOrganograma(organogramaDEP)
  window.localStorage.setItem(ORGANOGRAMA_STORAGE_KEY, JSON.stringify(initial))
  return initial
}

function persistOrganograma(data: DEPGerencia[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ORGANOGRAMA_STORAGE_KEY, JSON.stringify(data))
}

function readJsonArray(key: string): unknown[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || '[]') as unknown
    if (Array.isArray(parsed)) return parsed
    if (parsed && typeof parsed === 'object' && key === TIME_ENTRY_STORAGE_KEY) {
      const entriesByCollaborator = (parsed as { entriesByCollaborator?: unknown }).entriesByCollaborator
      if (!entriesByCollaborator || typeof entriesByCollaborator !== 'object') return []
      return Object.values(entriesByCollaborator).flatMap((entries) => Array.isArray(entries) ? entries : [])
    }
    if (parsed && typeof parsed === 'object' && key === TIME_OFF_STORAGE_KEY) {
      const requests = (parsed as { requests?: unknown }).requests
      return Array.isArray(requests) ? requests : []
    }
    return []
  } catch {
    return []
  }
}

function normalizeEntry(value: unknown): DiretoriaEntry | null {
  if (!value || typeof value !== 'object') return null
  const entry = value as Record<string, unknown>
  if (typeof entry.id !== 'string'
    || typeof entry.collaboratorId !== 'string'
    || typeof entry.entryDate !== 'string'
    || typeof entry.projectCode !== 'string'
    || !Number.isFinite(Number(entry.durationMinutes))) return null
  return {
    id: entry.id,
    collaboratorId: entry.collaboratorId,
    entryDate: entry.entryDate,
    projectCode: entry.projectCode,
    durationMinutes: Number(entry.durationMinutes),
    status: typeof entry.status === 'string' ? entry.status : 'ACTIVE',
  }
}

function normalizeAbsence(value: unknown): DiretoriaAbsence | null {
  if (!value || typeof value !== 'object') return null
  const absence = value as Record<string, unknown>
  if (typeof absence.id !== 'string') return null
  return {
    id: absence.id,
    status: typeof absence.status === 'string' ? absence.status : 'Pendente',
  }
}

function SummaryCard({ label, value, helper }: { label: string, value: string | number, helper: string }) {
  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-3 text-3xl font-extrabold text-[var(--color-primary)]">{value}</p>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">{helper}</p>
    </article>
  )
}

function DiretoriaSidebar({ onSignOut }: { onSignOut: () => void }) {
  return (
    <aside className="hidden h-[calc(100vh-5rem)] w-64 flex-col bg-[var(--color-sidebar)] text-[var(--color-sidebar-text)] lg:sticky lg:top-20 lg:flex lg:self-start">
      <section className="border-b border-[var(--color-sidebar-border)] p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-sidebar-border)] bg-[var(--color-sidebar-surface)] text-sm font-extrabold">DI</span>
          <div>
            <p className="text-sm font-extrabold leading-tight">Diretoria SM&A</p>
            <p className="mt-0.5 text-xs leading-tight text-[var(--color-sidebar-text-muted)]">Visao macro</p>
          </div>
        </div>
      </section>
      <nav className="flex-1 space-y-2 p-4" aria-label="Menu lateral da diretoria">
        <button type="button" className="flex w-full items-center gap-3 rounded-xl border-l-4 border-[var(--color-primary)] bg-[var(--color-navigation-active)] px-3 py-3 text-left text-sm font-semibold text-[var(--color-navigation-active-text)]">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-navigation-active-detail)] text-xs text-[var(--color-primary)]">DI</span>
          <span className="flex-1">Painel Diretor</span>
          <span className="text-[10px] font-extrabold uppercase">Atual</span>
        </button>
      </nav>
      <div className="border-t border-[var(--color-sidebar-border)] p-4">
        <button type="button" onClick={onSignOut} className="w-full rounded-xl border border-[var(--color-sidebar-border)] px-4 py-3 text-left text-sm font-bold text-[var(--color-sidebar-text)] hover:bg-[var(--color-navigation-hover)]">
          Sair da demonstracao
        </button>
      </div>
    </aside>
  )
}

function EditableCollaboratorCard({ colaborador, squadName, squadOptions, onSave }: {
  colaborador: DEPColaborador
  squadName: string
  squadOptions: string[]
  onSave: (originalName: string, updated: DEPColaborador, targetSquadName: string) => void
}) {
  const [isEditing, setEditing] = useState(false)
  const [form, setForm] = useState({ nome: colaborador.nome, cargo: colaborador.cargo, squad: squadName })

  useEffect(() => {
    setForm({ nome: colaborador.nome, cargo: colaborador.cargo, squad: squadName })
    setEditing(false)
  }, [colaborador.cargo, colaborador.nome, squadName])

  function cancelEdit() {
    setForm({ nome: colaborador.nome, cargo: colaborador.cargo, squad: squadName })
    setEditing(false)
  }

  function saveEdit() {
    const updated = { nome: form.nome.trim(), cargo: form.cargo.trim() }
    if (!updated.nome || !updated.cargo) return
    onSave(colaborador.nome, updated, form.squad)
    setEditing(false)
  }

  if (isEditing) {
    return (
      <article className="rounded-2xl border border-[var(--color-primary)] bg-[var(--color-surface)] p-4 shadow-sm">
        <div className="grid gap-3">
          <label className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
            Nome
            <input type="text" value={form.nome} onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))} className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 py-2 text-sm font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20" />
          </label>
          <label className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
            Cargo
            <select value={form.cargo} onChange={(event) => setForm((current) => ({ ...current, cargo: event.target.value }))} className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 py-2 text-sm font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20">
              {cargoOptions.map((cargo) => <option key={cargo} value={cargo}>{cargo}</option>)}
              {!cargoOptions.includes(form.cargo) && <option value={form.cargo}>{form.cargo}</option>}
            </select>
          </label>
          <label className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
            Mudar de Equipe
            <select value={form.squad} onChange={(event) => setForm((current) => ({ ...current, squad: event.target.value }))} className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 py-2 text-sm font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20">
              {squadOptions.map((squad) => <option key={squad} value={squad}>{squad}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={cancelEdit} className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm font-bold text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)]">Cancelar</button>
          <button type="button" onClick={saveEdit} className="rounded-xl bg-[var(--color-primary)] px-3 py-2 text-sm font-bold text-[#06241f] hover:opacity-90">Salvar</button>
        </div>
      </article>
    )
  }

  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[var(--color-text)]">{colaborador.nome}</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">{colaborador.cargo}</p>
        </div>
        <button type="button" onClick={() => setEditing(true)} className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-bold text-[var(--color-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-subtle)]">
          Editar
        </button>
      </div>
    </article>
  )
}

export function DiretoriaPage() {
  const { session, signOut } = useSession()
  const navigate = useNavigate()
  const [entries, setEntries] = useState<DiretoriaEntry[]>([])
  const [absences, setAbsences] = useState<DiretoriaAbsence[]>([])
  const [dadosOrganograma, setDadosOrganograma] = useState<DEPGerencia[]>([])
  const [squadSelecionada, setSquadSelecionada] = useState(getFirstSquadName(organogramaDEP))
  const currentMonth = getMonthKey(new Date().toISOString().slice(0, 10))

  useEffect(() => {
    const storedEntries = readJsonArray(TIME_ENTRY_STORAGE_KEY).flatMap((entry) => {
      const normalized = normalizeEntry(entry)
      return normalized ? [normalized] : []
    })
    const storedAbsences = readJsonArray(TIME_OFF_STORAGE_KEY).flatMap((absence) => {
      const normalized = normalizeAbsence(absence)
      return normalized ? [normalized] : []
    })
    setEntries(storedEntries)
    setAbsences(storedAbsences)
  }, [])

  useEffect(() => {
    const storedOrganograma = loadEditableOrganograma()
    setDadosOrganograma(storedOrganograma)
    setSquadSelecionada((current) => current || getFirstSquadName(storedOrganograma))
  }, [])

  const projectHours = useMemo(() => {
    const activeEntries = entries.filter((entry) => entry.status !== 'CANCELLED')
    if (activeEntries.length === 0) return fallbackProjectHours
    const grouped = activeEntries.reduce<Record<string, number>>((totals, entry) => {
      totals[entry.projectCode] = (totals[entry.projectCode] ?? 0) + entry.durationMinutes / 60
      return totals
    }, {})
    return Object.entries(grouped)
      .map(([projeto, horas]) => ({ projeto, horas: Number(horas.toFixed(1)) }))
      .sort((left, right) => right.horas - left.horas)
      .slice(0, 6)
  }, [entries])

  const monthEntries = entries.filter((entry) => entry.entryDate.startsWith(currentMonth) && entry.status !== 'CANCELLED')
  const totalMonthHours = monthEntries.reduce((total, entry) => total + entry.durationMinutes / 60, 0)
  const activeProjects = new Set(entries.filter((entry) => entry.status !== 'CANCELLED').map((entry) => entry.projectCode)).size
  const pendingAbsences = absences.filter((absence) => absence.status === 'PENDING' || absence.status === 'Pendente').length
  const squadOptions = useMemo(() => getSquads(dadosOrganograma).map((squad) => squad.nome), [dadosOrganograma])
  const selectedSquad = useMemo(() => findSquad(dadosOrganograma, squadSelecionada), [dadosOrganograma, squadSelecionada])

  function handleSaveCollaborator(sourceSquadName: string, originalName: string, updated: DEPColaborador, targetSquadName: string) {
    setDadosOrganograma((current) => {
      const next = current.map((gerencia) => ({
        ...gerencia,
        squads: gerencia.squads.map((squad) => {
          if (squad.nome === sourceSquadName) {
            const remainingCollaborators = squad.colaboradores.filter((colaborador) => colaborador.nome !== originalName)
            if (sourceSquadName === targetSquadName) {
              return {
                ...squad,
                colaboradores: [...remainingCollaborators.map((colaborador) => ({ ...colaborador })), updated]
                  .sort((left, right) => left.nome.localeCompare(right.nome)),
              }
            }
            return {
              ...squad,
              colaboradores: remainingCollaborators.map((colaborador) => ({ ...colaborador })),
            }
          }
          if (squad.nome === targetSquadName) {
            return {
              ...squad,
              colaboradores: [...squad.colaboradores.map((colaborador) => ({ ...colaborador })), updated]
                .sort((left, right) => left.nome.localeCompare(right.nome)),
            }
          }
          return {
            ...squad,
            colaboradores: squad.colaboradores.map((colaborador) => ({ ...colaborador })),
          }
        }),
      }))
      persistOrganograma(next)
      if (targetSquadName !== sourceSquadName) setSquadSelecionada(targetSquadName)
      return next
    })
  }

  function exitDemo() {
    signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)]">
      <header className="sticky top-0 z-40 flex h-20 w-full items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-header)] px-4 shadow-sm sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <BrandMark variant="compact" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-secondary)]">SM&A - Painel da Diretoria</p>
            <p className="text-sm text-[var(--color-text-muted)]">Visao macro e alocacao de tempo por projetos</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-right text-xs font-semibold text-[var(--color-text-muted)] sm:block">{session?.name}</span>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex">
        <DiretoriaSidebar onSignOut={exitDemo} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <section>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-secondary)]">Visao Macro</p>
              <h1 className="mt-2 text-3xl font-extrabold text-[var(--color-text)]">SM&A - Painel da Diretoria</h1>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">Visao macro e alocacao de tempo por projetos.</p>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores da diretoria">
              <SummaryCard label="Total de Horas Apontadas (Mes)" value={totalMonthHours > 0 ? totalMonthHours.toFixed(1) : '298'} helper="Horas consolidadas no mes atual" />
              <SummaryCard label="Projetos Ativos" value={activeProjects || 3} helper="Projetos com apontamentos registrados" />
              <SummaryCard label="Apontamentos Registrados" value={entries.length} helper="Base persistida em localStorage" />
              <SummaryCard label="Pendencias Gerais" value={pendingAbsences} helper="Ausencias aguardando decisao" />
            </section>

            <section className="space-y-5" aria-labelledby="dep-org-title">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-secondary)]">Estrutura DEP</p>
                <h2 id="dep-org-title" className="mt-1 text-xl font-extrabold text-[var(--color-text)]">Organograma de Equipes (DEP)</h2>
              </div>
              <div className="flex flex-col gap-6 md:flex-row">
                <aside className="md:w-72 md:shrink-0" aria-label="Squads do DEP">
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                    <p className="px-2 pb-3 text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">Squads</p>
                    <div className="max-h-[620px] space-y-2 overflow-y-auto pr-1">
                      {getSquads(dadosOrganograma).map((squad) => {
                        const isActive = squadSelecionada === squad.nome
                        return (
                          <button
                            key={`${squad.gerente}-${squad.nome}`}
                            type="button"
                            onClick={() => setSquadSelecionada(squad.nome)}
                            className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                              isActive
                                ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[#06241f]'
                                : 'border-[var(--color-border)] bg-[var(--color-surface-subtle)] text-[var(--color-text)] hover:border-[var(--color-primary)]'
                            }`}
                          >
                            <span className="block text-sm font-extrabold">{squad.nome}</span>
                            <span className={`mt-1 block text-xs ${isActive ? 'text-[#06241f]' : 'text-[var(--color-text-muted)]'}`}>{squad.supervisor}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </aside>

                <section className="min-w-0 flex-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
                  {selectedSquad ? (
                    <>
                      <div className="mb-5 flex flex-col gap-2 border-b border-[var(--color-border)] pb-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">Equipe selecionada</p>
                          <h3 className="mt-1 text-2xl font-extrabold text-[var(--color-text)]">{selectedSquad.nome}</h3>
                          <p className="mt-1 text-sm font-bold text-[var(--color-primary)]">Supervisor: {selectedSquad.supervisor}</p>
                        </div>
                        <p className="text-sm text-[var(--color-text-muted)]">{selectedSquad.colaboradores.length} colaborador(es)</p>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {selectedSquad.colaboradores.map((colaborador) => (
                          <EditableCollaboratorCard
                            key={`${selectedSquad.nome}-${colaborador.nome}`}
                            colaborador={colaborador}
                            squadName={selectedSquad.nome}
                            squadOptions={squadOptions}
                            onSave={(originalName, updated, targetSquadName) => handleSaveCollaborator(selectedSquad.nome, originalName, updated, targetSquadName)}
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-8 text-center text-sm font-semibold text-[var(--color-text-muted)]">
                      Nenhuma squad encontrada no organograma.
                    </div>
                  )}
                </section>
              </div>
            </section>

            <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm" aria-labelledby="project-allocation-title">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-secondary)]">Dashboard</p>
                  <h2 id="project-allocation-title" className="mt-1 text-xl font-extrabold text-[var(--color-text)]">Alocacao de Tempo por Projeto</h2>
                </div>
                <p className="text-sm text-[var(--color-text-muted)]">{entries.length > 0 ? 'Dados reais do localStorage' : 'Dados demonstrativos para aprovacao visual'}</p>
              </div>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectHours} margin={{ top: 10, right: 16, left: 0, bottom: 8 }}>
                    <XAxis dataKey="projeto" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(119, 194, 164, 0.08)' }}
                      contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, color: 'var(--color-text)' }}
                      labelStyle={{ color: 'var(--color-text)' }}
                    />
                    <Bar dataKey="horas" name="Horas" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
