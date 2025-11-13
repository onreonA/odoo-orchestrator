/**
 * Odoo.sh API Client
 *
 * Client for interacting with Odoo.sh REST API.
 * Handles instance management, backups, deployments, and monitoring.
 *
 * API Documentation: https://www.odoo.com/documentation/saas-17.0/developer/reference/odoo_sh_api.html
 */

export interface OdooShAPIConfig {
  apiToken: string
  baseUrl?: string // Default: https://www.odoo.sh/api/v1
}

export interface CreateInstanceRequest {
  name: string // Instance name (subdomain)
  database: string
  version: string // '17.0', '16.0', etc.
  subscription_tier?: 'starter' | 'growth' | 'enterprise'
  region?: string // 'eu', 'us', 'asia'
}

export interface InstanceInfo {
  id: string
  name: string
  url: string // https://<name>.odoo.sh
  database: string
  version: string
  status: 'active' | 'inactive' | 'suspended' | 'maintenance'
  subscription_id: string
  subscription_tier: string
  git_repository_url: string
  git_branch: string
  git_commit_hash: string
  created_at: string
  updated_at: string
}

export interface BackupInfo {
  id: string
  instance_id: string
  type: 'manual' | 'automatic'
  size_mb: number
  status: 'creating' | 'completed' | 'failed'
  download_url?: string
  created_at: string
}

export interface DeploymentInfo {
  id: string
  instance_id: string
  branch: string
  commit_hash: string
  status: 'pending' | 'deploying' | 'success' | 'failed'
  logs?: string[]
  created_at: string
  completed_at?: string
}

export class OdooShAPIClient {
  private apiToken: string
  private baseUrl: string

  constructor(config: OdooShAPIConfig) {
    this.apiToken = config.apiToken
    this.baseUrl = config.baseUrl || 'https://www.odoo.sh/api/v1'
  }

  /**
   * Create a new Odoo.sh instance
   */
  async createInstance(request: CreateInstanceRequest): Promise<InstanceInfo> {
    const response = await this.request('POST', '/instances', request)
    return response.data
  }

  /**
   * Get instance information
   */
  async getInstance(instanceId: string): Promise<InstanceInfo> {
    const response = await this.request('GET', `/instances/${instanceId}`)
    return response.data
  }

  /**
   * List all instances
   */
  async listInstances(): Promise<InstanceInfo[]> {
    const response = await this.request('GET', '/instances')
    return response.data
  }

  /**
   * Update instance (suspend, resume, etc.)
   */
  async updateInstance(instanceId: string, updates: Partial<InstanceInfo>): Promise<InstanceInfo> {
    const response = await this.request('PATCH', `/instances/${instanceId}`, updates)
    return response.data
  }

  /**
   * Delete instance
   */
  async deleteInstance(instanceId: string): Promise<void> {
    await this.request('DELETE', `/instances/${instanceId}`)
  }

  /**
   * Suspend instance
   */
  async suspendInstance(instanceId: string): Promise<InstanceInfo> {
    return await this.updateInstance(instanceId, { status: 'suspended' })
  }

  /**
   * Resume instance
   */
  async resumeInstance(instanceId: string): Promise<InstanceInfo> {
    return await this.updateInstance(instanceId, { status: 'active' })
  }

  /**
   * Create a backup
   */
  async createBackup(
    instanceId: string,
    type: 'manual' | 'automatic' = 'manual'
  ): Promise<BackupInfo> {
    const response = await this.request('POST', `/instances/${instanceId}/backups`, { type })
    return response.data
  }

  /**
   * List backups for an instance
   */
  async listBackups(instanceId: string): Promise<BackupInfo[]> {
    const response = await this.request('GET', `/instances/${instanceId}/backups`)
    return response.data
  }

  /**
   * Get backup information
   */
  async getBackup(instanceId: string, backupId: string): Promise<BackupInfo> {
    const response = await this.request('GET', `/instances/${instanceId}/backups/${backupId}`)
    return response.data
  }

  /**
   * Restore from backup
   */
  async restoreBackup(instanceId: string, backupId: string): Promise<void> {
    await this.request('POST', `/instances/${instanceId}/backups/${backupId}/restore`)
  }

  /**
   * Get backup download URL
   */
  async getBackupDownloadUrl(instanceId: string, backupId: string): Promise<string> {
    const response = await this.request(
      'GET',
      `/instances/${instanceId}/backups/${backupId}/download`
    )
    return response.data.download_url
  }

  /**
   * Deploy to instance (Git push)
   * Note: Odoo.sh automatically deploys when you push to the Git repository
   * This endpoint triggers a manual deployment or checks deployment status
   */
  async deployToInstance(
    instanceId: string,
    branch: string = 'master',
    commitHash?: string
  ): Promise<DeploymentInfo> {
    const response = await this.request('POST', `/instances/${instanceId}/deployments`, {
      branch,
      commit_hash: commitHash,
    })
    return response.data
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(instanceId: string, deploymentId: string): Promise<DeploymentInfo> {
    const response = await this.request(
      'GET',
      `/instances/${instanceId}/deployments/${deploymentId}`
    )
    return response.data
  }

  /**
   * List deployments for an instance
   */
  async listDeployments(instanceId: string): Promise<DeploymentInfo[]> {
    const response = await this.request('GET', `/instances/${instanceId}/deployments`)
    return response.data
  }

  /**
   * Get instance health status
   */
  async getInstanceHealth(instanceId: string): Promise<{
    status: 'healthy' | 'unhealthy' | 'degraded'
    uptime: number
    response_time_ms: number
    last_check: string
  }> {
    const response = await this.request('GET', `/instances/${instanceId}/health`)
    return response.data
  }

  /**
   * Get instance metrics
   */
  async getInstanceMetrics(
    instanceId: string,
    period: 'hour' | 'day' | 'week' = 'day'
  ): Promise<{
    cpu_usage: number[]
    memory_usage: number[]
    disk_usage: number[]
    request_count: number[]
    error_count: number[]
    timestamps: string[]
  }> {
    const response = await this.request('GET', `/instances/${instanceId}/metrics`, {
      period,
    })
    return response.data
  }

  /**
   * Get instance logs
   */
  async getInstanceLogs(
    instanceId: string,
    options?: {
      level?: 'info' | 'warning' | 'error'
      limit?: number
      since?: string // ISO timestamp
    }
  ): Promise<
    Array<{
      level: string
      message: string
      timestamp: string
      source: string
    }>
  > {
    const response = await this.request('GET', `/instances/${instanceId}/logs`, options)
    return response.data
  }

  /**
   * Make HTTP request to Odoo.sh API
   */
  private async request(method: string, endpoint: string, data?: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`

    const headers: HeadersInit = {
      Authorization: `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }

    const options: RequestInit = {
      method,
      headers,
    }

    if (data && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      options.body = JSON.stringify(data)
    }

    try {
      const response = await fetch(url, options)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          `Odoo.sh API error: ${response.status} ${response.statusText}. ${errorData.message || ''}`
        )
      }

      return await response.json()
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error(`Request failed: ${error}`)
    }
  }
}
