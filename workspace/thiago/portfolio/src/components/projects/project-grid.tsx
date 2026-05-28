'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ProjectCard } from '@/components/projects/project-card'
import { cn } from '@/lib/utils'
import type { Project } from '@/types/database'

interface ProjectGridProps {
  projects: Project[]
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  const [activeTag, setActiveTag] = useState('Todos')

  const allTags = ['Todos', ...Array.from(new Set(projects.flatMap((p) => p.built_with))).sort()]

  const filtered = activeTag === 'Todos'
    ? projects
    : projects.filter((p) => p.built_with.includes(activeTag))

  if (projects.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="text-lg">Nenhum projeto publicado ainda.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Tag filters */}
      <div className="flex flex-wrap gap-2">
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveTag(tag)}
            className={cn(
              'px-3 py-1 rounded-full text-sm font-medium transition-colors border',
              activeTag === tag
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-transparent text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
            )}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Project cards */}
      <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filtered.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </AnimatePresence>
      </motion.div>

      {filtered.length === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 text-muted-foreground"
        >
          Nenhum projeto com essa tecnologia.
        </motion.p>
      )}
    </div>
  )
}
