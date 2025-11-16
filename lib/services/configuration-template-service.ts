import { createClient } from '@/lib/supabase/server'

export interface ConfigurationTemplate {
  id: string
  name: string
  description?: string
  category: 'model' | 'view' | 'workflow' | 'security' | 'report'
  industry?: string[]
  department_types?: string[]
  template_config: Record<string, any>
  variables?: Record<string, any>
  created_by?: string
  is_public: boolean
  usage_count: number
  rating?: number
  created_at: string
  updated_at: string
}

export interface CreateTemplateInput {
  name: string
  description?: string
  category: 'model' | 'view' | 'workflow' | 'security' | 'report'
  industry?: string[]
  department_types?: string[]
  template_config: Record<string, any>
  variables?: Record<string, any>
  is_public?: boolean
}

export interface UpdateTemplateInput {
  name?: string
  description?: string
  industry?: string[]
  department_types?: string[]
  template_config?: Record<string, any>
  variables?: Record<string, any>
  is_public?: boolean
}

export interface TemplateFilters {
  category?: 'model' | 'view' | 'workflow' | 'security' | 'report'
  industry?: string
  department_type?: string
  is_public?: boolean
  search?: string
}

class ConfigurationTemplateService {
  private supabase: Awaited<ReturnType<typeof createClient>> | null = null

