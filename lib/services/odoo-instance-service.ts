/**
 * Odoo Instance Management Service
 *
 * Manages Odoo.sh instances:
 * - Create, update, delete instances
 * - Health checks
 * - Backup and restore
 * - Metrics and monitoring
 *
 * Uses Odoo.sh API for instance management and XML-RPC for Odoo operations.
 */

import { createClient } from '@/lib/supabase/server'
import {
  OdooShAPIClient,
  CreateInstanceRequest,
  InstanceInfo,
  BackupInfo,
} from '@/lib/odoo/odoo-sh-api-client'
import { OdooXMLRPCClient } from '@/lib/odoo/xmlrpc-client'
import { getEncryptionService } from './encryption-service'

export interface InstanceConfig {
  deploymentMethod: 'odoo_com' | 'odoo_sh' | 'docker' | 'manual'
  instanceName: string // Subdomain name (e.g., 'aeka-mobilya')
  databaseName: string
  version: string // '17.0', '16.0', etc.
  adminUsername: string
  adminPassword: string

  // Odoo.sh specific (only if deploymentMethod === 'odoo_sh')
  subscriptionTier?: 'starter' | 'growth' | 'enterprise'
  region?: 'eu' | 'us' | 'asia'

  // Odoo.com specific (only if deploymentMethod === 'odoo_com')
  odooComAccountId?: string
  odooComSubdomain?: string
}

export interface Instance {
  id: string
  company_id: string
  instance_id?: string // Only for odoo_sh
  instance_name: string
  instance_url: string
  database_name: string
  version: string
  status: 'active' | 'inactive' | 'suspended' | 'error' | 'deploying' | 'maintenance'
  deployment_method: 'odoo_com' | 'odoo_sh' | 'docker' | 'manual'

  // Odoo.sh specific
  subscription_id?: string
  subscription_tier?: string
  git_repository_url?: string
  git_branch?: string
  git_commit_hash?: string

  // Odoo.com specific
  odoo_com_account_id?: string
  odoo_com_subdomain?: string

  // Migration info
  migrated_from?: string
  migrated_at?: string

  created_at: string
  updated_at: string
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded'
  uptime: number
  response_time_ms: number
  last_check: string
  details?: any
}

export interface Metrics {
  cpu_usage: number[]
  memory_usage: number[]
  disk_usage: number[]
  request_count: number[]
  error_count: number[]
  timestamps: string[]
}

export interface Backup {
  id: string
  instance_id: string
  backup_id: string
  backup_type: 'manual' | 'automatic' | 'pre_deployment'
  size_mb?: number
  status: 'creating' | 'completed' | 'failed' | 'downloading'
  download_url?: string
  created_at: string
  completed_at?: string
}

export class OdooInstanceService {
  private supabase: any
  private encryptionService: ReturnType<typeof getEncryptionService>

  constructor() {
    this.encryptionService = getEncryptionService()
  }

