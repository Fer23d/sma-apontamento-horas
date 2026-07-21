import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { DailySummary } from './types'
import { CalendarLegend } from './CalendarLegend'
import { MonthlyCalendar } from './MonthlyCalendar'
import { DayDetails } from './DayDetails'
import type { DayApproval } from '../approvals/types'

function day(date: string, visualState: DailySummary['visualState'], workedMinutes = 0, expectedMinutes = 480): DailySummary {
  return {
    date, baseExpectedMinutes: expectedMinutes, expectedMinutes, justifiedMinutes: 0, workedMinutes,
    regularMinutes: Math.min(workedMinutes, expectedMinutes), extraMinutes: Math.max(0, workedMinutes - expectedMinutes),
    missingMinutes: Math.max(0, expectedMinutes - workedMinutes), balanceMinutes: workedMinutes - expectedMinutes,
    isFuture: false, hasIntegralEventConflict: false, visualState,
  }
}

const approval: DayApproval = {
  id: 'approval-1', collaboratorId: 'demo-collaborator-001', entryDate: '2026-07-20', assignmentSnapshot: null,
  status: 'AVAILABLE_FOR_APPROVAL', version: 1, updatedAt: '2026-07-20T12:00:00.000Z',
}

describe('calendário acessível', () => {
  it('renderiza legenda textual para todos os estados sem depender somente de cor', () => {
    const markup = renderToStaticMarkup(<CalendarLegend />)
    for (const label of ['Sem apontamento', 'Jornada incompleta', 'Jornada atingida', 'Jornada excedida', 'Férias', 'Folga', 'Afastamento', 'Feriado']) {
      expect(markup).toContain(label)
    }
  })

  it('nomeia cada dia com data, situação e totais, sem codificar aprovação como cor', () => {
    const markup = renderToStaticMarkup(
      <MonthlyCalendar monthKey="2026-07" selectedDate="2026-07-20" days={[
        day('2026-07-20', 'COMPLETE', 480), day('2026-07-21', 'INCOMPLETE', 300),
      ]} onMonthChange={vi.fn()} onSelectDate={vi.fn()} />,
    )
    expect(markup).toContain('aria-label="20 de julho de 2026: Jornada atingida; 08:00 apontadas de 08:00 previstas"')
    expect(markup).toContain('Jornada incompleta')
    expect(markup).not.toContain('approval-color')
  })

  it('oferece navegação mensal com nomes acessíveis', () => {
    const markup = renderToStaticMarkup(<MonthlyCalendar monthKey="2026-07" selectedDate="2026-07-20" days={[]} onMonthChange={vi.fn()} onSelectDate={vi.fn()} />)
    expect(markup).toContain('aria-label="Mês anterior"')
    expect(markup).toContain('aria-label="Próximo mês"')
    expect(markup).toContain('aria-label="Selecionar mês do calendário"')
    expect(markup).toContain('Julho de 2026')
  })

  it('renderiza somente dias do mês e mantém placeholders fora do foco', () => {
    const markup = renderToStaticMarkup(<MonthlyCalendar monthKey="2026-07" selectedDate="2026-07-20" days={[]} onMonthChange={vi.fn()} onSelectDate={vi.fn()} />)

    expect(markup.match(/data-calendar-day=/g)).toHaveLength(31)
    expect(markup.match(/data-calendar-placeholder=/g)).toHaveLength(4)
    expect(markup).not.toContain('29 de junho de 2026')
    expect(markup).not.toContain('1 de agosto de 2026')
    expect(markup).toContain('data-calendar-placeholder="true" aria-hidden="true"')
  })

  it('explica que o calendário é demonstrativo sem expor termos técnicos', () => {
    const markup = renderToStaticMarkup(<MonthlyCalendar monthKey="2026-07" selectedDate="2026-07-20" days={[]} onMonthChange={vi.fn()} onSelectDate={vi.fn()} />)

    expect(markup).toContain('Calendário de demonstração: os feriados nacionais, estaduais e municipais ainda não estão integrados a uma fonte oficial.')
    expect(markup).toContain('role="note"')
    expect(markup).not.toContain('HolidayProvider')
    expect(markup).not.toContain('provider demonstrativo')
  })

  it('sinaliza registro histórico conflitante com evento integral', () => {
    const summary = { ...day('2026-07-20', 'VACATION'), hasIntegralEventConflict: true }
    const markup = renderToStaticMarkup(<DayDetails summary={summary} events={[{
      id: 'vacation-1', collaboratorId: 'demo-collaborator-001', type: 'VACATION', startDate: '2026-07-20', endDate: '2026-07-20',
      title: 'Férias demonstrativas', source: 'DEMO', createdAt: '2026-07-01T12:00:00.000Z',
    }]} approval={approval} />)

    expect(markup).toContain('Conflito com evento integral')
    expect(markup).toContain('preservado para auditoria')
    expect(markup).toContain('role="alert"')
  })
})
