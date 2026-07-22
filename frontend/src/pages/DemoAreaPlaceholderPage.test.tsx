import { isValidElement, type ButtonHTMLAttributes, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, type NavigateFunction } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ThemeContext } from '../app/themeContext'
import { AppRoutes } from '../app/AppRoutes'
import { SessionContext, type SessionContextValue } from '../features/session/sessionContext'
import type { DemoRole, DemoSession } from '../features/session/types'
import { DemoAreaPlaceholderContent, DemoAreaPlaceholderPage } from './DemoAreaPlaceholderPage'

const NOW = '2026-07-21T15:30:00.000Z'

function sessionFor(role: DemoRole): DemoSession {
  const names: Record<DemoRole, string> = {
    COLLABORATOR: 'Colaborador Demonstração',
    SUPERVISOR: 'Supervisor Demonstração',
    DIRECTOR_ADMIN: 'Diretor/Administração Demonstração',
  }
  return {
    id: `demo-${role.toLowerCase()}`,
    name: names[role],
    role,
    createdAt: NOW,
    explicitLoginAt: NOW,
    isDemo: true,
    version: 2,
  }
}

function contextFor(role: DemoRole): SessionContextValue {
  return {
    session: sessionFor(role),
    profile: null,
    isLoading: false,
    signIn: vi.fn(sessionFor) as SessionContextValue['signIn'],
    signOut: vi.fn(),
  }
}

function renderPage(role: 'SUPERVISOR' | 'DIRECTOR_ADMIN') {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[role === 'SUPERVISOR' ? '/supervisor' : '/administracao']}>
      <ThemeContext.Provider value={{ theme: 'light', toggleTheme: vi.fn() }}>
        <SessionContext.Provider value={contextFor(role)}>
          <DemoAreaPlaceholderPage role={role} />
        </SessionContext.Provider>
      </ThemeContext.Provider>
    </MemoryRouter>,
  )
}

function renderRoutes(path: string, sessionRole: DemoRole) {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  try {
    return renderToStaticMarkup(
      <MemoryRouter initialEntries={[path]}>
        <ThemeContext.Provider value={{ theme: 'light', toggleTheme: vi.fn() }}>
          <SessionContext.Provider value={contextFor(sessionRole)}>
            <AppRoutes />
          </SessionContext.Provider>
        </ThemeContext.Provider>
      </MemoryRouter>,
    )
  } finally {
    warn.mockRestore()
  }
}

function findLogoutButton(node: ReactNode): ReactElement<ButtonHTMLAttributes<HTMLButtonElement>> | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const button: ReactElement<ButtonHTMLAttributes<HTMLButtonElement>> | null = findLogoutButton(child)
      if (button) return button
    }
    return null
  }
  if (!isValidElement<{ children?: ReactNode }>(node)) return null
  if (node.type === 'button' && node.props.children === 'Sair da demonstração') {
    return node as ReactElement<ButtonHTMLAttributes<HTMLButtonElement>>
  }
  return findLogoutButton(node.props.children)
}

describe('DemoAreaPlaceholderPage', () => {
  it.each([
    ['SUPERVISOR', 'Supervisor', 'Supervisor Demonstração'],
    ['DIRECTOR_ADMIN', 'Diretor/Administração', 'Diretor/Administração Demonstração'],
  ] as const)('identifica %s com conteúdo honesto', (role, label, sessionName) => {
    const markup = renderPage(role)

    expect(markup).toContain(label)
    expect(markup).toContain(sessionName)
    expect(markup).toMatch(/em desenvolvimento/i)
    expect(markup).toContain('Sair da demonstração')
    expect(markup).not.toMatch(/aprovar|indicadores|equipe ativa|solicitações pendentes/i)
  })

  it('encerra a sessão antes de voltar ao login', () => {
    const signOut = vi.fn()
    const navigate = vi.fn()
    const content = DemoAreaPlaceholderContent({
      role: 'SUPERVISOR',
      sessionName: 'Supervisor Demonstração',
      signOut,
      navigate: navigate as NavigateFunction,
    })

    findLogoutButton(content)?.props.onClick?.({} as never)

    expect(signOut).toHaveBeenCalledOnce()
    expect(navigate).toHaveBeenCalledWith('/login', { replace: true })
    expect(signOut.mock.invocationCallOrder[0]).toBeLessThan(navigate.mock.invocationCallOrder[0])
  })

  it.each([
    ['/supervisor', 'SUPERVISOR', 'Supervisor Demonstração'],
    ['/administracao', 'DIRECTOR_ADMIN', 'Diretor/Administração Demonstração'],
  ] as const)('protege a rota %s para o perfil correto', (path, role, expectedName) => {
    expect(renderRoutes(path, role)).toContain(expectedName)
  })

  it.each([
    ['/supervisor', 'COLLABORATOR'],
    ['/supervisor', 'DIRECTOR_ADMIN'],
    ['/administracao', 'COLLABORATOR'],
    ['/administracao', 'SUPERVISOR'],
    ['/colaborador', 'SUPERVISOR'],
    ['/colaborador', 'DIRECTOR_ADMIN'],
  ] as const)('não exibe %s para uma sessão %s', (path, role) => {
    const markup = renderRoutes(path, role)

    expect(markup).not.toContain('Esta área está em desenvolvimento')
    expect(markup).not.toContain('data-layout-region="global-header"')
  })
})
