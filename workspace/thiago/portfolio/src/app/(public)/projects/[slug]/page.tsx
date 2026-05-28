import { notFound } from 'next/navigation'
import { cache } from 'react'
import type { Metadata } from 'next'
import { getProjectBySlug } from '@/lib/actions/projects'
import { createPublicClient } from '@/lib/supabase/public'
import { TechBadge } from '@/components/projects/tech-badge'
import { buttonVariants } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils'

export const revalidate = 3600

const getProject = cache(getProjectBySlug)

export async function generateStaticParams() {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('projects')
    .select('slug')
    .eq('status', 'published')
  return (data ?? []).map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const project = await getProject(slug)
  if (!project) return { title: 'Projeto não encontrado' }
  return {
    title: project.title,
    description: project.tagline ?? project.description ?? '',
    openGraph: {
      title: project.title,
      description: project.tagline ?? '',
    },
  }
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const project = await getProject(slug)
  if (!project) notFound()

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para projetos
      </Link>

      <article className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">{project.title}</h1>
          {project.tagline && (
            <p className="text-xl text-muted-foreground">{project.tagline}</p>
          )}
          <div className="flex flex-wrap gap-3">
            {project.live_url && (
              <a
                href={project.live_url}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants()}
              >
                Ver demo
              </a>
            )}
            {project.repo_url && (
              <a
                href={project.repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: 'outline' })}
              >
                Ver código
              </a>
            )}
          </div>
        </div>

        {/* Stack */}
        {project.built_with.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Stack
            </h2>
            <div className="flex flex-wrap gap-2">
              {project.built_with.map((tech) => (
                <TechBadge key={tech} tech={tech} />
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {project.description && (
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <ReactMarkdown>{project.description}</ReactMarkdown>
          </div>
        )}

        {/* Target audience */}
        {project.target_audience && (
          <div className="space-y-2 p-4 rounded-lg bg-muted/30 border border-border/50">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Público-alvo
            </h2>
            <p className="text-foreground">{project.target_audience}</p>
          </div>
        )}

        {/* Objective */}
        {project.objective && (
          <div className="space-y-2 p-4 rounded-lg bg-muted/30 border border-border/50">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Objetivo
            </h2>
            <p className="text-foreground">{project.objective}</p>
          </div>
        )}

        {/* Metrics */}
        {project.metrics && (
          <div className="space-y-2 p-4 rounded-lg bg-muted/30 border border-border/50">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Métricas / Impacto
            </h2>
            <p className="text-foreground">{project.metrics}</p>
          </div>
        )}
      </article>
    </div>
  )
}
