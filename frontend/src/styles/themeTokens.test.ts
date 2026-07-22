/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import appLayoutSource from '../components/AppLayout.tsx?raw'
import confirmDialogSource from '../components/ConfirmDialog.tsx?raw'
import headerSource from '../components/Header.tsx?raw'
import pageContainerSource from '../components/PageContainer.tsx?raw'
import sidebarSource from '../components/Sidebar.tsx?raw'
import themeToggleSource from '../components/ThemeToggle.tsx?raw'

const stylesheet = readFileSync(new URL('./index.css', import.meta.url), 'utf8')

const requiredSemanticTokens = [
  '--color-background',
  '--color-surface',
  '--color-surface-raised',
  '--color-surface-subtle',
  '--color-header',
  '--color-sidebar',
  '--color-text',
  '--color-text-muted',
  '--color-text-subtle',
  '--color-border',
  '--color-border-strong',
  '--color-focus-ring',
  '--color-shadow',
  '--color-primary',
  '--color-primary-hover',
  '--color-primary-active',
  '--color-primary-contrast',
  '--color-secondary',
  '--color-secondary-hover',
  '--color-input-background',
  '--color-input-border',
  '--color-input-placeholder',
  '--color-navigation-active',
  '--color-navigation-active-detail',
  '--color-navigation-hover',
  '--color-overlay',
] as const

const calendarStates = {
  'no-schedule': {
    light: ['#F1F5F9', '#334155', '#64748B'],
    dark: ['#263545', '#E8EEF5', '#91A4B8'],
  },
  'no-entry': {
    light: ['#FFF7E6', '#6B4F13', '#A16207'],
    dark: ['#44371E', '#FFE9B0', '#D5A23A'],
  },
  incomplete: {
    light: ['#FFF1E8', '#8A3F17', '#C2410C'],
    dark: ['#4A2A1B', '#FFD9C4', '#D27A44'],
  },
  complete: {
    light: ['#EEF7EF', '#275B39', '#4D7C0F'],
    dark: ['#253C2A', '#DDEFD8', '#80A76B'],
  },
  exceeded: {
    light: ['#FDF0F4', '#7A2E45', '#A23E5A'],
    dark: ['#452532', '#FFD9E4', '#D0809A'],
  },
  vacation: {
    light: ['#F5F0FB', '#5B3C88', '#7E5BA6'],
    dark: ['#352944', '#E9DDFF', '#A98AD0'],
  },
  'time-off': {
    light: ['#EDF8FC', '#225E7A', '#2C7DA0'],
    dark: ['#203A48', '#D9F2FF', '#6FB7D1'],
  },
  'medical-leave': {
    light: ['#FAF0F8', '#633A61', '#8A5A83'],
    dark: ['#42283F', '#F5DDF0', '#C28AB8'],
  },
  holiday: {
    light: ['#FFF0F0', '#7C2D32', '#B23A48'],
    dark: ['#49282A', '#FFE0E0', '#D68787'],
  },
} as const

