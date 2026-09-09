import { useEffect, useMemo, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark'
import { ThemeToggle } from '../components/ThemeToggle'
import { useSession } from '../features/session/useSession'
import { organogramaDEP } from '../data/mockDEP'
import { ReportsHierarchy } from '../features/reports/ReportsHierarchy'
import type { ReportEntry, ReportStatus, ReportSupervisor } from '../features/reports/types'
import { eachIsoDate, getCorporateToday, getMonthKey, getMonthRange, isWeekend } from '../shared/utils/date'
import { TIME_ENTRY_STORAGE_KEY } from '../services/timeEntryService'

const statusOptions: Array<{ value: '' | ReportStatus, label: string }> = [
  { value: '', label: 'Todos os status' }, { value: 'PENDING', label: 'Pendente' }, { value: 'APPROVED', label: 'Aprovado' }, { value: 'REJECTED', label: 'Rejeitado' },
]

function readEntries(): ReportEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(TIME_ENTRY_STORAGE_KEY) || '[]') as unknown
    const rawEntries = Array.isArray(parsed) ? parsed : parsed && typeof parsed === 'object' && 'entriesByCollaborator' in parsed
      ? Object.values((parsed as { entriesByCollaborator?: Record<string, unknown> }).entriesByCollaborator ?? {}).flatMap((items) => Array.isArray(items) ? items : []) : []
    return rawEntries.flatMap((value): ReportEntry[] => {
      if (!value || typeof value !== 'object') return []
      const raw = value as Record<string, unknown>
      if (typeof raw.id !== 'string' || typeof raw.collaboratorId !== 'string' || typeof raw.entryDate !== 'string') return []
      const statusValue = String(raw.status ?? 'ACTIVE').toUpperCase()
      const status = (statusValue === 'PENDENTE' ? 'PENDING' : statusValue) as ReportStatus
      const snapshot = raw.assignmentSnapshot as Record<string, unknown> | null
      const numberValue = (key: string) => Number.isFinite(Number(raw[key])) ? Number(raw[key]) : 0
      return [{ id: raw.id, collaboratorId: raw.collaboratorId, entryDate: raw.entryDate, projectCode: typeof raw.projectCode === 'string' ? raw.projectCode : '', durationMinutes: numberValue('durationMinutes'), extraMinutes: numberValue('extraMinutes') || numberValue('overtimeMinutes'), nightMinutes: numberValue('nightMinutes'), status, details: typeof raw.details === 'string' ? raw.details : undefined, activityName: typeof raw.activityId === 'string' ? raw.activityId : undefined, supervisorName: typeof snapshot?.supervisorName === 'string' ? snapshot.supervisorName : undefined, squadName: typeof snapshot?.squadName === 'string' ? snapshot.squadName : undefined }]
    })
  } catch { return [] }
}

function slug(value: string) { return value.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-') }
function sumMinutes(entries: ReportEntry[], selector: (entry: ReportEntry) => number) { return entries.reduce((total, entry) => total + selector(entry), 0) }
function expectedMinutes(startDate: string, endDate: string) { return eachIsoDate(startDate, endDate).filter((date) => !isWeekend(date)).length * 480 }

function DiretoriaSidebar({ onSignOut }: { onSignOut: () => void }) {
  const linkClass = ({ isActive }: { isActive: boolean }) => `flex w-full items-center gap-3 rounded-xl border-l-4 px-3 py-3 text-left text-sm font-semibold transition ${isActive ? 'border-[var(--color-primary)] bg-[var(--color-navigation-active)] text-[var(--color-navigation-active-text)]' : 'border-transparent text-[var(--color-sidebar-text-muted)] hover:bg-[var(--color-navigation-hover)] hover:text-[var(--color-sidebar-text)]'}`
  return <aside className="hidden h-[calc(100vh-5rem)] w-64 flex-col bg-[var(--color-sidebar)] text-[var(--color-sidebar-text)] lg:sticky lg:top-20 lg:flex lg:self-start"><section className="border-b border-[var(--color-sidebar-border)] p-4"><div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-sidebar-border)] bg-[var(--color-sidebar-surface)] text-sm font-extrabold">DI</span><div><p className="text-sm font-extrabold leading-tight">Diretoria SM&A</p><p className="mt-0.5 text-xs leading-tight text-[var(--color-sidebar-text-muted)]">Visão macro</p></div></div></section><nav className="flex-1 space-y-2 p-4" aria-label="Menu lateral da diretoria"><NavLink to="/administracao" end className={linkClass}><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-sidebar-surface)] text-xs">DI</span><span className="flex-1">Painel Diretor</span></NavLink><NavLink to="/administracao/equipes" className={linkClass}><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-sidebar-surface)] text-xs">EQ</span><span className="flex-1">Equipes</span></NavLink><NavLink to="/administracao/relatorios" className={linkClass}><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-navigation-active-detail)] text-xs text-[var(--color-primary)]">RE</span><span className="flex-1">Relatórios</span></NavLink></nav><div className="border-t border-[var(--color-sidebar-border)] p-4"><button type="button" onClick={onSignOut} className="w-full rounded-xl border border-[var(--color-sidebar-border)] px-4 py-3 text-left text-sm font-bold text-[var(--color-sidebar-text)] hover:bg-[var(--color-navigation-hover)]">Sair do sistema</button></div></aside>
}

