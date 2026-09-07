# LD e RDO do Colaborador — plano de implementação

**Objetivo:** importar documentos de uma LD opcional, preservar seus dados no apontamento e gerar RDO A4 sem salvar o formulário.

**Arquitetura:** parser de LD separado da UI; metadados opcionais em `TimeEntry`; gerador PDF independente de persistência. Continuidade na branch autorizada `refactor/frontend-colaborador`, sem incorporar outras branches.

**Referência inspecionada:** arquivo LD-2000KS-G-500016=1 REVISÃO Geral 1.xlsm, abas F. Rosto e LD. Aba LD com cabeçalho na linha 16, linha técnica 15, subcabeçalho 17 e 236 documentos entre 18 e 254. Cabeçalhos reais: B `No  VALE`, D `No  CONTRATADA`, I `SIGLA DE DESENHO`, L `ESPECIALIDADES DE ENGENHARIA`, M `TÍTULO`. Tipos: DG, DI, DT, ET, FD, LB, LD, LE, LM, MC, MD, PQ, RL. Disciplinas: AUTOMAÇÃO, ELÉTRICA, GERAL, MECÂNICA.

**Referência visual:** RDO de sete páginas com cabeçalho, contratada/contrato/data/objeto, quadro profissional/horas, atividades e assinaturas. O novo PDF adapta essa hierarquia e omite horários, Data OS, QQP e assinaturas não disponíveis. Não incorpora dados preenchidos da referência.

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

- [ ] Escrever testes de detalhe vazio, Geral/Mecânica, número com espaços internos, tipo dinâmico vinculado à LD, leitura antiga, edição/duplicação.
- [ ] Executar `npm test -- src/features/time-entries/domain.test.ts src/services/timeEntryService.test.ts` e confirmar falhas esperadas.
- [ ] Centralizar catálogos/validação documental; atualizar tipos, normalizador, service, formulário e histórico. Preservar o comportamento dos demais campos.
- [ ] Reexecutar testes e typecheck; revisar diff e commit coerente.

## Etapa 2 — leitura e seleção

- [ ] Testar parser com cabeçalhos reais, colunas deslocadas, ausência de aba, linhas inválidas, sigla desconhecida e fixture sintética sem dados corporativos.
- [ ] Executar teste de integração opt-in contra o anexo real via variável `SMA_LD_REFERENCE`, sem copiar o anexo ao repositório.
- [ ] Implementar `parseLdRows(rows)` e `importLd(file)`; UI com busca, seleção nativa acessível, mensagens e limpeza explícita.
- [ ] Autopreencher número da contratada, disciplina e tipo; não alterar projeto/cliente/detalhamento.
- [ ] Testar, revisar e commitar a entrega.

## Etapa 3 — RDO

- [ ] Testar modelo PDF manual/com LD, ausência de dados inventados, nome sanitizado, PDF A4 válido e texto longo multipágina.
- [ ] Implementar `generateRdo(data, logo)` com jspdf e download por Blob; ação type=button sem persistência.
- [ ] Usar dados atuais do formulário e perfil; quebra de texto calculada, margens e paginação; erros controlados.
- [ ] Renderizar PDF gerado e inspecionar visualmente; verificar desktop, 390px e temas claro/escuro.
- [ ] Atualizar documentação funcional e técnica; testes, lint, typecheck, build e diff check; commit e push somente da branch autorizada.
