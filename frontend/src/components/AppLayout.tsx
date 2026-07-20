import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <a href="#main-content" className="fixed left-3 top-3 z-50 -translate-y-20 rounded-lg bg-white px-4 py-2 font-bold text-sma-navy shadow focus:translate-y-0 dark:bg-slate-900 dark:text-white">Ir para o conteúdo principal</a>
      <Header isMenuOpen={isSidebarOpen} onMenuToggle={() => setSidebarOpen((current) => !current)} />
      <div className="flex min-h-[calc(100vh-5rem)] min-w-0">
        <Sidebar isOpen={isSidebarOpen} onNavigate={() => setSidebarOpen(false)} />
        {isSidebarOpen && (
          <button
            type="button"
            className="fixed inset-x-0 bottom-0 top-20 z-20 bg-slate-950/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fechar navegação"
          />
        )}
        <main id="main-content" className="min-w-0 flex-1 overflow-x-hidden" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
