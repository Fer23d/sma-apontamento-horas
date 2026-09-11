import type { Comunicado, ComunicadoTipo } from '../features/announcements/types'

export const ANNOUNCEMENTS_STORAGE_KEY = 'avisos_sistema'
export const ANNOUNCEMENTS_UPDATED_EVENT = 'sma:announcements-updated'

const validTypes = new Set<ComunicadoTipo>(['info', 'alerta', 'urgente'])

function isComunicado(value: unknown): value is Comunicado {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return typeof item.id === 'string'
    && typeof item.titulo === 'string'
    && typeof item.mensagem === 'string'
    && typeof item.dataPublicacao === 'string'
    && typeof item.autor === 'string'
    && typeof item.tipo === 'string'
    && validTypes.has(item.tipo as ComunicadoTipo)
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
    return Array.isArray(parsed) ? sortAnnouncements(parsed.filter(isComunicado)) : []
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
