import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { TimeOffRequest } from './types'
import { TimeOffRequestForm } from './TimeOffRequestForm'
import { TimeOffRequestList } from './TimeOffRequestList'

const pending: TimeOffRequest = {
  id: 'request-1', collaboratorId: 'collaborator-1', date: '2026-07-25', reason: 'Compromisso', status: 'PENDING',
  assignmentSnapshot: null, createdAt: '2026-07-20T12:00:00.000Z', updatedAt: '2026-07-20T12:00:00.000Z',
}

describe('interface de folgas do colaborador', () => {
  it('associa labels, restringe a data futura e explica a aprovação necessária', () => {
    const markup = renderToStaticMarkup(<TimeOffRequestForm date="" reason="" minDate="2026-07-21" isSubmitting={false} onDateChange={vi.fn()} onReasonChange={vi.fn()} onSubmit={vi.fn()} />)
    expect(markup).toContain('for="time-off-date"')
    expect(markup).toContain('min="2026-07-21"')
    expect(markup).toContain('for="time-off-reason"')
    expect(markup).toContain('Pendente de aprovação')
  })

  it('permite retirar pendente sem expor controles de aprovação', () => {
    const markup = renderToStaticMarkup(<TimeOffRequestList requests={[pending]} today="2026-07-20" onRemovePending={vi.fn()} onCancelApproved={vi.fn()} />)
    expect(markup).toContain('Excluir solicitação')
    expect(markup).not.toContain('Aprovar folga')
    expect(markup).not.toContain('Rejeitar folga')
  })
})
