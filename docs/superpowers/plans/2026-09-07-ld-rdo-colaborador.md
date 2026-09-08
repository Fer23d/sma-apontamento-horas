# LD e RDO do Colaborador — plano de implementação

**Objetivo:** importar documentos de uma LD opcional, preservar seus dados no apontamento e gerar RDO A4 paisagem sem salvar o formulário.

**Arquitetura:** parser de LD separado da UI; metadados opcionais em `TimeEntry`; gerador PDF independente de persistência. Continuidade na branch autorizada `refactor/frontend-colaborador`, sem incorporar outras branches.

**Referência real revalidada:** arquivo `LD-2000KS-G-500016=1 REVISÃO Geral 1.xlsm`, SHA-256 `3246399648A9B6091E5AE4587BEBF22A8120CC36F7C03F8726145EDC4DCE4D9C`, lido diretamente do anexo externo e não de fixture do projeto. Abas `F. Rosto` e `LD`; cabeçalho da LD na linha 16, linha técnica 15, subcabeçalho 17 e 236 documentos válidos entre as linhas 18 e 254. Cabeçalhos reais: B `No  VALE`, D `No  CONTRATADA`, I `SIGLA DE DESENHO`, L `ESPECIALIDADES DE ENGENHARIA`, M `TÍTULO`. Tipos: DG, DI, DT, ET, FD, LB, LD, LE, LM, MC, MD, PQ, RL. Disciplinas: AUTOMAÇÃO, ELÉTRICA, GERAL, MECÂNICA.

**Referência visual real revalidada:** arquivo `RDO_25M022E_29072026_a_31072026 e 11082026_a_14082026 completo.pdf`, SHA-256 `0861986DA444862FB3AAB5A51D7652EF071E72A90EDCC7F023968DD80EEE56B8`. As sete páginas A4 paisagem foram renderizadas e inspecionadas individualmente. Todas mantêm cabeçalho tabular, contratada/contrato/data/objeto, quadro profissional/horas, grade de atividades e assinaturas. O novo PDF adapta essa hierarquia e omite horários, Data OS, QQP e assinaturas não disponíveis. Não incorpora dados preenchidos ou a marca de terceiros da referência.

**Confirmação adicional do teste real:** há 237 linhas candidatas; a linha 33 não possui título. Ela é informada como inválida e ignorada, restando 236 documentos completos selecionáveis.

## Restrições e decisões

- Número da contratada opcional, preservando caracteres e espaços internos; somente trim externo, limite de 160 caracteres.
- Detalhamento continua string, aceitando vazio; motivo de edição/cancelamento permanece obrigatório.
- Disciplina: —, E, A, G, M. Tipo manual mantém catálogo; sigla importada aceita 1–20 letras/números/ponto/hífen/barra, preservando capitalização.
- Metadados de LD: número VALE, título, sigla original, disciplina original e nome de arquivo; planilha nunca persistida.
- Extensões xlsx/xlsm; limite 10 MiB; macros não executadas; aba e cabeçalhos obrigatórios, linhas inválidas reportadas e não selecionáveis.
- Contrato v3 recebe campos aditivos opcionais. Normalização de registros antigos permanece idempotente, sem regravar durante leitura; cadeia v1→v2→v3 e backups preservados.
- read-excel-file e jspdf são necessárias pois navegador/React não possuem parser OOXML ou exportação PDF com download direto. Importação dinâmica mantém custo fora do carregamento inicial.
- Sem backend, novas aprovações, mudanças em saldo ou PR nesta tarefa.

## Etapa 1 — contrato e persistência

- [x] Escrever testes de detalhe vazio, Geral/Mecânica, número com espaços internos, tipo dinâmico vinculado à LD, leitura antiga, edição/duplicação.
- [x] Executar `npm test -- src/features/time-entries/domain.test.ts src/services/timeEntryService.test.ts` e confirmar falhas esperadas.
- [x] Centralizar catálogos/validação documental; atualizar tipos, normalizador, service, formulário e histórico. Preservar o comportamento dos demais campos.
- [x] Reexecutar testes e typecheck; revisar diff e commit coerente.

## Etapa 2 — leitura e seleção

- [x] Testar parser com cabeçalhos reais, colunas deslocadas, ausência de aba, linhas inválidas, sigla desconhecida e fixture sintética sem dados corporativos.
- [x] Executar teste de integração opt-in contra o anexo real via variável `SMA_LD_REFERENCE`, sem copiar o anexo ao repositório.
- [x] Implementar `parseLdRows(rows)` e `importLd(file)`; UI com busca, seleção nativa acessível, mensagens e limpeza explícita.
- [x] Autopreencher número da contratada, disciplina e tipo; não alterar projeto/cliente/detalhamento.
- [x] Testar, revisar e commitar a entrega.

## Etapa 3 — RDO

- [x] Testar modelo PDF manual/com LD, ausência de dados inventados, nome sanitizado, PDF A4 paisagem válido, download e texto longo multipágina.
- [x] Implementar `generateRdo(data, logo)` com jspdf e download por Blob; ação type=button sem persistência.
- [x] Usar dados atuais do formulário e perfil; quebra de texto calculada, margens e paginação; erros controlados.
- [x] Renderizar PDF gerado e inspecionar visualmente; verificar desktop, 390px e temas claro/escuro.
- [x] Atualizar documentação funcional e técnica; testes, lint, typecheck, build e diff check; commit e push somente da branch autorizada.
