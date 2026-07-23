import type { CalendarVisualState } from './types'
import { calendarStatePresentation } from './presentation'

export function CalendarStateBadge({ state }: { state: CalendarVisualState }) {
  const { label, marker, tone } = calendarStatePresentation[state]

  return (
    <span
      data-calendar-state={state}
      className={`calendar-state calendar-state--${tone} inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold`}
    >
      <span aria-hidden="true">{marker}</span>
      <span>{label}</span>
    </span>
  )
}
