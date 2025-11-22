/**
 * Odoo Project Deployment Service
 *
 * Creates Odoo projects, stages, tasks, subtasks, and milestones from kick-off templates.
 * This service is used by TemplateDeploymentEngine to deploy project structures to Odoo.
 */

import { OdooXMLRPCClient } from '@/lib/odoo/xmlrpc-client'
import type {
  ExtendedKickoffTemplateData,
  ProjectCustomizations,
  ProjectDeploymentResult,
  TaskTemplate,
  Subtask,
  ProjectMilestone,
} from '@/lib/types/kickoff-template'

export class OdooProjectDeploymentService {
  /**
   * Create Odoo project from kick-off template
   */
  async deployProjectFromTemplate(
    odooClient: OdooXMLRPCClient,
    template: ExtendedKickoffTemplateData,
    customizations: ProjectCustomizations
  ): Promise<ProjectDeploymentResult> {
    const result: ProjectDeploymentResult = {
      projectId: 0,
      stageIds: [],
      taskIds: [],
      subtaskIds: [],
      milestoneIds: [],
      errors: [],
      warnings: [],
    }

    try {
      // 1. CREATE PROJECT
      const projectId = await this.createProject(odooClient, template, customizations)
      result.projectId = projectId

      // 2. CREATE STAGES (PHASES)
      const stageMap = await this.createProjectStages(
        odooClient,
        projectId,
        template.project_timeline.phases
      )
      result.stageIds = Array.from(stageMap.values())

      // 3. CREATE TASKS
      const taskResults = await this.createProjectTasks(
        odooClient,
        projectId,
        template,
        stageMap,
        customizations
      )
      result.taskIds = taskResults.taskIds
      result.subtaskIds = taskResults.subtaskIds
      result.errors.push(...taskResults.errors)
      result.warnings.push(...taskResults.warnings)

      // 4. CREATE MILESTONES
      if (template.project_timeline.milestones && template.project_timeline.milestones.length > 0) {
        const milestoneIds = await this.createMilestones(
          odooClient,
          projectId,
          template.project_timeline.milestones,
          customizations.startDate
        )
        result.milestoneIds = milestoneIds
      }

      return result
    } catch (error: any) {
      result.errors.push(`Project deployment failed: ${error.message}`)
      throw error
    }
  }

  /**
   * Create Odoo project
   */
  private async createProject(
    odooClient: OdooXMLRPCClient,
    template: ExtendedKickoffTemplateData,
    customizations: ProjectCustomizations
  ): Promise<number> {
    const projectName =
      customizations.projectName || `${template.companyName || 'Company'} ERP Kurulum Projesi`

    const projectData: any = {
      name: projectName,
      use_tasks: true,
      use_subtasks: true,
      allow_milestones: true,
      privacy_visibility: 'portal',
    }

    if (customizations.companyPartnerId) {
      projectData.partner_id = customizations.companyPartnerId
    }

    if (customizations.startDate) {
      projectData.date_start = customizations.startDate.split('T')[0] // ISO date to YYYY-MM-DD
    }

    const projectId = await odooClient.create('project.project', projectData)
    console.log(`[Odoo Project] ✅ Created project: ${projectName} (ID: ${projectId})`)

    return projectId
  }

  /**
   * Create project stages (phases)
   */
  private async createProjectStages(
    odooClient: OdooXMLRPCClient,
    projectId: number,
    phases: Array<{ name: string; description?: string; sequence: number }>
  ): Promise<Map<string, number>> {
    const stageMap = new Map<string, number>()

    for (const phase of phases) {
      try {
        const stageData: any = {
          name: phase.name,
          description: phase.description || '',
          project_ids: [[6, 0, [projectId]]],
          sequence: phase.sequence,
          fold: false,
        }

        const stageId = await odooClient.create('project.task.type', stageData)
        stageMap.set(phase.name, stageId)

        console.log(`[Odoo Project] ✅ Created stage: ${phase.name} (ID: ${stageId})`)
      } catch (error: any) {
        console.error(`[Odoo Project] ❌ Failed to create stage ${phase.name}:`, error)
        throw error
      }
    }

    return stageMap
  }

