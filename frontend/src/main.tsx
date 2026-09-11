import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PublicClientApplication } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'
import { App } from './app/App'
import { ThemeProvider } from './app/ThemeProvider'
import { DemoSessionProvider } from './features/session/DemoSessionProvider'
import { isMsalConfigured, msalConfig } from './authConfig'
import { demoSessionService } from './services/demoSessionService'
import { registerSW } from 'virtual:pwa-register'
import './styles/index.css'

const msalInstance = new PublicClientApplication(msalConfig)
registerSW({ immediate: true })

async function prepareMsal() {
  if (!isMsalConfigured) return
  try {
    await msalInstance.initialize()
    const response = await msalInstance.handleRedirectPromise()
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
      // O SSO atual não traz um papel de negócio; mantém o acesso corporativo como colaborador.
      demoSessionService.signIn('COLLABORATOR')
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
