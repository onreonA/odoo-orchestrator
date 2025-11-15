/**
 * Template Validation Service
 *
 * Validates template structure before deployment to ensure all required fields
 * and data types are correct.
 */

import type { ExtendedKickoffTemplateData } from '@/lib/types/kickoff-template'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export class TemplateValidationService {
  /**
   * Validate a kickoff template structure
   */
  validateKickoffTemplate(template: ExtendedKickoffTemplateData): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // 1. Check required top-level fields
    if (!template.modules || !Array.isArray(template.modules) || template.modules.length === 0) {
      errors.push('Template must have at least one module')
    }

    // 2. Validate modules
    if (template.modules) {
      template.modules.forEach((module, index) => {
        if (!module.name) {
          errors.push(`Module ${index + 1}: name is required`)
        }
        if (!module.technical_name) {
          errors.push(`Module ${index + 1}: technical_name is required`)
        }
        if (module.priority !== undefined && (module.priority < 1 || module.priority > 10)) {
          warnings.push(`Module ${index + 1}: priority should be between 1 and 10`)
        }
        if (module.phase !== undefined && module.phase < 1) {
          warnings.push(`Module ${index + 1}: phase should be at least 1`)
        }
      })
    }

    // 3. Validate custom fields
    if (template.customFields) {
      template.customFields.forEach((field, index) => {
        if (!field.model) {
          errors.push(`Custom field ${index + 1}: model is required`)
        }
        if (!field.field_name) {
          errors.push(`Custom field ${index + 1}: field_name is required`)
        }
        if (!field.field_type) {
          errors.push(`Custom field ${index + 1}: field_type is required`)
        }
        if (!field.label) {
          errors.push(`Custom field ${index + 1}: label is required`)
        }

        // Validate field name starts with x_ (Odoo requirement)
        if (field.field_name && !field.field_name.startsWith('x_')) {
          warnings.push(
            `Custom field ${index + 1}: field_name should start with 'x_' (will be auto-added during deployment)`
          )
        }

        // Validate field type
        const validFieldTypes = [
          'char',
          'text',
          'integer',
          'float',
          'boolean',
          'date',
          'datetime',
          'selection',
          'many2one',
          'one2many',
          'many2many',
        ]
        if (field.field_type && !validFieldTypes.includes(field.field_type)) {
          warnings.push(
            `Custom field ${index + 1}: field_type '${field.field_type}' may not be valid. Valid types: ${validFieldTypes.join(', ')}`
          )
        }

        // Validate selection options
        if (field.field_type === 'selection' && field.options?.selection) {
          if (!Array.isArray(field.options.selection)) {
            errors.push(`Custom field ${index + 1}: selection options must be an array`)
          } else {
            field.options.selection.forEach((option: any, optIndex: number) => {
              if (!Array.isArray(option) || option.length !== 2) {
                errors.push(
                  `Custom field ${index + 1}: selection option ${optIndex + 1} must be [value, label] array`
                )
              }
            })
          }
        }
      })
    }

    // 4. Validate workflows
    if (template.workflows) {
      template.workflows.forEach((workflow, index) => {
        if (!workflow.name) {
          errors.push(`Workflow ${index + 1}: name is required`)
        }
        if (!workflow.model) {
          errors.push(`Workflow ${index + 1}: model is required`)
        }

        // Validate states
        if (workflow.states && Array.isArray(workflow.states)) {
          workflow.states.forEach((state, stateIndex) => {
            if (!state.name) {
              errors.push(`Workflow ${index + 1}, State ${stateIndex + 1}: name is required`)
            }
            if (!state.label) {
              errors.push(`Workflow ${index + 1}, State ${stateIndex + 1}: label is required`)
            }
          })
        }

        // Validate transitions
        if (workflow.transitions && Array.isArray(workflow.transitions)) {
          workflow.transitions.forEach((transition, transIndex) => {
            if (!transition.from) {
              errors.push(`Workflow ${index + 1}, Transition ${transIndex + 1}: 'from' is required`)
            }
            if (!transition.to) {
              errors.push(`Workflow ${index + 1}, Transition ${transIndex + 1}: 'to' is required`)
            }

            // Check if transition states exist
            if (workflow.states) {
              const stateNames = workflow.states.map(s => s.name)
              if (!stateNames.includes(transition.from)) {
                warnings.push(
                  `Workflow ${index + 1}, Transition ${transIndex + 1}: 'from' state '${transition.from}' not found in states`
                )
              }
              if (!stateNames.includes(transition.to)) {
                warnings.push(
                  `Workflow ${index + 1}, Transition ${transIndex + 1}: 'to' state '${transition.to}' not found in states`
                )
              }
            }
          })
        }
      })
    }

    // 5. Validate dashboards
    if (template.dashboards) {
      template.dashboards.forEach((dashboard, index) => {
        if (!dashboard.name) {
          errors.push(`Dashboard ${index + 1}: name is required`)
        }
        if (!dashboard.view_type) {
          errors.push(`Dashboard ${index + 1}: view_type is required`)
        }

        const validViewTypes = ['graph', 'pivot', 'kanban', 'calendar', 'gantt']
        if (dashboard.view_type && !validViewTypes.includes(dashboard.view_type)) {
          warnings.push(
            `Dashboard ${index + 1}: view_type '${dashboard.view_type}' may not be valid. Valid types: ${validViewTypes.join(', ')}`
          )
        }

        // Validate components
        if (dashboard.components && Array.isArray(dashboard.components)) {
          dashboard.components.forEach((component, compIndex) => {
            if (!component.type) {
              errors.push(`Dashboard ${index + 1}, Component ${compIndex + 1}: type is required`)
            }
            if (component.model && !component.fields) {
              warnings.push(
                `Dashboard ${index + 1}, Component ${compIndex + 1}: model specified but no fields defined`
              )
            }
          })
        }
      })
    }

    // 6. Validate departments (for kickoff templates)
    if (template.departments) {
      template.departments.forEach((dept, index) => {
        if (!dept.name) {
          errors.push(`Department ${index + 1}: name is required`)
        }
        if (!dept.technical_name) {
          errors.push(`Department ${index + 1}: technical_name is required`)
        }

        // Validate tasks
        if (dept.tasks && Array.isArray(dept.tasks)) {
          dept.tasks.forEach((task, taskIndex) => {
            if (!task.title) {
              errors.push(`Department ${index + 1}, Task ${taskIndex + 1}: title is required`)
            }
            if (!task.type) {
              errors.push(`Department ${index + 1}, Task ${taskIndex + 1}: type is required`)
            }
            if (!task.priority) {
              errors.push(`Department ${index + 1}, Task ${taskIndex + 1}: priority is required`)
            }
          })
        }
      })
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Validate template before deployment
   */
  validateTemplateForDeployment(template: any, templateType: string): ValidationResult {
    if (templateType === 'kickoff') {
      return this.validateKickoffTemplate(template as ExtendedKickoffTemplateData)
    }

    // Add validation for other template types (bom, workflow, dashboard) as needed
    return {
      valid: true,
      errors: [],
      warnings: [`Validation for template type '${templateType}' is not yet implemented`],
    }
  }
}
