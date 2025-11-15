import { createClient } from '@/lib/supabase/server'
import { TemplateValidationService } from './template-validation-service'
import { TemplateDeploymentEngine } from './template-deployment-engine'

export interface TestResult {
  testId: string
  testName: string
  status: 'passed' | 'failed' | 'skipped'
  error?: string
  duration: number
}

export interface VersionTestSuite {
  versionId: string
  tests: TestResult[]
  overallStatus: 'passed' | 'failed' | 'running'
  startedAt: string
  completedAt?: string
  duration: number
}

export class TemplateVersionTestService {
  private supabase: any
  private validationService = new TemplateValidationService()

  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createClient()
    }
    return this.supabase
  }

  /**
   * Run tests for a template version
   */
  async runTests(versionId: string): Promise<VersionTestSuite> {
    const version = await this.getVersion(versionId)
    if (!version) {
      throw new Error('Version not found')
    }

    const startedAt = new Date().toISOString()
    const tests: TestResult[] = []

    // Test 1: Structure Validation
    try {
      const validationStart = Date.now()
      const validationResult = await this.validationService.validateTemplateForDeployment(
        version.structure
      )
      const validationDuration = Date.now() - validationStart

      tests.push({
        testId: 'structure_validation',
        testName: 'Structure Validation',
        status: validationResult.isValid ? 'passed' : 'failed',
        error: validationResult.errors?.join(', '),
        duration: validationDuration,
      })
    } catch (error: any) {
      tests.push({
        testId: 'structure_validation',
        testName: 'Structure Validation',
        status: 'failed',
        error: error.message,
        duration: 0,
      })
    }

    // Test 2: Required Fields Check
    try {
      const fieldsStart = Date.now()
      const hasRequiredFields = this.checkRequiredFields(version.structure)
      const fieldsDuration = Date.now() - fieldsStart

      tests.push({
        testId: 'required_fields',
        testName: 'Required Fields Check',
        status: hasRequiredFields ? 'passed' : 'failed',
        error: hasRequiredFields ? undefined : 'Missing required fields',
        duration: fieldsDuration,
      })
    } catch (error: any) {
      tests.push({
        testId: 'required_fields',
        testName: 'Required Fields Check',
        status: 'failed',
        error: error.message,
        duration: 0,
      })
    }

    // Test 3: Custom Fields Naming Convention
    try {
      const namingStart = Date.now()
      const namingValid = this.checkCustomFieldNaming(version.structure)
      const namingDuration = Date.now() - namingStart

      tests.push({
        testId: 'custom_field_naming',
        testName: 'Custom Fields Naming Convention',
        status: namingValid ? 'passed' : 'failed',
        error: namingValid ? undefined : 'Custom fields must start with x_',
        duration: namingDuration,
      })
    } catch (error: any) {
      tests.push({
        testId: 'custom_field_naming',
        testName: 'Custom Fields Naming Convention',
        status: 'failed',
        error: error.message,
        duration: 0,
      })
    }

    // Test 4: Workflow State Consistency
    try {
      const workflowStart = Date.now()
      const workflowValid = this.checkWorkflowConsistency(version.structure)
      const workflowDuration = Date.now() - workflowStart

      tests.push({
        testId: 'workflow_consistency',
        testName: 'Workflow State Consistency',
        status: workflowValid ? 'passed' : 'failed',
        error: workflowValid ? undefined : 'Workflow states and transitions are inconsistent',
        duration: workflowDuration,
      })
    } catch (error: any) {
      tests.push({
        testId: 'workflow_consistency',
        testName: 'Workflow State Consistency',
        status: 'failed',
        error: error.message,
        duration: 0,
      })
    }

    // Test 5: Dashboard XML Validation
    try {
      const dashboardStart = Date.now()
      const dashboardValid = this.checkDashboardXML(version.structure)
      const dashboardDuration = Date.now() - dashboardStart

      tests.push({
        testId: 'dashboard_xml',
        testName: 'Dashboard XML Validation',
        status: dashboardValid ? 'passed' : 'failed',
        error: dashboardValid ? undefined : 'Dashboard XML structure is invalid',
        duration: dashboardDuration,
      })
    } catch (error: any) {
      tests.push({
        testId: 'dashboard_xml',
        testName: 'Dashboard XML Validation',
        status: 'failed',
        error: error.message,
        duration: 0,
      })
    }

    const completedAt = new Date().toISOString()
    const duration = new Date(completedAt).getTime() - new Date(startedAt).getTime()
    const overallStatus = tests.every(t => t.status === 'passed') ? 'passed' : 'failed'

    // Store test results
    await this.storeTestResults(versionId, {
      versionId,
      tests,
      overallStatus,
      startedAt,
      completedAt,
      duration,
    })

    return {
      versionId,
      tests,
      overallStatus,
      startedAt,
      completedAt,
      duration,
    }
  }

  /**
   * Get version data
   */
  private async getVersion(versionId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('template_versions')
      .select('*')
      .eq('id', versionId)
      .single()

    if (error) {
      throw new Error(`Failed to get version: ${error.message}`)
    }

    return data
  }

  /**
   * Check required fields
   */
  private checkRequiredFields(structure: any): boolean {
    if (!structure) return false

    // Check for kickoff template
    if (structure.type === 'kickoff') {
      return !!(structure.modules && structure.departments && structure.tasks)
    }

    // Check for workflow template
    if (structure.type === 'workflow') {
      return !!(structure.workflows && structure.workflows.length > 0)
    }

    // Check for dashboard template
    if (structure.type === 'dashboard') {
      return !!(structure.dashboards && structure.dashboards.length > 0)
    }

    return true
  }

  /**
   * Check custom field naming convention
   */
  private checkCustomFieldNaming(structure: any): boolean {
    if (!structure.custom_fields) return true

    return structure.custom_fields.every((field: any) => {
      const fieldName = field.field_name || field.name
      return fieldName && fieldName.startsWith('x_')
    })
  }

  /**
   * Check workflow consistency
   */
  private checkWorkflowConsistency(structure: any): boolean {
    if (!structure.workflows) return true

    for (const workflow of structure.workflows) {
      if (!workflow.states || !workflow.transitions) continue

      const stateNames = workflow.states.map((s: any) => s.name)
      const transitionStates = [
        ...workflow.transitions.map((t: any) => t.from_state),
        ...workflow.transitions.map((t: any) => t.to_state),
      ]

      // Check if all transition states exist in states
      for (const state of transitionStates) {
        if (!stateNames.includes(state)) {
          return false
        }
      }
    }

    return true
  }

  /**
   * Check dashboard XML structure
   */
  private checkDashboardXML(structure: any): boolean {
    if (!structure.dashboards) return true

    for (const dashboard of structure.dashboards) {
      if (!dashboard.xml_arch) continue

      // Basic XML validation (check if it contains <graph>)
      if (!dashboard.xml_arch.includes('<graph')) {
        return false
      }
    }

    return true
  }

  /**
   * Store test results
   */
  private async storeTestResults(versionId: string, testSuite: VersionTestSuite): Promise<void> {
    await this.supabase
      .from('template_versions')
    const supabase = await this.getSupabase()
    await supabase
      .from('template_versions')
      .update({
        test_results: testSuite,
        last_tested_at: testSuite.completedAt,
      })
      .eq('id', versionId)
  }

  /**
   * Get test results for a version
   */
  async getTestResults(versionId: string): Promise<VersionTestSuite | null> {
    const version = await this.getVersion(versionId)
    if (!version) {
      return null
    }
    return version.test_results || null
  }
}

export function getTemplateVersionTestService(): TemplateVersionTestService {
  return new TemplateVersionTestService()
}
