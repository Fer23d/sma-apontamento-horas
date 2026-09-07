import { useRef, useState } from 'react'
import { fieldClassName } from '../time-entries/TimeEntryFields'
import type { LdDocumentSnapshot } from '../time-entries/types'
import { importLd, type LdDocument, type LdImportResult } from './ldImport'

export function LdSection({ selected, onSelect, onClear }: { selected?: LdDocumentSnapshot; onSelect: (document: LdDocument) => void; onClear: () => void }) {
  const [result, setResult] = useState<LdImportResult | null>(null)
  const [fileName, setFileName] = useState('')
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const request = useRef(0)
  const upload = async (file?: File) => {
    if (!file) return
    const current = ++request.current
    setBusy(true); setError('')
    try {
      const next = await importLd(file)
      if (current !== request.current) return
      setResult(next); setFileName(file.name); setQuery('')
    } catch (error) {
      if (current === request.current) setError(error instanceof Error ? error.message : 'Não foi possível importar a LD.')
    } finally { if (current === request.current) setBusy(false) }
  }
  const search = query.toLocaleLowerCase('pt-BR')
  const matching = result?.documents.filter((doc) => `${doc.valeNumber} ${doc.contractorNumber} ${doc.title}`.toLocaleLowerCase('pt-BR').includes(search)) ?? []
  return <section className="min-w-0 space-y-3 rounded-xl border ui-border ui-surface-subtle p-4" aria-labelledby="ld-title">
    <h2 id="ld-title" className="font-bold ui-heading">Lista de Documentos (LD)</h2>
    <p className="text-sm ui-text-muted">Opcional. Importe uma planilha e selecione um documento para preencher os dados relacionados.</p>
    <label htmlFor="ld-file" className="block text-sm font-bold ui-text">Arquivo .xlsm ou .xlsx</label>
    <input id="ld-file" type="file" accept=".xlsm,.xlsx" className="block w-full min-w-0 text-sm ui-text" onChange={(event) => { void upload(event.target.files?.[0]); event.target.value = '' }} aria-describedby="ld-feedback" />
    <div id="ld-feedback" aria-live="polite" className="break-words text-sm ui-text-muted">{busy ? 'Lendo a LD…' : fileName && `${fileName} — ${result?.documents.length} documentos válidos`}</div>
    {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error} Os dados atuais do formulário foram preservados.</p>}
    {result && <>
      <label htmlFor="ld-search" className="block text-sm font-bold ui-text">Pesquisar documento</label>
      <input id="ld-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} className={fieldClassName} placeholder="Número VALE, contratada ou título" />
      <label htmlFor="ld-document" className="block text-sm font-bold ui-text">Documento da LD</label>
      <select id="ld-document" className={fieldClassName} value="" disabled={busy} onChange={(event) => { const document = result.documents.find((doc) => String(doc.rowNumber) === event.target.value); if (document) onSelect(document) }}>
        <option value="">{matching.length ? `Selecione entre ${matching.length} documento(s)` : 'Nenhum resultado para a pesquisa'}</option>
        {matching.map((doc) => <option key={doc.rowNumber} value={doc.rowNumber}>{doc.valeNumber} — {doc.contractorNumber} — {doc.title}</option>)}
      </select>
      {result.issues.length > 0 && <details className="text-sm ui-text-muted"><summary>{result.issues.length} linha(s) ignorada(s)</summary><ul className="mt-2 list-disc pl-5">{result.issues.map((issue) => <li key={issue.rowNumber}>Linha {issue.rowNumber}: {issue.message}</li>)}</ul></details>}
    </>}
    {selected && <div className="break-words rounded-lg border ui-border ui-surface p-3 text-sm ui-text" role="status">
      <p className="font-bold">Selecionado: {selected.valeNumber}</p><p>{selected.title}</p><p className="mt-1 ui-text-muted">Origem: {selected.fileName}</p>
      <button type="button" onClick={onClear} className="mt-2 font-bold underline">Desvincular documento e usar dados manuais</button>
    </div>}
  </section>
}
