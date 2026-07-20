import { describe, expect, it } from 'vitest'
import type { DayApproval } from '../features/approvals/types'
import type { AuditEvent } from '../features/audit/types'
import { LocalDayApprovalService } from './dayApprovalService'
import type { StorageLike } from './storage'

class MemoryStorage implements StorageLike {
  private values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
}

const correction: DayApproval = {
  id: 'day-1', collaboratorId: 'collaborator-1', entryDate: '2026-07-17', assignmentSnapshot: null,
  status: 'CORRECTION_REQUESTED', correctionReason: 'Detalhar a entrega', version: 2, updatedAt: '2026-07-18T12:00:00.000Z',
}

describe('LocalDayApprovalService', () => {
  it('bloqueia datas futuras e competências anteriores fechadas', async () => {
    const service = new LocalDayApprovalService(new MemoryStorage(), () => '2026-07-20')
    await expect(service.canMutate('collaborator-1', '2026-07-21')).resolves.toBe(false)
    await expect(service.canMutate('collaborator-1', '2026-06-30')).resolves.toBe(false)
  })

  it('permite dia atual e anterior da competência aberta', async () => {
    const service = new LocalDayApprovalService(new MemoryStorage(), () => '2026-07-20')
    await expect(service.canMutate('collaborator-1', '2026-07-20')).resolves.toBe(true)
    await expect(service.canMutate('collaborator-1', '2026-07-01')).resolves.toBe(true)
  })

  it('conclui correção explicitamente e registra auditoria', async () => {
    const events: AuditEvent[] = []
    const service = new LocalDayApprovalService(new MemoryStorage(), () => '2026-07-20', {
      record: async (event) => { events.push(event) },
    })
    await service.save(correction)

    const completed = await service.completeCorrection('collaborator-1', '2026-07-17')

    expect(completed.status).toBe('AVAILABLE_FOR_APPROVAL')
    expect(events.map((event) => event.type)).toEqual(['CORRECTION_COMPLETED'])
    expect(events[0].entityId).toBe(correction.id)
  })
})
