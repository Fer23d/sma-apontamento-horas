import { useState, type FormEvent } from 'react'
import { useSession } from '../session/useSession'
import { saveAnnouncement } from '../../services/announcementService'
import type { ComunicadoTipo } from './types'

const urgencyOptions: Array<{ value: ComunicadoTipo, label: string }> = [
  { value: 'info', label: 'Normal' },
  { value: 'alerta', label: 'Importante' },
  { value: 'urgente', label: 'Crítico' },
]

export function CriarAviso() {
  const { session } = useSession()
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState<ComunicadoTipo>('info')
  const [feedback, setFeedback] = useState<string | null>(null)

  const canCreate = session?.role === 'SUPERVISOR' || session?.role === 'DIRECTOR_ADMIN'
  if (!canCreate) return null

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const titulo = title.trim()
    const mensagem = message.trim()
    if (!titulo || !mensagem || !session) {
      setFeedback('Preencha o título e a mensagem para enviar o aviso.')
      return
    }

    saveAnnouncement({
      id: crypto.randomUUID(),
      titulo,
      mensagem,
      dataPublicacao: new Date().toISOString(),
      autor: session.name,
      tipo: type,
    })
    setTitle('')
    setMessage('')
    setType('info')
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
          <button type="submit" className="ui-button-primary">Enviar Aviso</button>
        </div>
        {feedback && <p role="status" className="text-sm font-semibold ui-text-muted">{feedback}</p>}
      </form>
    </section>
  )
}
