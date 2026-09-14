import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MsalProvider } from '@azure/msal-react'
import { App } from './app/App'
import { ThemeProvider } from './app/ThemeProvider'
import { DemoSessionProvider } from './features/session/DemoSessionProvider'
import { isMsalConfigured, msalInstance } from './authConfig'
import { demoSessionService } from './services/demoSessionService'
import { mapMicrosoftClaimsToRole } from './features/session/claims'
import { registerSW } from 'virtual:pwa-register'
import './styles/index.css'

registerSW({ immediate: true })

async function prepareMsal() {
  if (!isMsalConfigured) return
  try {
    await msalInstance.initialize()
    const response = await msalInstance.handleRedirectPromise({ navigateToLoginRequestUrl: false }).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error)
      console.warn('Ignorando erro de cache de redirect (fluxo principal é popup):', message)
      return null
    })
    const account = response?.account ?? msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0]
    if (account) {
      msalInstance.setActiveAccount(account)
      try {
        window.localStorage.setItem('sma:microsoft-user:v1', JSON.stringify({
          name: account.name ?? account.username,
          email: account.username,
          homeAccountId: account.homeAccountId,
        }))
      } catch (storageError) {
        console.warn('Não foi possível persistir os dados básicos da conta Microsoft.', storageError)
      }
      const claims = account.idTokenClaims as { roles?: unknown; groups?: unknown } | undefined
      demoSessionService.signInWithMicrosoft({
        id: account.homeAccountId,
        name: account.name ?? account.username,
        email: account.username,
        role: mapMicrosoftClaimsToRole(claims),
      })
    }
  } catch (error) {
    console.error('Não foi possível processar o retorno da autenticação Microsoft.', error)
  }
}

void prepareMsal().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <MsalProvider instance={msalInstance}>
        <ThemeProvider>
          <DemoSessionProvider>
            <App />
          </DemoSessionProvider>
        </ThemeProvider>
      </MsalProvider>
    </StrictMode>,
  )
})
