import { useNavigate } from 'react-router-dom'
import { ThemeToggle } from '../components/ThemeToggle'
import { useSession } from '../features/session/useSession'
import { BrandMark } from '../components/BrandMark'

export function LoginPage() {
  const { signIn } = useSession()
  const navigate = useNavigate()

  const enterDemo = () => {
    signIn()
    navigate('/colaborador', { replace: true })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-950">
      <div className="absolute right-4 top-4"><ThemeToggle /></div>
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <BrandMark variant="full" alt="SM&A — Sistema de apontamento de horas" className="mb-8" />
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-sma-green-dark dark:text-sma-green">Ambiente demonstrativo</p>
        <h1 className="mt-2 text-3xl font-extrabold text-sma-navy dark:text-white">Bem-vindo</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">Ambiente de demonstração da área do Colaborador. Não é necessário informar senha.</p>
        <button type="button" onClick={enterDemo} className="mt-8 w-full rounded-xl bg-sma-navy px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-sma-navy-dark dark:bg-sma-green dark:text-sma-navy">
          Entrar como colaborador de demonstração
        </button>
      </section>
    </main>
  )
}
