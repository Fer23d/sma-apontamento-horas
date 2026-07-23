import { demoActivities, demoClients } from '../../mocks/demoData'
import type { TimeEntryValidationErrors } from './types'
import type { TimeEntryFormValues } from './useTimeEntryForm'

export const fieldClassName = 'mt-2 w-full ui-field rounded-xl px-3 py-2.5 text-sm ui-text shadow-sm outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-[var(--color-surface-subtle)]'

export function FieldError({ id, message }: { id: string; message?: string | null }) {
  if (!message) return null
  return <p id={id} className="mt-1.5 text-sm font-medium text-red-700 dark:text-red-300">{message}</p>
}

type TimeEntryFieldsProps = {
  values: TimeEntryFormValues
  errors: TimeEntryValidationErrors
  maxDate: string
  onChange: <Key extends keyof TimeEntryFormValues>(field: Key, value: TimeEntryFormValues[Key]) => void
}

const documentTypes = [
  ['—', '— — Não se aplica'], ['RN', 'RN — Reunião'], ['GR', 'GR — Gerenciamento'], ['G', 'G — Geral'],
  ['FD', 'FD — Folha de Dados'], ['DE', 'DE — Desenho'], ['LM', 'LM — Lista de Material'], ['DI', 'DI — Diagrama'],
  ['LC', 'LC — Lista de Cabos'], ['LI', 'LI — Lista de Instrumentos'], ['ET', 'ET — Especificação Técnica'],
  ['MC', 'MC — Memória de Cálculo'], ['MO', 'MO — Modelo 3D'], ['MD', 'MD — Memorial Descritivo'],
  ['FG', 'FG — Fluxograma'], ['LA', 'LA — Lista de Cargas'], ['ES', 'ES — Relação de Entradas e Saídas'],
  ['CF', 'CF — Arquitetura de Rede'],
] as const

export function TimeEntryFields({ values, errors, maxDate, onChange }: TimeEntryFieldsProps) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div>
        <label htmlFor="entry-date" className="text-sm font-bold ui-text">Data</label>
        <input id="entry-date" name="entryDate" type="date" max={maxDate} value={values.entryDate} onChange={(event) => onChange('entryDate', event.target.value)} className={fieldClassName} aria-invalid={Boolean(errors.entryDate)} aria-describedby={errors.entryDate ? 'entry-date-error' : undefined} />
        <FieldError id="entry-date-error" message={errors.entryDate} />
      </div>

      <div>
        <label htmlFor="client" className="text-sm font-bold ui-text">Cliente</label>
        <select id="client" name="clientId" value={values.clientId} onChange={(event) => onChange('clientId', event.target.value)} className={fieldClassName} aria-invalid={Boolean(errors.clientId)} aria-describedby={errors.clientId ? 'client-error' : undefined}>
          <option value="">Selecione um cliente</option>
          {demoClients.filter((client) => client.active).map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
        </select>
        <FieldError id="client-error" message={errors.clientId} />
      </div>

      <div>
        <label htmlFor="project-code" className="text-sm font-bold ui-text">Número do projeto</label>
        <input id="project-code" name="projectCode" type="text" maxLength={80} value={values.projectCode} onChange={(event) => onChange('projectCode', event.target.value)} autoCapitalize="none" autoCorrect="off" spellCheck={false} className={fieldClassName} aria-invalid={Boolean(errors.projectCode)} aria-describedby={errors.projectCode ? 'project-code-help project-code-error' : 'project-code-help'} />
        <p id="project-code-help" className="mt-1.5 text-xs ui-text-subtle">* Escreva exatamente a numeração do projeto atual, caso já possua.</p>
        <FieldError id="project-code-error" message={errors.projectCode} />
      </div>

      <div>
        <label htmlFor="activity" className="text-sm font-bold ui-text">Atividade realizada</label>
        <select id="activity" name="activityId" value={values.activityId} onChange={(event) => onChange('activityId', event.target.value)} className={fieldClassName} aria-invalid={Boolean(errors.activityId)} aria-describedby={errors.activityId ? 'activity-error' : undefined}>
          <option value="">Selecione uma atividade</option>
          {demoActivities.filter((activity) => activity.active).map((activity) => <option key={activity.id} value={activity.id}>{activity.name}</option>)}
        </select>
        <FieldError id="activity-error" message={errors.activityId} />
      </div>

      <div>
        <label htmlFor="discipline" className="text-sm font-bold ui-text">Disciplina</label>
        <select id="discipline" name="disciplineCode" value={values.disciplineCode} onChange={(event) => onChange('disciplineCode', event.target.value as TimeEntryFormValues['disciplineCode'])} className={fieldClassName} aria-invalid={Boolean(errors.disciplineCode)} aria-describedby={errors.disciplineCode ? 'discipline-error' : undefined}>
          <option value="">Selecione uma disciplina</option>
          <option value="—">— — Não se aplica</option>
          <option value="A">A — Automação</option>
          <option value="E">E — Elétrica</option>
        </select>
        <FieldError id="discipline-error" message={errors.disciplineCode} />
      </div>

      <div>
        <label htmlFor="document-type" className="text-sm font-bold ui-text">Tipo de documento</label>
        <select id="document-type" name="documentTypeCode" value={values.documentTypeCode} onChange={(event) => onChange('documentTypeCode', event.target.value as TimeEntryFormValues['documentTypeCode'])} className={fieldClassName} aria-invalid={Boolean(errors.documentTypeCode)} aria-describedby={errors.documentTypeCode ? 'document-type-error' : undefined}>
          <option value="">Selecione um tipo</option>
          {documentTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <FieldError id="document-type-error" message={errors.documentTypeCode} />
      </div>
    </div>
  )
}
