# Modo Offline Inteligente

## Objetivo

Permitir que novos apontamentos sejam registrados sem conexão, persistindo-os em IndexedDB e sincronizando-os automaticamente quando a rede voltar.

## Decisões de arquitetura

- `localforage` será usado sobre IndexedDB com uma instância dedicada chamada `sync_queue_horas`.
- A fila armazenará itens serializáveis do tipo `OfflineQueueItem`, contendo um identificador da fila, `status: 'PENDING'`, o `collaboratorId` e os dados de criação do apontamento.
- O caminho online existente de `timeEntryService.create` será preservado.
- O caminho offline não escreverá em `apontamentos_sma`; a sincronização chamará o mesmo serviço de criação e só removerá o item após sucesso.
- Falhas de sincronização permanecerão na fila para novas tentativas no próximo evento `online` ou na próxima montagem do app.
- Um evento customizado será emitido após alterações na fila para atualizar o contador da interface sem polling.

## Fluxo de dados

1. `useTimeEntryForm.submit` verifica `navigator.onLine` antes da criação em modo CREATE.
2. Offline: cria um payload serializável, grava na store `sync_queue_horas`, atualiza feedback e encerra o submit sem chamar o serviço principal.
3. Online: mantém a chamada atual de `timeEntryService.create`.
4. `useOfflineSync` é montado globalmente, consulta a fila, processa itens pendentes sequencialmente e remove cada item confirmado.
5. `OfflineStatusIndicator` observa o estado online/offline e o contador da fila.

## Segurança contra duplicidade

- Um item é removido somente depois de `timeEntryService.create` resolver com sucesso.
- O processamento é serializado por uma trava em memória para impedir duas sincronizações simultâneas.
- O payload da fila não contém eventos, funções, refs ou objetos React.

## Critérios de aceitação

- O envio offline exibe exatamente: `Sem conexão. Apontamento salvo localmente e aguardando rede.`
- A fila sobrevive a refresh e não usa `localStorage`.
- Ao voltar a conexão, os itens são enviados e removidos quando confirmados.
- O cabeçalho exibe `Modo Offline` sem conexão e um badge com a quantidade pendente.
- O fluxo online, edição, duplicação e cancelamento permanecem inalterados.
