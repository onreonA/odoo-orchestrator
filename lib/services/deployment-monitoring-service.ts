/**
 * Deployment Monitoring Service
 *
 * Monitors template deployments:
 * - Real-time progress tracking
 * - Log aggregation and filtering
 * - Notifications (in-app, email, webhook)
 * - Error alerting
 * - Deployment analytics
 */

import { createClient } from '@/lib/supabase/server'
import { getTemplateDeploymentEngine } from './template-deployment-engine'

export interface DeploymentStatus {
  deploymentId: string
  status: 'pending' | 'in_progress' | 'success' | 'failed' | 'rolled_back'
  progress: number
  currentStep?: string
  errorMessage?: string
  startedAt?: string
  completedAt?: string
  durationSeconds?: number
}

export interface DeploymentLog {
  id: string
  deploymentId: string
  level: 'debug' | 'info' | 'warning' | 'error'
  message: string
  details?: any
  createdAt: string
}

export interface DeploymentMetrics {
  totalDeployments: number
  successfulDeployments: number
  failedDeployments: number
  averageDuration: number
  deploymentsByType: Record<string, number>
  deploymentsByStatus: Record<string, number>
  recentDeployments: DeploymentStatus[]
}

export interface NotificationConfig {
  deploymentId: string
  userId: string
  channels: ('in_app' | 'email' | 'webhook')[]
  onStatusChange?: boolean
  onError?: boolean
  onCompletion?: boolean
  webhookUrl?: string
}

export class DeploymentMonitoringService {
  private supabase: any
  private templateDeploymentEngine: ReturnType<typeof getTemplateDeploymentEngine>

