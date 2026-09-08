import { describe, expect, it } from 'vitest'
import { parseLdRows, validateLdFile, applyLdDocument, importLd } from './ldImport'

const headers = ['No  VALE', 'No  CONTRATADA', 'SIGLA DE DESENHO', 'ESPECIALIDADES DE ENGENHARIA', 'TÍTULO']
const row = ['VA-001', 'ab-00/1  02', 'ZZ-2', 'MECÂNICA', 'Título com acentuação']

describe('importação por cabeçalhos da LD', () => {
  it('ignora título, linha técnica, legenda e vazios e extrai valores reais', () => {
    const result = parseLdRows([['LISTA DE DOCUMENTOS'], ['numero_vale'], headers, [], row], 'base.xlsm')
    expect(result.documents).toHaveLength(1)
    expect(result.documents[0]).toMatchObject({ clientName: 'VALE', valeNumber: 'VA-001', contractorNumber: 'ab-00/1  02', documentTypeCode: 'ZZ-2', disciplineCode: 'M', title: 'Título com acentuação', rowNumber: 5 })
  })
  it('localiza cabeçalhos normalizados mesmo com colunas deslocadas', () => {
    const result = parseLdRows([['TÍTULO', null, 'Nº CONTRATADA', 'ESPECIALIDADES\nDE ENGENHARIA', 'Nº VALE', 'SIGLA DE DESENHO'], ['Geral', null, '0001', 'GERAL', 'LD-001', 'LD']], 'base.xlsx')
    expect(result.documents[0]).toMatchObject({ valeNumber: 'LD-001', disciplineCode: 'G', documentTypeCode: 'LD', contractorNumber: '0001' })
  })
  it('rejeita cabeçalhos ausentes e planilha sem documentos', () => {
    expect(() => parseLdRows([['Outra tabela']], 'base.xlsx')).toThrow(/cabeçalhos/i)
    expect(() => parseLdRows([headers, []], 'base.xlsx')).toThrow(/documentos/i)
  })
  it('isola linhas incompletas, disciplina desconhecida e sigla ausente', () => {
    const result = parseLdRows([headers, row, ['VA-2', '', 'LD', 'GERAL', 'Título'], ['VA-3', '001', 'LD', 'CIVIL', 'Título'], ['VA-4', '001', '', 'GERAL', 'Título']], 'base.xlsx')
    expect(result.documents).toHaveLength(1)
    expect(result.issues.map((item) => item.rowNumber)).toEqual([3, 4, 5])
    expect(result.issues[1].message).toMatch(/disciplina/i)
    expect(result.issues[2].message).toMatch(/sigla/i)
  })
  it('preenche o cliente identificado pela LD e preserva o projeto', () => {
    const document = parseLdRows([headers, row], 'base.xlsm').documents[0]
    const result = applyLdDocument({ projectCode: 'Meu Projeto', clientName: 'Cliente anterior', details: '' }, document)
    expect(result).toMatchObject({ projectCode: 'Meu Projeto', clientName: 'VALE', details: '', contractorNumber: 'ab-00/1  02', disciplineCode: 'M', documentTypeCode: 'ZZ-2', ldDocument: { fileName: 'base.xlsm', valeNumber: 'VA-001' } })
  })
  it('rejeita extensão, conteúdo vazio e tamanho excessivo', () => {
    expect(() => validateLdFile({ name: 'arquivo.csv', size: 100 })).toThrow(/xlsx/i)
    expect(() => validateLdFile({ name: 'arquivo.xlsm', size: 0 })).toThrow(/vazio/i)
    expect(() => validateLdFile({ name: 'arquivo.xlsx', size: 11 * 1024 * 1024 })).toThrow(/10 MB/i)
  })
  it('rejeita conteúdo falso sem tentar preencher formulário', async () => {
    await expect(importLd(new File(['não é um Excel'], 'falso.xlsx'))).rejects.toThrow(/planilha Excel válida/)
  })
})
