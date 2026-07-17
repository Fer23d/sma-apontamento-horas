type SummaryCardProps = {
  label: string
  value: string
  helper: string
  tone?: 'neutral' | 'positive' | 'warning'
}

const toneClasses = {
  neutral: 'border-slate-200 dark:border-slate-800',
  positive: 'border-emerald-300 dark:border-emerald-800',
  warning: 'border-amber-300 dark:border-amber-800',
}

export function SummaryCard({ label, value, helper, tone = 'neutral' }: SummaryCardProps) {
  return (
    <article className={`rounded-2xl border bg-white p-5 shadow-sm dark:bg-slate-900 ${toneClasses[tone]}`}>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-extrabold text-sma-navy dark:text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{helper}</p>
    </article>
  )
}
