import { getPublishedProjects } from '@/lib/actions/projects'
import { ProjectGrid } from '@/components/projects/project-grid'
import { HeroSection } from '@/components/projects/hero-section'

export const revalidate = 3600

export default async function HomePage() {
  const projects = await getPublishedProjects()

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <HeroSection />
      <section id="projects" className="mt-20">
        <h2 className="text-2xl font-bold mb-8">Projetos</h2>
        <ProjectGrid projects={projects} />
      </section>
    </div>
  )
}
