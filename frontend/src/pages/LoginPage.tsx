import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { InteractionStatus } from '@azure/msal-browser'
import { useIsAuthenticated, useMsal } from '@azure/msal-react'
import { getMsalRedirectUri, isMsalConfigured, loginRequest } from '../authConfig'
import { BrandMark } from '../components/BrandMark'
import { ThemeToggle } from '../components/ThemeToggle'
import { canAccessDemoPath, getDemoHomePath } from '../features/session/routePolicy'
import { mapMicrosoftClaimsToRole } from '../features/session/claims'
import { demoSessionService } from '../services/demoSessionService'

type LoginPageContentProps = {
  handleLogin: () => Promise<void>
  isProcessing?: boolean
  authError: string | null
}

export function LoginPageContent({ handleLogin, isProcessing = false, authError }: LoginPageContentProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[var(--color-background)] px-4 py-20 text-[var(--color-text)] sm:px-6">
      <div className="absolute right-4 top-4"><ThemeToggle /></div>
      <section className="w-full max-w-6xl" aria-labelledby="demo-login-title">
        <header className="mx-auto mb-10 flex max-w-2xl flex-col items-center text-center">
          <BrandMark variant="full" className="mb-7" />
          <p className="ui-badge-secondary">Ambiente corporativo</p>
          <h1 id="demo-login-title" className="mt-4 text-3xl font-extrabold text-[var(--color-primary)] sm:text-4xl">
            Acesso corporativo
          </h1>
          <p className="mt-4 text-sm leading-6 text-[var(--color-text-muted)] sm:text-base">
            Acesse o sistema com sua conta corporativa Microsoft.
          </p>
          <button
            type="button"
            onClick={() => void handleLogin()}
            disabled={isProcessing}
            aria-busy={isProcessing}
            className="ui-button-secondary mt-6"
          >
            {isProcessing ? 'Processando autenticação...' : 'Entrar com Microsoft'}
          </button>
          {authError && <p role="alert" className="mt-3 text-sm font-semibold text-[var(--color-danger)]">{authError}</p>}
        </header>

      </section>
    </main>
  )
}

export function LoginPage() {
  const { instance, accounts, inProgress } = useMsal()
  const isAuthenticated = useIsAuthenticated()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: unknown } | null)?.from
  const [authError, setAuthError] = useState<string | null>(null)
  const [isSigningIn, setIsSigningIn] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || inProgress !== InteractionStatus.None) return

    const account = instance.getActiveAccount() ?? accounts[0]
    if (!account) return

    instance.setActiveAccount(account)
    const claims = account.idTokenClaims as { roles?: unknown; groups?: unknown } | undefined
    const role = mapMicrosoftClaimsToRole(claims)

    try {
      demoSessionService.signInWithMicrosoft({
        id: account.homeAccountId,
        name: account.name ?? account.username,
        email: account.username,
        role,
      })
      const destination = typeof from === 'string' && canAccessDemoPath(role, from)
        ? from
        : getDemoHomePath(role)
      navigate(destination, { replace: true })
    } catch (error) {
      console.error('Erro ao preparar a sessão Microsoft:', error)
      setAuthError('Não foi possível preparar sua sessão corporativa.')
    }
  }, [accounts, from, inProgress, instance, isAuthenticated, navigate])

  async function handleLogin() {
    if (isSigningIn || inProgress !== InteractionStatus.None) return
    setAuthError(null)
    if (!isMsalConfigured) {
      setAuthError('Configure VITE_MSAL_CLIENT_ID e VITE_MSAL_TENANT_ID no arquivo frontend/.env e reinicie o servidor.')
      return
    }
    setIsSigningIn(true)
    try {
      await instance.loginRedirect({
        ...loginRequest,
        redirectUri: getMsalRedirectUri(),
      })
    } catch (error) {
      console.error('Erro ao iniciar redirect:', error)
      setAuthError(error instanceof Error ? error.message : 'Não foi possível autenticar com a Microsoft.')
    } finally {
      setIsSigningIn(false)
    }
  }

  return <LoginPageContent handleLogin={handleLogin} isProcessing={isSigningIn || inProgress !== InteractionStatus.None} authError={authError} />
}
