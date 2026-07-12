import { useTheme } from '../hooks/useTheme'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-sma-navy transition hover:border-sma-green dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
    >
      {isDark ? 'Tema claro' : 'Tema escuro'}
    </button>
  )
}
