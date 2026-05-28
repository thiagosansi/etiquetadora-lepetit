import { getAllProjects } from '@/lib/actions/projects'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function DashboardPage() {
  const projects = await getAllProjects()
  const published = projects.filter((p) => p.status === 'published')
  const drafts = projects.filter((p) => p.status === 'draft')

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link href="/dashboard/projects/new" className={buttonVariants()}>
          + Novo projeto
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{projects.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Publicados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-500">{published.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rascunhos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-500">{drafts.length}</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <Link href="/dashboard/projects" className="text-sm text-primary hover:underline">
          Gerenciar todos os projetos →
        </Link>
      </div>
    </div>
  )
}
