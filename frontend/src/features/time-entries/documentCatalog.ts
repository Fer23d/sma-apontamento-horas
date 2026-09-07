import type { DisciplineCode, LdDocumentSnapshot, ManualDocumentTypeCode } from './types'

export const disciplines: ReadonlyArray<readonly [DisciplineCode, string]> = [
  ['—', 'Não se aplica'], ['E', 'Elétrica'], ['A', 'Automação'], ['G', 'Geral'], ['M', 'Mecânica'],
]

export const documentTypes: ReadonlyArray<readonly [ManualDocumentTypeCode, string]> = [
  ['—', 'Não se aplica'], ['RN', 'Reunião'], ['GR', 'Gerenciamento'], ['G', 'Geral'],
  ['FD', 'Folha de Dados'], ['DE', 'Desenho'], ['LM', 'Lista de Material'], ['DI', 'Diagrama'],
  ['LC', 'Lista de Cabos'], ['LI', 'Lista de Instrumentos'], ['ET', 'Especificação Técnica'],
  ['MC', 'Memória de Cálculo'], ['MO', 'Modelo 3D'], ['MD', 'Memorial Descritivo'],
  ['FG', 'Fluxograma'], ['LA', 'Lista de Cargas'], ['ES', 'Relação de Entradas e Saídas'], ['CF', 'Arquitetura de Rede'],
]

export const isDisciplineCode = (value: unknown): value is DisciplineCode => disciplines.some(([code]) => code === value)
export const isDocumentAcronym = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9./-]{0,19}$/.test(value)
export const isManualDocumentType = (value: unknown) => documentTypes.some(([code]) => code === value)

export function isLdDocumentSnapshot(value: unknown): value is LdDocumentSnapshot {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const item = value as Record<string, unknown>
  return ['valeNumber', 'title', 'disciplineName', 'fileName'].every((key) => typeof item[key] === 'string' && Boolean(item[key].trim()) && item[key].length <= (key === 'title' ? 4000 : 255))
    && isDocumentAcronym(item.documentTypeCode)
}

export function isAllowedDocumentType(value: unknown, ldDocument?: unknown) {
  return isManualDocumentType(value) || (isLdDocumentSnapshot(ldDocument) && value === ldDocument.documentTypeCode)
}
