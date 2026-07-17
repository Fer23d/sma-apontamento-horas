import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { ThemeProvider } from './app/ThemeProvider'
import { DemoSessionProvider } from './features/session/DemoSessionProvider'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <DemoSessionProvider>
        <App />
      </DemoSessionProvider>
    </ThemeProvider>
  </StrictMode>,
)
