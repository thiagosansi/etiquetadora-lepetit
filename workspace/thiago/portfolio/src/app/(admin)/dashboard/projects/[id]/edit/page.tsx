import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { verifyAdminSession } from '@/lib/dal'
import { ProjectForm } from '@/components/admin/project-form'

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await verifyAdminSession()
  const { id } = await params
  const supabase = await createClient()
  const { data: project } = await supabase.from('projects').select('*').eq('id', id).single()
  if (!project) notFound()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Editar projeto</h1>
      <ProjectForm project={project} />
    </div>
  )
}
