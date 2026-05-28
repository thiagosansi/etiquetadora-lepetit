'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { toggleProjectStatus, deleteProject } from '@/lib/actions/projects'
import { Switch } from '@/components/ui/switch'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Project } from '@/types/database'

interface ProjectsTableProps {
  projects: Project[]
}

export function ProjectsTable({ projects }: ProjectsTableProps) {
  const [isPending, startTransition] = useTransition()

  function handleToggle(id: string, currentStatus: 'draft' | 'published') {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published'
    startTransition(async () => {
      await toggleProjectStatus(id, newStatus)
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteProject(id)
    })
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground border rounded-lg">
        <p>Nenhum projeto. Crie o primeiro!</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-4 font-medium">Título</th>
            <th className="text-left p-4 font-medium">Status</th>
            <th className="text-left p-4 font-medium hidden sm:table-cell">Criado em</th>
            <th className="text-right p-4 font-medium">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {projects.map((project) => (
            <tr key={project.id} className="hover:bg-muted/30 transition-colors">
              <td className="p-4">
                <div>
                  <p className="font-medium">{project.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{project.slug}</p>
                </div>
              </td>
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={project.status === 'published'}
                    onCheckedChange={() => handleToggle(project.id, project.status)}
                    disabled={isPending}
                    aria-label={`${project.status === 'published' ? 'Despublicar' : 'Publicar'} ${project.title}`}
                  />
                  <Badge
                    variant={project.status === 'published' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {project.status === 'published' ? 'Publicado' : 'Rascunho'}
                  </Badge>
                </div>
              </td>
              <td className="p-4 hidden sm:table-cell text-muted-foreground">
                {new Date(project.created_at).toLocaleDateString('pt-BR')}
              </td>
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/dashboard/projects/${project.id}/edit`}
                    className={buttonVariants({ variant: 'ghost', size: 'icon' })}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Editar</span>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger
                      className={cn(
                        buttonVariants({ variant: 'ghost', size: 'icon' }),
                        'text-destructive hover:text-destructive'
                      )}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Excluir</span>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. O projeto &ldquo;{project.title}&rdquo; será removido permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(project.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
