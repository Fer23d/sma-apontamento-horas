import type { Comunicado, ComunicadoDestinatario, ComunicadoTipo } from '../features/announcements/types'
import type { DemoRole } from '../features/session/types'

export const ANNOUNCEMENTS_STORAGE_KEY = 'avisos_sistema'
export const ANNOUNCEMENTS_UPDATED_EVENT = 'sma:announcements-updated'

const validTypes = new Set<ComunicadoTipo>(['info', 'alerta', 'urgente'])
const validRecipients = new Set<ComunicadoDestinatario>(['all', 'team', 'individual'])

function normalizeComunicado(value: unknown): Comunicado | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  if (typeof item.id !== 'string'
    || typeof item.titulo !== 'string'
    || typeof item.mensagem !== 'string'
    || typeof item.dataPublicacao !== 'string'
    || typeof item.autor !== 'string'
    || typeof item.tipo !== 'string'
    || !validTypes.has((item.urgencia ?? item.tipo) as ComunicadoTipo)) return null
  const tipoDestinatario = validRecipients.has(item.tipo_destinatario as ComunicadoDestinatario)
    ? item.tipo_destinatario as ComunicadoDestinatario
    : 'all'
  return {
    id: item.id,
    titulo: item.titulo,
    mensagem: item.mensagem,
    dataPublicacao: item.dataPublicacao,
    timestamp: typeof item.timestamp === 'string' ? item.timestamp : item.dataPublicacao,
    autor: item.autor,
    autorId: typeof item.autorId === 'string' ? item.autorId : undefined,
    tipo: item.tipo as ComunicadoTipo,
    urgencia: validTypes.has(item.urgencia as ComunicadoTipo) ? item.urgencia as ComunicadoTipo : item.tipo as ComunicadoTipo,
    tipo_destinatario: tipoDestinatario,
    alvo_referencia: typeof item.alvo_referencia === 'string' ? item.alvo_referencia : null,
  }
}

export function canDeleteAnnouncement(announcement: Comunicado, role: DemoRole | null | undefined, actorId: string | undefined) {
  if (role === 'DIRECTOR_ADMIN') return true
  return role === 'SUPERVISOR' && Boolean(actorId) && announcement.autorId === actorId
}

export function sortAnnouncements(announcements: Comunicado[]) {
  return [...announcements].sort((left, right) => (
    new Date(right.dataPublicacao).getTime() - new Date(left.dataPublicacao).getTime()
  ))
}

export function readAnnouncements(fallback: Comunicado[] = []) {
  if (typeof window === 'undefined') return sortAnnouncements(fallback)
  try {
    const raw = window.localStorage.getItem(ANNOUNCEMENTS_STORAGE_KEY)
    if (!raw) {
      const seeded = sortAnnouncements(fallback)
      if (seeded.length > 0) window.localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(seeded))
      return seeded
    }
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? sortAnnouncements(parsed.flatMap((item) => {
      const normalized = normalizeComunicado(item)
      return normalized ? [normalized] : []
    })) : []
  } catch (error) {
    console.error('Erro ao ler avisos:', error)
    return []
  }
}

export function saveAnnouncement(announcement: Comunicado) {
  if (typeof window === 'undefined') return
  const current = readAnnouncements()
  const next = sortAnnouncements([...current, announcement])
  window.localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(ANNOUNCEMENTS_UPDATED_EVENT))
}

export function deleteAnnouncement(id: string) {
  if (typeof window === 'undefined') return false
  const current = readAnnouncements()
  const next = current.filter((announcement) => announcement.id !== id)
  if (next.length === current.length) return false
  window.localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(ANNOUNCEMENTS_UPDATED_EVENT))
  return true
}
