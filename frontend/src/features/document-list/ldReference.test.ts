import { describe, expect, it } from 'vitest'
import { readSheet } from 'read-excel-file/node'
import { parseLdRows } from './ldImport'

// Referência corporativa externa: nunca copiar o anexo para o repositório.
describe.skipIf(!process.env.SMA_LD_REFERENCE)('LD real fornecida pelo produto', () => {
  it('importa os 236 documentos e seus cabeçalhos, siglas e disciplinas', async () => {
    const rows = await readSheet(process.env.SMA_LD_REFERENCE!, 'LD')
    const result = parseLdRows(rows, 'referencia.xlsm')
    expect(result.documents).toHaveLength(236)
    expect(result.issues).toEqual([{ rowNumber: 33, message: 'Linha incompleta ou com identificação/título acima do limite.' }])
    expect(result.headerRow).toBe(16)
    expect(result.columns).toEqual({ valeNumber: 1, contractorNumber: 3, documentTypeCode: 8, disciplineName: 11, title: 12 })
    expect([...new Set(result.documents.map((doc) => doc.documentTypeCode))].sort()).toEqual(['DG', 'DI', 'DT', 'ET', 'FD', 'LB', 'LD', 'LE', 'LM', 'MC', 'MD', 'PQ', 'RL'])
    expect([...new Set(result.documents.map((doc) => doc.disciplineName))].sort()).toEqual(['AUTOMAÇÃO', 'ELÉTRICA', 'GERAL', 'MECÂNICA'])
    expect(result.documents[0].valeNumber).toBe('LD-2000KS-G-500016')
    expect(result.documents[0].contractorNumber).toBe('LD-G-19N066E-001')
    expect(new Set(result.documents.map((doc) => doc.clientName))).toEqual(new Set(['VALE']))
  })
})
