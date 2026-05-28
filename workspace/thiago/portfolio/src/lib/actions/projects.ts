'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { verifyAdminSession } from '@/lib/dal'
import type { Project, ProjectInsert, ProjectUpdate } from '@/types/database'

export async function getPublishedProjects(): Promise<Project[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('status', 'published')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as Project[]
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error) return null
  return data as unknown as Project
}

export async function getAllProjects(): Promise<Project[]> {
  await verifyAdminSession()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as Project[]
}

export async function createProject(data: ProjectInsert): Promise<Project> {
  await verifyAdminSession()
  const supabase = await createClient()
  const { data: project, error } = await supabase.from('projects').insert(data).select().single()

  if (error) throw error
  revalidatePath('/')
  revalidatePath('/projects/[slug]', 'page')
  return project as unknown as Project
}

export async function updateProject(id: string, data: ProjectUpdate): Promise<Project> {
  await verifyAdminSession()
  const supabase = await createClient()
  const payload = { ...data, updated_at: new Date().toISOString() }
  const { data: project, error } = await supabase.from('projects').update(payload).eq('id', id).select().single()

  if (error) throw error
  revalidatePath('/')
  revalidatePath('/projects/[slug]', 'page')
  return project as unknown as Project
}

export async function deleteProject(id: string) {
  await verifyAdminSession()
  const supabase = await createClient()
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/')
  revalidatePath('/projects/[slug]', 'page')
}

export async function toggleProjectStatus(id: string, status: 'draft' | 'published') {
  await verifyAdminSession()
  const supabase = await createClient()
  const payload = { status, updated_at: new Date().toISOString() }
  const { error } = await supabase.from('projects').update(payload).eq('id', id)

  if (error) throw error
  revalidatePath('/')
  revalidatePath('/projects/[slug]', 'page')
}
