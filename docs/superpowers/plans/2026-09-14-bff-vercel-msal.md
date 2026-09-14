# BFF Vercel MSAL Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Host the React/Vite frontend and Microsoft authorization-code BFF together on Vercel with stable SPA routes and secure HttpOnly authentication cookies.

**Architecture:** The repository remains a monorepo with `frontend/` as the Vite app and root-level `api/` TypeScript serverless functions. Vercel builds `frontend`, routes `/api/*` to functions, and rewrites non-API paths to the frontend entry point. The backend owns the MSAL Node confidential-client flow; the frontend starts authentication through `/api/login` and uses `BrowserRouter`.

**Tech Stack:** React, Vite, TypeScript, React Router, Vercel Node Functions, `@azure/msal-node`, `cookie`, `dotenv`.

**Spec:** `docs/superpowers/specs/2026-09-14-bff-vercel-msal-design.md`

## Global Constraints

- Credentials remain in environment variables and never enter source control.
- `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID`, `REDIRECT_URI`, and `FRONTEND_URL` are required by the BFF.
- Cookies use `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Secure` in production.
- `/api/*` must never be rewritten to the SPA entry point.
- The frontend uses `BrowserRouter` and no longer depends on the GitHub Pages base path.

### Task 1: Add BFF dependencies and configuration

**Files:**
- Create: `package.json`
- Create: `api/types.ts`
- Create: `vercel.json`

**Interfaces:**
- Produces the shared Vercel request/response type and root build metadata consumed by Tasks 2-4.

- [ ] **Step 1: Write the failing configuration test**

Create a small Node/Vitest test that reads `vercel.json` and asserts the frontend build command, output directory, API rewrite, and SPA fallback are present.

- [ ] **Step 2: Run the test and verify it fails**

Run `npm test -- --run api/config.test.ts` from the repository root. Expected: failure because the root package/configuration files do not exist.

- [ ] **Step 3: Add the root package and Vercel configuration**

Use root scripts/dependencies equivalent to:

```json
{
  "private": true,
  "type": "module",
  "scripts": {
    "build": "npm --prefix frontend run build",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@azure/msal-node": "^3.8.0",
    "cookie": "^1.0.2",
    "dotenv": "^16.4.7"
  },
  "devDependencies": {
    "@types/node": "^24.0.0",
    "@types/cookie": "^0.6.0",
    "typescript": "^6.0.0",
    "vitest": "^4.0.0"
  }
}
```

Configure `vercel.json` with `buildCommand: "npm --prefix frontend run build"`, `outputDirectory: "frontend/dist"`, a `/api/(.*)` destination of `/api/$1`, and a catch-all destination of `/index.html`.

- [ ] **Step 4: Run the configuration test**

Run `npm test -- --run api/config.test.ts`. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add package.json vercel.json api/config.test.ts
git commit -m "build: configura monorepo para vercel e bff msal"
```

### Task 2: Implement the MSAL authorization endpoints

**Files:**
- Create: `api/msal.ts`
- Create: `api/login.ts`
- Create: `api/redirect.ts`
- Test: `api/auth.test.ts`

**Interfaces:**
- `createMsalClient(): ConfidentialClientApplication`
- `login(req: VercelRequest, res: VercelResponse): Promise<void>`
- `redirect(req: VercelRequest, res: VercelResponse): Promise<void>`

- [ ] **Step 1: Write failing endpoint tests**

Test missing configuration returns HTTP 500 without secrets, login redirects to Microsoft when configuration exists, and callback rejects missing `code` with HTTP 400.

- [ ] **Step 2: Run the tests and verify they fail**

Run `npm test -- --run api/auth.test.ts`. Expected: failure because the endpoint modules do not exist.

- [ ] **Step 3: Implement shared MSAL configuration**

Read `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID`, `REDIRECT_URI`, and `FRONTEND_URL` from `process.env`; build authority as `https://login.microsoftonline.com/${TENANT_ID}`; create `ConfidentialClientApplication`; and throw a controlled configuration error when required variables are absent.

- [ ] **Step 4: Implement login**

