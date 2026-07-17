import { describe, expect, it, vi } from 'vitest'
import { LocalStorageTimeEntryService, type StorageLike } from './timeEntryService'

class MemoryStorage implements StorageLike {
  private values = new Map<string, string>()
  readonly writes = new Map<string, number>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
    this.writes.set(key, (this.writes.get(key) ?? 0) + 1)
  }
}

class CorruptingV2Storage extends MemoryStorage {
  setItem(key: string, value: string) {
    super.setItem(key, key === v2Key ? '{invalid-v2' : value)
  }
}

const v1Key = 'sma:time-entries:v1'
const v2Key = 'sma:time-entries:v2'

function legacyEntry(projectId: unknown, overrides: Record<string, unknown> = {}) {
  return {
    id: 'legacy-entry-1',
    collaboratorId: 'demo-collaborator-001',
    entryDate: '2026-07-13',
    clientId: 'client-industrial-alpha',
    projectId,
    activityId: 'activity-project-design',
    durationMinutes: 60,
    details: 'Registro legado',
    status: 'ACTIVE',
    version: 1,
    createdAt: '2026-07-13T12:00:00.000Z',
    updatedAt: '2026-07-13T12:00:00.000Z',
    ...overrides,
  }
}

function currentEntry(projectCode: string, overrides: Record<string, unknown> = {}) {
  const { projectId: _projectId, ...entry } = legacyEntry(undefined, overrides)
  return { ...entry, projectCode }
}

