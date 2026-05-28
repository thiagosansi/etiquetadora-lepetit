import { verifyAdminSession } from '@/lib/dal'
import { logout } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await verifyAdminSession()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur px-6 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="font-semibold">
          Painel Admin
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Ver site
          </Link>
          <form action={logout}>
            <Button type="submit" variant="outline" size="sm">
              Sair
            </Button>
          </form>
        </div>
      </header>
      <main className="container mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  )
}