  /**
   * Create project tasks
   */
  private async createProjectTasks(
    odooClient: OdooXMLRPCClient,
    projectId: number,
    template: ExtendedKickoffTemplateData,
    stageMap: Map<string, number>,
    customizations: ProjectCustomizations
  ): Promise<{ taskIds: number[]; subtaskIds: number[]; errors: string[]; warnings: string[] }> {
    const taskIds: number[] = []
    const subtaskIds: number[] = []
    const errors: string[] = []
    const warnings: string[] = []

    // Collect all tasks from all departments
    const allTasks: Array<{ task: TaskTemplate; departmentName: string }> = []
    for (const dept of template.departments) {
      if (dept.tasks) {
        for (const task of dept.tasks) {
          allTasks.push({ task, departmentName: dept.name })
        }
      }
    }

    // Create tasks
    for (const { task, departmentName } of allTasks) {
      try {
        // Determine which stage this task belongs to
        const phaseName = this.determinePhase(task, template)
        const stageId = stageMap.get(phaseName)

        if (!stageId) {
          warnings.push(`Task "${task.title}" has unknown phase "${phaseName}", using first stage`)
          // Use first stage as fallback
          const firstPhase = template.project_timeline.phases[0]
          const fallbackStageId = stageMap.get(firstPhase.name)
          if (!fallbackStageId) {
            errors.push(`Cannot find stage for task "${task.title}"`)
            continue
          }
        }

        // Calculate deadline
        const deadline = this.calculateDeadline(customizations.startDate, task.due_days)

        // Format task description
        const description = this.formatTaskDescription(task)

        // Create task
        const taskData: any = {
          name: task.title,
          description: description,
          project_id: projectId,
          stage_id: stageId || stageMap.values().next().value,
          planned_hours: task.estimated_hours || 0,
          date_deadline: deadline,
          priority: this.mapPriority(task.priority),
        }

        // Create tags if needed
        const tagIds = await this.createOrGetTags(odooClient, [
          departmentName,
          task.type,
          `priority-${task.priority}`,
        ])
        if (tagIds.length > 0) {
          taskData.tag_ids = [[6, 0, tagIds]]
        }

        const taskId = await odooClient.create('project.task', taskData)
        taskIds.push(taskId)

        console.log(`[Odoo Project] ✅ Created task: ${task.title} (ID: ${taskId})`)

        // Create subtasks if any
        if (task.subtasks && task.subtasks.length > 0) {
          const createdSubtasks = await this.createSubtasks(
            odooClient,
            projectId,
            taskId,
            task.subtasks
          )
          subtaskIds.push(...createdSubtasks)
        }
      } catch (error: any) {
        const errorMsg = `Failed to create task "${task.title}": ${error.message}`
        errors.push(errorMsg)
        console.error(`[Odoo Project] ❌ ${errorMsg}`, error)
      }
    }

    return { taskIds, subtaskIds, errors, warnings }
  }

  /**
   * Create subtasks for a parent task
   */
  private async createSubtasks(
    odooClient: OdooXMLRPCClient,
    projectId: number,
    parentTaskId: number,
    subtasks: Subtask[]
  ): Promise<number[]> {
    const subtaskIds: number[] = []

    for (const subtask of subtasks) {
      try {
        const subtaskData: any = {
          name: subtask.title,
          description: subtask.description || '',
          project_id: projectId,
          parent_id: parentTaskId,
          planned_hours: subtask.estimated_hours || 0,
        }

        if (subtask.priority) {
          subtaskData.priority = this.mapPriority(subtask.priority)
        }

        const subtaskId = await odooClient.create('project.task', subtaskData)
        subtaskIds.push(subtaskId)

        console.log(`[Odoo Project] ✅ Created subtask: ${subtask.title} (ID: ${subtaskId})`)
      } catch (error: any) {
        console.error(`[Odoo Project] ❌ Failed to create subtask "${subtask.title}":`, error)
      }
    }

    return subtaskIds
  }

