import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PublicClientApplication } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'
import { App } from './app/App'
import { ThemeProvider } from './app/ThemeProvider'
import { DemoSessionProvider } from './features/session/DemoSessionProvider'
import { msalConfig } from './authConfig'
import { registerSW } from 'virtual:pwa-register'
import './styles/index.css'

const msalInstance = new PublicClientApplication(msalConfig)
registerSW({ immediate: true })

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
