type SummaryCardProps = {
  label: string
  value: string
  helper: string
  tone?: 'neutral' | 'positive' | 'warning'
}

const toneClasses = {
  neutral: 'ui-border',
  positive: 'border-emerald-300 dark:border-emerald-800',
  warning: 'border-amber-300 dark:border-amber-800',
}

export function SummaryCard({ label, value, helper, tone = 'neutral' }: SummaryCardProps) {
  return (
    <article className={`rounded-2xl border ui-surface p-5 shadow-sm ${toneClasses[tone]}`}>
      <p className="text-xs font-bold uppercase tracking-wider ui-text-subtle">{label}</p>
      <p className="mt-3 text-3xl font-extrabold ui-heading">{value}</p>
      <p className="mt-2 text-sm ui-text-muted">{helper}</p>
    </article>
  )
}
