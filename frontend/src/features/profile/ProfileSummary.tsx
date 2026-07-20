import { formatMinutes } from '../time-entries/domain'
import type { CollaboratorProfile } from './types'
import type { AssignmentSnapshot } from '../squads/types'
import type { WorkloadVersion } from '../workloads/types'

type ProfileSummaryProps = {
  profile: CollaboratorProfile
  assignment: AssignmentSnapshot | null
  currentWorkload: WorkloadVersion | null
}

export function ProfileSummary({ profile, assignment, currentWorkload }: ProfileSummaryProps) {
  const items = [
    ['Nome', profile.name],
    ['E-mail', profile.email],
    ['Cargo', profile.jobTitle],
    ['Status', profile.active ? 'Ativo' : 'Inativo'],
    ['Localização', `${profile.location.city} · ${profile.location.stateCode}`],
    ['Squad atual', assignment?.squadName ?? 'Não definida'],
    ['Supervisor responsável', assignment?.supervisorName ?? 'Não definido'],
    ['Carga diária vigente', currentWorkload ? formatMinutes(currentWorkload.dailyMinutes) : 'Não cadastrada'],
  ]

  return (
    <section className="space-y-4" aria-labelledby="profile-summary-title">
      <h2 id="profile-summary-title" className="text-lg font-extrabold text-sma-navy dark:text-white">Dados profissionais</h2>
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
            <dt className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</dt>
            <dd className="mt-2 break-words font-bold text-sma-navy dark:text-white">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="rounded-xl border border-sma-green/40 bg-sma-green/10 p-4 text-sm text-slate-700 dark:text-slate-200">
        Localização controlada pela empresa. Nome, e-mail, cargo, status e localização são somente leitura nesta fase.
      </p>
    </section>
  )
}
