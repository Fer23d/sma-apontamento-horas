import { calendarStatePresentation } from './presentation'

export function CalendarLegend() {
  return (
    <div aria-label="Legenda do calendário" className="flex flex-wrap gap-2">
      {Object.entries(calendarStatePresentation).map(([state, item]) => (
        <span key={state} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${item.classes}`}>
          <span aria-hidden="true">{item.marker}</span>{item.label}
        </span>
      ))}
    </div>
  )
}
