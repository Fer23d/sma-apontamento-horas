import { formatMinutes } from '../time-entries/domain'
import { formatDatePtBr } from '../../shared/utils/date'
import { getMonthGridDates, shiftMonth } from './domain'
import type { DailySummary } from './types'
import { CalendarLegend } from './CalendarLegend'
import { calendarStatePresentation } from './presentation'

type MonthlyCalendarProps = {
  monthKey: string
  selectedDate: string
  days: DailySummary[]
  onMonthChange: (monthKey: string) => void
  onSelectDate: (date: string) => void
}

const weekdayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

function monthLabel(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number)
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, 1, 12)))
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function MonthlyCalendar({ monthKey, selectedDate, days, onMonthChange, onSelectDate }: MonthlyCalendarProps) {
  const summaries = new Map(days.map((day) => [day.date, day]))
  const gridDates = getMonthGridDates(monthKey)

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900" aria-labelledby="calendar-title">
      <div className="flex items-center justify-between gap-3">
        <button type="button" aria-label="Mês anterior" onClick={() => onMonthChange(shiftMonth(monthKey, -1))} className="rounded-xl border border-slate-300 px-3 py-2 font-bold dark:border-slate-700">‹</button>
        <h2 id="calendar-title" className="text-lg font-extrabold text-sma-navy dark:text-white">{monthLabel(monthKey)}</h2>
        <button type="button" aria-label="Próximo mês" onClick={() => onMonthChange(shiftMonth(monthKey, 1))} className="rounded-xl border border-slate-300 px-3 py-2 font-bold dark:border-slate-700">›</button>
      </div>
      <div className="mt-5 grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500 sm:gap-2">
        {weekdayLabels.map((label) => <span key={label}>{label}</span>)}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1 sm:gap-2">
        {gridDates.map((date) => {
          const summary = summaries.get(date)
          const state = summary?.visualState ?? 'NO_SCHEDULE'
          const presentation = calendarStatePresentation[state]
          const isCurrentMonth = date.startsWith(monthKey)
          const worked = formatMinutes(summary?.workedMinutes ?? 0)
          const expected = formatMinutes(summary?.expectedMinutes ?? 0)
          const ariaLabel = `${formatDatePtBr(date)}: ${presentation.label}; ${worked} apontadas de ${expected} previstas`
          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelectDate(date)}
              aria-label={ariaLabel}
              aria-pressed={selectedDate === date}
              title={ariaLabel}
              className={`min-h-20 rounded-xl border p-1.5 text-left transition hover:-translate-y-0.5 sm:min-h-24 sm:p-2 ${presentation.classes} ${isCurrentMonth ? '' : 'opacity-40'} ${selectedDate === date ? 'ring-2 ring-sma-navy ring-offset-2 dark:ring-sma-green dark:ring-offset-slate-900' : ''}`}
            >
              <span className="block text-xs font-extrabold sm:text-sm">{Number(date.slice(-2))}</span>
              <span className="mt-1 hidden text-[10px] font-bold leading-tight sm:block"><span aria-hidden="true">{presentation.marker} </span>{presentation.label}</span>
              <span className="mt-1 block text-[9px] font-semibold sm:text-[10px]">{worked}/{expected}</span>
            </button>
          )
        })}
      </div>
      <div className="mt-5"><CalendarLegend /></div>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Feriados exibidos por um provider demonstrativo e determinístico; a fonte oficial será integrada futuramente.</p>
    </section>
  )
}