function KpiCard({ label, value, helper }: { label: string, value: string, helper: string }) { return <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">{label}</p><p className="mt-3 text-3xl font-extrabold text-[var(--color-primary)]">{value}</p><p className="mt-2 text-sm text-[var(--color-text-muted)]">{helper}</p></article> }

export function RelatoriosPage() {
  const { session, signOut } = useSession()
  const navigate = useNavigate()
  const initialRange = getMonthRange(getMonthKey(getCorporateToday()))
  const [entries, setEntries] = useState<ReportEntry[]>([])
  const [startDate, setStartDate] = useState(initialRange.startDate)
  const [endDate, setEndDate] = useState(initialRange.endDate)
  const [supervisorFilter, setSupervisorFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | ReportStatus>('')
  useEffect(() => { setEntries(readEntries()) }, [])

  const filteredEntries = useMemo(() => entries.filter((entry) => entry.entryDate >= startDate && entry.entryDate <= endDate && (!supervisorFilter || entry.supervisorName === supervisorFilter) && (!statusFilter || entry.status === statusFilter)), [endDate, entries, startDate, statusFilter, supervisorFilter])
  const supervisorNames = useMemo(() => Array.from(new Set([...organogramaDEP.flatMap((item) => item.squads.map((squad) => squad.supervisor)), ...entries.map((entry) => entry.supervisorName).filter((name): name is string => Boolean(name))])).sort((a, b) => a.localeCompare(b)), [entries])
  const supervisors = useMemo<ReportSupervisor[]>(() => {
    const groups = new Map<string, ReportEntry[]>()
    filteredEntries.forEach((entry) => { const key = entry.supervisorName ?? 'Não atribuído'; groups.set(key, [...(groups.get(key) ?? []), entry]) })
    const names = Array.from(new Set([...organogramaDEP.flatMap((item) => item.squads.map((squad) => squad.supervisor)), ...groups.keys()]))
    return names.map((name) => {
      const supervisorEntries = groups.get(name) ?? []
      const collaboratorMap = new Map<string, ReportEntry[]>()
      supervisorEntries.forEach((entry) => collaboratorMap.set(entry.collaboratorId, [...(collaboratorMap.get(entry.collaboratorId) ?? []), entry]))
      const collaborators = Array.from(collaboratorMap.entries()).map(([id, collaboratorEntries]) => { const workedMinutes = sumMinutes(collaboratorEntries, (entry) => entry.status === 'CANCELLED' ? 0 : entry.durationMinutes); return { id, name: id === 'demo-collaborator-001' ? 'Colaborador' : id, workedMinutes, extraMinutes: sumMinutes(collaboratorEntries, (entry) => entry.extraMinutes), nightMinutes: sumMinutes(collaboratorEntries, (entry) => entry.nightMinutes), bankMinutes: workedMinutes - expectedMinutes(startDate, endDate), entries: collaboratorEntries } })
      const workedMinutes = sumMinutes(supervisorEntries, (entry) => entry.status === 'CANCELLED' ? 0 : entry.durationMinutes)
      return { id: slug(name), name, workedMinutes, extraMinutes: sumMinutes(supervisorEntries, (entry) => entry.extraMinutes), nightMinutes: sumMinutes(supervisorEntries, (entry) => entry.nightMinutes), bankMinutes: workedMinutes - expectedMinutes(startDate, endDate), collaborators }
    }).sort((a, b) => a.name.localeCompare(b.name))
  }, [endDate, filteredEntries, startDate])
  const activeEntries = filteredEntries.filter((entry) => entry.status !== 'CANCELLED')
  const totalMinutes = sumMinutes(activeEntries, (entry) => entry.durationMinutes)
  const extraMinutes = sumMinutes(activeEntries, (entry) => entry.extraMinutes)
  const nightMinutes = sumMinutes(activeEntries, (entry) => entry.nightMinutes)
  const pendingCount = filteredEntries.filter((entry) => entry.status === 'PENDING').length
  const validRange = Boolean(startDate && endDate && startDate <= endDate)
  const exit = () => { signOut(); navigate('/login', { replace: true }) }

  return <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)]"><header className="sticky top-0 z-40 flex h-20 w-full items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-header)] px-4 shadow-sm sm:px-6 lg:px-8"><div className="flex items-center gap-3"><BrandMark variant="compact" /><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-secondary)]">SM&A - Relatórios</p><p className="text-sm text-[var(--color-text-muted)]">Visão macro da operação</p></div></div><div className="flex items-center gap-3"><span className="hidden text-right text-xs font-semibold text-[var(--color-text-muted)] sm:block">{session?.name}</span><ThemeToggle /></div></header><div className="flex"><DiretoriaSidebar onSignOut={exit} /><main className="flex-1 px-4 py-6 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl space-y-6"><section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-secondary)]">Visão macro</p><h1 className="mt-2 text-3xl font-extrabold">Relatórios</h1><p className="mt-2 text-sm text-[var(--color-text-muted)]">Acompanhe horas, extras, período noturno e pendências por supervisor e equipe.</p></div><button type="button" className="rounded-xl border border-[var(--color-primary)] px-4 py-3 text-sm font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10">Exportar Relatório</button></section><section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores dos relatórios"><KpiCard label="Total de Horas da Operação" value={`${(totalMinutes / 60).toFixed(1)} h`} helper="Período filtrado" /><KpiCard label="Total de Horas Extras" value={`${(extraMinutes / 60).toFixed(1)} h`} helper="Informadas nos apontamentos" /><KpiCard label="Total de Horas Noturnas" value={`${(nightMinutes / 60).toFixed(1)} h`} helper="Faixa das 22h às 05h" /><KpiCard label="Horas Pendentes de Aprovação" value={`${pendingCount}`} helper="Apontamentos aguardando análise" /></section><section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5" aria-label="Filtros globais"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><label className="text-sm font-bold">Data inicial<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 py-2.5 font-normal outline-none focus:border-[var(--color-primary)]" /></label><label className="text-sm font-bold">Data final<input type="date" min={startDate} value={endDate} onChange={(event) => setEndDate(event.target.value)} className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 py-2.5 font-normal outline-none focus:border-[var(--color-primary)]" /></label><label className="text-sm font-bold">Supervisor<select value={supervisorFilter} onChange={(event) => setSupervisorFilter(event.target.value)} className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 py-2.5 font-normal outline-none focus:border-[var(--color-primary)]"><option value="">Todos os supervisores</option>{supervisorNames.map((name) => <option key={name} value={name}>{name}</option>)}</select></label><label className="text-sm font-bold">Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as '' | ReportStatus)} className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 py-2.5 font-normal outline-none focus:border-[var(--color-primary)]">{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label></div>{!validRange && <p role="alert" className="mt-3 text-sm font-semibold text-red-500">A data final deve ser igual ou posterior à data inicial.</p>}</section><ReportsHierarchy supervisors={validRange ? supervisors : []} /></div></main></div></div>
}
