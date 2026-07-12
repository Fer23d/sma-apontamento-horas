import { Link } from 'react-router-dom'
import { ThemeToggle } from '../components/ThemeToggle'

export function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-950">
      <div className="absolute right-4 top-4"><ThemeToggle /></div>
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-sma-green font-extrabold text-sma-navy">SM&A</div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-sma-green-dark dark:text-sma-green">Acesso ao sistema</p>
        <h1 className="mt-2 text-3xl font-extrabold text-sma-navy dark:text-white">Bem-vindo</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">A autenticação será implementada em uma etapa futura.</p>
        <Link to="/colaborador" className="mt-8 block rounded-xl bg-sma-navy px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-sma-navy-dark dark:bg-sma-green dark:text-sma-navy">
          Visualizar área do colaborador
        </Link>
      </section>
    </main>
  )
}
