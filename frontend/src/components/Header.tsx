import { forwardRef } from 'react'
import { ThemeToggle } from './ThemeToggle'
import { useSession } from '../features/session/useSession'
import { BrandMark } from './BrandMark'

type HeaderProps = {
  isMenuOpen: boolean
  onMenuToggle: () => void
}

export const Header = forwardRef<HTMLButtonElement, HeaderProps>(function Header({ isMenuOpen, onMenuToggle }, menuButtonRef) {
  const { profile } = useSession()
  return (
    <header data-layout-region="global-header" className="sticky top-0 z-40 flex h-20 w-full items-center justify-between border-b border-[var(--sma-border)] bg-[var(--sma-surface-header)] px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          ref={menuButtonRef}
          type="button"
          onClick={onMenuToggle}
          className="rounded-lg border border-slate-200 p-2 text-sma-navy lg:hidden dark:border-slate-700 dark:text-slate-100"
          aria-label={isMenuOpen ? 'Fechar navegação lateral' : 'Abrir navegação lateral'}
          aria-controls="collaborator-mobile-navigation"
          aria-expanded={isMenuOpen}
        >
          <span aria-hidden="true">☰</span>
        </button>
        <BrandMark variant="compact" />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sma-green-dark dark:text-sma-green">Área do colaborador</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Apontamento de horas por projeto</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-right text-xs font-semibold text-slate-600 sm:block dark:text-slate-300">{profile?.name}</span>
        <ThemeToggle />
      </div>
    </header>
  )
})
