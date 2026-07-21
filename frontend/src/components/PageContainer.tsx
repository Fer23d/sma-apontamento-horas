import type { ReactNode } from 'react'

type PageContainerProps = {
  title: string
  description: string
  children?: ReactNode
  contained?: boolean
}

export function PageContainer({ title, description, children, contained = true }: PageContainerProps) {
  return (
    <section className="mx-auto w-full min-w-0 max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-sma-green-dark dark:text-sma-green">SM&A</p>
        <h1 className="text-2xl font-extrabold text-sma-navy sm:text-3xl dark:text-white">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">{description}</p>
      </div>
      {contained ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          {children ?? <p className="text-sm text-slate-500 dark:text-slate-400">Conteúdo será desenvolvido nas próximas etapas.</p>}
        </div>
      ) : children}
    </section>
  )
}
