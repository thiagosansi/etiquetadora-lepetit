'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createProject, updateProject } from '@/lib/actions/projects'
import { generateSlug } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ImagePicker } from '@/components/admin/image-picker'
import type { Project } from '@/types/database'
import { toast } from 'sonner'

interface ProjectFormProps {
  project?: Project
}

export function ProjectForm({ project }: ProjectFormProps) {
  const router = useRouter()
  const [slug, setSlug] = useState(project?.slug ?? '')
  const [builtWith, setBuiltWith] = useState(project?.built_with?.join(', ') ?? '')
  const [coverImage, setCoverImage] = useState<string | null>(project?.cover_image ?? null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      title: formData.get('title') as string,
      slug: formData.get('slug') as string,
      tagline: formData.get('tagline') as string || null,
      description: formData.get('description') as string || null,
      target_audience: formData.get('target_audience') as string || null,
      objective: formData.get('objective') as string || null,
      metrics: formData.get('metrics') as string || null,
      live_url: formData.get('live_url') as string || null,
      repo_url: formData.get('repo_url') as string || null,
      built_with: builtWith.split(',').map((t) => t.trim()).filter(Boolean),
      status: (formData.get('status') as 'draft' | 'published') ?? 'draft',
      featured: formData.get('featured') === 'on',
      sort_order: Number(formData.get('sort_order') ?? 0),
      cover_image: coverImage,
    }

    try {
      if (project) {
        await updateProject(project.id, data)
        toast.success('Projeto atualizado!')
      } else {
        await createProject(data)
        toast.success('Projeto criado!')
      }
      router.push('/dashboard/projects')
    } catch (err) {
      toast.error('Erro ao salvar projeto.')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Título *</Label>
          <Input
            id="title"
            name="title"
            required
            defaultValue={project?.title}
            onChange={(e) => {
              if (!project) setSlug(generateSlug(e.target.value))
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            name="slug"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tagline">Tagline</Label>
        <Input id="tagline" name="tagline" defaultValue={project?.tagline ?? ''} placeholder="Uma frase sobre o produto" />
      </div>

      <div className="space-y-2">
        <Label>Imagem de capa</Label>
        <ImagePicker value={coverImage} onChange={setCoverImage} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição (Markdown)</Label>
        <textarea
          id="description"
          name="description"
          defaultValue={project?.description ?? ''}
          placeholder="Descreva o projeto em detalhes..."
          className="w-full min-h-[160px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="target_audience">Público-alvo</Label>
          <Input id="target_audience" name="target_audience" defaultValue={project?.target_audience ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="objective">Objetivo</Label>
          <Input id="objective" name="objective" defaultValue={project?.objective ?? ''} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="metrics">Métricas / Impacto</Label>
        <Input id="metrics" name="metrics" defaultValue={project?.metrics ?? ''} placeholder="ex: 500 usuários em 2 semanas" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="live_url">URL demo</Label>
          <Input id="live_url" name="live_url" type="url" defaultValue={project?.live_url ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="repo_url">URL repositório</Label>
          <Input id="repo_url" name="repo_url" type="url" defaultValue={project?.repo_url ?? ''} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="built_with">Stack (separado por vírgula)</Label>
        <Input
          id="built_with"
          value={builtWith}
          onChange={(e) => setBuiltWith(e.target.value)}
          placeholder="Next.js, Supabase, Tailwind CSS"
        />
      </div>

      <Separator />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={project?.status ?? 'draft'}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="draft">Rascunho</option>
            <option value="published">Publicado</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sort_order">Ordem</Label>
          <Input id="sort_order" name="sort_order" type="number" defaultValue={project?.sort_order ?? 0} />
        </div>
        <div className="flex items-end gap-2 pb-0.5">
          <input
            type="checkbox"
            id="featured"
            name="featured"
            defaultChecked={project?.featured ?? false}
            className="rounded border-input h-4 w-4"
          />
          <Label htmlFor="featured">Destaque</Label>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : project ? 'Salvar alterações' : 'Criar projeto'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/dashboard/projects')}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
