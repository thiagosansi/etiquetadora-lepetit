'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { TechBadge } from '@/components/projects/tech-badge'
import type { Project } from '@/types/database'

interface ProjectCardProps {
  project: Project
  index?: number
}

export function ProjectCard({ project, index = 0 }: ProjectCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      layout
      className="h-full"
    >
      <Link href={`/projects/${project.slug}`} className="block h-full group">
        <Card className="h-full overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-border group-hover:border-primary/20">
          {project.cover_image && (
            <div className="relative aspect-video overflow-hidden">
              <Image
                src={project.cover_image}
                alt={project.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          )}
          {!project.cover_image && (
            <div className="aspect-video bg-muted/50 flex items-center justify-center">
              <span className="text-4xl">🚀</span>
            </div>
          )}
          <CardContent className="p-5">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
                {project.title}
              </h3>
              {project.tagline && (
                <p className="text-sm text-muted-foreground line-clamp-2">{project.tagline}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="px-5 pb-5 pt-0">
            <div className="flex flex-wrap gap-1.5">
              {project.built_with.slice(0, 4).map((tech) => (
                <TechBadge key={tech} tech={tech} />
              ))}
              {project.built_with.length > 4 && (
                <TechBadge tech={`+${project.built_with.length - 4}`} />
              )}
            </div>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  )
}
