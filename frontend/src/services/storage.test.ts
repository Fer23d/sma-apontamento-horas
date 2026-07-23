import { describe, expect, it } from 'vitest'
import { createResilientStorage, type StorageLike } from './storage'

describe('storage resiliente', () => {
  it('usa memória quando o getter do storage primário lança', () => {
    const storage = createResilientStorage(() => { throw new DOMException('Bloqueado', 'SecurityError') })

    storage.setItem('key', 'value')

    expect(storage.getItem('key')).toBe('value')
  })

  it('mantém leitura e escrita da sessão quando operações do primário lançam', () => {
    const primary: StorageLike = {
      getItem: () => { throw new DOMException('Bloqueado', 'SecurityError') },
      setItem: () => { throw new DOMException('Bloqueado', 'SecurityError') },
    }
    const storage = createResilientStorage(() => primary)

    expect(storage.getItem('missing')).toBeNull()
    storage.setItem('theme', 'dark')
    expect(storage.getItem('theme')).toBe('dark')
  })

  it('espelha no fallback os valores lidos com sucesso do primário', () => {
    let reads = 0
    const primary: StorageLike = {
      getItem: () => {
        reads += 1
        if (reads > 1) throw new DOMException('Bloqueado', 'SecurityError')
        return 'persisted'
      },
      setItem: () => undefined,
    }
    const storage = createResilientStorage(() => primary)

    expect(storage.getItem('key')).toBe('persisted')
    expect(storage.getItem('key')).toBe('persisted')
  })
})
