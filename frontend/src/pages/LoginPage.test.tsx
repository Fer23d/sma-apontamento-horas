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
    expect(markup).toContain('Selecione a área de acesso e entre com sua conta corporativa Microsoft.')
    expect(markup).toContain('alt="SM&amp;A — Sistemas Elétricos e Automação"')
    expect(markup).toContain('<a href="/api/login"')
    expect(markup).toContain('Entrar com Microsoft</a>')
    expect(markup).toContain('Colaborador')
    expect(markup).toContain('Supervisão')
    expect(markup).toContain('Direção')
    expect(markup.match(/href="\/api\/login"/g) ?? []).toHaveLength(3)
    expect(markup.match(/<img/g) ?? []).toHaveLength(1)
    expect(markup).not.toContain('Processando autenticação...')
    expect(markup).not.toMatch(/type="password"|Microsoft Login/i)
  })
})