function declarationsFor(selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const block = stylesheet.match(new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\}`))?.[1]
  expect(block, `bloco ${selector}`).toBeDefined()

  return Object.fromEntries(
    [...(block ?? '').matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(([, token, value]) => [token, value.trim()]),
  )
}

function contrastRatio(foreground: string, background: string) {
  const luminance = (hex: string) => {
    const channels = hex.match(/[A-F\d]{2}/gi)!.map((value) => Number.parseInt(value, 16) / 255)
      .map((value) => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
  }
  const a = luminance(foreground)
  const b = luminance(background)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

describe('tokens institucionais e contraste', () => {
  it('declara somente a escala institucional consumida', () => {
    const theme = declarationsFor('@theme')

    expect(theme).toMatchObject({
      '--color-brand-primary-950': '#092E42',
      '--color-brand-primary-800': '#0F455F',
      '--color-brand-primary-600': '#1D617B',
      '--color-brand-primary-100': '#E6F2F4',
      '--color-brand-primary-50': '#F7FBFC',
      '--color-brand-secondary-700': '#3A6F5B',
      '--color-brand-secondary-500': '#75AC96',
      '--color-brand-secondary-100': '#E9F2EC',
    })
  })

  it('oferece a camada semantica completa nos temas claro e escuro', () => {
    const light = declarationsFor(':root')
    const dark = declarationsFor('.dark')

    for (const token of requiredSemanticTokens) {
      expect(light[token], `${token} no tema claro`).toBeDefined()
      expect(dark[token], `${token} no tema escuro`).toBeDefined()
    }

    expect(light).toMatchObject({
      '--color-background': '#F7F7F7',
      '--color-surface': '#FFFFFF',
      '--color-surface-raised': '#FFFFFF',
      '--color-surface-subtle': '#F1F5F7',
      '--color-text': '#17212B',
      '--color-text-muted': '#4B5B67',
      '--color-border': '#758798',
      '--color-primary': '#0F455F',
      '--color-primary-contrast': '#FFFFFF',
    })
    expect(dark).toMatchObject({
      '--color-background': '#0E1720',
      '--color-surface': '#15232D',
      '--color-surface-raised': '#1B2D38',
      '--color-surface-subtle': '#20333F',
      '--color-text': '#F2F7FA',
      '--color-text-muted': '#B9C7D1',
      '--color-border': '#607787',
      '--color-primary': '#90C6D7',
      '--color-primary-contrast': '#0E1720',
    })
  })

  it('mantem texto normal acima de 4,5:1 e bordas e foco acima de 3:1', () => {
    for (const selector of [':root', '.dark']) {
      const tokens = declarationsFor(selector)

      expect(contrastRatio(tokens['--color-text'], tokens['--color-background'])).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(tokens['--color-text-muted'], tokens['--color-background'])).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(tokens['--color-primary-contrast'], tokens['--color-primary'])).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(tokens['--color-border'], tokens['--color-surface'])).toBeGreaterThanOrEqual(3)
      expect(contrastRatio(tokens['--color-focus-ring'], tokens['--color-surface'])).toBeGreaterThanOrEqual(3)
    }
  })

  it('declara as 54 cores fechadas dos estados e preserva contraste nos dois temas', () => {
    for (const [selector, theme] of [[':root', 'light'], ['.dark', 'dark']] as const) {
      const tokens = declarationsFor(selector)
      const canvas = tokens['--color-background']

      for (const [tone, values] of Object.entries(calendarStates)) {
        const [surface, text, border] = values[theme]
        expect(tokens[`--calendar-state-${tone}-surface`]).toBe(surface)
        expect(tokens[`--calendar-state-${tone}-text`]).toBe(text)
        expect(tokens[`--calendar-state-${tone}-border`]).toBe(border)
        expect(contrastRatio(text, surface), `${tone}: texto/fundo em ${theme}`).toBeGreaterThanOrEqual(4.5)
        expect(contrastRatio(border, canvas), `${tone}: borda/canvas em ${theme}`).toBeGreaterThanOrEqual(3)
      }
    }

    expect(declarationsFor(':root')['--calendar-selected-ring']).toBeDefined()
    expect(declarationsFor('.dark')['--calendar-selected-ring']).toBeDefined()
  })

  it('faz a classe compartilhada consumir apenas tokens semanticos de calendario', () => {
    expect(stylesheet).toContain('.calendar-state {')
    expect(stylesheet).toContain('background: var(--calendar-state-surface)')
    expect(stylesheet).toContain('color: var(--calendar-state-text)')
    expect(stylesheet).toContain('border-color: var(--calendar-state-border)')

    for (const tone of Object.keys(calendarStates)) {
      expect(stylesheet).toContain(`.calendar-state--${tone} {`)
      expect(stylesheet).toContain(`var(--calendar-state-${tone}-surface)`)
      expect(stylesheet).toContain(`var(--calendar-state-${tone}-text)`)
      expect(stylesheet).toContain(`var(--calendar-state-${tone}-border)`)
    }
  })

  it('nao deixa o anel de selecao mascarar o foco visivel do teclado', () => {
    expect(stylesheet).toContain('.calendar-day--selected:not(:focus-visible) {')
    expect(stylesheet).not.toMatch(/\.calendar-day--selected\s*\{/)
  })

  it('mantem a sigla da navegacao ativa acima de 4,5:1', () => {
    const activeDetailToken = sidebarSource.includes("isActive ? 'bg-[var(--color-navigation-active-detail)]'")
      ? '--color-navigation-active-detail'
      : '--color-sidebar-surface'

    for (const selector of [':root', '.dark']) {
      const tokens = declarationsFor(selector)
      expect(contrastRatio(tokens['--color-navigation-active-text'], tokens[activeDetailToken])).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('define os utilitarios visuais compartilhados', () => {
    for (const className of ['ui-card', 'ui-field', 'ui-button-primary', 'ui-button-secondary', 'ui-badge-primary', 'ui-badge-secondary', 'brand-mark']) {
      expect(stylesheet).toContain(`.${className}`)
    }
  })

  it('preserva utilitarios consumidos fora do shell sem reintroduzir tokens paralelos', () => {
    const compatibilityUtilities = [
      'text-sma-navy',
      'text-sma-green',
      'text-sma-green-dark',
      'bg-sma-navy',
      'bg-sma-navy-dark',
      'bg-sma-green',
      'border-sma-navy',
      'border-sma-green',
      'ring-sma-navy',
      'ring-sma-green',
    ]

    for (const utility of compatibilityUtilities) {
      expect(stylesheet).toContain(`@utility ${utility}`)
    }
  })

  it('remove tokens paralelos antigos e mantem literais de cor fora dos componentes', () => {
    expect(stylesheet).not.toMatch(/--color-sma-/)
    expect(stylesheet).not.toMatch(/--sma-/)

    const shellSources = [appLayoutSource, headerSource, sidebarSource, pageContainerSource, themeToggleSource, confirmDialogSource]
    for (const source of shellSources) {
      expect(source).not.toMatch(/#[\da-f]{3,8}\b|(?:rgb|hsl)a?\s*\(/i)
    }
  })
})
