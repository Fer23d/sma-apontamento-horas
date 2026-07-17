import { PageContainer } from '../components/PageContainer'
import { useProfile } from '../features/collaborator/useProfile'
import { formatMinutes } from '../features/time-entries/domain'

export function PerfilPage() {
  const { profile, isLoading, error } = useProfile()
  return (
    <PageContainer title="Meu perfil" description="Informações profissionais utilizadas pela experiência demonstrativa.">
      {isLoading && <p aria-live="polite" className="text-sm text-slate-600 dark:text-slate-300">Carregando perfil profissional…</p>}
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-800 dark:bg-red-950/40 dark:text-red-200">{error}</p>}
      {!isLoading && !error && !profile && <p className="text-sm text-slate-600 dark:text-slate-300">Nenhum perfil profissional disponível.</p>}
      {profile && (
        <div>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ['Nome', profile.name],
              ['E-mail', profile.email],
              ['Cargo', profile.jobTitle],
              ['Squad', profile.squadName],
              ['Jornada diária', formatMinutes(profile.workSchedule.mondayMinutes)],
              ['Dias de trabalho', 'Segunda a sexta-feira'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
                <dt className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</dt>
                <dd className="mt-2 font-bold text-sma-navy dark:text-white">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 rounded-xl border border-sma-green/40 bg-sma-green/10 p-4 text-sm text-slate-700 dark:text-slate-200">Os dados profissionais são somente leitura e serão administrados futuramente pela empresa.</p>
        </div>
      )}
    </PageContainer>
  )
}
