import { useState } from 'react'
import { PageContainer } from '../components/PageContainer'
import { useProfile } from '../features/collaborator/useProfile'
import { ProfileSummary } from '../features/profile/ProfileSummary'
import { SquadSelector } from '../features/profile/SquadSelector'
import { WorkloadHistory } from '../features/workloads/WorkloadHistory'
import { WorkloadRequestForm, type WorkloadFormField } from '../features/workloads/WorkloadRequestForm'
import { getCorporateToday } from '../shared/utils/date'

type WorkloadForm = { hours: string; minutes: string; effectiveFrom: string; justification: string }

const initialForm = (): WorkloadForm => ({ hours: '8', minutes: '0', effectiveFrom: getCorporateToday(), justification: '' })

function toDailyMinutes(form: WorkloadForm) {
  const hours = Number(form.hours)
  const minutes = Number(form.minutes)
  if (!Number.isInteger(hours) || hours < 0 || hours > 24 || !Number.isInteger(minutes) || minutes < 0 || minutes > 59) {
    throw new Error('Informe horas entre 0 e 24 e minutos entre 0 e 59.')
  }
  const total = hours * 60 + minutes
  if (total <= 0 || total > 24 * 60) throw new Error('A carga diária deve ser maior que zero e de no máximo 24 horas.')
  return total
}

export function PerfilPage() {
  const profileState = useProfile()
  const [form, setForm] = useState<WorkloadForm>(initialForm)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [operationError, setOperationError] = useState<string | null>(null)

  const updateField = (field: WorkloadFormField, value: string) => setForm((current) => ({ ...current, [field]: value }))

  async function changeSquad(squadId: string) {
    setFeedback(null)
    setOperationError(null)
    try {
      await profileState.changeSquad(squadId)
      setFeedback('Squad alterada. A nova alocação será usada somente em novos registros e solicitações.')
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : 'Não foi possível alterar a squad.')
    }
  }

  async function submitWorkload() {
    setFeedback(null)
    setOperationError(null)
    try {
      const dailyMinutes = toDailyMinutes(form)
      if (profileState.data?.workloadVersions.length) {
        await profileState.requestWorkloadChange({ requestedDailyMinutes: dailyMinutes, requestedEffectiveFrom: form.effectiveFrom, justification: form.justification })
        setFeedback('Solicitação de alteração enviada ao supervisor da squad atual.')
      } else {
        await profileState.createInitialWorkload(dailyMinutes, form.effectiveFrom)
        setFeedback('Carga horária inicial cadastrada.')
      }
      setForm(initialForm())
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : 'Não foi possível salvar a carga horária.')
    }
  }

  return (
    <PageContainer title="Meu perfil" description="Informações profissionais, alocação e carga horária da sessão demonstrativa.">
      {profileState.isLoading && <p aria-live="polite" className="text-sm ui-text-muted">Carregando perfil profissional…</p>}
      {profileState.error && <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-800 dark:bg-red-950/40 dark:text-red-200"><p>{profileState.error}</p><button type="button" onClick={() => void profileState.reload()} className="mt-2 underline">Tentar novamente</button></div>}
      {operationError && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-800 dark:bg-red-950/40 dark:text-red-200">{operationError}</p>}
      {feedback && <p aria-live="polite" className="rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">{feedback}</p>}
      {profileState.data && !profileState.isLoading && (
        <div className="space-y-6">
          <ProfileSummary profile={profileState.data.profile} assignment={profileState.data.assignment} currentWorkload={profileState.data.currentWorkload} />
          <SquadSelector squads={profileState.data.squads} activeSquadId={profileState.data.profile.activeSquadId} isSaving={profileState.isSaving} onChange={(squadId) => void changeSquad(squadId)} />
          <WorkloadRequestForm
            {...form}
            minDate={getCorporateToday()}
            isSubmitting={profileState.isSaving}
            isInitial={profileState.data.workloadVersions.length === 0}
            onFieldChange={updateField}
            onSubmit={() => void submitWorkload()}
          />
          <WorkloadHistory versions={profileState.data.workloadVersions} requests={profileState.data.workloadRequests} />
        </div>
      )}
    </PageContainer>
  )
}
