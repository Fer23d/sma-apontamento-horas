import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { DailySummary } from './types'
import { CalendarLegend } from './CalendarLegend'
import { MonthlyCalendar } from './MonthlyCalendar'

function day(date: string, visualState: DailySummary['visualState'], workedMinutes = 0, expectedMinutes = 480): DailySummary {
  return {
    date, baseExpectedMinutes: expectedMinutes, expectedMinutes, justifiedMinutes: 0, workedMinutes,
    regularMinutes: Math.min(workedMinutes, expectedMinutes), extraMinutes: Math.max(0, workedMinutes - expectedMinutes),
    missingMinutes: Math.max(0, expectedMinutes - workedMinutes), balanceMinutes: workedMinutes - expectedMinutes,
    isFuture: false, visualState,
  }
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
    expect(markup).toContain('Julho de 2026')
  })
})
