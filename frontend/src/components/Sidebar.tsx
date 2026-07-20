import { NavLink, useNavigate } from 'react-router-dom'
import { collaboratorNavigation } from '../mocks/navigation'
import { useSession } from '../features/session/useSession'

type SidebarProps = {
  isOpen: boolean
  onNavigate: () => void
}

export function Sidebar({ isOpen, onNavigate }: SidebarProps) {
  const { signOut } = useSession()
  const navigate = useNavigate()

  const handleSignOut = () => {
    signOut()
    onNavigate()
    navigate('/login', { replace: true })
  }

  return (
    <aside
      id="collaborator-navigation"
      className={`${isOpen ? 'translate-x-0' : '-translate-x-full'} fixed bottom-0 left-0 top-20 z-30 flex w-72 flex-col bg-sma-navy text-white shadow-2xl transition-transform duration-200 lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] lg:translate-x-0 lg:self-start lg:shadow-none`}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 lg:hidden">
        <p className="font-bold">Navegação</p>
        <button type="button" onClick={onNavigate} className="rounded-lg border border-white/20 px-3 py-2 text-sm font-bold" aria-label="Fechar navegação lateral">Fechar</button>
      </div>

      <nav className="flex-1 space-y-2 p-4" aria-label="Navegação do colaborador">
        {collaboratorNavigation.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/colaborador'}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl border-l-4 px-3 py-3 text-sm font-semibold transition ${
                isActive ? 'border-white bg-sma-green text-sma-navy' : 'border-transparent text-slate-200 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-xs">{item.shortLabel}</span>
                <span className="flex-1">{item.label}</span>
                {isActive && <span className="text-[10px] font-extrabold uppercase" aria-label="Página atual">Atual</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <button type="button" onClick={handleSignOut} className="w-full rounded-xl border border-white/20 px-4 py-3 text-left text-sm font-bold text-white hover:bg-white/10">
          Sair da demonstração
        </button>
        <p className="mt-3 px-1 text-xs text-slate-400">Dados armazenados somente neste navegador.</p>
      </div>
    </aside>
  )
}
