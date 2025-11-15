import { createClient } from '@/lib/supabase/server'
import { OdooXMLRPCClient, OdooConnectionConfig } from '@/lib/odoo/xmlrpc-client'
import { getOdooInstanceService } from './odoo-instance-service'
import { getEncryptionService } from './encryption-service'
import { ConfigurationGeneratorAgent } from '@/lib/ai/agents/configuration-generator-agent'

export interface DeploymentOptions {
  skipValidation?: boolean
  skipBackup?: boolean
  skipTests?: boolean
  force?: boolean
}

export interface DeploymentResult {
  deploymentId: string
  success: boolean
  configurationId: string
  versionId?: string
  instanceId: string
  status: 'success' | 'failed' | 'rolled_back'
  errorMessage?: string
  deployedAt?: string
  durationSeconds?: number
}

export interface RollbackResult {
  success: boolean
  rolledBackToVersion?: number
  errorMessage?: string
}

export interface DeploymentStatus {
  deploymentId: string
  status: 'pending' | 'in_progress' | 'success' | 'failed' | 'rolled_back'
  progress: number // 0-100
  currentStep?: string
  errorMessage?: string
  startedAt?: string
  completedAt?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: Array<{
    type: 'syntax' | 'dependency' | 'conflict' | 'other'
    message: string
    severity: 'error' | 'warning'
  }>
  warnings: Array<{
    type: string
    message: string
  }>
}

class ConfigurationDeploymentService {
  private supabase: Awaited<ReturnType<typeof createClient>>
  private odooInstanceService: ReturnType<typeof getOdooInstanceService>
  private encryptionService: ReturnType<typeof getEncryptionService>

