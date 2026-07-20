export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export function createBrowserStorage(): StorageLike {
  if (typeof window !== 'undefined') return window.localStorage
  return {
    getItem: () => null,
    setItem: () => undefined,
  }
}
