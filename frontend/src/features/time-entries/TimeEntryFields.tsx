import { demoActivities } from '../../mocks/demoData'
import type { TimeEntryValidationErrors } from './types'
import type { TimeEntryFormValues } from './useTimeEntryForm'
import { disciplines, documentTypes, isManualDocumentType } from './documentCatalog'
import { MAX_CLIENT_NAME_LENGTH } from '../../config/business'

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
        <input id="client" name="clientName" type="text" maxLength={MAX_CLIENT_NAME_LENGTH} value={values.clientName} readOnly={Boolean(values.ldDocument)} onChange={(event) => onChange('clientName', event.target.value)} autoCorrect="off" spellCheck={false} className={fieldClassName} aria-invalid={Boolean(errors.clientName)} aria-describedby={values.ldDocument ? 'client-help client-error' : errors.clientName ? 'client-error' : undefined} />
        {values.ldDocument && <p id="client-help" className="mt-1.5 text-xs ui-text-subtle">Identificado automaticamente pela LD.</p>}
        <FieldError id="client-error" message={errors.clientName} />
      </div>

      <div>
        <label htmlFor="project-code" className="text-sm font-bold ui-text">Número do projeto</label>
        <input id="project-code" name="projectCode" type="text" maxLength={80} value={values.projectCode} onChange={(event) => onChange('projectCode', event.target.value)} autoCapitalize="none" autoCorrect="off" spellCheck={false} className={fieldClassName} aria-invalid={Boolean(errors.projectCode)} aria-describedby={errors.projectCode ? 'project-code-help project-code-error' : 'project-code-help'} />
        <p id="project-code-help" className="mt-1.5 text-xs ui-text-subtle">* Escreva exatamente a numeração do projeto atual, caso já possua.</p>
        <FieldError id="project-code-error" message={errors.projectCode} />
      </div>

      <div>
        <label htmlFor="contractor-number" className="text-sm font-bold ui-text">Número da contratada</label>
        <input id="contractor-number" name="contractorNumber" value={values.contractorNumber ?? ''} onChange={(event) => onChange('contractorNumber', event.target.value)} autoCapitalize="none" autoCorrect="off" spellCheck={false} className={fieldClassName} aria-invalid={Boolean(errors.contractorNumber)} aria-describedby="contractor-number-help contractor-number-error" />
        <p id="contractor-number-help" className="mt-1.5 text-xs ui-text-subtle">Opcional. Preencha manualmente ou selecione um documento da LD.</p>
        <FieldError id="contractor-number-error" message={errors.contractorNumber} />
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
          {disciplines.map(([code, label]) => <option key={code} value={code}>{code} — {label}</option>)}
        </select>
        <FieldError id="discipline-error" message={errors.disciplineCode} />
      </div>

      <div>
        <label htmlFor="document-type" className="text-sm font-bold ui-text">Tipo de documento</label>
        <select id="document-type" name="documentTypeCode" value={values.documentTypeCode} onChange={(event) => onChange('documentTypeCode', event.target.value as TimeEntryFormValues['documentTypeCode'])} className={fieldClassName} aria-invalid={Boolean(errors.documentTypeCode)} aria-describedby={errors.documentTypeCode ? 'document-type-error' : undefined}>
          <option value="">Selecione um tipo</option>
          {values.ldDocument && !isManualDocumentType(values.ldDocument.documentTypeCode) && <option value={values.ldDocument.documentTypeCode}>{values.ldDocument.documentTypeCode} — Importado da LD</option>}
          {documentTypes.map(([value, label]) => <option key={value} value={value}>{value} — {label}</option>)}
        </select>
        <FieldError id="document-type-error" message={errors.documentTypeCode} />
      </div>
    </div>
  )
}
