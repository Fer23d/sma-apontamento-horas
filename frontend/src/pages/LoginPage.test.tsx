import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ThemeContext } from '../app/themeContext'
import { DemoSessionProvider } from '../features/session/DemoSessionProvider'
import { LoginPage } from './LoginPage'

function renderLogin() {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={['/login']}>
      <ThemeContext.Provider value={{ theme: 'light', toggleTheme: vi.fn() }}>
        <DemoSessionProvider><LoginPage /></DemoSessionProvider>
      </ThemeContext.Provider>
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  it('exibe os três perfis para acesso simulado', () => {
    const markup = renderLogin()

    expect(markup).toContain('Ambiente corporativo')
    expect(markup).toContain('Selecione a área de acesso e entre com sua conta corporativa Microsoft.')
    expect(markup).toContain('alt="SM&amp;A — Sistemas Elétricos e Automação"')
    expect(markup).toContain('Entrar como Colaborador')
    expect(markup).toContain('Entrar como Supervisão')
    expect(markup).toContain('Entrar como Direção')
    expect(markup.match(/Entrar como (?:Colaborador|Supervisão|Direção)/g) ?? []).toHaveLength(3)
    expect(markup).toContain('Colaborador')
    expect(markup).toContain('Supervisão')
    expect(markup).toContain('Direção')
    expect(markup.match(/<img/g) ?? []).toHaveLength(1)
    expect(markup).not.toContain('Processando autenticação...')
    expect(markup).not.toMatch(/type="password"|Microsoft Login/i)
  })
})
