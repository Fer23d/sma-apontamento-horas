# SM&A — Frontend

Área demonstrativa do Colaborador para apontamento de horas por projeto, construída com React, TypeScript, Vite, Tailwind CSS e React Router.

## Escopo disponível

- sessão demonstrativa e perfil profissional;
- dashboard com saldos reais consolidados por dia, mês, intervalo e total, sempre limitados ao dia atual;
- calendário mensal com feriados e eventos demonstrativos;
- criação, edição, duplicação e cancelamento lógico de apontamentos;
- histórico individual paginado, filtros e eventos do período;
- solicitações de folga e de alteração de carga horária;
- tema claro/escuro e layout responsivo.

As rotas autenticadas começam em `/colaborador`. O login em `/login` não usa senha e existe somente para demonstrar o fluxo do frontend. Não há backend, banco de dados ou autenticação real nesta fase.

## Execução local

```bash
npm ci
npm run dev
```

O Vite exibirá no terminal o endereço local da aplicação.

## Persistência demonstrativa

Os repositórios locais escondem o acesso ao `localStorage`, de modo que possam ser substituídos por uma API. Apontamentos usam `sma:time-entries:v3`; na primeira leitura, uma base `v2` é migrada com validação e preservada como backup. Perfil, cargas, folgas, aprovações, notificações e auditoria usam chaves versionadas próprias.

Feriados e eventos profissionais vêm de fontes demonstrativas determinísticas. Eles não representam uma fonte oficial completa. A interface do Colaborador não apresenta projeção futura; datas futuras não geram déficit no saldo real.

## Validação

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

O build é gerado em `dist/`, que permanece ignorado pelo Git. `node_modules/` também não é versionado.