  /**
   * Create project milestones
   */
  private async createMilestones(
    odooClient: OdooXMLRPCClient,
    projectId: number,
    milestones: ProjectMilestone[],
    startDate?: string
  ): Promise<number[]> {
    const milestoneIds: number[] = []

    for (const milestone of milestones) {
      try {
        // Parse deadline date
        let deadlineDate: string
        if (milestone.deadline) {
          // If deadline is already a date string, use it
          deadlineDate = milestone.deadline.split('T')[0]
        } else {
          // Fallback: calculate from start date if provided
          if (startDate) {
            const start = new Date(startDate)
            start.setDate(start.getDate() + 30) // Default: 30 days from start
            deadlineDate = start.toISOString().split('T')[0]
          } else {
            deadlineDate = new Date().toISOString().split('T')[0]
          }
        }

        const milestoneData: any = {
          name: milestone.name,
          project_id: projectId,
          deadline: deadlineDate,
          is_reached: false,
        }

        if (milestone.description) {
          milestoneData.description = milestone.description
        }

        const milestoneId = await odooClient.create('project.milestone', milestoneData)
        milestoneIds.push(milestoneId)

        console.log(`[Odoo Project] ✅ Created milestone: ${milestone.name} (ID: ${milestoneId})`)
      } catch (error: any) {
        console.error(`[Odoo Project] ❌ Failed to create milestone "${milestone.name}":`, error)
      }
    }

    return milestoneIds
  }

  /**
   * Determine which phase a task belongs to
   */
  private determinePhase(task: TaskTemplate, template: ExtendedKickoffTemplateData): string {
    // 1. If task.phase is explicitly set, use it
    if (task.phase) {
      return task.phase
    }

    // 2. Try to extract from task title (e.g., "F0-01" → "FAZ 0: Pre-Analiz")
    const match = task.title.match(/^F(\d+)-/)
    if (match) {
      const phaseIndex = parseInt(match[1])
      if (template.project_timeline.phases[phaseIndex]) {
        return template.project_timeline.phases[phaseIndex].name
      }
    }

    // 3. Default: First phase
    return template.project_timeline.phases[0]?.name || 'FAZ 0: Pre-Analiz'
  }

  /**
   * Format task description with documents and collaborators
   */
  private formatTaskDescription(task: TaskTemplate): string {
    let description = task.description || ''

    // Add required documents section
    if (task.required_documents && task.required_documents.length > 0) {
      description += '\n\n**Gerekli Belgeler:**\n'
      for (const doc of task.required_documents) {
        description += `- **${doc.name}**: ${doc.description}`
        if (doc.required) {
          description += ' *(Zorunlu)*'
        }
        if (doc.format && doc.format.length > 0) {
          description += ` [Format: ${doc.format.join(', ')}]`
        }
        description += '\n'
      }
    }

    // Add collaborator departments section
    if (task.collaborator_departments && task.collaborator_departments.length > 0) {
      description += '\n**İşbirliği Yapılacak Departmanlar:**\n'
      description += task.collaborator_departments.join(', ')
      description += '\n'
    }

    // Add dependencies section
    if (task.depends_on && task.depends_on.length > 0) {
      description += '\n**Bağımlılıklar:**\n'
      for (const dep of task.depends_on) {
        description += `- ${dep}\n`
      }
    }

    return description.trim()
  }

  /**
   * Calculate deadline from start date and due days
   */
  private calculateDeadline(startDate: string | undefined, dueDays: number): string {
    const start = startDate ? new Date(startDate) : new Date()
    start.setDate(start.getDate() + dueDays)
    return start.toISOString().split('T')[0] // Return YYYY-MM-DD format
  }

  /**
   * Map priority string to Odoo priority value
   */
  private mapPriority(priority: string): string {
    const priorityMap: Record<string, string> = {
      low: '0',
      medium: '1',
      high: '2',
      critical: '3',
    }
    return priorityMap[priority.toLowerCase()] || '1' // Default: medium
  }

  /**
   * Create or get tags for tasks
   */
  private async createOrGetTags(
    odooClient: OdooXMLRPCClient,
    tagNames: string[]
  ): Promise<number[]> {
    const tagIds: number[] = []

    for (const tagName of tagNames) {
      if (!tagName) continue

      try {
        // Search for existing tag
        const existingTags = await odooClient.search('project.tags', [['name', '=', tagName]])

        if (existingTags.length > 0) {
          tagIds.push(existingTags[0])
        } else {
          // Create new tag
          const tagId = await odooClient.create('project.tags', {
            name: tagName,
          })
          tagIds.push(tagId)
        }
      } catch (error: any) {
        // If project.tags model doesn't exist, skip tags
        console.warn(`[Odoo Project] ⚠️ Could not create/get tag "${tagName}":`, error.message)
      }
    }

    return tagIds
  }
}


