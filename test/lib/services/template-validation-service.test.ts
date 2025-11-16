import { describe, it, expect } from 'vitest'
import { TemplateValidationService } from '@/lib/services/template-validation-service'
import type { ExtendedKickoffTemplateData } from '@/lib/types/kickoff-template'

describe('TemplateValidationService', () => {
  const validationService = new TemplateValidationService()

  describe('validateKickoffTemplate', () => {
    it('should validate a valid template', () => {
      const validTemplate: ExtendedKickoffTemplateData = {
        modules: [
          {
            name: 'Sales',
            technical_name: 'sale',
            category: 'sales',
            priority: 1,
            phase: 1,
          },
        ],
        customFields: [
          {
            model: 'product.product',
            field_name: 'x_product_dimensions',
            field_type: 'char',
            label: 'Ürün Ölçüleri',
          },
        ],
        workflows: [
          {
            name: 'Sipariş Onay Süreci',
            model: 'sale.order',
            states: [
              { name: 'draft', label: 'Taslak' },
              { name: 'approved', label: 'Onaylandı' },
            ],
            transitions: [{ from: 'draft', to: 'approved' }],
          },
        ],
        dashboards: [
          {
            name: 'Satış Dashboard',
            view_type: 'graph',
            components: [
              {
                type: 'graph',
                model: 'sale.order',
                fields: ['amount_total'],
              },
            ],
          },
        ],
        departments: [],
        project_timeline: {
          phases: [],
        },
        document_templates: [],
      }

      const result = validationService.validateKickoffTemplate(validTemplate)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail validation when modules are missing', () => {
      const invalidTemplate: ExtendedKickoffTemplateData = {
        modules: [],
        departments: [],
        project_timeline: {
          phases: [],
        },
        document_templates: [],
      }

      const result = validationService.validateKickoffTemplate(invalidTemplate)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Template must have at least one module')
    })

    it('should fail validation when module name is missing', () => {
      const invalidTemplate: ExtendedKickoffTemplateData = {
        modules: [
          {
            technical_name: 'sale',
            category: 'sales',
          } as any,
        ],
        departments: [],
        project_timeline: {
          phases: [],
        },
        document_templates: [],
      }

      const result = validationService.validateKickoffTemplate(invalidTemplate)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Module 1: name is required')
    })

    it('should fail validation when module technical_name is missing', () => {
      const invalidTemplate: ExtendedKickoffTemplateData = {
        modules: [
          {
            name: 'Sales',
            category: 'sales',
          } as any,
        ],
        departments: [],
        project_timeline: {
          phases: [],
        },
        document_templates: [],
      }

      const result = validationService.validateKickoffTemplate(invalidTemplate)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Module 1: technical_name is required')
    })

    it('should warn when module priority is out of range', () => {
      const template: ExtendedKickoffTemplateData = {
        modules: [
          {
            name: 'Sales',
            technical_name: 'sale',
            priority: 15,
          },
        ],
        departments: [],
        project_timeline: {
          phases: [],
        },
        document_templates: [],
      }

      const result = validationService.validateKickoffTemplate(template)

      expect(result.warnings).toContain('Module 1: priority should be between 1 and 10')
    })

    it('should validate custom fields', () => {
      const template: ExtendedKickoffTemplateData = {
        modules: [
          {
            name: 'Sales',
            technical_name: 'sale',
          },
        ],
        customFields: [
          {
            model: 'product.product',
            field_name: 'x_product_dimensions',
            field_type: 'char',
            label: 'Ürün Ölçüleri',
          },
        ],
        departments: [],
        project_timeline: {
          phases: [],
        },
        document_templates: [],
      }

      const result = validationService.validateKickoffTemplate(template)

      expect(result.valid).toBe(true)
    })

    it('should fail validation when custom field model is missing', () => {
      const template: ExtendedKickoffTemplateData = {
        modules: [
          {
            name: 'Sales',
            technical_name: 'sale',
          },
        ],
        customFields: [
          {
            field_name: 'x_product_dimensions',
            field_type: 'char',
            label: 'Ürün Ölçüleri',
          } as any,
        ],
        departments: [],
        project_timeline: {
          phases: [],
        },
        document_templates: [],
      }

      const result = validationService.validateKickoffTemplate(template)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Custom field 1: model is required')
    })

    it('should warn when custom field name does not start with x_', () => {
      const template: ExtendedKickoffTemplateData = {
        modules: [
          {
            name: 'Sales',
            technical_name: 'sale',
          },
        ],
        customFields: [
          {
            model: 'product.product',
            field_name: 'product_dimensions', // Missing x_ prefix
            field_type: 'char',
            label: 'Ürün Ölçüleri',
          },
        ],
        departments: [],
        project_timeline: {
          phases: [],
        },
        document_templates: [],
      }

      const result = validationService.validateKickoffTemplate(template)

      expect(result.warnings).toContain(
        "Custom field 1: field_name should start with 'x_' (will be auto-added during deployment)"
      )
    })

    it('should validate selection field options', () => {
      const template: ExtendedKickoffTemplateData = {
        modules: [
          {
            name: 'Sales',
            technical_name: 'sale',
          },
        ],
        customFields: [
          {
            model: 'product.product',
            field_name: 'x_coating_type',
            field_type: 'selection',
            label: 'Kaplama Tipi',
            options: {
              selection: [
                ['walnut', 'Ceviz'],
                ['oak', 'Meşe'],
              ],
            },
          },
        ],
        departments: [],
        project_timeline: {
          phases: [],
        },
        document_templates: [],
      }

      const result = validationService.validateKickoffTemplate(template)

      expect(result.valid).toBe(true)
    })

    it('should fail validation when selection options are invalid', () => {
      const template: ExtendedKickoffTemplateData = {
        modules: [
          {
            name: 'Sales',
            technical_name: 'sale',
          },
        ],
        customFields: [
          {
            model: 'product.product',
            field_name: 'x_coating_type',
            field_type: 'selection',
            label: 'Kaplama Tipi',
            options: {
              selection: [['walnut']], // Invalid: should be [value, label]
            },
          },
        ],
        departments: [],
        project_timeline: {
          phases: [],
        },
        document_templates: [],
      }

      const result = validationService.validateKickoffTemplate(template)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Custom field 1: selection option 1 must be [value, label] array'
      )
    })

    it('should validate workflows', () => {
      const template: ExtendedKickoffTemplateData = {
        modules: [
          {
            name: 'Sales',
            technical_name: 'sale',
          },
        ],
        workflows: [
          {
            name: 'Sipariş Onay Süreci',
            model: 'sale.order',
            states: [
              { name: 'draft', label: 'Taslak' },
              { name: 'approved', label: 'Onaylandı' },
            ],
            transitions: [{ from: 'draft', to: 'approved' }],
          },
        ],
        departments: [],
        project_timeline: {
          phases: [],
        },
        document_templates: [],
      }

      const result = validationService.validateKickoffTemplate(template)

      expect(result.valid).toBe(true)
    })

    it('should fail validation when workflow name is missing', () => {
      const template: ExtendedKickoffTemplateData = {
        modules: [
          {
            name: 'Sales',
            technical_name: 'sale',
          },
        ],
        workflows: [
          {
            model: 'sale.order',
            states: [],
            transitions: [],
          } as any,
        ],
        departments: [],
        project_timeline: {
          phases: [],
        },
        document_templates: [],
      }

      const result = validationService.validateKickoffTemplate(template)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Workflow 1: name is required')
    })

    it('should warn when transition state does not exist', () => {
      const template: ExtendedKickoffTemplateData = {
        modules: [
          {
            name: 'Sales',
            technical_name: 'sale',
          },
        ],
        workflows: [
          {
            name: 'Sipariş Onay Süreci',
            model: 'sale.order',
            states: [{ name: 'draft', label: 'Taslak' }],
            transitions: [{ from: 'draft', to: 'non_existent_state' }],
          },
        ],
        departments: [],
        project_timeline: {
          phases: [],
        },
        document_templates: [],
      }

      const result = validationService.validateKickoffTemplate(template)

      expect(result.warnings).toContain(
        "Workflow 1, Transition 1: 'to' state 'non_existent_state' not found in states"
      )
    })

    it('should validate dashboards', () => {
      const template: ExtendedKickoffTemplateData = {
        modules: [
          {
            name: 'Sales',
            technical_name: 'sale',
          },
        ],
        dashboards: [
          {
            name: 'Satış Dashboard',
            view_type: 'graph',
            components: [
              {
                type: 'graph',
                model: 'sale.order',
                fields: ['amount_total'],
              },
            ],
          },
        ],
        departments: [],
        project_timeline: {
          phases: [],
        },
        document_templates: [],
      }

      const result = validationService.validateKickoffTemplate(template)

      expect(result.valid).toBe(true)
    })

    it('should fail validation when dashboard name is missing', () => {
      const template: ExtendedKickoffTemplateData = {
        modules: [
          {
            name: 'Sales',
            technical_name: 'sale',
          },
        ],
        dashboards: [
          {
            view_type: 'graph',
            components: [],
          } as any,
        ],
        departments: [],
        project_timeline: {
          phases: [],
        },
        document_templates: [],
      }

      const result = validationService.validateKickoffTemplate(template)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Dashboard 1: name is required')
    })

    it('should validate departments', () => {
      const template: ExtendedKickoffTemplateData = {
        modules: [
          {
            name: 'Sales',
            technical_name: 'sale',
          },
        ],
        departments: [
          {
            name: 'Üretim',
            technical_name: 'production',
            tasks: [
              {
                title: 'BOM Hazırlama',
                description: 'BOM hazırlama görevi',
                type: 'data_collection',
                priority: 'high',
                due_days: 7,
                estimated_hours: 16,
                required_documents: [],
                requires_approval: false,
                depends_on: [],
                collaborator_departments: [],
              },
            ],
          },
        ],
        project_timeline: {
          phases: [],
        },
        document_templates: [],
      }

      const result = validationService.validateKickoffTemplate(template)

      expect(result.valid).toBe(true)
    })

    it('should fail validation when department name is missing', () => {
      const template: ExtendedKickoffTemplateData = {
        modules: [
          {
            name: 'Sales',
            technical_name: 'sale',
          },
        ],
        departments: [
          {
            technical_name: 'production',
          } as any,
        ],
        project_timeline: {
          phases: [],
        },
        document_templates: [],
      }

      const result = validationService.validateKickoffTemplate(template)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Department 1: name is required')
    })

    it('should fail validation when task title is missing', () => {
      const template: ExtendedKickoffTemplateData = {
        modules: [
          {
            name: 'Sales',
            technical_name: 'sale',
          },
        ],
        departments: [
          {
            name: 'Üretim',
            technical_name: 'production',
            tasks: [
              {
                type: 'data_collection',
                priority: 'high',
                due_days: 7,
                estimated_hours: 16,
                required_documents: [],
                requires_approval: false,
                depends_on: [],
                collaborator_departments: [],
              } as any,
            ],
          },
        ],
        project_timeline: {
          phases: [],
        },
        document_templates: [],
      }

      const result = validationService.validateKickoffTemplate(template)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Department 1, Task 1: title is required')
    })
  })

  describe('validateTemplateForDeployment', () => {
    it('should validate kickoff template type', () => {
      const template: ExtendedKickoffTemplateData = {
        modules: [
          {
            name: 'Sales',
            technical_name: 'sale',
          },
        ],
        departments: [],
        project_timeline: {
          phases: [],
        },
        document_templates: [],
      }

      const result = validationService.validateTemplateForDeployment(template, 'kickoff')

      expect(result.valid).toBe(true)
    })

    it('should return warning for unimplemented template types', () => {
      const template = {}

      const result = validationService.validateTemplateForDeployment(template, 'bom')

      expect(result.valid).toBe(true)
      expect(result.warnings).toContain("Validation for template type 'bom' is not yet implemented")
    })
  })
})
