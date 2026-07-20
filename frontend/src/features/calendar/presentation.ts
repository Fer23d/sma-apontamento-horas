import type { CalendarVisualState } from './types'

export const calendarStatePresentation: Record<CalendarVisualState, { label: string; marker: string; classes: string }> = {
  NO_SCHEDULE: { label: 'Sem jornada prevista', marker: '○', classes: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300' },
  NO_ENTRY: { label: 'Sem apontamento', marker: '!', classes: 'border-red-300 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-100' },
  INCOMPLETE: { label: 'Jornada incompleta', marker: '◷', classes: 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100' },
  COMPLETE: { label: 'Jornada atingida', marker: '✓', classes: 'border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100' },
  EXCEEDED: { label: 'Jornada excedida', marker: '+', classes: 'border-blue-300 bg-blue-50 text-blue-950 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-100' },
  VACATION: { label: 'Férias', marker: '▣', classes: 'border-pink-300 bg-pink-50 text-pink-950 dark:border-pink-800 dark:bg-pink-950/50 dark:text-pink-100' },
  TIME_OFF: { label: 'Folga', marker: '↺', classes: 'border-slate-400 bg-slate-200 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100' },
  MEDICAL_LEAVE: { label: 'Afastamento', marker: '✚', classes: 'border-slate-700 bg-slate-800 text-white dark:border-slate-500 dark:bg-slate-950 dark:text-slate-100' },
  HOLIDAY: { label: 'Feriado', marker: '◆', classes: 'border-violet-300 bg-violet-50 text-violet-950 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-100' },
}
