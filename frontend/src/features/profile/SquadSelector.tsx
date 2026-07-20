import type { Squad } from '../squads/types'

type SquadSelectorProps = {
  squads: Squad[]
  activeSquadId: string
  isSaving: boolean
  onChange: (squadId: string) => void
}

export function SquadSelector({ squads, activeSquadId, isSaving, onChange }: SquadSelectorProps) {
  return (
    <section className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700" aria-labelledby="squad-title">
      <h2 id="squad-title" className="text-lg font-extrabold text-sma-navy dark:text-white">Alocação atual</h2>
      <div className="mt-4 max-w-xl">
        <label htmlFor="active-squad" className="block text-sm font-bold text-slate-700 dark:text-slate-200">Squad ativa</label>
        <select
          id="active-squad"
          value={activeSquadId}
          disabled={isSaving}
          onChange={(event) => onChange(event.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-sma-green focus:ring-2 focus:ring-sma-green/30 disabled:cursor-wait disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
        >
          {squads.map((squad) => <option key={squad.id} value={squad.id}>{squad.name}</option>)}
        </select>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Ao alterar a squad, o supervisor será definido automaticamente para os próximos registros e solicitações.
        </p>
      </div>
    </section>
  )
}
