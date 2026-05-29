import Link from 'next/link'
import { ThemeToggle } from '@/components/layout/theme-toggle'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-semibold tracking-tight hover:opacity-80 transition-opacity">
          Thiago Silva
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/#projects"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Projetos
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
