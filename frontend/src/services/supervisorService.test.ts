import { describe, expect, it } from 'vitest'
import { LocalStorageSupervisorService } from './supervisorService'
import type { StorageLike } from './storage'

function createMemoryStorage(): StorageLike {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value) },
  }
}

const seedEntries = [
  {
    id: 'entry-001',
    collaboratorId: 'collaborator-001',
    collaboratorName: 'Ana Lima',
    entryDate: '2026-07-28',
    projectCode: 'SM&A-001',
    durationMinutes: 480,
    activityName: 'Projeto',
  },
  {
    id: 'entry-002',
    collaboratorId: 'collaborator-002',
    collaboratorName: 'Bruno Dias',
    entryDate: '2026-07-29',
    projectCode: 'SM&A-002',
    durationMinutes: 360,
    activityName: 'Revisão',
  },
]

describe('LocalStorageSupervisorService', () => {
  it('lista apontamentos mockados como pendentes inicialmente', async () => {
    const service = new LocalStorageSupervisorService(createMemoryStorage(), () => '2026-07-30T12:00:00.000Z', seedEntries)

    await expect(service.getSummary()).resolves.toEqual({ pending: 2, approved: 0, rejected: 0 })
    await expect(service.listEntries()).resolves.toMatchObject([
      { id: 'entry-001', status: 'PENDING' },
      { id: 'entry-002', status: 'PENDING' },
    ])
  })

  it('persiste aprovação e rejeição no storage local', async () => {
    const storage = createMemoryStorage()
    const service = new LocalStorageSupervisorService(storage, () => '2026-07-30T12:00:00.000Z', seedEntries)

    await service.approve('entry-001', 'supervisor-001')
    await service.reject('entry-002', 'supervisor-001', 'Ajustar projeto informado.')

    await expect(service.getSummary()).resolves.toEqual({ pending: 0, approved: 1, rejected: 1 })
    await expect(service.listEntries()).resolves.toMatchObject([
      { id: 'entry-001', status: 'APPROVED', decidedBy: 'supervisor-001' },
      { id: 'entry-002', status: 'REJECTED', rejectionReason: 'Ajustar projeto informado.' },
    ])
  })

  it('exige motivo para rejeitar', async () => {
    const service = new LocalStorageSupervisorService(createMemoryStorage(), () => '2026-07-30T12:00:00.000Z', seedEntries)

    expect(() => service.reject('entry-001', 'supervisor-001', '   ')).toThrow('Informe o motivo da rejeição.')
  })
})
