import { PageContainer } from '../components/PageContainer'
import type { Comunicado, ComunicadoTipo } from '../features/announcements/types'

const comunicadosMock: Comunicado[] = [
  {
    id: 'aviso-fechamento-julho-2026',
    titulo: 'Fechamento do mês antecipado',
    mensagem: 'Em razão do feriado nacional, o fechamento dos apontamentos de julho acontecerá antecipadamente no dia 03/08, às 12h. Revise seus lançamentos e envie eventuais ajustes antes desse horário.',
    dataPublicacao: '2026-07-29',
    autor: 'RH',
    tipo: 'alerta',
  },
  {
    id: 'aviso-politica-apontamentos',
    titulo: 'Revisão dos apontamentos da semana',
    mensagem: 'Reserve alguns minutos ao final de cada dia para conferir horas, projeto e detalhamento. Essa rotina ajuda a manter o fechamento da operação mais ágil.',
    dataPublicacao: '2026-07-24',
    autor: 'Diretoria',
    tipo: 'info',
  },
  {
    id: 'aviso-prazo-urgente',
    titulo: 'Ação necessária: regularize pendências',
    mensagem: 'Existem apontamentos pendentes de revisão no seu histórico. Confira os registros e encaminhe as correções solicitadas antes do prazo de fechamento.',
    dataPublicacao: '2026-07-22',
    autor: 'Supervisão',
    tipo: 'urgente',
  },
]

const tipoPresentation: Record<ComunicadoTipo, { label: string, border: string, badge: string }> = {
  info: {
    label: 'Informação',
    border: '[border-left-color:#8AB7C7]',
    badge: 'border-[#8AB7C7]/40 bg-[#8AB7C7]/10 text-[#8AB7C7]',
  },
  alerta: {
    label: 'Atenção',
    border: '[border-left-color:#C9A66B]',
    badge: 'border-[#C9A66B]/40 bg-[#C9A66B]/10 text-[#C9A66B]',
  },
  urgente: {
    label: 'Urgente',
    border: '[border-left-color:#C99393]',
    badge: 'border-[#C99393]/40 bg-[#C99393]/10 text-[#C99393]',
  },
}

function formatPublicationDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00.000Z`))
}

export function AvisosPage() {
  return (
    <PageContainer
      title="Quadro de Avisos"
      description="Acompanhe comunicados importantes da Diretoria, do RH e da supervisão da operação."
      contained={false}
    >
      <section className="space-y-4" aria-labelledby="announcements-title">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-secondary)]">Comunicados</p>
            <h2 id="announcements-title" className="mt-1 text-xl font-extrabold ui-text">Mensagens recentes</h2>
          </div>
          <span className="text-sm text-[var(--color-text-muted)]">{comunicadosMock.length} comunicado(s)</span>
        </div>

        <div className="space-y-4">
          {comunicadosMock.map((comunicado) => {
            const presentation = tipoPresentation[comunicado.tipo]
            return (
              <article key={comunicado.id} className={`rounded-2xl border border-l-4 ui-border ui-surface p-5 shadow-sm ${presentation.border}`}>
                <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-extrabold ui-text">{comunicado.titulo}</h3>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                      Publicado em {formatPublicationDate(comunicado.dataPublicacao)} · por {comunicado.autor}
                    </p>
                  </div>
                  <span className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${presentation.badge}`}>{presentation.label}</span>
                </header>
                <p className="mt-4 max-w-4xl text-sm leading-7 ui-text-muted">{comunicado.mensagem}</p>
              </article>
            )
          })}
        </div>
      </section>
    </PageContainer>
  )
}
