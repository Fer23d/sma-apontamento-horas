import { describe, expect, it } from 'vitest'
import { canDeleteAnnouncement } from './announcementService'
import type { Comunicado } from '../features/announcements/types'

const announcement = { id: 'a-1', autorId: 'supervisor-1' } as Comunicado

describe('permissão de exclusão de avisos', () => {
  it('permite que a Diretoria exclua qualquer aviso', () => {
    expect(canDeleteAnnouncement(announcement, 'DIRECTOR_ADMIN', 'director-1')).toBe(true)
  })

  it('permite que o Supervisor exclua apenas avisos de sua autoria', () => {
    expect(canDeleteAnnouncement(announcement, 'SUPERVISOR', 'supervisor-1')).toBe(true)
    expect(canDeleteAnnouncement(announcement, 'SUPERVISOR', 'supervisor-2')).toBe(false)
  })

  it('não permite exclusão para Colaborador', () => {
    expect(canDeleteAnnouncement(announcement, 'COLLABORATOR', 'supervisor-1')).toBe(false)
  })
})
