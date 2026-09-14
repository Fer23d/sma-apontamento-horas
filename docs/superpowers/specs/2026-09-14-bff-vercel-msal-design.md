# BFF Vercel com MSAL Node

## Objetivo

Hospedar o frontend React/Vite e a autenticação Microsoft no mesmo projeto Vercel, eliminando a dependência do GitHub Pages e os conflitos entre MSAL e `HashRouter`.

## Arquitetura

- `frontend/` continua sendo a aplicação React/Vite.
- `api/login.ts` inicia o fluxo OAuth 2.0 Authorization Code e redireciona para a Microsoft.
- `api/redirect.ts` troca o `code` por tokens usando `ConfidentialClientApplication`.
- O callback grava a sessão em cookie `HttpOnly`, `Secure` em produção, `SameSite=Lax` e com `Path=/`.
- Após o callback, o usuário retorna para `/colaborador` na aplicação Vercel.
- O `BrowserRouter` será usado porque a Vercel fará fallback das rotas do SPA para `frontend/dist/index.html`.

## Configuração do Vercel

- `vercel.json` definirá `frontend` como diretório de build.
- O comando de build será `npm --prefix frontend run build`.
- O diretório publicado será `frontend/dist`.
- Rotas `/api/*` permanecerão destinadas às funções serverless.
- Rotas não-API terão fallback para `/index.html`.

## Variáveis de ambiente

- `CLIENT_ID`
- `CLIENT_SECRET`
- `TENANT_ID`
- `REDIRECT_URI`, normalmente `https://<projeto>.vercel.app/api/redirect`
- `FRONTEND_URL`, normalmente `https://<projeto>.vercel.app`

As credenciais não serão gravadas no repositório.

## Segurança e falhas

- A API validará a presença das variáveis antes de iniciar o fluxo.
- O callback recusará requisições sem `code` ou com `error`.
- Cookies terão flags de segurança apropriadas ao ambiente.
- Erros de autenticação retornarão para `/login` com mensagem genérica, sem expor tokens ou segredos.
- A implementação usará os tipos de request/response compatíveis com funções Vercel Node.

## Escopo de frontend

- Substituir `HashRouter` por `BrowserRouter`.
- Remover a base específica do GitHub Pages do Vite.
- Trocar o login MSAL client-side por um link para `/api/login`.
- Manter a sessão local necessária para as telas atuais até que as APIs de domínio sejam migradas.

## Validação

- TypeScript do frontend e das funções serverless.
- Lint e testes existentes.
- Build de produção do monorepo.
- Verificação do fallback de rotas e da presença das funções no artefato/configuração.
