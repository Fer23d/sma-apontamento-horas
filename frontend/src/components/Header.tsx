import { ThemeToggle } from './ThemeToggle'

type HeaderProps = {
  onMenuToggle: () => void
}

export function Header({ onMenuToggle }: HeaderProps) {
  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-slate-900/90">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          className="rounded-lg border border-slate-200 p-2 text-sma-navy lg:hidden dark:border-slate-700 dark:text-slate-100"
          aria-label="Abrir ou fechar navegação"
        >
          <span aria-hidden="true">☰</span>
        </button>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sma-green-dark dark:text-sma-green">Área do colaborador</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Apontamento de horas por projeto</p>
        </div>
      </div>
      <ThemeToggle />
    </header>
  )
}
