import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ThemeContext } from '../app/themeContext'
import { LoginPage } from './LoginPage'

function renderLogin() {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={['/login']}>
      <ThemeContext.Provider value={{ theme: 'light', toggleTheme: vi.fn() }}>
        <LoginPage />
      </ThemeContext.Provider>
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  it('direciona o acesso corporativo para o endpoint de login do BFF', () => {
    const markup = renderLogin()

    expect(markup).toContain('Ambiente corporativo')
    expect(markup).toContain('Acesse o sistema com sua conta corporativa Microsoft.')
    expect(markup).toContain('alt="SM&amp;A — Sistemas Elétricos e Automação"')
    expect(markup).toContain('<a href="/api/login"')
    expect(markup).toContain('Entrar com Microsoft</a>')
    expect(markup).not.toMatch(/Entrar como (Colaborador|Supervisor|Diretor)/)
    expect(markup.match(/<img/g) ?? []).toHaveLength(1)
    expect(markup).not.toContain('Processando autenticação...')
    expect(markup).not.toMatch(/type="password"|Microsoft Login/i)
  })
})
