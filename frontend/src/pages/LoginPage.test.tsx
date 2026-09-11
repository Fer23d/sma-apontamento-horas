import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { PublicClientApplication } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'
import { describe, expect, it, vi } from 'vitest'
import { ThemeContext } from '../app/themeContext'
import { msalConfig } from '../authConfig'
import { LoginPage } from './LoginPage'

function renderLogin(from?: string) {
  const msalInstance = new PublicClientApplication(msalConfig)

  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[{ pathname: '/login', state: from ? { from } : null }]}>
      <MsalProvider instance={msalInstance}>
        <ThemeContext.Provider value={{ theme: 'light', toggleTheme: vi.fn() }}>
          <LoginPage />
        </ThemeContext.Provider>
      </MsalProvider>
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  it('exibe somente o acesso corporativo pela Microsoft', () => {
    const markup = renderLogin()

    expect(markup).toContain('Ambiente corporativo')
    expect(markup).toContain('Acesse o sistema com sua conta corporativa Microsoft.')
    expect(markup).toContain('alt="SM&amp;A — Sistemas Elétricos e Automação"')
    expect(markup).not.toMatch(/Entrar como (Colaborador|Supervisor|Diretor)/)
    expect(markup.match(/<img/g) ?? []).toHaveLength(1)
    expect(markup).toContain('Entrar com Microsoft')
    expect(markup).not.toMatch(/type="password"|Microsoft Login/i)
  })
})
