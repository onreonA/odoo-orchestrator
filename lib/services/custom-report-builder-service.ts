import { createClient } from '@/lib/supabase/server'

export interface ReportTemplate {
  id?: string
  name: string
  description?: string
  template_id: string
  metrics: string[] // ['usage_count', 'success_rate', 'avg_rating', etc.]
  date_range: {
    type: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'custom'
    start_date?: string
    end_date?: string
  }
  include_deployments: boolean
  include_feedback: boolean
  group_by?: 'day' | 'week' | 'month'
  format: 'pdf' | 'excel' | 'both'
  schedule?: {
    enabled: boolean
    frequency: 'daily' | 'weekly' | 'monthly'
    day_of_week?: number // 0-6 for weekly
    day_of_month?: number // 1-31 for monthly
    time?: string // HH:mm format
    recipients?: string[] // email addresses
  }
  created_by: string
  created_at?: string
  updated_at?: string
}

export class CustomReportBuilderService {
  private supabase = createClient()

  /**
   * Create a custom report template
   */
  async createTemplate(
    template: Omit<ReportTemplate, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ReportTemplate> {
    const { data, error } = await this.supabase
      .from('custom_report_templates')
      .insert({
        name: template.name,
        description: template.description,
        template_id: template.template_id,
        metrics: template.metrics,
        date_range: template.date_range,
        include_deployments: template.include_deployments,
        include_feedback: template.include_feedback,
        group_by: template.group_by,
        format: template.format,
        schedule: template.schedule,
        created_by: template.created_by,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create report template: ${error.message}`)
    }

    return data
  }

  /**
   * Get all report templates for a user
   */
  async getTemplates(userId: string, templateId?: string): Promise<ReportTemplate[]> {
    let query = this.supabase.from('custom_report_templates').select('*').eq('created_by', userId)

    if (templateId) {
      query = query.eq('template_id', templateId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get templates: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get a single report template
   */
  async getTemplate(id: string): Promise<ReportTemplate | null> {
    const { data, error } = await this.supabase
      .from('custom_report_templates')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get template: ${error.message}`)
    }

    return data
  }

  /**
   * Update a report template
   */
  async updateTemplate(id: string, updates: Partial<ReportTemplate>): Promise<ReportTemplate> {
    const { data, error } = await this.supabase
      .from('custom_report_templates')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update template: ${error.message}`)
    }

    return data
  }

  /**
   * Delete a report template
   */
  async deleteTemplate(id: string): Promise<void> {
    const supabase = await this.getSupabase()
    const { error } = await supabase.from('custom_report_templates').delete().eq('id', id)

    if (error) {
      throw new Error(`Failed to delete template: ${error.message}`)
    }
  }

  /**
   * Generate report from template
   */
  async generateReport(templateId: string): Promise<Blob> {
    const template = await this.getTemplate(templateId)
    if (!template) {
      throw new Error('Template not found')
    }

    // Calculate date range
    const dateRange = this.calculateDateRange(template.date_range)

    // Generate report using report export service
    const { getReportExportService } = await import('./report-export-service')
    const exportService = getReportExportService()

    return await exportService.generateExcelReport(
      template.template_id,
      dateRange.start,
      dateRange.end
    )
  }

  /**
   * Calculate date range from template settings
   */
  private calculateDateRange(dateRange: ReportTemplate['date_range']): {
    start: string
    end: string
  } {
    const end = new Date()
    let start: Date

    switch (dateRange.type) {
      case 'last_7_days':
        start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'last_30_days':
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'last_90_days':
        start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case 'custom':
        start = dateRange.start_date
          ? new Date(dateRange.start_date)
          : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)
        end.setTime(dateRange.end_date ? new Date(dateRange.end_date).getTime() : end.getTime())
        break
      default:
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    }
  }
}

export function getCustomReportBuilderService(): CustomReportBuilderService {
  return new CustomReportBuilderService()
}
