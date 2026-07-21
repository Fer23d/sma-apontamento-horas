import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { shouldCloseDrawerForKey } from './drawer'

const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function AppLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  const closeSidebar = (returnFocus = false) => {
    setSidebarOpen(false)
    if (returnFocus) requestAnimationFrame(() => menuButtonRef.current?.focus())
  }

  useEffect(() => {
    if (!isSidebarOpen) return
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (!shouldCloseDrawerForKey(event.key)) return
      event.preventDefault()
      closeSidebar(true)
    }
    document.addEventListener('keydown', handleKeyDown)
    requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-drawer-initial-focus]')?.focus())
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isSidebarOpen])

  const trapDrawerFocus = (event: KeyboardEvent<HTMLElement>) => {
    if (!isSidebarOpen || event.key !== 'Tab' || window.matchMedia('(min-width: 1024px)').matches) return
    const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(focusableSelector))
    const first = focusable[0]
    const last = focusable.at(-1)
    if (!first || !last) return
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-[var(--sma-surface-page)] text-[var(--sma-text-primary)]">
      <a href="#main-content" className="fixed left-3 top-3 z-50 -translate-y-20 rounded-lg bg-white px-4 py-2 font-bold text-sma-navy shadow focus:translate-y-0 dark:bg-slate-900 dark:text-white">Ir para o conteúdo principal</a>
      <Header ref={menuButtonRef} isMenuOpen={isSidebarOpen} onMenuToggle={() => setSidebarOpen((current) => !current)} />
      <div className="relative grid min-h-[calc(100vh-5rem)] min-w-0 grid-cols-1 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <Sidebar isOpen={isSidebarOpen} onNavigate={() => closeSidebar()} onKeyDown={trapDrawerFocus} />
        {isSidebarOpen && (
          <button
            type="button"
            className="fixed inset-x-0 bottom-0 top-20 z-20 bg-slate-950/50 lg:hidden"
            onClick={() => closeSidebar(true)}
            aria-label="Fechar navegação"
          />
        )}
        <main id="main-content" className="w-full min-w-0 overflow-x-hidden" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
