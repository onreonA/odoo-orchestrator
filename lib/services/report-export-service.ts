import { createClient } from '@/lib/supabase/server'

export interface ReportData {
  template_id: string
  template_name: string
  date_range: {
    start: string
    end: string
  }
  metrics: {
    total_usage: number
    total_success: number
    total_failure: number
    avg_rating: number
    avg_deployment_time: number
    total_feedback: number
    positive_feedback: number
    negative_feedback: number
  }
  deployments: Array<{
    id: string
    date: string
    status: string
    duration: number
    company_name: string
  }>
  feedback: Array<{
    id: string
    date: string
    rating: number
    sentiment: string
    comment: string
  }>
}

export class ReportExportService {
  private supabase = createClient()

  /**
   * Generate PDF report
   */
  async generatePDFReport(templateId: string, startDate: string, endDate: string): Promise<Blob> {
    const reportData = await this.getReportData(templateId, startDate, endDate)

    // Generate PDF using a library like jsPDF or puppeteer
    // For now, return a placeholder
    const pdfContent = this.generatePDFContent(reportData)

    // In production, use jsPDF or puppeteer to generate actual PDF
    return new Blob([pdfContent], { type: 'application/pdf' })
  }

  /**
   * Generate Excel report
   */
  async generateExcelReport(templateId: string, startDate: string, endDate: string): Promise<Blob> {
    const reportData = await this.getReportData(templateId, startDate, endDate)

    // Generate Excel using a library like xlsx or exceljs
    // For now, return CSV as placeholder
    const csvContent = this.generateCSVContent(reportData)

    return new Blob([csvContent], { type: 'text/csv' })
  }

  /**
   * Get report data
   */
  private async getReportData(
    templateId: string,
    startDate: string,
    endDate: string
  ): Promise<ReportData> {
    // Get template info
    const supabase = await this.getSupabase()
    const { data: template } = await supabase
      .from('template_library')
      .select('template_id, name')
      .eq('template_id', templateId)
      .single()

    // Get aggregated analytics
    const supabase = await this.getSupabase()
    const { data: analytics } = await supabase.rpc('aggregate_template_analytics', {
      p_template_id: templateId,
      p_start_date: startDate,
      p_end_date: endDate,
    })

    // Get deployments
    const { data: deployments } = await this.supabase
      .from('template_deployments')
      .select(
        `
        id,
        created_at,
        status,
        duration_seconds,
        companies:odoo_instances!template_deployments_instance_id_fkey(companies(name))
      `
      )
      .eq('template_id', templateId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false })

    // Get feedback
    const { data: feedback } = await this.supabase
      .from('template_feedback')
      .select('id, created_at, rating, sentiment, comment')
      .eq('template_id', templateId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false })

    return {
      template_id: templateId,
      template_name: template?.name || 'Unknown Template',
      date_range: {
        start: startDate,
        end: endDate,
      },
      metrics: analytics?.[0] || {
        total_usage: 0,
        total_success: 0,
        total_failure: 0,
        avg_rating: 0,
        avg_deployment_time: 0,
        total_feedback: 0,
        positive_feedback: 0,
        negative_feedback: 0,
      },
      deployments: (deployments || []).map((d: any) => ({
        id: d.id,
        date: d.created_at,
        status: d.status,
        duration: d.duration_seconds || 0,
        company_name: d.companies?.name || 'Unknown',
      })),
      feedback: (feedback || []).map((f: any) => ({
        id: f.id,
        date: f.created_at,
        rating: f.rating || 0,
        sentiment: f.sentiment || 'neutral',
        comment: f.comment || '',
      })),
    }
  }

  /**
   * Generate PDF content (placeholder)
   */
  private generatePDFContent(data: ReportData): string {
    return `
Template Analytics Report
Template: ${data.template_name}
Date Range: ${data.date_range.start} to ${data.date_range.end}

Metrics:
- Total Usage: ${data.metrics.total_usage}
- Success Rate: ${data.metrics.total_success} / ${data.metrics.total_usage}
- Average Rating: ${data.metrics.avg_rating}
- Average Deployment Time: ${data.metrics.avg_deployment_time}s
- Total Feedback: ${data.metrics.total_feedback}

Deployments: ${data.deployments.length}
Feedback: ${data.feedback.length}
    `.trim()
  }

  /**
   * Generate CSV content
   */
  private generateCSVContent(data: ReportData): string {
    const lines: string[] = []

    // Header
    lines.push('Template Analytics Report')
    lines.push(`Template: ${data.template_name}`)
    lines.push(`Date Range: ${data.date_range.start} to ${data.date_range.end}`)
    lines.push('')

    // Metrics
    lines.push('Metrics')
    lines.push('Metric,Value')
    lines.push(`Total Usage,${data.metrics.total_usage}`)
    lines.push(`Total Success,${data.metrics.total_success}`)
    lines.push(`Total Failure,${data.metrics.total_failure}`)
    lines.push(`Average Rating,${data.metrics.avg_rating}`)
    lines.push(`Average Deployment Time,${data.metrics.avg_deployment_time}`)
    lines.push(`Total Feedback,${data.metrics.total_feedback}`)
    lines.push(`Positive Feedback,${data.metrics.positive_feedback}`)
    lines.push(`Negative Feedback,${data.metrics.negative_feedback}`)
    lines.push('')

    // Deployments
    lines.push('Deployments')
    lines.push('ID,Date,Status,Duration (s),Company')
    data.deployments.forEach(d => {
      lines.push(`${d.id},${d.date},${d.status},${d.duration},${d.company_name}`)
    })
    lines.push('')

    // Feedback
    lines.push('Feedback')
    lines.push('ID,Date,Rating,Sentiment,Comment')
    data.feedback.forEach(f => {
      lines.push(`${f.id},${f.date},${f.rating},${f.sentiment},"${f.comment.replace(/"/g, '""')}"`)
    })

    return lines.join('\n')
  }
}

export function getReportExportService(): ReportExportService {
  return new ReportExportService()
}