  constructor() {
    // Supabase client will be initialized lazily
  }

  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createClient()
    }
    return this.supabase
  }

  /**
   * Create a new configuration template
   */
  async createTemplate(input: CreateTemplateInput): Promise<ConfigurationTemplate> {
    const supabase = await this.getSupabase()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    const { data, error } = await supabase
      .from('configuration_templates')
      .insert({
        name: input.name,
        description: input.description,
        category: input.category,
        industry: input.industry || [],
        department_types: input.department_types || [],
        template_config: input.template_config,
        variables: input.variables || {},
        created_by: user.id,
        is_public: input.is_public || false,
        usage_count: 0,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create template: ${error.message}`)
    }

    return data as ConfigurationTemplate
  }

  /**
   * Get templates with optional filters
   */
  async getTemplates(filters?: TemplateFilters): Promise<ConfigurationTemplate[]> {
    const supabase = await this.getSupabase()

    let query = supabase.from('configuration_templates').select('*')

    // Apply filters
    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    if (filters?.industry) {
      query = query.contains('industry', [filters.industry])
    }

    if (filters?.department_type) {
      query = query.contains('department_types', [filters.department_type])
    }

    if (filters?.is_public !== undefined) {
      query = query.eq('is_public', filters.is_public)
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    // Order by rating (desc) and usage_count (desc)
    query = query.order('rating', { ascending: false, nullsFirst: false })
    query = query.order('usage_count', { ascending: false })

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get templates: ${error.message}`)
    }

    return (data || []) as ConfigurationTemplate[]
  }

  /**
   * Get template by ID
   */
  async getTemplateById(id: string): Promise<ConfigurationTemplate> {
    const supabase = await this.getSupabase()

    const { data, error } = await supabase
      .from('configuration_templates')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Failed to get template: ${error.message}`)
    }

    return data as ConfigurationTemplate
  }

  /**
   * Update template
   */
  async updateTemplate(id: string, input: UpdateTemplateInput): Promise<ConfigurationTemplate> {
    const supabase = await this.getSupabase()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    // Check if user owns the template or is super_admin
    const template = await this.getTemplateById(id)
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser?.id)
      .single()

    if (template.created_by !== user.id && profile?.role !== 'super_admin') {
      throw new Error('Unauthorized: You can only update your own templates')
    }

    const updateData: Partial<ConfigurationTemplate> = {}
    if (input.name !== undefined) updateData.name = input.name
    if (input.description !== undefined) updateData.description = input.description
    if (input.industry !== undefined) updateData.industry = input.industry
    if (input.department_types !== undefined) updateData.department_types = input.department_types
    if (input.template_config !== undefined)
      updateData.template_config = input.template_config as any
    if (input.variables !== undefined) updateData.variables = input.variables as any
    if (input.is_public !== undefined) updateData.is_public = input.is_public

    const { data, error } = await supabase
      .from('configuration_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update template: ${error.message}`)
    }

    return data as ConfigurationTemplate
  }

  /**
   * Delete template
   */
  async deleteTemplate(id: string): Promise<void> {
    const supabase = await this.getSupabase()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    // Check if user owns the template or is super_admin
    const template = await this.getTemplateById(id)
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser?.id)
      .single()

    if (template.created_by !== user.id && profile?.role !== 'super_admin') {
      throw new Error('Unauthorized: You can only delete your own templates')
    }

    const { error } = await supabase.from('configuration_templates').delete().eq('id', id)

    if (error) {
      throw new Error(`Failed to delete template: ${error.message}`)
    }
  }

  /**
   * Apply template to create a configuration
   */
  async applyTemplate(
    templateId: string,
    companyId: string,
    variables: Record<string, any>
  ): Promise<{ configurationId: string; generatedCode: string }> {
    const supabase = await this.getSupabase()

    // Get template
    const template = await this.getTemplateById(templateId)

    // Replace variables in template_config
    let generatedConfig = JSON.parse(JSON.stringify(template.template_config))
    const templateVariables = template.variables || {}

    // Replace variables
    const replaceVariables = (obj: any): any => {
      if (typeof obj === 'string') {
        // Replace {{variable}} patterns
        return obj.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
          if (variables[varName] !== undefined) {
            return variables[varName]
          }
          if (templateVariables[varName]?.default !== undefined) {
            return templateVariables[varName].default
          }
          return match
        })
      } else if (Array.isArray(obj)) {
        return obj.map(replaceVariables)
      } else if (obj && typeof obj === 'object') {
        const result: any = {}
        for (const [key, value] of Object.entries(obj)) {
          result[key] = replaceVariables(value)
        }
        return result
      }
      return obj
    }

    generatedConfig = replaceVariables(generatedConfig)

    // Generate code from config (this will be handled by AI Configuration Generator later)
    // For now, we'll just store the config
    const generatedCode = JSON.stringify(generatedConfig, null, 2)

    // Create configuration
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    const { data: configuration, error: configError } = await supabase
      .from('configurations')
      .insert({
        company_id: companyId,
        type: template.category,
        name: template.name,
        natural_language_input: `Applied template: ${template.name}`,
        requirements: generatedConfig,
        generated_code: generatedCode,
        status: 'draft',
        created_by: user.id,
      })
      .select()
      .single()

    if (configError) {
      throw new Error(`Failed to create configuration: ${configError.message}`)
    }

    // Increment usage count
    await supabase
      .from('configuration_templates')
      .update({ usage_count: template.usage_count + 1 })
      .eq('id', templateId)

    return {
      configurationId: configuration.id,
      generatedCode,
    }
  }

  /**
   * Search templates
   */
  async searchTemplates(
    query: string,
    filters?: TemplateFilters
  ): Promise<ConfigurationTemplate[]> {
    return this.getTemplates({
      ...filters,
      search: query,
    })
  }

  /**
   * Rate template
   */
  async rateTemplate(templateId: string, rating: number, userId: string): Promise<void> {
    const supabase = await this.getSupabase()

    if (rating < 0 || rating > 5) {
      throw new Error('Rating must be between 0 and 5')
    }

    // Get current template
    const template = await this.getTemplateById(templateId)

    // Calculate new average rating
    // For simplicity, we'll use a simple average
    // In production, you might want to store individual ratings
    const currentRating = template.rating || 0
    const usageCount = template.usage_count || 0
    const newRating =
      usageCount > 0 ? (currentRating * usageCount + rating) / (usageCount + 1) : rating

    const { error } = await supabase
      .from('configuration_templates')
      .update({ rating: newRating })
      .eq('id', templateId)

    if (error) {
      throw new Error(`Failed to rate template: ${error.message}`)
    }
  }
}

// Singleton pattern
let instance: ConfigurationTemplateService | null = null

export function getConfigurationTemplateService(): ConfigurationTemplateService {
  if (!instance) {
    instance = new ConfigurationTemplateService()
  }
  return instance
}

// Export class for testing
export { ConfigurationTemplateService }
