import { PageContainer } from '../components/PageContainer'
import { TimeEntryForm } from '../features/time-entries/TimeEntryForm'

export function NovoApontamentoPage() {
  return (
    <PageContainer title="Novo apontamento" description="Registre o tempo dedicado a uma atividade. O resumo e o saldo exibidos são provisórios.">
      <TimeEntryForm />
    </PageContainer>
  )
}