describe('LocalStorageTimeEntryService', () => {
  it('não quebra quando o storage contém JSON inválido', async () => {
    const storage = new MemoryStorage()
    storage.setItem(v1Key, '{invalid')
    const onStorageError = vi.fn()
    const service = new LocalStorageTimeEntryService({ storage, onStorageError })

    await expect(service.listByDate('demo-collaborator-001', '2026-07-13')).resolves.toEqual([])
    expect(onStorageError).toHaveBeenCalledOnce()
  })

  it('persiste e isola apontamentos por colaborador', async () => {
    const storage = new MemoryStorage()
    const service = new LocalStorageTimeEntryService({
      storage,
      createId: () => 'stable-entry-id',
      now: () => '2026-07-13T12:00:00.000Z',
    })
    await service.create('demo-collaborator-001', {
      entryDate: '2026-07-13',
      clientId: 'client-industrial-alpha',
      projectCode: 'Ab-001/2.03',
      activityId: 'activity-project-design',
      durationMinutes: 60,
      details: 'Teste de persistência',
    })

    const ownEntries = await service.listByDate('demo-collaborator-001', '2026-07-13')
    expect(ownEntries).toHaveLength(1)
    expect(ownEntries[0].id).toBe('stable-entry-id')
    expect(ownEntries[0].projectCode).toBe('Ab-001/2.03')
    await expect(service.listByDate('other-user', '2026-07-13')).resolves.toEqual([])
  })

  it('descarta registro armazenado no grupo de outro colaborador', async () => {
    const storage = new MemoryStorage()
    storage.setItem(v2Key, JSON.stringify({
      version: 2,
      entriesByCollaborator: {
        'demo-collaborator-001': [{
          id: 'foreign-entry',
          collaboratorId: 'other-user',
          entryDate: '2026-07-13',
          clientId: 'client-industrial-alpha',
          projectCode: 'ALF-001',
          activityId: 'activity-project-design',
          durationMinutes: 60,
          details: 'Registro em grupo incorreto',
          status: 'ACTIVE',
          version: 1,
          createdAt: '2026-07-13T12:00:00.000Z',
          updatedAt: '2026-07-13T12:00:00.000Z',
        }],
      },
    }))
    const service = new LocalStorageTimeEntryService({ storage })

    await expect(service.listByDate('demo-collaborator-001', '2026-07-13')).resolves.toEqual([])
  })

  it('remove somente espaços externos antes de persistir e preserva o restante do código', async () => {
    const storage = new MemoryStorage()
    const service = new LocalStorageTimeEntryService({ storage, createId: () => 'trimmed', now: () => '2026-07-13T12:00:00.000Z' })

    await service.create('demo-collaborator-001', {
      entryDate: '2026-07-13',
      clientId: 'client-industrial-alpha',
      projectCode: '  Ab-00  1/2.03  ',
      activityId: 'activity-project-design',
      durationMinutes: 60,
      details: 'Teste',
    })

    const [saved] = await service.listByDate('demo-collaborator-001', '2026-07-13')
    expect(saved.projectCode).toBe('Ab-00  1/2.03')
  })

  it('migra projectId conhecido para o código demonstrativo correspondente', async () => {
    const storage = new MemoryStorage()
    storage.setItem(v1Key, JSON.stringify({ version: 1, entriesByCollaborator: { 'demo-collaborator-001': [legacyEntry('project-alpha-automation')] } }))
    const service = new LocalStorageTimeEntryService({ storage })

    const entries = await service.listByDate('demo-collaborator-001', '2026-07-13')

    expect(entries).toHaveLength(1)
    expect(entries[0].projectCode).toBe('ALF-001')
    expect(storage.getItem(v2Key)).not.toBeNull()
  })

  it('preserva projectId desconhecido como projectCode', async () => {
    const storage = new MemoryStorage()
    storage.setItem(v1Key, JSON.stringify({ version: 1, entriesByCollaborator: { 'demo-collaborator-001': [legacyEntry('LEGADO-X/007')] } }))
    const service = new LocalStorageTimeEntryService({ storage })

    const [entry] = await service.listByDate('demo-collaborator-001', '2026-07-13')

    expect(entry.projectCode).toBe('LEGADO-X/007')
  })

  it('é idempotente e não duplica registros em execuções repetidas', async () => {
    const storage = new MemoryStorage()
    const originalV1 = JSON.stringify({ version: 1, entriesByCollaborator: { 'demo-collaborator-001': [legacyEntry('project-alpha-automation')] } })
    storage.setItem(v1Key, originalV1)

    await new LocalStorageTimeEntryService({ storage }).listByDate('demo-collaborator-001', '2026-07-13')
    const v2AfterFirstMigration = storage.getItem(v2Key)
    const secondRead = await new LocalStorageTimeEntryService({ storage }).listByDate('demo-collaborator-001', '2026-07-13')

    expect(secondRead).toHaveLength(1)
    expect(storage.getItem(v2Key)).toBe(v2AfterFirstMigration)
    expect(storage.writes.get(v2Key)).toBe(1)
    expect(storage.getItem(v1Key)).toBe(originalV1)
  })

  it('prioriza uma v2 válida e não mistura registros da v1', async () => {
    const storage = new MemoryStorage()
    storage.setItem(v1Key, JSON.stringify({ version: 1, entriesByCollaborator: { 'demo-collaborator-001': [legacyEntry('project-alpha-automation')] } }))
    storage.setItem(v2Key, JSON.stringify({ version: 2, entriesByCollaborator: { 'demo-collaborator-001': [currentEntry('V2-ONLY')] } }))
    const service = new LocalStorageTimeEntryService({ storage })

    const entries = await service.listByDate('demo-collaborator-001', '2026-07-13')

    expect(entries.map((entry) => entry.projectCode)).toEqual(['V2-ONLY'])
  })

  it('preserva registros válidos quando outro registro legado é inválido', async () => {
    const storage = new MemoryStorage()
    storage.setItem(v1Key, JSON.stringify({
      version: 1,
      entriesByCollaborator: {
        'demo-collaborator-001': [legacyEntry('project-alpha-automation'), legacyEntry(null, { id: 'invalid' })],
      },
    }))
    const service = new LocalStorageTimeEntryService({ storage })

    const entries = await service.listByDate('demo-collaborator-001', '2026-07-13')

    expect(entries).toHaveLength(1)
    expect(entries[0].projectCode).toBe('ALF-001')
  })

  it('retorna vazio e preserva v1 quando a v2 gravada não pode ser validada', async () => {
    const storage = new CorruptingV2Storage()
    const originalV1 = JSON.stringify({ version: 1, entriesByCollaborator: { 'demo-collaborator-001': [legacyEntry('project-alpha-automation')] } })
    storage.setItem(v1Key, originalV1)
    const onStorageError = vi.fn()
    const service = new LocalStorageTimeEntryService({ storage, onStorageError })

    const entries = await service.listByDate('demo-collaborator-001', '2026-07-13')

    expect(entries).toEqual([])
    expect(storage.getItem(v1Key)).toBe(originalV1)
    expect(onStorageError).toHaveBeenCalled()
  })

  it('não sobrescreve uma v2 inválida ao tentar criar novo registro', async () => {
    const storage = new MemoryStorage()
    const invalidV2 = '{invalid-v2'
    storage.setItem(v2Key, invalidV2)
    const service = new LocalStorageTimeEntryService({ storage, onStorageError: vi.fn() })

    await expect(service.create('demo-collaborator-001', {
      entryDate: '2026-07-13',
      clientId: 'client-industrial-alpha',
      projectCode: 'NEW-001',
      activityId: 'activity-project-design',
      durationMinutes: 60,
      details: 'Não deve ser gravado',
    })).rejects.toThrow('Não foi possível preparar o armazenamento local para gravação.')
    expect(storage.getItem(v2Key)).toBe(invalidV2)
  })

  it('persiste e relê projectCode após nova instância do service', async () => {
    const storage = new MemoryStorage()
    await new LocalStorageTimeEntryService({ storage, createId: () => 'reload-entry' }).create('demo-collaborator-001', {
      entryDate: '2026-07-13',
      clientId: 'client-industrial-alpha',
      projectCode: 'Reload-001',
      activityId: 'activity-project-design',
      durationMinutes: 60,
      details: 'Persistência após reload',
    })

    const [entry] = await new LocalStorageTimeEntryService({ storage }).listByDate('demo-collaborator-001', '2026-07-13')

    expect(entry.projectCode).toBe('Reload-001')
  })
})
