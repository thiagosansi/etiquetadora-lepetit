import { getAllProjects } from '@/lib/actions/projects'
import { ProjectsTable } from '@/components/admin/projects-table'
import { buttonVariants } from '@/components/ui/button'
import Link from 'next/link'

export default async function AdminProjectsPage() {
  const projects = await getAllProjects()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projetos</h1>
        <Link href="/dashboard/projects/new" className={buttonVariants()}>
          + Novo projeto
        </Link>
      </div>
      <ProjectsTable projects={projects} />
    </div>
  )
}