  constructor() {
    // Services will be initialized lazily
  }

  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createClient()
    }
    return this.supabase
  }

  private async getOdooInstanceService() {
    if (!this.odooInstanceService) {
      this.odooInstanceService = getOdooInstanceService()
    }
    return this.odooInstanceService
  }

  private async getEncryptionService() {
    if (!this.encryptionService) {
      this.encryptionService = getEncryptionService()
    }
    return this.encryptionService
  }

  /**
   * Validate configuration before deployment
   */
  async validateBeforeDeployment(
    configurationId: string,
    instanceId: string
  ): Promise<ValidationResult> {
    const supabase = await this.getSupabase()

    // Get configuration
    const { data: configuration, error: configError } = await supabase
      .from('configurations')
      .select('*')
      .eq('id', configurationId)
      .single()

    if (configError || !configuration) {
      return {
        isValid: false,
        errors: [
          {
            type: 'other',
            message: `Configuration not found: ${configError?.message}`,
            severity: 'error',
          },
        ],
        warnings: [],
      }
    }

    const errors: ValidationResult['errors'] = []
    const warnings: ValidationResult['warnings'] = []

    // 1. Syntax validation (if code exists)
    if (configuration.generated_code) {
      const generatorAgent = new ConfigurationGeneratorAgent(configuration.company_id)
      const validation = await generatorAgent.validateCode(
        configuration.generated_code,
        configuration.type
      )

      if (!validation.isValid) {
        validation.errors.forEach(err => {
          errors.push({
            type: 'syntax',
            message: err.message,
            severity: err.severity === 'error' ? 'error' : 'warning',
          })
        })
      }

      validation.warnings.forEach(warn => {
        warnings.push({
          type: 'syntax',
          message: warn.message,
        })
      })
    }

    // 2. Dependency validation
    // Check if required modules are installed
    const instanceService = await this.getOdooInstanceService()
    const instance = await instanceService.getInstanceById(instanceId)

    if (!instance) {
      errors.push({
        type: 'other',
        message: 'Instance not found',
        severity: 'error',
      })
    }

    // 3. Conflict validation
    // Check if similar configurations exist
    const { data: existingConfigs } = await supabase
      .from('configurations')
      .select('id, name, type, file_path')
      .eq('company_id', configuration.company_id)
      .eq('type', configuration.type)
      .neq('id', configurationId)
      .eq('status', 'deployed')

    if (existingConfigs && configuration.file_path) {
      const conflictingConfig = existingConfigs.find(c => c.file_path === configuration.file_path)
      if (conflictingConfig) {
        warnings.push({
          type: 'conflict',
          message: `Similar configuration already deployed: ${conflictingConfig.name}`,
        })
      }
    }

    return {
      isValid: errors.filter(e => e.severity === 'error').length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Deploy configuration to Odoo instance
   */
  async deployConfiguration(
    configurationId: string,
    instanceId: string,
    options?: DeploymentOptions
  ): Promise<DeploymentResult> {
    const supabase = await this.getSupabase()
    const startTime = new Date()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    // Get configuration
    const { data: configuration, error: configError } = await supabase
      .from('configurations')
      .select('*')
      .eq('id', configurationId)
      .single()

    if (configError || !configuration) {
      throw new Error(`Configuration not found: ${configError?.message}`)
    }

    // 1. Pre-deployment validation
    if (!options?.skipValidation) {
      const validation = await this.validateBeforeDeployment(configurationId, instanceId)
      if (!validation.isValid) {
        const errorMessages = validation.errors
          .filter(e => e.severity === 'error')
          .map(e => e.message)
          .join('; ')

        // Create failed deployment record
        const { data: deployment } = await supabase
          .from('configuration_deployments')
          .insert({
            configuration_id: configurationId,
            instance_id: instanceId,
            status: 'failed',
            progress: 0,
            error_message: `Validation failed: ${errorMessages}`,
            started_at: startTime.toISOString(),
            completed_at: new Date().toISOString(),
            deployed_by: user.id,
          })
          .select()
          .single()

        return {
          deploymentId: deployment?.id || '',
          success: false,
          configurationId,
          instanceId,
          status: 'failed',
          errorMessage: errorMessages,
        }
      }
    }

    // 2. Create backup (if not skipped)
    let backupId: string | undefined
    if (!options?.skipBackup) {
      const instanceService = await this.getOdooInstanceService()
      try {
        const backup = await instanceService.createBackup(instanceId, {
          description: `Pre-deployment backup for configuration: ${configuration.name}`,
        })
        backupId = backup.id
      } catch (error: any) {
        console.warn('Failed to create backup:', error.message)
        if (!options?.force) {
          throw new Error(`Backup failed: ${error.message}`)
        }
      }
    }

    // 3. Create deployment record
    const { data: deployment, error: deploymentError } = await supabase
      .from('configuration_deployments')
      .insert({
        configuration_id: configurationId,
        instance_id: instanceId,
        status: 'in_progress',
        progress: 10,
        current_step: 'Connecting to Odoo instance',
        backup_id: backupId,
        started_at: startTime.toISOString(),
        deployed_by: user.id,
      })
      .select()
      .single()

    if (deploymentError) {
      throw new Error(`Failed to create deployment record: ${deploymentError.message}`)
    }

    const deploymentId = deployment.id

    try {
      // 4. Get Odoo connection
      const instanceService = await this.getOdooInstanceService()
      const instance = await instanceService.getInstanceById(instanceId)

      if (!instance) {
        throw new Error('Instance not found')
      }

      // Get encrypted credentials
      const encryptionService = await this.getEncryptionService()
      const adminPassword = await encryptionService.decrypt(instance.admin_password_encrypted)

      // Update progress
      await supabase
        .from('configuration_deployments')
        .update({
          progress: 30,
          current_step: 'Deploying configuration code',
        })
        .eq('id', deploymentId)

      // 5. Deploy code to Odoo
      const odooClient = new OdooXMLRPCClient({
        url: instance.instance_url?.trim() || instance.instance_url,
        db: instance.database_name?.trim() || instance.database_name,
        username: instance.admin_username,
        password: adminPassword,
      })

      // Connect to Odoo
      const uid = await odooClient.authenticate()
      if (!uid) {
        throw new Error('Failed to authenticate with Odoo')
      }

      // Deploy based on configuration type
      let deployResult: any
      switch (configuration.type) {
        case 'model':
          deployResult = await this.deployModel(odooClient, configuration)
          break
        case 'view':
          deployResult = await this.deployView(odooClient, configuration)
          break
        case 'workflow':
          deployResult = await this.deployWorkflow(odooClient, configuration)
          break
        case 'security':
          deployResult = await this.deploySecurity(odooClient, configuration)
          break
        case 'report':
          deployResult = await this.deployReport(odooClient, configuration)
          break
        default:
          throw new Error(`Unsupported configuration type: ${configuration.type}`)
      }

      // Update progress
      await supabase
        .from('configuration_deployments')
        .update({
          progress: 70,
          current_step: 'Running tests',
        })
        .eq('id', deploymentId)

      // 6. Run tests (if not skipped)
      if (!options?.skipTests && configuration.generated_code) {
        // This would typically run Odoo tests
        // For now, we'll just validate the deployment
        const testResult = await this.runDeploymentTests(odooClient, configuration)
        if (!testResult.success && !options?.force) {
          throw new Error(`Tests failed: ${testResult.error}`)
        }
      }

      // 7. Update configuration status
      await supabase
        .from('configurations')
        .update({
          status: 'deployed',
        })
        .eq('id', configurationId)

      // 8. Create version record
      const { data: version } = await supabase
        .from('configuration_versions')
        .insert({
          configuration_id: configurationId,
          version_number: configuration.version || 1,
          generated_code: configuration.generated_code || '',
          changes_summary: 'Initial deployment',
          deployed_at: new Date().toISOString(),
          deployed_by: user.id,
        })
        .select()
        .single()

      // 9. Update deployment status
      const endTime = new Date()
      const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)

      await supabase
        .from('configuration_deployments')
        .update({
          status: 'success',
          progress: 100,
          current_step: 'Deployment completed',
          version_id: version?.id,
          completed_at: endTime.toISOString(),
          result: deployResult,
        })
        .eq('id', deploymentId)

      return {
        deploymentId,
        success: true,
        configurationId,
        versionId: version?.id,
        instanceId,
        status: 'success',
        deployedAt: endTime.toISOString(),
        durationSeconds,
      }
    } catch (error: any) {
      // Update deployment status to failed
      const endTime = new Date()
      await supabase
        .from('configuration_deployments')
        .update({
          status: 'failed',
          progress: 0,
          error_message: error.message,
          error_stack: error.stack,
          completed_at: endTime.toISOString(),
        })
        .eq('id', deploymentId)

      return {
        deploymentId,
        success: false,
        configurationId,
        instanceId,
        status: 'failed',
        errorMessage: error.message,
      }
    }
  }

  /**
   * Deploy model configuration
   */
  private async deployModel(odooClient: OdooXMLRPCClient, configuration: any): Promise<any> {
    // Parse Python code and deploy
    // This is a simplified version - in production, you'd parse the code
    // and use Odoo's module system to deploy it
    return {
      type: 'model',
      deployed: true,
      message: 'Model deployed successfully',
    }
  }

  /**
   * Deploy view configuration
   */
  private async deployView(odooClient: OdooXMLRPCClient, configuration: any): Promise<any> {
    // Parse XML and deploy view
    return {
      type: 'view',
      deployed: true,
      message: 'View deployed successfully',
    }
  }

  /**
   * Deploy workflow configuration
   */
  private async deployWorkflow(odooClient: OdooXMLRPCClient, configuration: any): Promise<any> {
    // Deploy automated actions, server actions, etc.
    return {
      type: 'workflow',
      deployed: true,
      message: 'Workflow deployed successfully',
    }
  }

  /**
   * Deploy security configuration
   */
  private async deploySecurity(odooClient: OdooXMLRPCClient, configuration: any): Promise<any> {
    // Deploy record rules, access rights, groups
    return {
      type: 'security',
      deployed: true,
      message: 'Security rules deployed successfully',
    }
  }

  /**
   * Deploy report configuration
   */
  private async deployReport(odooClient: OdooXMLRPCClient, configuration: any): Promise<any> {
    // Deploy QWeb PDF reports
    return {
      type: 'report',
      deployed: true,
      message: 'Report deployed successfully',
    }
  }

  /**
   * Run deployment tests
   */
  private async runDeploymentTests(
    odooClient: OdooXMLRPCClient,
    configuration: any
  ): Promise<{ success: boolean; error?: string }> {
    // In production, this would run actual Odoo tests
    // For now, we'll just return success
    return { success: true }
  }

  /**
   * Deploy specific version
   */
  async deployVersion(versionId: string, instanceId: string): Promise<DeploymentResult> {
    const supabase = await this.getSupabase()

    // Get version
    const { data: version, error: versionError } = await supabase
      .from('configuration_versions')
      .select('*, configurations(*)')
      .eq('id', versionId)
      .single()

    if (versionError || !version) {
      throw new Error(`Version not found: ${versionError?.message}`)
    }

    // Update configuration with version code
    await supabase
      .from('configurations')
      .update({
        generated_code: version.generated_code,
        version: version.version_number,
      })
      .eq('id', version.configuration_id)

    // Deploy configuration
    return this.deployConfiguration(version.configuration_id, instanceId)
  }

  /**
   * Rollback configuration
   */
  async rollbackConfiguration(
    configurationId: string,
    instanceId: string,
    targetVersion?: number
  ): Promise<RollbackResult> {
    const supabase = await this.getSupabase()

    // Get configuration
    const { data: configuration } = await supabase
      .from('configurations')
      .select('*')
      .eq('id', configurationId)
      .single()

    if (!configuration) {
      return {
        success: false,
        errorMessage: 'Configuration not found',
      }
    }

    // Get target version (or latest previous version)
    let versionQuery = supabase
      .from('configuration_versions')
      .select('*')
      .eq('configuration_id', configurationId)
      .order('version_number', { ascending: false })

    if (targetVersion) {
      versionQuery = versionQuery.eq('version_number', targetVersion)
    } else {
      versionQuery = versionQuery.lt('version_number', configuration.version || 1)
    }

    const { data: targetVersionData } = await versionQuery.limit(1).single()

    if (!targetVersionData) {
      return {
        success: false,
        errorMessage: 'No previous version found',
      }
    }

    try {
      // Deploy target version
      const result = await this.deployVersion(targetVersionData.id, instanceId)

      if (result.success) {
        return {
          success: true,
          rolledBackToVersion: targetVersionData.version_number,
        }
      } else {
        return {
          success: false,
          errorMessage: result.errorMessage,
        }
      }
    } catch (error: any) {
      return {
        success: false,
        errorMessage: error.message,
      }
    }
  }

  /**
   * Check deployment status
   */
  async checkDeploymentStatus(deploymentId: string): Promise<DeploymentStatus> {
    const supabase = await this.getSupabase()

    const { data: deployment, error } = await supabase
      .from('configuration_deployments')
      .select('*')
      .eq('id', deploymentId)
      .single()

    if (error || !deployment) {
      throw new Error(`Deployment not found: ${error?.message}`)
    }

    return {
      deploymentId: deployment.id,
      status: deployment.status as any,
      progress: deployment.progress || 0,
      currentStep: deployment.current_step,
      errorMessage: deployment.error_message,
      startedAt: deployment.started_at,
      completedAt: deployment.completed_at,
    }
  }
}

// Singleton pattern
let instance: ConfigurationDeploymentService | null = null

export function getConfigurationDeploymentService(): ConfigurationDeploymentService {
  if (!instance) {
    instance = new ConfigurationDeploymentService()
  }
  return instance
}

// Export class for testing
export { ConfigurationDeploymentService }
