import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ThemeContext } from '../app/themeContext'
import { demoCollaborator } from '../mocks/demoData'
import { SessionContext } from '../features/session/sessionContext'
import { AppLayout } from './AppLayout'

function renderLayout() {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={['/colaborador']}>
      <ThemeContext.Provider value={{ theme: 'light', toggleTheme: vi.fn() }}>
        <SessionContext.Provider value={{ profile: demoCollaborator, isLoading: false, signIn: vi.fn(), signOut: vi.fn() }}>
          <AppLayout />
        </SessionContext.Provider>
      </ThemeContext.Provider>
    </MemoryRouter>,
  )
}

describe('layout responsivo do colaborador', () => {
  it('posiciona o header global antes da navegação lateral e do conteúdo', () => {
    const markup = renderLayout()
    expect(markup.indexOf('data-layout-region="global-header"')).toBeLessThan(markup.indexOf('id="collaborator-navigation"'))
    expect(markup.indexOf('id="collaborator-navigation"')).toBeLessThan(markup.indexOf('id="main-content"'))
  })

  it('expõe estado e alvo do menu mobile para tecnologias assistivas', () => {
    const markup = renderLayout()
    expect(markup).toContain('aria-controls="collaborator-navigation"')
    expect(markup).toContain('aria-expanded="false"')
    expect(markup).toContain('Fechar navegação lateral')
  })

  it('mantém o drawer abaixo do header sem reservar largura quando fechado', () => {
    const markup = renderLayout()
    expect(markup).toContain('top-20')
    expect(markup).toContain('-translate-x-full')
    expect(markup).toContain('lg:translate-x-0')
  })
})
