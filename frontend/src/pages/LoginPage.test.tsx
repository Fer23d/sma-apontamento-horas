import { isValidElement, type ButtonHTMLAttributes, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, type NavigateFunction } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ThemeContext } from '../app/themeContext'
import { SessionContext, type SessionContextValue } from '../features/session/sessionContext'
import type { DemoRole, DemoSession } from '../features/session/types'
import { LoginPage, LoginPageContent } from './LoginPage'

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2) ? true : false

const signInRequiresExactlyOneRole: Equal<Parameters<SessionContextValue['signIn']>, [DemoRole]> = true

const NOW = '2026-07-21T15:30:00.000Z'

function sessionFor(role: DemoRole): DemoSession {
  return {
    id: `demo-${role.toLowerCase()}`,
    name: `${role} Demonstração`,
    role,
    createdAt: NOW,
    explicitLoginAt: NOW,
    isDemo: true,
    version: 2,
  }
}

function renderLogin(from?: string) {
  const value: SessionContextValue = {
    session: null,
    profile: null,
    isLoading: false,
    signIn: vi.fn(sessionFor) as SessionContextValue['signIn'],
    signOut: vi.fn(),
  }

  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[{ pathname: '/login', state: from ? { from } : null }]}>
      <ThemeContext.Provider value={{ theme: 'light', toggleTheme: vi.fn() }}>
        <SessionContext.Provider value={value}>
          <LoginPage />
        </SessionContext.Provider>
      </ThemeContext.Provider>
    </MemoryRouter>,
  )
}

function findButtons(node: ReactNode): ReactElement<ButtonHTMLAttributes<HTMLButtonElement>>[] {
  if (Array.isArray(node)) return node.flatMap(findButtons)
  if (!isValidElement<{ children?: ReactNode }>(node)) return []
  const current = node.type === 'button'
    ? [node as ReactElement<ButtonHTMLAttributes<HTMLButtonElement>>]
    : []
  return [...current, ...findButtons(node.props.children)]
}

describe('LoginPage', () => {
  it('explica a demonstração sem senha e apresenta os três perfis', () => {
    const markup = renderLogin()

    expect(markup).toContain('Ambiente de demonstração')
    expect(markup).toMatch(/sem senha/i)
    expect(markup).toContain('alt="SM&amp;A — Sistemas Elétricos e Automação"')
    for (const label of [
      'Entrar como Colaborador',
      'Entrar como Supervisor',
      'Entrar como Diretor/Administração',
    ]) expect(markup).toContain(label)
    expect(markup.match(/<img/g) ?? []).toHaveLength(1)
    expect(markup).not.toMatch(/type="password"|Microsoft Login|Entrar com Microsoft/i)
  })

  it('exige um perfil explícito no contrato TypeScript de signIn', () => {
    expect(signInRequiresExactlyOneRole).toBe(true)
  })

  it('inicia cada perfil explicitamente e navega somente para sua home', () => {
    const signIn = vi.fn(sessionFor)
    const navigate = vi.fn()
    const content = LoginPageContent({
      from: undefined,
      signIn,
      navigate: navigate as NavigateFunction,
    })
    const buttons = findButtons(content).filter((button) => String(button.props.children).startsWith('Entrar como'))
    const roles: DemoRole[] = ['COLLABORATOR', 'SUPERVISOR', 'DIRECTOR_ADMIN']
    const paths = ['/colaborador', '/supervisor', '/administracao']

    expect(buttons).toHaveLength(3)
    buttons.forEach((button) => button.props.onClick?.({} as never))

    roles.forEach((role, index) => {
      expect(signIn).toHaveBeenNthCalledWith(index + 1, role)
      expect(navigate).toHaveBeenNthCalledWith(index + 1, paths[index], { replace: true })
    })
  })

  it('reutiliza state.from somente quando pertence ao perfil selecionado', () => {
    const signIn = vi.fn(sessionFor)
    const navigate = vi.fn()
    const content = LoginPageContent({
      from: '/supervisor?periodo=atual#equipe',
      signIn,
      navigate: navigate as NavigateFunction,
    })
    const buttons = findButtons(content).filter((button) => String(button.props.children).startsWith('Entrar como'))

    buttons[0].props.onClick?.({} as never)
    buttons[1].props.onClick?.({} as never)
    buttons[2].props.onClick?.({} as never)

    expect(navigate).toHaveBeenNthCalledWith(1, '/colaborador', { replace: true })
    expect(navigate).toHaveBeenNthCalledWith(2, '/supervisor?periodo=atual#equipe', { replace: true })
    expect(navigate).toHaveBeenNthCalledWith(3, '/administracao', { replace: true })
  })
})