  /**
   * Get Supabase client
   */
  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createClient()
    }
    return this.supabase
  }

  /**
   * Get Odoo.sh API client (only for odoo_sh instances)
   */
  private async getOdooShClient(): Promise<OdooShAPIClient> {
    const apiToken = process.env.ODOO_SH_API_TOKEN
    if (!apiToken) {
      throw new Error('ODOO_SH_API_TOKEN environment variable is required for Odoo.sh operations')
    }

    return new OdooShAPIClient({
      apiToken,
      baseUrl: process.env.ODOO_SH_API_BASE_URL,
    })
  }

  /**
   * Create a new Odoo instance (supports both odoo.com and odoo.sh)
   */
  async createInstance(
    companyId: string,
    config: InstanceConfig,
    deployedBy: string
  ): Promise<Instance> {
    const supabase = await this.getSupabase()

    try {
      // Encrypt credentials
      const encryptedCredentials = this.encryptionService.encryptOdooCredentials({
        username: config.adminUsername,
        password: config.adminPassword,
      })

      let instanceData: any = {
        company_id: companyId,
        instance_name: config.instanceName,
        database_name: config.databaseName,
        version: config.version,
        admin_username: encryptedCredentials.username,
        admin_password_encrypted: encryptedCredentials.password_encrypted,
        deployment_method: config.deploymentMethod,
        deployed_by: deployedBy,
        deployed_at: new Date().toISOString(),
        status: 'active',
      }

      // Handle different deployment methods
      if (config.deploymentMethod === 'odoo_sh') {
        // Odoo.sh: Create via API
        const odooShClient = await this.getOdooShClient()

        const createRequest: CreateInstanceRequest = {
          name: config.instanceName,
          database: config.databaseName,
          version: config.version,
          subscription_tier: config.subscriptionTier || 'starter',
          region: config.region || 'eu',
        }

        const instanceInfo = await odooShClient.createInstance(createRequest)

        // Encrypt API token
        const encryptedApiToken = this.encryptionService.encryptOdooShToken(
          process.env.ODOO_SH_API_TOKEN!
        )

        instanceData = {
          ...instanceData,
          instance_id: instanceInfo.id,
          instance_url: instanceInfo.url,
          odoo_sh_api_token_encrypted: encryptedApiToken,
          subscription_id: instanceInfo.subscription_id,
          subscription_tier: instanceInfo.subscription_tier,
          git_repository_url: instanceInfo.git_repository_url,
          git_branch: instanceInfo.git_branch || 'master',
          git_commit_hash: instanceInfo.git_commit_hash,
          status: instanceInfo.status,
        }
      } else if (config.deploymentMethod === 'odoo_com') {
        // Odoo.com: Manual setup (just save the info)
        // URL format: https://<subdomain>.odoo.com
        const subdomain = config.odooComSubdomain || config.instanceName
        instanceData = {
          ...instanceData,
          instance_url: `https://${subdomain}.odoo.com`,
          odoo_com_account_id: config.odooComAccountId,
          odoo_com_subdomain: subdomain,
          status: 'active', // Assume active for manual setup
        }
      } else {
        // Docker or manual: Just save basic info
        instanceData = {
          ...instanceData,
          instance_url: config.instanceName.startsWith('http')
            ? config.instanceName
            : `https://${config.instanceName}`,
          status: 'active',
        }
      }

      // Save to database
      const { data, error } = await supabase
        .from('odoo_instances')
        .insert(instanceData)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to save instance to database: ${error.message}`)
      }

      return this.mapToInstance(data)
    } catch (error) {
      throw new Error(
        `Failed to create instance: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Get instance information
   */
  async getInstanceInfo(companyId: string): Promise<Instance | null> {
    const supabase = await this.getSupabase()

    const { data, error } = await supabase
      .from('odoo_instances')
      .select('*')
      .eq('company_id', companyId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null
      }
      throw new Error(`Failed to get instance: ${error.message}`)
    }

    return data ? this.mapToInstance(data) : null
  }

  /**
   * Get all instances (for super admins)
   */
  async getAllInstances(): Promise<Instance[]> {
    const supabase = await this.getSupabase()

    const { data, error } = await supabase
      .from('odoo_instances')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get instances: ${error.message}`)
    }

    return (data || []).map(d => this.mapToInstance(d))
  }

  /**
   * Get instance by ID
   */
  async getInstanceById(instanceId: string): Promise<Instance | null> {
    const supabase = await this.getSupabase()

    const { data, error } = await supabase
      .from('odoo_instances')
      .select('*')
      .eq('id', instanceId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get instance: ${error.message}`)
    }

    return data ? this.mapToInstance(data) : null
  }

  /**
   * Update instance
   */
  async updateInstance(instanceId: string, updates: Partial<Instance>): Promise<Instance> {
    const supabase = await this.getSupabase()
    const instance = await this.getInstanceById(instanceId)

    if (!instance) {
      throw new Error('Instance not found')
    }

    // Update via Odoo.sh API if needed (only for odoo_sh instances)
    if (instance.deployment_method === 'odoo_sh' && instance.instance_id) {
      if (updates.status && updates.status !== instance.status) {
        try {
          const odooShClient = await this.getOdooShClient()

          if (updates.status === 'suspended') {
            await odooShClient.suspendInstance(instance.instance_id)
          } else if (updates.status === 'active' && instance.status === 'suspended') {
            await odooShClient.resumeInstance(instance.instance_id)
          }
        } catch (error) {
          // Log error but continue with database update
          console.error('Failed to update instance via Odoo.sh API:', error)
        }
      }
    }

    // Update database
    const { data, error } = await supabase
      .from('odoo_instances')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', instanceId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update instance: ${error.message}`)
    }

    return this.mapToInstance(data)
  }

  /**
   * Delete instance
   */
  async deleteInstance(instanceId: string): Promise<boolean> {
    const supabase = await this.getSupabase()
    const instance = await this.getInstanceById(instanceId)

    if (!instance) {
      throw new Error('Instance not found')
    }

    try {
      // Delete via Odoo.sh API if it's an odoo_sh instance
      if (instance.deployment_method === 'odoo_sh' && instance.instance_id) {
        try {
          const odooShClient = await this.getOdooShClient()
          await odooShClient.deleteInstance(instance.instance_id)
        } catch (error) {
          // Log error but continue with database deletion
          console.error('Failed to delete instance via Odoo.sh API:', error)
        }
      }

      // For odoo.com instances, we just delete from database
      // (actual instance deletion must be done manually on odoo.com)

      // Delete from database (CASCADE will handle related records)
      const { error } = await supabase.from('odoo_instances').delete().eq('id', instanceId)

      if (error) {
        throw new Error(`Failed to delete instance from database: ${error.message}`)
      }

      return true
    } catch (error) {
      throw new Error(
        `Failed to delete instance: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Check instance health (works for both odoo.com and odoo.sh)
   */
  async checkHealth(instanceId: string): Promise<HealthStatus> {
    const instance = await this.getInstanceById(instanceId)
    if (!instance) {
      throw new Error('Instance not found')
    }

    const supabase = await this.getSupabase()

    try {
      let healthStatus: HealthStatus

      if (instance.deployment_method === 'odoo_sh' && instance.instance_id) {
        // Odoo.sh: Get health from API
        try {
          const odooShClient = await this.getOdooShClient()
          const health = await odooShClient.getInstanceHealth(instance.instance_id)

          // Also test XML-RPC connection
          const xmlrpcClient = await this.getXMLRPCClient(instance)
          const xmlrpcHealthy = await xmlrpcClient.testConnection()

          healthStatus = {
            status: health.status === 'healthy' && xmlrpcHealthy ? 'healthy' : 'degraded',
            uptime: health.uptime,
            response_time_ms: health.response_time_ms,
            last_check: new Date().toISOString(),
            details: {
              odoo_sh_status: health.status,
              xmlrpc_connected: xmlrpcHealthy,
            },
          }
        } catch (error) {
          // Fallback to XML-RPC only check
          const xmlrpcClient = await this.getXMLRPCClient(instance)
          const xmlrpcHealthy = await xmlrpcClient.testConnection()

          healthStatus = {
            status: xmlrpcHealthy ? 'degraded' : 'unhealthy',
            uptime: 0,
            response_time_ms: 0,
            last_check: new Date().toISOString(),
            details: {
              odoo_sh_api_error: error instanceof Error ? error.message : 'Unknown error',
              xmlrpc_connected: xmlrpcHealthy,
            },
          }
        }
      } else {
        // Odoo.com or other: Only test XML-RPC connection
        const xmlrpcClient = await this.getXMLRPCClient(instance)
        const xmlrpcHealthy = await xmlrpcClient.testConnection()

        // Measure response time
        const startTime = Date.now()
        try {
          await xmlrpcClient.getVersion()
          const responseTime = Date.now() - startTime

          healthStatus = {
            status: xmlrpcHealthy ? 'healthy' : 'unhealthy',
            uptime: 0, // Not available for odoo.com
            response_time_ms: responseTime,
            last_check: new Date().toISOString(),
            details: {
              xmlrpc_connected: xmlrpcHealthy,
              deployment_method: instance.deployment_method,
            },
          }
        } catch (error) {
          healthStatus = {
            status: 'unhealthy',
            uptime: 0,
            response_time_ms: Date.now() - startTime,
            last_check: new Date().toISOString(),
            details: {
              xmlrpc_error: error instanceof Error ? error.message : 'Unknown error',
              deployment_method: instance.deployment_method,
            },
          }
        }
      }

      // Update database
      await supabase
        .from('odoo_instances')
        .update({
          health_status: healthStatus,
          last_health_check: new Date().toISOString(),
          status: healthStatus.status === 'healthy' ? 'active' : instance.status,
        })
        .eq('id', instanceId)

      return healthStatus
    } catch (error) {
      const healthStatus: HealthStatus = {
        status: 'unhealthy',
        uptime: 0,
        response_time_ms: 0,
        last_check: new Date().toISOString(),
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }

      // Update database
      await supabase
        .from('odoo_instances')
        .update({
          health_status: healthStatus,
          last_health_check: new Date().toISOString(),
          status: 'error',
        })
        .eq('id', instanceId)

      return healthStatus
    }
  }

  /**
   * Get instance metrics (only for odoo_sh instances)
   */
  async getMetrics(
    instanceId: string,
    period: 'hour' | 'day' | 'week' = 'day'
  ): Promise<Metrics | null> {
    const instance = await this.getInstanceById(instanceId)
    if (!instance) {
      throw new Error('Instance not found')
    }

    // Metrics only available for odoo.sh instances
    if (instance.deployment_method !== 'odoo_sh' || !instance.instance_id) {
      return null
    }

    try {
      const odooShClient = await this.getOdooShClient()
      return await odooShClient.getInstanceMetrics(instance.instance_id, period)
    } catch (error) {
      console.error('Failed to get metrics:', error)
      return null
    }
  }

  /**
   * Create backup (works for both odoo.com and odoo.sh)
   */
  async createBackup(
    instanceId: string,
    type: 'manual' | 'automatic' | 'pre_deployment' = 'manual',
    createdBy?: string
  ): Promise<Backup> {
    const instance = await this.getInstanceById(instanceId)
    if (!instance) {
      throw new Error('Instance not found')
    }

    const supabase = await this.getSupabase()

    try {
      let backupData: any = {
        instance_id: instanceId,
        backup_type: type,
        created_by: createdBy,
        created_at: new Date().toISOString(),
        status: 'creating',
      }

      if (instance.deployment_method === 'odoo_sh' && instance.instance_id) {
        // Odoo.sh: Create backup via API
        const odooShClient = await this.getOdooShClient()
        const backupInfo = await odooShClient.createBackup(
          instance.instance_id,
          type === 'pre_deployment' ? 'manual' : type
        )

        backupData = {
          ...backupData,
          backup_id: backupInfo.id,
          size_mb: backupInfo.size_mb,
          status: backupInfo.status,
        }
      } else {
        // Odoo.com or other: Manual backup (user must create backup manually)
        // We just record that a backup was requested
        backupData = {
          ...backupData,
          backup_id: `manual-${Date.now()}`,
          status: 'completed', // Mark as completed since it's manual
          storage_path: 'manual_backup', // Placeholder
        }
      }

      // Save to database
      const { data, error } = await supabase
        .from('odoo_instance_backups')
        .insert(backupData)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to save backup to database: ${error.message}`)
      }

      return this.mapToBackup(data)
    } catch (error) {
      throw new Error(
        `Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * List backups
   */
  async listBackups(instanceId: string): Promise<Backup[]> {
    const instance = await this.getInstanceById(instanceId)
    if (!instance) {
      throw new Error('Instance not found')
    }

    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('odoo_instance_backups')
      .select('*')
      .eq('instance_id', instanceId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to list backups: ${error.message}`)
    }

    return data.map(this.mapToBackup)
  }

  /**
   * Restore from backup (works for both odoo.com and odoo.sh)
   */
  async restoreBackup(instanceId: string, backupId: string): Promise<boolean> {
    const instance = await this.getInstanceById(instanceId)
    if (!instance) {
      throw new Error('Instance not found')
    }

    const supabase = await this.getSupabase()
    const { data: backupData } = await supabase
      .from('odoo_instance_backups')
      .select('backup_id, backup_type')
      .eq('id', backupId)
      .eq('instance_id', instanceId)
      .single()

    if (!backupData) {
      throw new Error('Backup not found')
    }

    try {
      if (
        instance.deployment_method === 'odoo_sh' &&
        instance.instance_id &&
        backupData.backup_id
      ) {
        // Odoo.sh: Restore via API
        const odooShClient = await this.getOdooShClient()
        await odooShClient.restoreBackup(instance.instance_id, backupData.backup_id)
        return true
      } else {
        // Odoo.com or other: Manual restore required
        // We just record that restore was requested
        throw new Error(
          'Restore must be done manually for odoo.com instances. Please restore backup manually on odoo.com.'
        )
      }
    } catch (error) {
      throw new Error(
        `Failed to restore backup: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Get XML-RPC client for an instance
   */
  async getXMLRPCClient(instance: Instance): Promise<OdooXMLRPCClient> {
    // Get raw data from database to access encrypted fields
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('odoo_instances')
      .select('admin_username, admin_password_encrypted')
      .eq('id', instance.id)
      .single()

    if (error || !data) {
      throw new Error('Failed to get instance credentials')
    }

    const credentials = this.encryptionService.decryptOdooCredentials({
      username: data.admin_username,
      password_encrypted: data.admin_password_encrypted,
    })

    return new OdooXMLRPCClient({
      url: instance.instance_url,
      database: instance.database_name,
      username: credentials.username,
      password: credentials.password,
    })
  }

  /**
   * Get connection for an instance (helper method)
   */
  async getConnection(companyId: string): Promise<OdooXMLRPCClient> {
    const instance = await this.getInstanceInfo(companyId)
    if (!instance) {
      throw new Error('Instance not found for company')
    }

    return await this.getXMLRPCClient(instance)
  }

  /**
   * Map database record to Instance
   */
  private mapToInstance(data: any): Instance {
    return {
      id: data.id,
      company_id: data.company_id,
      instance_id: data.instance_id || undefined,
      instance_name: data.instance_name,
      instance_url: data.instance_url,
      database_name: data.database_name,
      version: data.version,
      status: data.status,
      deployment_method: data.deployment_method || 'odoo_com',
      subscription_id: data.subscription_id || undefined,
      subscription_tier: data.subscription_tier || undefined,
      git_repository_url: data.git_repository_url || undefined,
      git_branch: data.git_branch || undefined,
      git_commit_hash: data.git_commit_hash || undefined,
      odoo_com_account_id: data.odoo_com_account_id || undefined,
      odoo_com_subdomain: data.odoo_com_subdomain || undefined,
      migrated_from: data.migrated_from || undefined,
      migrated_at: data.migrated_at || undefined,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
  }

  /**
   * Map database record to Backup
   */
  private mapToBackup(data: any): Backup {
    return {
      id: data.id,
      instance_id: data.instance_id,
      backup_id: data.backup_id,
      backup_type: data.backup_type,
      size_mb: data.size_mb,
      status: data.status,
      download_url: data.download_url,
      created_at: data.created_at,
      completed_at: data.completed_at,
    }
  }
}

// Singleton instance
let instanceServiceInstance: OdooInstanceService | null = null

/**
 * Get instance service (singleton)
 */
export function getOdooInstanceService(): OdooInstanceService {
  if (!instanceServiceInstance) {
    instanceServiceInstance = new OdooInstanceService()
  }
  return instanceServiceInstance
}