Call `getAuthCodeUrl({ scopes: ['User.Read'], redirectUri: REDIRECT_URI })` and respond with `res.redirect(url)`. Never log client secrets or authorization codes.

- [ ] **Step 5: Implement callback**

Require `code`, call `acquireTokenByCode({ code, scopes: ['User.Read'], redirectUri: REDIRECT_URI })`, serialize only the needed token/session value into a cookie named `sma_session`, and redirect to `${FRONTEND_URL}/colaborador` for the BrowserRouter application.

- [ ] **Step 6: Run endpoint tests**

Run `npm test -- --run api/auth.test.ts`. Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add api/msal.ts api/login.ts api/redirect.ts api/auth.test.ts
git commit -m "feat: adiciona endpoints serverless de autenticacao msal"
```

### Task 3: Migrate the frontend to Vercel routing and backend login

**Files:**
- Modify: `frontend/src/app/App.tsx`
- Modify: `frontend/src/pages/LoginPage.tsx`
- Modify: `frontend/src/authConfig.ts`
- Modify: `frontend/vite.config.ts`
- Test: existing frontend route/login tests

**Interfaces:**
- The login UI links to `/api/login`.
- The application router is `BrowserRouter`.

- [ ] **Step 1: Add/update failing route assertions**

Assert that `App` renders a `BrowserRouter`, login markup contains `/api/login`, and no login UI calls `loginPopup` or `loginRedirect`.

- [ ] **Step 2: Run the targeted frontend tests and verify failure**

Run `npm --prefix frontend test -- --run src/pages/LoginPage.test.tsx src/components/layout.test.tsx`. Expected: failure while the app still uses `HashRouter` and client-side MSAL login.

- [ ] **Step 3: Replace `HashRouter` with `BrowserRouter`**

Update `frontend/src/app/App.tsx` to import/render `BrowserRouter` around the existing providers and routes.

- [ ] **Step 4: Delegate login to the BFF**

Replace the MSAL hook/login handler in `LoginPage.tsx` with an anchor styled like the existing button: `<a href="/api/login">Entrar com Microsoft</a>`. Keep error/status presentation only where it remains meaningful; do not start authentication from an effect.

- [ ] **Step 5: Remove browser-page MSAL configuration from the frontend**

Remove the client-side `PublicClientApplication` initialization and obsolete redirect callback flow from `main.tsx`/`authConfig.ts`, while preserving session restoration needed by current demo screens until backend session consumption is added.

- [ ] **Step 6: Remove GitHub Pages base behavior**

Set Vite `base: '/'` and remove GitHub Pages-specific `GITHUB_PAGES` branching. Keep the PWA and asset paths rooted at `/`.

- [ ] **Step 7: Run targeted frontend tests**

Run `npm --prefix frontend test -- --run src/pages/LoginPage.test.tsx src/components/layout.test.tsx`. Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/app/App.tsx frontend/src/pages/LoginPage.tsx frontend/src/authConfig.ts frontend/src/main.tsx frontend/vite.config.ts frontend/src/pages/LoginPage.test.tsx
git commit -m "refactor: migra frontend para browserrouter e login bff"
```

### Task 4: Integrate, typecheck, and verify the Vercel monorepo

**Files:**
- Create: `tsconfig.json` for the root API TypeScript sources
- Modify: `vercel.json` only when a verification command identifies a concrete routing mismatch

- [ ] **Step 1: Install root dependencies**

Run `npm install` from the repository root and commit the generated root lockfile.

- [ ] **Step 2: Run all checks**

Run `npm run typecheck`, `npm --prefix frontend run typecheck`, `npm --prefix frontend run lint`, `npm --prefix frontend test -- --run`, and `npm run build`. Expected: all pass; a large-chunk warning may remain non-fatal.

- [ ] **Step 3: Verify output and routes**

Confirm `frontend/dist/index.html` exists, direct SPA routes resolve through the Vercel fallback, and `/api/login` is excluded from the fallback rewrite.

- [ ] **Step 4: Commit final integration**

```bash
git add package-lock.json vercel.json api frontend/src
git commit -m "chore: valida monorepo vercel com autenticacao bff"
```
