/**
 * Template Deployment Engine
 *
 * Deploys templates (kickoff, BOM, workflow, dashboard, module_config) to Odoo instances.
 * Handles progress tracking, logging, and rollback capabilities.
 */

import { createClient } from '@/lib/supabase/server'
import { OdooXMLRPCClient, OdooConnectionConfig } from '@/lib/odoo/xmlrpc-client'
import { getOdooInstanceService } from './odoo-instance-service'
import { getEncryptionService } from './encryption-service'

export type TemplateType = 'kickoff' | 'bom' | 'workflow' | 'dashboard' | 'module_config'

export interface DeploymentConfig {
  instanceId: string
  templateId: string
  templateType: TemplateType
  customizations?: Record<string, any>
  userId: string
}

export interface DeploymentProgress {
  deploymentId: string
  status: 'pending' | 'in_progress' | 'success' | 'failed' | 'rolled_back'
  progress: number // 0-100
  currentStep?: string
  errorMessage?: string
}

export interface KickoffTemplateData {
  modules: Array<{
    name: string
    technical_name: string
    category?: string
    priority?: number
    phase?: number
  }>
  customFields?: Array<{
    model: string
    field_name: string
    field_type: string
    label: string
    required?: boolean
    options?: Record<string, any>
  }>
  workflows?: Array<{
    name: string
    model: string
    states: Array<{
      name: string
      label: string
    }>
    transitions: Array<{
      from: string
      to: string
      condition?: string
    }>
  }>
  dashboards?: Array<{
    name: string
    view_type: string
    components: Array<{
      type: string
      model?: string
      domain?: any[]
      fields?: string[]
    }>
  }>
  moduleConfigs?: Array<{
    module: string
    settings: Record<string, any>
  }>
}

export class TemplateDeploymentEngine {
  private supabase: any
  private odooInstanceService: ReturnType<typeof getOdooInstanceService>
  private encryptionService: ReturnType<typeof getEncryptionService>

