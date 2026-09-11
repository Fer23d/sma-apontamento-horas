import { useState, type FormEvent } from 'react'
import { useSession } from '../session/useSession'
import { saveAnnouncement } from '../../services/announcementService'
import { getAllColaboradores } from '../../data/mockDEP'
import { demoSquads } from '../../mocks/demoData'
import type { ComunicadoDestinatario, ComunicadoTipo } from './types'

const urgencyOptions: Array<{ value: ComunicadoTipo, label: string }> = [
  { value: 'info', label: 'Normal' },
  { value: 'alerta', label: 'Importante' },
  { value: 'urgente', label: 'Crítico' },
]

const recipientOptions: Array<{ value: ComunicadoDestinatario, label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'team', label: 'Equipe Específica' },
  { value: 'individual', label: 'Colaborador Específico' },
]

export function CriarAviso() {
  const { session } = useSession()
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState<ComunicadoTipo>('info')
  const [recipientType, setRecipientType] = useState<ComunicadoDestinatario>('all')
  const [recipientReference, setRecipientReference] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)

  const sessionRole = session?.role ?? null
  const canCreate = sessionRole === 'SUPERVISOR' || sessionRole === 'DIRECTOR_ADMIN'
  const squads = Array.isArray(demoSquads) ? demoSquads : []
  const collaborators = getAllColaboradores()
  const collaboratorOptions = Array.isArray(collaborators) ? collaborators : []
  if (!canCreate) return null

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const titulo = title.trim()
    const mensagem = message.trim()
    if (!titulo || !mensagem || !session || (recipientType !== 'all' && !recipientReference)) {
      setFeedback('Preencha o título e a mensagem para enviar o aviso.')
      return
    }

    saveAnnouncement({
      id: crypto.randomUUID(),
      titulo,
      mensagem,
      dataPublicacao: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      autor: sessionRole === 'SUPERVISOR' ? 'Supervisor (Modo Offline)' : 'Gestão (Modo Offline)',
      tipo: type,
      urgencia: type,
      tipo_destinatario: recipientType,
      alvo_referencia: recipientType === 'all' ? null : recipientReference,
    })
    setTitle('')
    setMessage('')
    setType('info')
    setRecipientType('all')
    setRecipientReference('')
    setFeedback('Aviso enviado com sucesso.')
  }

  return (
    <section className="ui-card rounded-2xl p-5 sm:p-6" aria-labelledby="create-announcement-title">
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-secondary)]">Comunicação</p>
        <h2 id="create-announcement-title" className="mt-1 text-xl font-extrabold ui-text">Criar Novo Aviso</h2>
        <p className="mt-1 text-sm ui-text-muted">Publique uma orientação para os colaboradores da operação.</p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-bold ui-text">
          Título
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 block w-full ui-field rounded-xl px-3 py-2.5 ui-text outline-none focus:ring-2" />
        </label>
        <label className="block text-sm font-bold ui-text">
          Mensagem
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={4} className="mt-2 block w-full ui-field rounded-xl px-3 py-2.5 ui-text outline-none focus:ring-2" />
        </label>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <label className="block text-sm font-bold ui-text sm:min-w-64">
            Urgência
            <select value={type} onChange={(event) => setType(event.target.value as ComunicadoTipo)} className="mt-2 block w-full ui-field rounded-xl px-3 py-2.5 ui-text outline-none focus:ring-2">
              {urgencyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="block text-sm font-bold ui-text sm:min-w-64">
            Destinatário
            <select value={recipientType} onChange={(event) => { setRecipientType(event.target.value as ComunicadoDestinatario); setRecipientReference('') }} className="mt-2 block w-full ui-field rounded-xl px-3 py-2.5 ui-text outline-none focus:ring-2">
              {recipientOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <button type="submit" className="ui-button-primary">Enviar Aviso</button>
        </div>
        {recipientType === 'team' && (
          <label className="block text-sm font-bold ui-text">
            Equipe destinatária
            <select value={recipientReference} onChange={(event) => setRecipientReference(event.target.value)} className="mt-2 block w-full ui-field rounded-xl px-3 py-2.5 ui-text outline-none focus:ring-2">
              <option value="">Selecione uma equipe</option>
              {squads.map((squad) => <option key={squad.id} value={squad.id}>{squad.name}</option>)}
            </select>
          </label>
        )}
        {recipientType === 'individual' && (
          <label className="block text-sm font-bold ui-text">
            Colaborador destinatário
            <select value={recipientReference} onChange={(event) => setRecipientReference(event.target.value)} className="mt-2 block w-full ui-field rounded-xl px-3 py-2.5 ui-text outline-none focus:ring-2">
              <option value="">Selecione um colaborador</option>
              {collaboratorOptions.map((collaborator) => <option key={collaborator} value={collaborator}>{collaborator}</option>)}
            </select>
          </label>
        )}
        {feedback && <p role="status" className="text-sm font-semibold ui-text-muted">{feedback}</p>}
      </form>
    </section>
  )
}
