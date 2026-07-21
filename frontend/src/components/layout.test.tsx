import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ThemeContext } from '../app/themeContext'
import { demoCollaborator } from '../mocks/demoData'
import { SessionContext } from '../features/session/sessionContext'
import { AppLayout } from './AppLayout'
import { shouldCloseDrawerForKey } from './drawer'
import { PageContainer } from './PageContainer'

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
    expect(markup).toContain('lg:grid-cols-[18rem_minmax(0,1fr)]')
    expect(markup).toContain('overflow-x-clip')
  })

  it('exibe o resumo profissional e todos os links principais na sidebar', () => {
    const markup = renderLayout()

    expect(markup).toContain('Colaborador Demonstração')
    expect(markup).toContain('Projetista')
    expect(markup).toContain('Engenharia de Automação')
    for (const label of ['Visão geral', 'Novo apontamento', 'Histórico', 'Folgas', 'Meu perfil']) {
      expect(markup).toContain(label)
    }
  })

  it('fecha o drawer somente com a tecla Escape', () => {
    expect(shouldCloseDrawerForKey('Escape')).toBe(true)
    expect(shouldCloseDrawerForKey('Enter')).toBe(false)
    expect(shouldCloseDrawerForKey('Tab')).toBe(false)
  })

  it('centraliza a página sem aplicar offset lateral manual', () => {
    const markup = renderToStaticMarkup(<PageContainer title="Página" description="Descrição" />)

    expect(markup).toContain('mx-auto')
    expect(markup).toContain('max-w-7xl')
    expect(markup).not.toContain('lg:ml-')
  })
})
