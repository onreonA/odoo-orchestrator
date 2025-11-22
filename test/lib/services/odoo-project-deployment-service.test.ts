import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OdooProjectDeploymentService } from '@/lib/services/odoo-project-deployment-service'
import { OdooXMLRPCClient } from '@/lib/odoo/xmlrpc-client'
import type {
  ExtendedKickoffTemplateData,
  ProjectCustomizations,
} from '@/lib/types/kickoff-template'

// Mock OdooXMLRPCClient
vi.mock('@/lib/odoo/xmlrpc-client')

describe('OdooProjectDeploymentService', () => {
  let service: OdooProjectDeploymentService
  let mockOdooClient: any

  const mockTemplate: ExtendedKickoffTemplateData = {
    companyName: 'Test Company',
    modules: [],
    departments: [
      {
        name: 'Üretim',
        technical_name: 'production',
        description: 'Üretim departmanı',
        tasks: [
          {
            title: 'F0-01: Proje Organizasyonu',
            description: 'Proje organizasyonu ve iletişim kanalları',
            type: 'organization',
            priority: 'critical',
            due_days: 2,
            estimated_hours: 8,
            required_documents: [],
            requires_approval: false,
            depends_on: [],
            collaborator_departments: [],
            phase: 'FAZ 0: Pre-Analiz',
          },
          {
            title: 'F1-01: Detaylı Analiz',
            description: 'Detaylı analiz yapılması',
            type: 'data_collection',
            priority: 'high',
            due_days: 10,
            estimated_hours: 16,
            required_documents: [],
            requires_approval: false,
            depends_on: [],
            collaborator_departments: [],
            phase: 'FAZ 1: Detaylı Analiz',
            subtasks: [
              {
                title: 'Alt görev 1',
                description: 'Alt görev açıklaması',
                estimated_hours: 4,
                priority: 'medium',
              },
            ],
          },
        ],
      },
    ],
    project_timeline: {
      phases: [
        {
          name: 'FAZ 0: Pre-Analiz',
          description: 'Pre-analiz fazı',
          sequence: 0,
          duration_weeks: 2,
        },
        {
          name: 'FAZ 1: Detaylı Analiz',
          description: 'Detaylı analiz fazı',
          sequence: 1,
          duration_weeks: 4,
        },
        {
          name: 'Tamamlandı',
          description: 'Tamamlanan görevler',
          sequence: 2,
          duration_weeks: 0,
        },
      ],
      milestones: [
        {
          name: 'Pre-Analiz Tamamlandı',
          deadline: '2025-11-25',
          description: 'Pre-analiz raporu tamamlandı',
        },
      ],
    },
    document_templates: [],
  }

  const mockCustomizations: ProjectCustomizations = {
    projectName: 'Test ERP Kurulum Projesi',
    startDate: '2025-11-17',
  }

  beforeEach(() => {
    service = new OdooProjectDeploymentService()
    mockOdooClient = {
      create: vi.fn(),
      search: vi.fn(),
      read: vi.fn(),
    }

    vi.mocked(OdooXMLRPCClient).mockImplementation(() => mockOdooClient as any)
  })

  describe('deployProjectFromTemplate', () => {
    it('should create project, stages, tasks, and milestones', async () => {
      // Mock project creation
      mockOdooClient.create
        .mockResolvedValueOnce(1) // project.project
        .mockResolvedValueOnce(10) // stage 1
        .mockResolvedValueOnce(11) // stage 2
        .mockResolvedValueOnce(12) // stage 3
        .mockResolvedValueOnce(100) // task 1
        .mockResolvedValueOnce(101) // task 2
        .mockResolvedValueOnce(102) // subtask
        .mockResolvedValueOnce(200) // milestone

      // Mock tag search (no existing tags)
      mockOdooClient.search.mockResolvedValue([])

      const result = await service.deployProjectFromTemplate(
        mockOdooClient as any,
        mockTemplate,
        mockCustomizations
      )

      expect(result.projectId).toBe(1)
      expect(result.stageIds).toHaveLength(3)
      expect(result.taskIds).toHaveLength(2)
      expect(result.subtaskIds).toHaveLength(1)
      expect(result.milestoneIds).toHaveLength(1)
      expect(result.errors).toHaveLength(0)

      // Verify project was created
      expect(mockOdooClient.create).toHaveBeenCalledWith(
        'project.project',
        expect.objectContaining({
          name: 'Test ERP Kurulum Projesi',
          use_tasks: true,
          use_subtasks: true,
          allow_milestones: true,
        })
      )

      // Verify stages were created
      expect(mockOdooClient.create).toHaveBeenCalledWith(
        'project.task.type',
        expect.objectContaining({
          name: 'FAZ 0: Pre-Analiz',
          sequence: 0,
        })
      )
    })

    it('should handle errors gracefully', async () => {
      mockOdooClient.create.mockRejectedValueOnce(new Error('Connection failed'))

      await expect(
        service.deployProjectFromTemplate(mockOdooClient as any, mockTemplate, mockCustomizations)
      ).rejects.toThrow('Connection failed')
    })

    it('should use default project name if not provided', async () => {
      const customizationsWithoutName: ProjectCustomizations = {
        projectName: '',
        startDate: '2025-11-17',
      }

      mockOdooClient.create
        .mockResolvedValueOnce(1) // project
        .mockResolvedValueOnce(10) // stage 1
        .mockResolvedValueOnce(11) // stage 2
        .mockResolvedValueOnce(12) // stage 3
        .mockResolvedValueOnce(100) // task 1
        .mockResolvedValueOnce(101) // task 2
        .mockResolvedValueOnce(200) // milestone

      mockOdooClient.search.mockResolvedValue([])

      await service.deployProjectFromTemplate(
        mockOdooClient as any,
        mockTemplate,
        customizationsWithoutName
      )

      expect(mockOdooClient.create).toHaveBeenCalledWith(
        'project.project',
        expect.objectContaining({
          name: 'Test Company ERP Kurulum Projesi',
        })
      )
    })

    it('should calculate deadlines correctly', async () => {
      const startDate = '2025-11-17'
      const customizations: ProjectCustomizations = {
        projectName: 'Test Project',
        startDate,
      }

      mockOdooClient.create
        .mockResolvedValueOnce(1) // project
        .mockResolvedValueOnce(10) // stage 1
        .mockResolvedValueOnce(11) // stage 2
        .mockResolvedValueOnce(12) // stage 3
        .mockResolvedValueOnce(100) // task 1 (due_days: 2)
        .mockResolvedValueOnce(101) // task 2 (due_days: 10)
        .mockResolvedValueOnce(200) // milestone

      mockOdooClient.search.mockResolvedValue([])

      await service.deployProjectFromTemplate(mockOdooClient as any, mockTemplate, customizations)

      // Check that task deadlines are calculated correctly
      const taskCalls = mockOdooClient.create.mock.calls.filter(
        (call: any[]) => call[0] === 'project.task'
      )

      expect(taskCalls[0][1].date_deadline).toBe('2025-11-19') // 2 days after start
      expect(taskCalls[1][1].date_deadline).toBe('2025-11-27') // 10 days after start
    })

    it('should map priorities correctly', async () => {
      mockOdooClient.create
        .mockResolvedValueOnce(1) // project
        .mockResolvedValueOnce(10) // stage 1
        .mockResolvedValueOnce(11) // stage 2
        .mockResolvedValueOnce(12) // stage 3
        .mockResolvedValueOnce(100) // task 1 (critical)
        .mockResolvedValueOnce(101) // task 2 (high)
        .mockResolvedValueOnce(200) // milestone

      mockOdooClient.search.mockResolvedValue([])

      await service.deployProjectFromTemplate(
        mockOdooClient as any,
        mockTemplate,
        mockCustomizations
      )

      const taskCalls = mockOdooClient.create.mock.calls.filter(
        (call: any[]) => call[0] === 'project.task'
      )

      expect(taskCalls[0][1].priority).toBe('3') // critical
      expect(taskCalls[1][1].priority).toBe('2') // high
    })

    it('should create subtasks with parent reference', async () => {
      // Track create calls to get the correct parent task ID
      const createCalls: any[] = []
      mockOdooClient.create.mockImplementation((model: string, data: any) => {
        createCalls.push({ model, data })

        // Return sequential IDs
        if (model === 'project.project') return Promise.resolve(1)
        if (model === 'project.task.type') {
          // Stages: 10, 11, 12
          const stageCount = createCalls.filter(c => c.model === 'project.task.type').length
          return Promise.resolve(10 + stageCount - 1)
        }
        if (model === 'project.task') {
          // Tasks: 100, 101, 102 (subtask)
          const taskCount = createCalls.filter(c => c.model === 'project.task').length
          return Promise.resolve(100 + taskCount - 1)
        }
        if (model === 'project.milestone') return Promise.resolve(200)
        return Promise.resolve(999)
      })

      mockOdooClient.search.mockResolvedValue([])

      await service.deployProjectFromTemplate(
        mockOdooClient as any,
        mockTemplate,
        mockCustomizations
      )

      // Find subtask call (has parent_id)
      const subtaskCall = createCalls.find(
        call => call.model === 'project.task' && call.data.parent_id !== undefined
      )

      expect(subtaskCall).toBeDefined()
      expect(subtaskCall.data.parent_id).toBe(101) // Parent task ID (second task)
      expect(subtaskCall.data.name).toBe('Alt görev 1')
    })

    it('should determine phase from task title if phase not set', async () => {
      const templateWithoutPhase: ExtendedKickoffTemplateData = {
        ...mockTemplate,
        departments: [
          {
            name: 'Test',
            technical_name: 'test',
            tasks: [
              {
                title: 'F0-05: Test Task',
                description: 'Test',
                type: 'data_collection',
                priority: 'medium',
                due_days: 5,
                estimated_hours: 4,
                required_documents: [],
                requires_approval: false,
                depends_on: [],
                collaborator_departments: [],
                // phase not set - should be determined from title
              },
            ],
          },
        ],
      }

      mockOdooClient.create
        .mockResolvedValueOnce(1) // project
        .mockResolvedValueOnce(10) // stage 1 (FAZ 0)
        .mockResolvedValueOnce(11) // stage 2
        .mockResolvedValueOnce(12) // stage 3
        .mockResolvedValueOnce(100) // task
        .mockResolvedValueOnce(200) // milestone

      mockOdooClient.search.mockResolvedValue([])

      await service.deployProjectFromTemplate(
        mockOdooClient as any,
        templateWithoutPhase,
        mockCustomizations
      )

      // Task should be assigned to FAZ 0 stage (stage_id: 10)
      const taskCall = mockOdooClient.create.mock.calls.find(
        (call: any[]) => call[0] === 'project.task'
      )

      expect(taskCall[1].stage_id).toBe(10) // FAZ 0 stage
    })

    it('should format task description with documents and collaborators', async () => {
      const templateWithDocs: ExtendedKickoffTemplateData = {
        ...mockTemplate,
        departments: [
          {
            name: 'Test',
            technical_name: 'test',
            tasks: [
              {
                title: 'Test Task',
                description: 'Ana açıklama',
                type: 'data_collection',
                priority: 'medium',
                due_days: 5,
                estimated_hours: 4,
                required_documents: [
                  {
                    name: 'Test Belgesi',
                    description: 'Test belgesi açıklaması',
                    required: true,
                    format: ['pdf', 'xlsx'],
                  },
                ],
                requires_approval: false,
                depends_on: ['Önceki görev'],
                collaborator_departments: ['hr', 'finance'],
              },
            ],
          },
        ],
      }

      mockOdooClient.create
        .mockResolvedValueOnce(1) // project
        .mockResolvedValueOnce(10) // stage
        .mockResolvedValueOnce(11) // stage
        .mockResolvedValueOnce(12) // stage
        .mockResolvedValueOnce(100) // task
        .mockResolvedValueOnce(200) // milestone

      mockOdooClient.search.mockResolvedValue([])

      await service.deployProjectFromTemplate(
        mockOdooClient as any,
        templateWithDocs,
        mockCustomizations
      )

      const taskCall = mockOdooClient.create.mock.calls.find(
        (call: any[]) => call[0] === 'project.task'
      )

      expect(taskCall[1].description).toContain('Ana açıklama')
      expect(taskCall[1].description).toContain('Gerekli Belgeler')
      expect(taskCall[1].description).toContain('Test Belgesi')
      expect(taskCall[1].description).toContain('İşbirliği Yapılacak Departmanlar')
      expect(taskCall[1].description).toContain('Bağımlılıklar')
    })
  })
})
