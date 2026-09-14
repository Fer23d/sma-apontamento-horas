import { BrandMark } from '../components/BrandMark'
import { ThemeToggle } from '../components/ThemeToggle'

export function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[var(--color-background)] px-4 py-20 text-[var(--color-text)] sm:px-6">
      <div className="absolute right-4 top-4"><ThemeToggle /></div>
      <section className="w-full max-w-6xl" aria-labelledby="demo-login-title">
        <header className="mx-auto mb-10 flex max-w-2xl flex-col items-center text-center">
          <BrandMark variant="full" className="mb-7" />
          <p className="ui-badge-secondary">Ambiente corporativo</p>
          <h1 id="demo-login-title" className="mt-4 text-3xl font-extrabold text-[var(--color-primary)] sm:text-4xl">
            Acesso corporativo
          </h1>
          <p className="mt-4 text-sm leading-6 text-[var(--color-text-muted)] sm:text-base">
            Acesse o sistema com sua conta corporativa Microsoft.
          </p>
          <a href="/api/login" className="ui-button-secondary mt-6">Entrar com Microsoft</a>
        </header>
      </section>
    </main>
  )
}
