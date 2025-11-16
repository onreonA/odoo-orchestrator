import { createClient } from '@/lib/supabase/server'

interface EvolutionRecommendation {
  type: 'add_module' | 'remove_module' | 'modify_field' | 'add_workflow' | 'optimize_dashboard'
  priority: 'low' | 'medium' | 'high'
  description: string
  details: any
  confidence: number // 0-1
}

interface TemplateEvolutionResult {
  templateId: string
  recommendations: EvolutionRecommendation[]
  healthScore: number // 0-100
  usageTrend: 'increasing' | 'stable' | 'decreasing'
  successRate: number // 0-1
}

export class TemplateEvolutionService {
  private supabase: any

  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createClient()
    }
    return this.supabase
  }

  /**
   * Analyze template feedback and generate evolution recommendations
   */
  async analyzeTemplate(templateId: string): Promise<TemplateEvolutionResult> {
    const supabase = await this.getSupabase()
    // Get all feedback for this template
    const { data: feedback } = await supabase
      .from('template_feedback')
      .select('*')
      .eq('template_id', templateId)

    // Get deployment statistics
    const { data: deployments } = await supabase
      .from('template_deployments')
      .select('status, result')
      .eq('template_id', templateId)

    // Get analytics
    const { data: analytics } = await supabase
      .from('template_analytics')
      .select('*')
      .eq('template_id', templateId)
      .order('date', { ascending: false })
      .limit(30)

    // Calculate metrics
    const totalFeedback = feedback?.length || 0
    const avgRating = feedback
      ? feedback.reduce((sum: number, f: any) => sum + (f.rating || 0), 0) / feedback.length
      : 0
    const successCount = deployments?.filter((d: any) => d.status === 'success').length || 0
    const totalDeployments = deployments?.length || 0
    const successRate = totalDeployments > 0 ? successCount / totalDeployments : 0

    // Calculate health score
    const healthScore = this.calculateHealthScore(avgRating, successRate, totalFeedback)

    // Analyze usage trend
    const usageTrend = this.analyzeUsageTrend(analytics || [])

    // Generate recommendations
    const recommendations = await this.generateRecommendations(
      templateId,
      feedback || [],
      deployments || [],
      analytics || []
    )

    return {
      templateId,
      recommendations,
      healthScore,
      usageTrend,
      successRate,
    }
  }

  /**
   * Calculate template health score (0-100)
   */
  private calculateHealthScore(
    avgRating: number,
    successRate: number,
    feedbackCount: number
  ): number {
    // Rating contributes 40% (max 40 points)
    const ratingScore = (avgRating / 5) * 40

    // Success rate contributes 40% (max 40 points)
    const successScore = successRate * 40

    // Feedback count contributes 20% (max 20 points)
    // More feedback = better (capped at 20+ feedbacks = 20 points)
    const feedbackScore = Math.min((feedbackCount / 20) * 20, 20)

    return Math.round(ratingScore + successScore + feedbackScore)
  }

  /**
   * Analyze usage trend from analytics
   */
  private analyzeUsageTrend(analytics: any[]): 'increasing' | 'stable' | 'decreasing' {
    if (analytics.length < 2) return 'stable'

    const recent = analytics.slice(0, 7) // Last 7 days
    const older = analytics.slice(7, 14) // Previous 7 days

    const recentAvg = recent.reduce((sum, a) => sum + (a.usage_count || 0), 0) / recent.length
    const olderAvg = older.reduce((sum, a) => sum + (a.usage_count || 0), 0) / older.length

    if (recentAvg > olderAvg * 1.1) return 'increasing'
    if (recentAvg < olderAvg * 0.9) return 'decreasing'
    return 'stable'
  }

  /**
   * Generate evolution recommendations based on feedback and analytics
   */
  private async generateRecommendations(
    templateId: string,
    feedback: any[],
    deployments: any[],
    analytics: any[]
  ): Promise<EvolutionRecommendation[]> {
    const recommendations: EvolutionRecommendation[] = []

    // Analyze common issues
    const issues = feedback.flatMap(f => f.issues || []).filter(i => i)

    const issueGroups = this.groupIssues(issues)
    for (const [type, count] of Object.entries(issueGroups)) {
      if (count >= 3) {
        recommendations.push({
          type: 'add_module',
          priority: 'high',
          description: `${count} kullanıcı "${type}" sorunu bildirdi`,
          details: { issueType: type, count },
          confidence: Math.min(count / 10, 1),
        })
      }
    }

    // Analyze suggestions
    const suggestions = feedback.flatMap(f => f.suggestions || []).filter(s => s)

    const suggestionGroups = this.groupSuggestions(suggestions)
    for (const [type, count] of Object.entries(suggestionGroups)) {
      if (count >= 2) {
        recommendations.push({
          type: 'add_workflow',
          priority: 'medium',
          description: `${count} kullanıcı "${type}" önerisi yaptı`,
          details: { suggestionType: type, count },
          confidence: Math.min(count / 5, 1),
        })
      }
    }

    // Analyze low ratings
    const lowRatings = feedback.filter(f => f.rating <= 2)
    if (lowRatings.length >= 3) {
      recommendations.push({
        type: 'optimize_dashboard',
        priority: 'high',
        description: `${lowRatings.length} kullanıcı düşük rating verdi`,
        details: { lowRatingCount: lowRatings.length },
        confidence: Math.min(lowRatings.length / 10, 1),
      })
    }

    // Analyze deployment failures
    const failures = deployments.filter(d => d.status === 'failed')
    if (failures.length >= 2) {
      const commonErrors = this.analyzeDeploymentErrors(failures)
      if (commonErrors.length > 0) {
        recommendations.push({
          type: 'modify_field',
          priority: 'high',
          description: `Deployment hataları tespit edildi: ${commonErrors.join(', ')}`,
          details: { errors: commonErrors },
          confidence: 0.8,
        })
      }
    }

    // Sort by priority and confidence
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }
      return b.confidence - a.confidence
    })
  }

  /**
   * Group issues by type
   */
  private groupIssues(issues: any[]): Record<string, number> {
    const groups: Record<string, number> = {}
    for (const issue of issues) {
      const type = issue.type || 'unknown'
      groups[type] = (groups[type] || 0) + 1
    }
    return groups
  }

  /**
   * Group suggestions by type
   */
  private groupSuggestions(suggestions: any[]): Record<string, number> {
    const groups: Record<string, number> = {}
    for (const suggestion of suggestions) {
      const type = suggestion.type || 'unknown'
      groups[type] = (groups[type] || 0) + 1
    }
    return groups
  }

  /**
   * Analyze deployment errors
   */
  private analyzeDeploymentErrors(failures: any[]): string[] {
    const errors: string[] = []
    for (const failure of failures) {
      if (failure.error_message) {
        // Extract error type from error message
        if (failure.error_message.includes('field')) {
          errors.push('field_error')
        } else if (failure.error_message.includes('module')) {
          errors.push('module_error')
        } else if (failure.error_message.includes('workflow')) {
          errors.push('workflow_error')
        }
      }
    }
    return [...new Set(errors)]
  }

  /**
   * Get evolution recommendations for a template
   */
  async getRecommendations(templateId: string): Promise<EvolutionRecommendation[]> {
    const analysis = await this.analyzeTemplate(templateId)
    return analysis.recommendations
  }

  /**
   * Apply a recommendation (creates a new version with improvements)
   */
  async applyRecommendation(
    templateId: string,
    recommendationId: string
  ): Promise<{ success: boolean; message: string }> {
    // This would integrate with version creation
    // For now, just return success
    return {
      success: true,
      message: 'Recommendation will be applied in next version',
    }
  }
}
