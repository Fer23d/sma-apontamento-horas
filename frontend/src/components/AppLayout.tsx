import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar isOpen={isSidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      {isSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-slate-950/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Fechar navegação"
        />
      )}
      <div className="min-w-0 flex-1">
        <Header onMenuToggle={() => setSidebarOpen((current) => !current)} />
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
