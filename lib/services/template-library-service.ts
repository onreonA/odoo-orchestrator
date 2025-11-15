import { createClient } from '@/lib/supabase/server'
import type { ExtendedKickoffTemplateData } from '@/lib/types/kickoff-template'

export interface TemplateLibraryRecord {
  id?: string
  template_id: string
  name: string
  type: 'kickoff' | 'bom' | 'workflow' | 'dashboard' | 'configuration' | 'report'
  version: string
  industry: string
  sub_category?: string
  tags?: string[]
  structure: ExtendedKickoffTemplateData | any
  description?: string
  features?: string[]
  preview_images?: string[]
  documentation_url?: string
  required_odoo_modules?: string[]
  required_odoo_version?: string
  estimated_duration?: number
  estimated_cost_min?: number
  estimated_cost_max?: number
  currency?: string
  created_from_company?: string
  created_from_company_name?: string
  created_by?: string
  status?: 'draft' | 'published' | 'deprecated' | 'archived'
  is_official?: boolean
  is_featured?: boolean
  usage_count?: number
  success_rate?: number
  rating?: number
  review_count?: number
}

export class TemplateLibraryService {
  private supabase: Awaited<ReturnType<typeof createClient>>

  constructor(supabase?: Awaited<ReturnType<typeof createClient>>) {
    this.supabase = supabase as any
  }

  async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createClient()
    }
    return this.supabase
  }

  /**
   * Create a new template in the library
   */
  async createTemplate(template: TemplateLibraryRecord): Promise<{ data: any; error: any }> {
    const supabase = await this.getSupabase()

    const { data, error } = await supabase
      .from('template_library')
      .insert(template)
      .select()
      .single()

    return { data, error }
  }

  /**
   * Get template by template_id
   */
  async getTemplateById(templateId: string): Promise<{ data: any; error: any }> {
    const supabase = await this.getSupabase()

    const { data, error } = await supabase
      .from('template_library')
      .select('*')
      .eq('template_id', templateId)
      .eq('status', 'published')
      .single()

    return { data, error }
  }

  /**
   * Get templates by type and industry
   */
  async getTemplates(filters?: {
    type?: string
    industry?: string
    status?: string
    is_featured?: boolean
  }): Promise<{ data: any[]; error: any }> {
    const supabase = await this.getSupabase()

    let query = supabase.from('template_library').select('*')

    if (filters?.type) {
      query = query.eq('type', filters.type)
    }

    if (filters?.industry) {
      query = query.eq('industry', filters.industry)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    } else {
      query = query.eq('status', 'published')
    }

    if (filters?.is_featured !== undefined) {
      query = query.eq('is_featured', filters.is_featured)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    return { data: data || [], error }
  }

  /**
   * Update template
   */
  async updateTemplate(
    templateId: string,
    updates: Partial<TemplateLibraryRecord>
  ): Promise<{ data: any; error: any }> {
    const supabase = await this.getSupabase()

    const { data, error } = await supabase
      .from('template_library')
      .update(updates)
      .eq('template_id', templateId)
      .select()
      .single()

    return { data, error }
  }

  /**
   * Increment usage count
   */
  async incrementUsage(templateId: string): Promise<{ data: any; error: any }> {
    const supabase = await this.getSupabase()

    // Get current usage count
    const { data: current } = await supabase
      .from('template_library')
      .select('usage_count')
      .eq('template_id', templateId)
      .single()

    const newCount = (current?.usage_count || 0) + 1

    const { data, error } = await supabase
      .from('template_library')
      .update({ usage_count: newCount })
      .eq('template_id', templateId)
      .select()
      .single()

    return { data, error }
  }
}