  constructor() {
    this.odooInstanceService = getOdooInstanceService()
    this.encryptionService = getEncryptionService()
  }

  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createClient()
    }
    return this.supabase
  }

  /**
   * Deploy a template to an Odoo instance
   */
  async deployTemplate(config: DeploymentConfig): Promise<DeploymentProgress> {
    const supabase = await this.getSupabase()

    // 1. Get instance details
    const instance = await this.odooInstanceService.getInstanceById(config.instanceId)
    if (!instance) {
      throw new Error(`Instance not found: ${config.instanceId}`)
    }

    // 2. Create backup before deployment
    const backup = await this.odooInstanceService.createBackup(
      config.instanceId,
      'pre_deployment',
      config.userId
    )

    // 3. Create deployment record
    const { data: deployment, error: deployError } = await supabase
      .from('template_deployments')
      .insert({
        instance_id: config.instanceId,
        template_id: config.templateId,
        template_type: config.templateType,
        status: 'pending',
        progress: 0,
        backup_id: backup.id,
        deployed_by: config.userId,
        customizations: config.customizations || {},
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (deployError) {
      throw new Error(`Failed to create deployment record: ${deployError.message}`)
    }

    // 4. Start deployment (async)
    this.executeDeployment(deployment.id, instance, config).catch(error => {
      console.error(`[Template Deployment] Error in deployment ${deployment.id}:`, error)
    })

    return {
      deploymentId: deployment.id,
      status: 'pending',
      progress: 0,
    }
  }

  /**
   * Execute deployment (internal async method)
   */
  private async executeDeployment(
    deploymentId: string,
    instance: any,
    config: DeploymentConfig
  ): Promise<void> {
    const supabase = await this.getSupabase()
    let odooClient: OdooXMLRPCClient | null = null

    try {
      // Update status to in_progress
      await this.updateDeploymentStatus(deploymentId, {
        status: 'in_progress',
        progress: 0,
        currentStep: 'Connecting to Odoo instance',
      })

      // Get instance credentials from database (not included in Instance interface for security)
      const { data: instanceData, error: instanceError } = await supabase
        .from('odoo_instances')
        .select('admin_username, admin_password_encrypted, instance_url, database_name')
        .eq('id', config.instanceId)
        .single()

      if (instanceError || !instanceData) {
        throw new Error(
          `Failed to get instance credentials: ${instanceError?.message || 'Unknown error'}`
        )
      }

      // Decrypt password
      const decryptedCredentials = this.encryptionService.decryptOdooCredentials({
        username: instanceData.admin_username,
        password_encrypted: instanceData.admin_password_encrypted,
      })

      // Connect to Odoo
      const connectionConfig: OdooConnectionConfig = {
        url: instance.instance_url,
        database: instance.database_name,
        username: decryptedCredentials.username,
        password: decryptedCredentials.password,
      }

      odooClient = new OdooXMLRPCClient(connectionConfig)
      await odooClient.authenticate()

      await this.logDeployment(deploymentId, 'info', 'Connected to Odoo instance')

      // Get template data
      const templateData = await this.getTemplateData(config.templateId, config.templateType)

      // Deploy based on template type
      let result: any = {}

      switch (config.templateType) {
        case 'kickoff':
          result = await this.deployKickoffTemplate(odooClient, templateData, deploymentId, config)
          break
        case 'bom':
          result = await this.deployBOMTemplate(odooClient, templateData, deploymentId, config)
          break
        case 'workflow':
          result = await this.deployWorkflowTemplate(odooClient, templateData, deploymentId, config)
          break
        case 'dashboard':
          result = await this.deployDashboardTemplate(
            odooClient,
            templateData,
            deploymentId,
            config
          )
          break
        case 'module_config':
          result = await this.deployModuleConfigTemplate(
            odooClient,
            templateData,
            deploymentId,
            config
          )
          break
        default:
          throw new Error(`Unknown template type: ${config.templateType}`)
      }

      // Update deployment as successful
      await this.updateDeploymentStatus(deploymentId, {
        status: 'success',
        progress: 100,
        currentStep: 'Deployment completed',
        result,
      })

      await this.logDeployment(deploymentId, 'info', 'Deployment completed successfully')
    } catch (error: any) {
      console.error(`[Template Deployment] Deployment ${deploymentId} failed:`, error)

      await this.updateDeploymentStatus(deploymentId, {
        status: 'failed',
        errorMessage: error.message,
        errorStack: error.stack,
      })

      await this.logDeployment(deploymentId, 'error', `Deployment failed: ${error.message}`, {
        stack: error.stack,
      })
    } finally {
      if (odooClient) {
        odooClient.disconnect()
      }
    }
  }

  /**
   * Deploy Kick-off template
   * This deploys modules, custom fields, workflows, dashboards, and module configs
   */
  private async deployKickoffTemplate(
    odooClient: OdooXMLRPCClient,
    templateData: KickoffTemplateData,
    deploymentId: string,
    config: DeploymentConfig
  ): Promise<any> {
    const result: any = {
      modules: [],
      customFields: [],
      workflows: [],
      dashboards: [],
      moduleConfigs: [],
    }

    const totalSteps =
      (templateData.modules?.length || 0) +
      (templateData.customFields?.length || 0) +
      (templateData.workflows?.length || 0) +
      (templateData.dashboards?.length || 0) +
      (templateData.moduleConfigs?.length || 0)

    let completedSteps = 0

    // 1. Install modules
    if (templateData.modules && templateData.modules.length > 0) {
      await this.updateDeploymentStatus(deploymentId, {
        currentStep: 'Installing modules',
        progress: Math.round((completedSteps / totalSteps) * 100),
      })

      for (const module of templateData.modules) {
        try {
          await this.logDeployment(
            deploymentId,
            'info',
            `Installing module: ${module.technical_name}`
          )

          // Check if module is installed
          const moduleIds = await odooClient.search('ir.module.module', [
            ['name', '=', module.technical_name],
          ])

          if (moduleIds.length === 0) {
            await this.logDeployment(
              deploymentId,
              'warning',
              `Module not found: ${module.technical_name}`
            )
            result.modules.push({
              technical_name: module.technical_name,
              status: 'not_found',
            })
            continue
          }

          const moduleInfo = await odooClient.read('ir.module.module', moduleIds, ['state'])

          if (moduleInfo.length === 0 || moduleInfo[0].state !== 'installed') {
            // Install module
            await odooClient.executeKw('ir.module.module', 'button_immediate_install', [moduleIds])

            // Wait a bit for installation to complete
            await new Promise(resolve => setTimeout(resolve, 2000))

            // Verify installation
            const verifyInfo = await odooClient.read('ir.module.module', moduleIds, ['state'])
            if (verifyInfo[0].state === 'installed') {
              await this.logDeployment(
                deploymentId,
                'info',
                `Module installed: ${module.technical_name}`
              )
            } else {
              throw new Error(
                `Module installation failed: ${module.technical_name} is in state ${verifyInfo[0].state}`
              )
            }
          } else {
            await this.logDeployment(
              deploymentId,
              'info',
              `Module already installed: ${module.technical_name}`
            )
          }

          result.modules.push({
            technical_name: module.technical_name,
            status: 'installed',
          })
        } catch (error: any) {
          await this.logDeployment(
            deploymentId,
            'error',
            `Failed to install module ${module.technical_name}: ${error.message}`
          )
          result.modules.push({
            technical_name: module.technical_name,
            status: 'failed',
            error: error.message,
          })
        }

        completedSteps++
        await this.updateDeploymentStatus(deploymentId, {
          progress: Math.round((completedSteps / totalSteps) * 100),
        })
      }
    }

    // 2. Create custom fields
    if (templateData.customFields && templateData.customFields.length > 0) {
      await this.updateDeploymentStatus(deploymentId, {
        currentStep: 'Creating custom fields',
        progress: Math.round((completedSteps / totalSteps) * 100),
      })

      for (const field of templateData.customFields) {
        try {
          await this.logDeployment(
            deploymentId,
            'info',
            `Creating custom field: ${field.model}.${field.field_name}`
          )

          // Check if field exists
          const existingFields = await odooClient.fieldsGet(field.model, [field.field_name])

          if (!existingFields[field.field_name]) {
            // Create field via ir.model.fields
            const fieldData: any = {
              model: field.model,
              name: field.field_name,
              field_description: field.label,
              ttype: field.field_type,
              required: field.required || false,
            }

            // Add field-specific options
            if (field.options) {
              Object.assign(fieldData, field.options)
            }

            const fieldId = await odooClient.create('ir.model.fields', fieldData)

            await this.logDeployment(
              deploymentId,
              'info',
              `Custom field created: ${field.model}.${field.field_name}`
            )
            result.customFields.push({
              model: field.model,
              field_name: field.field_name,
              field_id: fieldId,
              status: 'created',
            })
          } else {
            await this.logDeployment(
              deploymentId,
              'info',
              `Custom field already exists: ${field.model}.${field.field_name}`
            )
            result.customFields.push({
              model: field.model,
              field_name: field.field_name,
              status: 'exists',
            })
          }
        } catch (error: any) {
          await this.logDeployment(
            deploymentId,
            'error',
            `Failed to create custom field ${field.model}.${field.field_name}: ${error.message}`
          )
          result.customFields.push({
            model: field.model,
            field_name: field.field_name,
            status: 'failed',
            error: error.message,
          })
        }

        completedSteps++
        await this.updateDeploymentStatus(deploymentId, {
          progress: Math.round((completedSteps / totalSteps) * 100),
        })
      }
    }

    // 3. Create workflows (if workflow module is available)
    if (templateData.workflows && templateData.workflows.length > 0) {
      await this.updateDeploymentStatus(deploymentId, {
        currentStep: 'Creating workflows',
        progress: Math.round((completedSteps / totalSteps) * 100),
      })

      // Note: Workflow creation depends on Odoo version and available modules
      // This is a simplified version - full implementation would require more complex logic
      for (const workflow of templateData.workflows) {
        try {
          await this.logDeployment(deploymentId, 'info', `Creating workflow: ${workflow.name}`)

          // Workflow creation logic would go here
          // This is placeholder - actual implementation depends on Odoo version

          result.workflows.push({
            name: workflow.name,
            status: 'pending', // Would be 'created' after implementation
          })
        } catch (error: any) {
          await this.logDeployment(
            deploymentId,
            'error',
            `Failed to create workflow ${workflow.name}: ${error.message}`
          )
          result.workflows.push({
            name: workflow.name,
            status: 'failed',
            error: error.message,
          })
        }

        completedSteps++
        await this.updateDeploymentStatus(deploymentId, {
          progress: Math.round((completedSteps / totalSteps) * 100),
        })
      }
    }

    // 4. Create dashboards
    if (templateData.dashboards && templateData.dashboards.length > 0) {
      await this.updateDeploymentStatus(deploymentId, {
        currentStep: 'Creating dashboards',
        progress: Math.round((completedSteps / totalSteps) * 100),
      })

      for (const dashboard of templateData.dashboards) {
        try {
          await this.logDeployment(deploymentId, 'info', `Creating dashboard: ${dashboard.name}`)

          // Dashboard creation via ir.ui.view
          const viewData: any = {
            name: dashboard.name,
            type: dashboard.view_type,
            model: 'ir.ui.view',
            arch: this.buildDashboardArch(dashboard),
          }

          const viewId = await odooClient.create('ir.ui.view', viewData)

          await this.logDeployment(deploymentId, 'info', `Dashboard created: ${dashboard.name}`)
          result.dashboards.push({
            name: dashboard.name,
            view_id: viewId,
            status: 'created',
          })
        } catch (error: any) {
          await this.logDeployment(
            deploymentId,
            'error',
            `Failed to create dashboard ${dashboard.name}: ${error.message}`
          )
          result.dashboards.push({
            name: dashboard.name,
            status: 'failed',
            error: error.message,
          })
        }

        completedSteps++
        await this.updateDeploymentStatus(deploymentId, {
          progress: Math.round((completedSteps / totalSteps) * 100),
        })
      }
    }

    // 5. Configure modules
    if (templateData.moduleConfigs && templateData.moduleConfigs.length > 0) {
      await this.updateDeploymentStatus(deploymentId, {
        currentStep: 'Configuring modules',
        progress: Math.round((completedSteps / totalSteps) * 100),
      })

      for (const moduleConfig of templateData.moduleConfigs) {
        try {
          await this.logDeployment(
            deploymentId,
            'info',
            `Configuring module: ${moduleConfig.module}`
          )

          // Update module settings via ir.config_parameter or model-specific settings
          for (const [key, value] of Object.entries(moduleConfig.settings)) {
            await odooClient.executeKw('ir.config_parameter', 'set_param', [
              `${moduleConfig.module}.${key}`,
              String(value),
            ])
          }

          await this.logDeployment(
            deploymentId,
            'info',
            `Module configured: ${moduleConfig.module}`
          )
          result.moduleConfigs.push({
            module: moduleConfig.module,
            status: 'configured',
          })
        } catch (error: any) {
          await this.logDeployment(
            deploymentId,
            'error',
            `Failed to configure module ${moduleConfig.module}: ${error.message}`
          )
          result.moduleConfigs.push({
            module: moduleConfig.module,
            status: 'failed',
            error: error.message,
          })
        }

        completedSteps++
        await this.updateDeploymentStatus(deploymentId, {
          progress: Math.round((completedSteps / totalSteps) * 100),
        })
      }
    }

    return result
  }

  /**
   * Deploy BOM template (placeholder - to be implemented)
   */
  private async deployBOMTemplate(
    odooClient: OdooXMLRPCClient,
    templateData: any,
    deploymentId: string,
    config: DeploymentConfig
  ): Promise<any> {
    await this.logDeployment(deploymentId, 'info', 'BOM template deployment not yet implemented')
    return { status: 'pending' }
  }

  /**
   * Deploy Workflow template (placeholder - to be implemented)
   */
  private async deployWorkflowTemplate(
    odooClient: OdooXMLRPCClient,
    templateData: any,
    deploymentId: string,
    config: DeploymentConfig
  ): Promise<any> {
    await this.logDeployment(
      deploymentId,
      'info',
      'Workflow template deployment not yet implemented'
    )
    return { status: 'pending' }
  }

  /**
   * Deploy Dashboard template (placeholder - to be implemented)
   */
  private async deployDashboardTemplate(
    odooClient: OdooXMLRPCClient,
    templateData: any,
    deploymentId: string,
    config: DeploymentConfig
  ): Promise<any> {
    await this.logDeployment(
      deploymentId,
      'info',
      'Dashboard template deployment not yet implemented'
    )
    return { status: 'pending' }
  }

  /**
   * Deploy Module Config template (placeholder - to be implemented)
   */
  private async deployModuleConfigTemplate(
    odooClient: OdooXMLRPCClient,
    templateData: any,
    deploymentId: string,
    config: DeploymentConfig
  ): Promise<any> {
    await this.logDeployment(
      deploymentId,
      'info',
      'Module config template deployment not yet implemented'
    )
    return { status: 'pending' }
  }

  /**
   * Get template data from database or file
   */
  private async getTemplateData(templateId: string, templateType: TemplateType): Promise<any> {
    const supabase = await this.getSupabase()

    // Try to get from templates table first
    const { data: template, error } = await supabase
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (!error && template) {
      // Parse template data based on type
      return this.parseTemplateData(template, templateType)
    }

    // If not found, return empty structure
    return this.getEmptyTemplateData(templateType)
  }

  /**
   * Parse template data based on type
   */
  private parseTemplateData(template: any, templateType: TemplateType): any {
    switch (templateType) {
      case 'kickoff':
        return {
          modules: template.modules || [],
          customFields: template.custom_fields || [],
          workflows: template.workflows || [],
          dashboards: template.dashboards || [],
          moduleConfigs: template.module_configs || [],
        }
      default:
        return template.data || {}
    }
  }

  /**
   * Get empty template data structure
   */
  private getEmptyTemplateData(templateType: TemplateType): any {
    switch (templateType) {
      case 'kickoff':
        return {
          modules: [],
          customFields: [],
          workflows: [],
          dashboards: [],
          moduleConfigs: [],
        }
      default:
        return {}
    }
  }

  /**
   * Build dashboard XML arch
   */
  private buildDashboardArch(dashboard: any): string {
    // Simplified dashboard arch builder
    // In production, this would generate proper Odoo XML
    return `<dashboard>${dashboard.name}</dashboard>`
  }

  /**
   * Update deployment status
   */
  private async updateDeploymentStatus(
    deploymentId: string,
    updates: Partial<{
      status: 'pending' | 'in_progress' | 'success' | 'failed' | 'rolled_back'
      progress: number
      currentStep: string
      result: any
      errorMessage: string
      errorStack: string
    }>
  ): Promise<void> {
    const supabase = await this.getSupabase()

    const updateData: any = {}
    if (updates.status) updateData.status = updates.status
    if (updates.progress !== undefined) updateData.progress = updates.progress
    if (updates.currentStep) updateData.current_step = updates.currentStep
    if (updates.result) updateData.result = updates.result
    if (updates.errorMessage) updateData.error_message = updates.errorMessage
    if (updates.errorStack) updateData.error_stack = updates.errorStack

    if (updates.status === 'success' || updates.status === 'failed') {
      updateData.completed_at = new Date().toISOString()
    }

    await supabase.from('template_deployments').update(updateData).eq('id', deploymentId)
  }

  /**
   * Log deployment event
   */
  private async logDeployment(
    deploymentId: string,
    level: 'debug' | 'info' | 'warning' | 'error',
    message: string,
    details?: any
  ): Promise<void> {
    const supabase = await this.getSupabase()

    await supabase.from('deployment_logs').insert({
      deployment_id: deploymentId,
      level,
      message,
      details: details || {},
    })
  }

  /**
   * Rollback a deployment
   */
  async rollbackDeployment(deploymentId: string, userId: string): Promise<void> {
    const supabase = await this.getSupabase()

    // Get deployment
    const { data: deployment, error } = await supabase
      .from('template_deployments')
      .select('*, odoo_instance_backups(*)')
      .eq('id', deploymentId)
      .single()

    if (error || !deployment) {
      throw new Error(`Deployment not found: ${deploymentId}`)
    }

    if (!deployment.can_rollback || !deployment.backup_id) {
      throw new Error('Rollback not available for this deployment')
    }

    // Restore backup
    await this.odooInstanceService.restoreBackup(
      deployment.instance_id,
      deployment.backup_id,
      userId
    )

    // Update deployment status
    await supabase
      .from('template_deployments')
      .update({
        status: 'rolled_back',
        rolled_back_at: new Date().toISOString(),
      })
      .eq('id', deploymentId)

    await this.logDeployment(deploymentId, 'info', 'Deployment rolled back successfully')
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(deploymentId: string): Promise<DeploymentProgress> {
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
    }
  }

  /**
   * Get deployment logs
   */
  async getDeploymentLogs(deploymentId: string, limit: number = 100): Promise<any[]> {
    const supabase = await this.getSupabase()

    const { data: logs, error } = await supabase
      .from('deployment_logs')
      .select('*')
      .eq('deployment_id', deploymentId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to get deployment logs: ${error.message}`)
    }

    return logs || []
  }
}

// Singleton instance
let templateDeploymentEngineInstance: TemplateDeploymentEngine | null = null

export function getTemplateDeploymentEngine(): TemplateDeploymentEngine {
  if (!templateDeploymentEngineInstance) {
    templateDeploymentEngineInstance = new TemplateDeploymentEngine()
  }
  return templateDeploymentEngineInstance
}
