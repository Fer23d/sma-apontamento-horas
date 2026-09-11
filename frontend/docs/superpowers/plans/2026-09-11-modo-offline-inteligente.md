# Modo Offline Inteligente Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar fila IndexedDB para apontamentos offline, sincronização automática e indicador de conectividade.

**Architecture:** `localforage` encapsula a store `sync_queue_horas`; `useTimeEntryForm` enfileira somente criações offline; `useOfflineSync` processa a fila usando `timeEntryService.create`; o indicador global compartilha o estado por hook/contexto simples e evento customizado.

**Tech Stack:** React 19, TypeScript, Vite, localforage, IndexedDB, Vitest, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-09-11-modo-offline-inteligente-design.md`

## Global Constraints

- Usar exatamente a store IndexedDB `sync_queue_horas`.
- Não usar `localStorage` para armazenar a fila.
- Manter o caminho online atual de `timeEntryService.create`.
- Remover item da fila somente após sincronização bem-sucedida.
- Preservar o feedback offline solicitado pelo produto.

---

### Task 1: Dependência e serviço da fila

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/services/offlineQueueService.ts`
- Test: `src/services/offlineQueueService.test.ts`

**Interfaces:**
- Produces `offlineQueueService.enqueue(item)`, `listPending()`, `countPending()`, `remove(id)` and `clear()`.

- [ ] **Step 1: Write the failing test**

Testar que itens pendentes são gravados, listados e removidos usando a instância isolada, sem depender de `localStorage`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/services/offlineQueueService.test.ts`
Expected: FAIL because the service ainda não existe.

- [ ] **Step 3: Install the dependency and implement the service**

Run: `npm install localforage`.

Implementar uma instância `localforage.createInstance({ name: 'sma-banco-de-horas', storeName: 'sync_queue_horas' })`, usando chaves únicas por item e filtrando somente `status === 'PENDING'`.

- [ ] **Step 4: Run the focused test**

Run: `npm test -- --run src/services/offlineQueueService.test.ts`
Expected: PASS.

### Task 2: Integração do submit offline

**Files:**
- Modify: `src/features/time-entries/useTimeEntryForm.ts`
- Test: `src/features/time-entries/useTimeEntryForm.test.ts` or the existing form hook test location.

**Interfaces:**
- Consumes `offlineQueueService.enqueue`.
- Produces the exact offline feedback and preserves the existing online submit branch.

- [ ] **Step 1: Add a failing offline-submit test**

Simular `navigator.onLine === false`, submeter uma criação válida e verificar que a fila recebe `status: 'PENDING'` e que `timeEntryService.create` não é chamado.

- [ ] **Step 2: Implement the smallest branch**

Depois da validação e antes de `timeEntryService.create`, enfileirar `{ id, status: 'PENDING', collaboratorId: profile.id, data }`, definir a mensagem solicitada e retornar sucesso do formulário.

- [ ] **Step 3: Run focused tests**

Run: `npm test -- --run src/features/time-entries`
Expected: PASS.

### Task 3: Hook global de sincronização e contador

**Files:**
- Create: `src/features/offline/useOfflineSync.ts`
- Test: `src/features/offline/useOfflineSync.test.ts`

**Interfaces:**
- `useOfflineSync()` returns `{ isOnline, pendingCount, syncNow }`.
- `syncNow()` processes pending items serially and calls `timeEntryService.create(item.collaboratorId, item.data)`.

- [ ] **Step 1: Write failing tests**

Testar processamento após `online`, remoção após sucesso, retenção após falha e ausência de chamadas concorrentes.

- [ ] **Step 2: Implement the hook**

Registrar `window.addEventListener('online', processarFila)`, carregar o contador na montagem, processar imediatamente se online e emitir/escutar `sma:offline-queue-updated`.

- [ ] **Step 3: Run focused tests**

Run: `npm test -- --run src/features/offline/useOfflineSync.test.ts`
Expected: PASS.

### Task 4: Indicador visual e montagem global

**Files:**
- Create: `src/components/OfflineStatusIndicator.tsx`
- Modify: `src/components/Header.tsx`
- Modify: `src/app/App.tsx`
- Test: `src/components/offline-status.test.tsx`

**Interfaces:**
- Consumes the return value of `useOfflineSync`.
- Renders `Modo Offline` only when offline and a pending badge when `pendingCount > 0`.

- [ ] **Step 1: Write failing component tests**

Verificar os textos e o badge para os estados offline, online com pendências e online sem pendências.

- [ ] **Step 2: Implement and mount**

Montar o hook uma vez em `App`, inserir o indicador no `Header` com classes existentes de tema e manter a estrutura visual atual.

- [ ] **Step 3: Run focused tests**

Run: `npm test -- --run src/components/offline-status.test.tsx`
Expected: PASS.

### Task 5: Verificação final

**Files:**
- No additional files.

- [ ] **Step 1: Run typecheck**

Run: `npm run typecheck`
Expected: exit code 0.

- [ ] **Step 2: Run lint and all tests**

Run: `npm run lint; npm test -- --run`
Expected: exit code 0.

- [ ] **Step 3: Run production build**

Run: `npm run build`
Expected: exit code 0 and generated PWA assets.