  constructor() {
    this.templateDeploymentEngine = getTemplateDeploymentEngine()
  }

  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createClient()
    }
    return this.supabase
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(deploymentId: string): Promise<DeploymentStatus> {
    const supabase = await this.getSupabase()

    const { data: deployment, error } = await supabase
      .from('template_deployments')
      .select('*')
      .eq('id', deploymentId)
      .single()

    if (error || !deployment) {
      throw new Error(`Deployment not found: ${deploymentId}`)
    }

    return {
      deploymentId: deployment.id,
      status: deployment.status,
      progress: deployment.progress,
      currentStep: deployment.current_step,
      errorMessage: deployment.error_message,
      startedAt: deployment.started_at,
      completedAt: deployment.completed_at,
      durationSeconds: deployment.duration_seconds,
    }
  }

  /**
   * Get deployment logs with filtering
   */
  async getDeploymentLogs(
    deploymentId: string,
    options?: {
      level?: 'debug' | 'info' | 'warning' | 'error'
      limit?: number
      offset?: number
      since?: string
    }
  ): Promise<DeploymentLog[]> {
    const supabase = await this.getSupabase()

    let query = supabase.from('deployment_logs').select('*').eq('deployment_id', deploymentId)

    if (options?.level) {
      query = query.eq('level', options.level)
    }

    if (options?.since) {
      query = query.gte('created_at', options.since)
    }

    query = query.order('created_at', { ascending: false })

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 100) - 1)
    }

    const { data: logs, error } = await query

    if (error) {
      throw new Error(`Failed to get deployment logs: ${error.message}`)
    }

    return (logs || []).map((log: any) => ({
      id: log.id,
      deploymentId: log.deployment_id,
      level: log.level,
      message: log.message,
      details: log.details,
      createdAt: log.created_at,
    }))
  }

  /**
   * Get deployment metrics
   */
  async getDeploymentMetrics(filters?: {
    instanceId?: string
    templateType?: string
    startDate?: string
    endDate?: string
  }): Promise<DeploymentMetrics> {
    const supabase = await this.getSupabase()

    let query = supabase.from('template_deployments').select('*')

    if (filters?.instanceId) {
      query = query.eq('instance_id', filters.instanceId)
    }

    if (filters?.templateType) {
      query = query.eq('template_type', filters.templateType)
    }

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate)
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate)
    }

    const { data: deployments, error } = await query

    if (error) {
      throw new Error(`Failed to get deployment metrics: ${error.message}`)
    }

    const totalDeployments = deployments?.length || 0
    const successfulDeployments =
      deployments?.filter((d: any) => d.status === 'success').length || 0
    const failedDeployments = deployments?.filter((d: any) => d.status === 'failed').length || 0

    // Calculate average duration
    const completedDeployments = deployments?.filter((d: any) => d.duration_seconds !== null) || []
    const averageDuration =
      completedDeployments.length > 0
        ? completedDeployments.reduce((sum: number, d: any) => sum + (d.duration_seconds || 0), 0) /
          completedDeployments.length
        : 0

    // Group by type
    const deploymentsByType: Record<string, number> = {}
    deployments?.forEach((d: any) => {
      deploymentsByType[d.template_type] = (deploymentsByType[d.template_type] || 0) + 1
    })

    // Group by status
    const deploymentsByStatus: Record<string, number> = {}
    deployments?.forEach((d: any) => {
      deploymentsByStatus[d.status] = (deploymentsByStatus[d.status] || 0) + 1
    })

    // Get recent deployments
    const recentDeployments = (deployments || [])
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map((d: any) => ({
        deploymentId: d.id,
        status: d.status,
        progress: d.progress,
        currentStep: d.current_step,
        errorMessage: d.error_message,
        startedAt: d.started_at,
        completedAt: d.completed_at,
        durationSeconds: d.duration_seconds,
      }))

    return {
      totalDeployments,
      successfulDeployments,
      failedDeployments,
      averageDuration: Math.round(averageDuration),
      deploymentsByType,
      deploymentsByStatus,
      recentDeployments,
    }
  }

  /**
   * Subscribe to deployment updates (for real-time monitoring)
   * Note: This requires client-side Supabase client. Use in client components.
   * For server-side, use polling with getDeploymentStatus()
   */
  subscribeToDeployment(
    supabaseClient: any, // Client-side Supabase client
    deploymentId: string,
    callback: (status: DeploymentStatus) => void
  ): () => void {
    // Create a real-time subscription
    const channel = supabaseClient
      .channel(`deployment:${deploymentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'template_deployments',
          filter: `id=eq.${deploymentId}`,
        },
        (payload: any) => {
          const deployment = payload.new
          callback({
            deploymentId: deployment.id,
            status: deployment.status,
            progress: deployment.progress,
            currentStep: deployment.current_step,
            errorMessage: deployment.error_message,
            startedAt: deployment.started_at,
            completedAt: deployment.completed_at,
            durationSeconds: deployment.duration_seconds,
          })
        }
      )
      .subscribe()

    // Return unsubscribe function
    return () => {
      supabaseClient.removeChannel(channel)
    }
  }

  /**
   * Subscribe to deployment logs (for real-time log streaming)
   * Note: This requires client-side Supabase client. Use in client components.
   */
  subscribeToDeploymentLogs(
    supabaseClient: any, // Client-side Supabase client
    deploymentId: string,
    callback: (log: DeploymentLog) => void
  ): () => void {
    const channel = supabaseClient
      .channel(`deployment-logs:${deploymentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'deployment_logs',
          filter: `deployment_id=eq.${deploymentId}`,
        },
        (payload: any) => {
          const log = payload.new
          callback({
            id: log.id,
            deploymentId: log.deployment_id,
            level: log.level,
            message: log.message,
            details: log.details,
            createdAt: log.created_at,
          })
        }
      )
      .subscribe()

    return () => {
      supabaseClient.removeChannel(channel)
    }
  }

  /**
   * Poll deployment status (for server-side or when real-time is not available)
   */
  async pollDeploymentStatus(
    deploymentId: string,
    callback: (status: DeploymentStatus) => void,
    intervalMs: number = 2000
  ): Promise<() => void> {
    let isPolling = true

    const poll = async () => {
      if (!isPolling) return

      try {
        const status = await this.getDeploymentStatus(deploymentId)
        callback(status)

        // Stop polling if deployment is complete
        if (
          status.status === 'success' ||
          status.status === 'failed' ||
          status.status === 'rolled_back'
        ) {
          isPolling = false
          return
        }
      } catch (error) {
        console.error('[Deployment Monitoring] Polling error:', error)
      }

      if (isPolling) {
        setTimeout(poll, intervalMs)
      }
    }

    poll()

    // Return stop function
    return () => {
      isPolling = false
    }
  }

  /**
   * Setup notification configuration for a deployment
   */
  async setupNotifications(config: NotificationConfig): Promise<void> {
    const supabase = await this.getSupabase()

    // Store notification config (you might want to create a notifications table)
    // For now, we'll use a simple approach with deployment metadata
    const { error } = await supabase
      .from('template_deployments')
      .update({
        // Store notification config in customizations or create a separate table
        // For now, we'll handle notifications inline
      })
      .eq('id', config.deploymentId)

    if (error) {
      throw new Error(`Failed to setup notifications: ${error.message}`)
    }

    // Start monitoring deployment for notifications
    this.monitorDeploymentForNotifications(config)
  }

  /**
   * Monitor deployment and send notifications
   */
  private async monitorDeploymentForNotifications(config: NotificationConfig): Promise<void> {
    // Use polling for server-side monitoring
    const stopPolling = await this.pollDeploymentStatus(
      config.deploymentId,
      async status => {
        // Check if notification should be sent
        if (config.onStatusChange) {
          await this.sendNotification(config, {
            type: 'status_change',
            status: status.status,
            progress: status.progress,
            currentStep: status.currentStep,
          })
        }

        if (config.onError && status.status === 'failed') {
          await this.sendNotification(config, {
            type: 'error',
            errorMessage: status.errorMessage,
          })
        }

        if (config.onCompletion && (status.status === 'success' || status.status === 'failed')) {
          await this.sendNotification(config, {
            type: 'completion',
            status: status.status,
            durationSeconds: status.durationSeconds,
          })
          // Stop polling after completion notification
          stopPolling()
        }
      },
      5000
    ) // Poll every 5 seconds
  }

  /**
   * Send notification via configured channels
   */
  private async sendNotification(
    config: NotificationConfig,
    data: {
      type: 'status_change' | 'error' | 'completion'
      status?: string
      progress?: number
      currentStep?: string
      errorMessage?: string
      durationSeconds?: number
    }
  ): Promise<void> {
    const supabase = await this.getSupabase()

    // Get deployment details
    const deployment = await this.getDeploymentStatus(config.deploymentId)

    // Get user details
    const { data: user } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', config.userId)
      .single()

    // Send via configured channels
    for (const channel of config.channels) {
      switch (channel) {
        case 'in_app':
          await this.sendInAppNotification(config.userId, {
            deploymentId: config.deploymentId,
            type: data.type,
            message: this.formatNotificationMessage(data, deployment),
            timestamp: new Date().toISOString(),
          })
          break

        case 'email':
          if (user?.email) {
            await this.sendEmailNotification(user.email, {
              deploymentId: config.deploymentId,
              type: data.type,
              message: this.formatNotificationMessage(data, deployment),
              subject: `Deployment ${data.type === 'error' ? 'Failed' : 'Update'}`,
            })
          }
          break

        case 'webhook':
          if (config.webhookUrl) {
            await this.sendWebhookNotification(config.webhookUrl, {
              deploymentId: config.deploymentId,
              type: data.type,
              data: {
                ...data,
                deployment,
              },
            })
          }
          break
      }
    }
  }

  /**
   * Send in-app notification
   */
  private async sendInAppNotification(userId: string, notification: any): Promise<void> {
    const supabase = await this.getSupabase()

    // Create notification record (you might want to create a notifications table)
    // For now, we'll just log it
    console.log('[Deployment Monitoring] In-app notification:', {
      userId,
      notification,
    })

    // TODO: Create notifications table and insert notification
    // await supabase.from('notifications').insert({
    //   user_id: userId,
    //   type: 'deployment_update',
    //   title: notification.message,
    //   data: notification,
    //   read: false
    // })
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(email: string, notification: any): Promise<void> {
    // TODO: Implement email sending (using Resend, SendGrid, etc.)
    console.log('[Deployment Monitoring] Email notification:', {
      email,
      notification,
    })

    // Example implementation:
    // await fetch('/api/notifications/email', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email, notification })
    // })
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(webhookUrl: string, payload: any): Promise<void> {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch (error) {
      console.error('[Deployment Monitoring] Webhook notification failed:', error)
    }
  }

  /**
   * Format notification message
   */
  private formatNotificationMessage(
    data: {
      type: 'status_change' | 'error' | 'completion'
      status?: string
      progress?: number
      currentStep?: string
      errorMessage?: string
      durationSeconds?: number
    },
    deployment: DeploymentStatus
  ): string {
    switch (data.type) {
      case 'status_change':
        return `Deployment ${deployment.deploymentId.substring(0, 8)}... status changed to ${data.status} (${data.progress}%)${data.currentStep ? `: ${data.currentStep}` : ''}`

      case 'error':
        return `Deployment ${deployment.deploymentId.substring(0, 8)}... failed: ${data.errorMessage}`

      case 'completion':
        const duration = data.durationSeconds
          ? `${Math.round(data.durationSeconds / 60)} minutes`
          : 'unknown'
        return `Deployment ${deployment.deploymentId.substring(0, 8)}... ${data.status === 'success' ? 'completed successfully' : 'failed'} in ${duration}`

      default:
        return `Deployment ${deployment.deploymentId.substring(0, 8)}... update`
    }
  }

  /**
   * Get active deployments
   */
  async getActiveDeployments(instanceId?: string): Promise<DeploymentStatus[]> {
    const supabase = await this.getSupabase()

    let query = supabase
      .from('template_deployments')
      .select('*')
      .in('status', ['pending', 'in_progress'])

    if (instanceId) {
      query = query.eq('instance_id', instanceId)
    }

    const { data: deployments, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get active deployments: ${error.message}`)
    }

    return (deployments || []).map((d: any) => ({
      deploymentId: d.id,
      status: d.status,
      progress: d.progress,
      currentStep: d.current_step,
      errorMessage: d.error_message,
      startedAt: d.started_at,
      completedAt: d.completed_at,
      durationSeconds: d.duration_seconds,
    }))
  }

  /**
   * Get deployment history
   */
  async getDeploymentHistory(filters?: {
    instanceId?: string
    templateType?: string
    status?: string
    limit?: number
    offset?: number
  }): Promise<DeploymentStatus[]> {
    const supabase = await this.getSupabase()

    let query = supabase.from('template_deployments').select('*')

    if (filters?.instanceId) {
      query = query.eq('instance_id', filters.instanceId)
    }

    if (filters?.templateType) {
      query = query.eq('template_type', filters.templateType)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    query = query.order('created_at', { ascending: false })

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1)
    }

    const { data: deployments, error } = await query

    if (error) {
      throw new Error(`Failed to get deployment history: ${error.message}`)
    }

    return (deployments || []).map((d: any) => ({
      deploymentId: d.id,
      status: d.status,
      progress: d.progress,
      currentStep: d.current_step,
      errorMessage: d.error_message,
      startedAt: d.started_at,
      completedAt: d.completed_at,
      durationSeconds: d.duration_seconds,
    }))
  }

  /**
   * Get error summary for a deployment
   */
  async getErrorSummary(deploymentId: string): Promise<{
    errorCount: number
    warningCount: number
    errors: DeploymentLog[]
    warnings: DeploymentLog[]
  }> {
    const logs = await this.getDeploymentLogs(deploymentId)

    const errors = logs.filter(log => log.level === 'error')
    const warnings = logs.filter(log => log.level === 'warning')

    return {
      errorCount: errors.length,
      warningCount: warnings.length,
      errors: errors.slice(0, 10), // Last 10 errors
      warnings: warnings.slice(0, 10), // Last 10 warnings
    }
  }
}

// Singleton instance
let deploymentMonitoringServiceInstance: DeploymentMonitoringService | null = null

export function getDeploymentMonitoringService(): DeploymentMonitoringService {
  if (!deploymentMonitoringServiceInstance) {
    deploymentMonitoringServiceInstance = new DeploymentMonitoringService()
  }
  return deploymentMonitoringServiceInstance
}
