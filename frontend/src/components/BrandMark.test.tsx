import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BrandMark } from './BrandMark'

describe('BrandMark', () => {
  it('renderiza o fallback textual atual sem criar uma logo fictícia', () => {
    const markup = renderToStaticMarkup(<BrandMark variant="compact" alt="SM&A" />)

    expect(markup).toContain('SM&amp;A')
    expect(markup).toContain('aria-label="SM&amp;A"')
    expect(markup).not.toContain('<img')
  })

  it('oferece variante completa reutilizável para futuros pontos de marca', () => {
    const markup = renderToStaticMarkup(<BrandMark variant="full" alt="SM&A — Sistema de apontamento" />)

    expect(markup).toContain('data-brand-variant="full"')
    expect(markup).toContain('Sistema de apontamento')
  })
})
