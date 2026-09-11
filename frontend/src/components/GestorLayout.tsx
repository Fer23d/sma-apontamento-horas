import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BrandMark } from './BrandMark'
import { ThemeToggle } from './ThemeToggle'
import { useSession } from '../features/session/useSession'

export function GestorLayout() {
  const { session, signOut } = useSession()
  const navigate = useNavigate()
  const sessionRole = session?.role ?? null
  const isDirector = sessionRole === 'DIRECTOR_ADMIN'
  const displayName = session?.name ?? 'Usuário gestor'

  function exit() {
    signOut()
    navigate('/login', { replace: true })
  }

  const linkClass = ({ isActive }: { isActive: boolean }) => `flex items-center gap-3 rounded-xl border-l-4 px-3 py-3 text-left text-sm font-semibold transition ${isActive ? 'border-[var(--color-primary)] bg-[var(--color-navigation-active)] text-[var(--color-navigation-active-text)]' : 'border-transparent text-[var(--color-sidebar-text-muted)] hover:bg-[var(--color-navigation-hover)] hover:text-[var(--color-sidebar-text)]'}`

  return (
    <div className="min-h-screen overflow-x-clip bg-[var(--color-background)] text-[var(--color-text)]">
      <header className="sticky top-0 z-40 flex h-20 w-full items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-header)] px-4 shadow-sm sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <BrandMark variant="compact" />
          <div className="hidden min-w-0 sm:block">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-secondary)]">Área da {isDirector ? 'diretoria' : 'supervisão'}</p>
            <p className="truncate text-sm text-[var(--color-text-muted)]">Central de comunicação da operação</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-right text-xs font-semibold text-[var(--color-text-muted)] sm:block">{displayName}</span>
          <ThemeToggle />
        </div>
      </header>

      <div className="relative grid min-h-[calc(100vh-5rem)] min-w-0 grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="flex max-h-80 min-w-0 flex-col overflow-y-auto bg-[var(--color-sidebar)] text-[var(--color-sidebar-text)] lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] lg:max-h-none lg:w-64 lg:self-start" aria-label="Menu lateral da gestão">
          <section className="border-b border-[var(--color-sidebar-border)] p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--color-sidebar-border)] bg-[var(--color-sidebar-surface)] text-sm font-extrabold">{isDirector ? 'DI' : 'SU'}</span>
              <div className="min-w-0">
                <p className="text-sm font-extrabold leading-tight">{displayName}</p>
                <p className="mt-0.5 text-xs leading-tight text-[var(--color-sidebar-text-muted)]">{isDirector ? 'Diretoria' : 'Supervisor'}</p>
              </div>
            </div>
          </section>
          <nav className="flex-1 space-y-2 p-4" aria-label="Navegação da gestão">
            <NavLink to={isDirector ? '/administracao' : '/supervisor'} end className={linkClass}>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-sidebar-surface)] text-xs">{isDirector ? 'DI' : 'GE'}</span>
              <span className="flex-1">{isDirector ? 'Painel Diretor' : 'Gestão da Equipe'}</span>
            </NavLink>
            {isDirector && <NavLink to="/administracao/equipes" className={linkClass}><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-sidebar-surface)] text-xs">EQ</span><span className="flex-1">Equipes</span></NavLink>}
            {isDirector && <NavLink to="/administracao/relatorios" className={linkClass}><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-sidebar-surface)] text-xs">RE</span><span className="flex-1">Relatórios</span></NavLink>}
            <NavLink to="/avisos" className={linkClass}><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-navigation-active-detail)] text-xs text-[var(--color-primary)]">AV</span><span className="flex-1">Avisos</span></NavLink>
          </nav>
          <div className="border-t border-[var(--color-sidebar-border)] p-4">
            <button type="button" onClick={exit} className="w-full rounded-xl border border-[var(--color-sidebar-border)] px-4 py-3 text-left text-sm font-bold text-[var(--color-sidebar-text)] hover:bg-[var(--color-navigation-hover)]">Sair do sistema</button>
          </div>
        </aside>
        <main className="w-full min-w-0 overflow-x-hidden" id="main-content"><Outlet /></main>
      </div>
    </div>
  )
}
