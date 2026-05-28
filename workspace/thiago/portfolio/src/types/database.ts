export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          slug: string
          title: string
          tagline: string | null
          description: string | null
          target_audience: string | null
          objective: string | null
          metrics: string | null
          cover_image: string | null
          built_with: string[]
          status: 'draft' | 'published'
          featured: boolean
          sort_order: number
          live_url: string | null
          repo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          tagline?: string | null
          description?: string | null
          target_audience?: string | null
          objective?: string | null
          metrics?: string | null
          cover_image?: string | null
          built_with: string[]
          status?: 'draft' | 'published'
          featured?: boolean
          sort_order?: number
          live_url?: string | null
          repo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          tagline?: string | null
          description?: string | null
          target_audience?: string | null
          objective?: string | null
          metrics?: string | null
          cover_image?: string | null
          built_with?: string[]
          status?: 'draft' | 'published'
          featured?: boolean
          sort_order?: number
          live_url?: string | null
          repo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_images: {
        Row: {
          id: string
          project_id: string
          storage_path: string
          alt_text: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          storage_path: string
          alt_text?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          storage_path?: string
          alt_text?: string | null
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: { id: string; name: string; slug: string }
        Insert: { id?: string; name: string; slug: string }
        Update: { id?: string; name?: string; slug?: string }
        Relationships: []
      }
      project_tags: {
        Row: { project_id: string; tag_id: string }
        Insert: { project_id: string; tag_id: string }
        Update: { project_id?: string; tag_id?: string }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export type Project = Database['public']['Tables']['projects']['Row']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type ProjectUpdate = Database['public']['Tables']['projects']['Update']
export type ProjectImage = Database['public']['Tables']['project_images']['Row']
export type Tag = Database['public']['Tables']['tags']['Row']
