import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TemplateDeploymentEngine } from '@/lib/services/template-deployment-engine'
import { createClient } from '@/lib/supabase/server'
import { getOdooInstanceService } from '@/lib/services/odoo-instance-service'
import { getEncryptionService } from '@/lib/services/encryption-service'

vi.mock('@/lib/supabase/server')
vi.mock('@/lib/services/odoo-instance-service')
vi.mock('@/lib/services/encryption-service')

describe('TemplateDeploymentEngine', () => {
  const mockSupabase = {
    from: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    insert: vi.fn(() => mockSupabase),
    update: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    single: vi.fn(),
  }

  const mockInstanceService = {
    getInstanceById: vi.fn(),
    createBackup: vi.fn(),
  }

  const mockEncryptionService = {
    decryptOdooCredentials: vi.fn((creds: any) => ({
      username: creds.username,
      password: 'decrypted_password',
    })),
  }

  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.mocked(getOdooInstanceService).mockReturnValue(mockInstanceService as any)
    vi.mocked(getEncryptionService).mockReturnValue(mockEncryptionService as any)
    vi.clearAllMocks()
  })

  describe('deployTemplate', () => {
    it('should create deployment record', async () => {
      const mockInstance = {
        id: 'instance-123',
        instance_url: 'https://test.odoo.com',
        database_name: 'test_db',
        admin_username: 'admin',
        admin_password_encrypted: 'encrypted_password',
      }

      const mockBackup = {
        id: 'backup-123',
        instance_id: 'instance-123',
        status: 'completed',
      }

      mockInstanceService.getInstanceById.mockResolvedValue(mockInstance as any)
      mockInstanceService.createBackup.mockResolvedValue(mockBackup as any)

      mockSupabase.insert.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'deployment-123',
          instance_id: 'instance-123',
          template_id: 'template-123',
          template_type: 'kickoff',
          status: 'pending',
          progress: 0,
        },
        error: null,
      })

      const engine = new TemplateDeploymentEngine()
      const result = await engine.deployTemplate({
        instanceId: 'instance-123',
        templateId: 'template-123',
        templateType: 'kickoff',
        userId: 'user-123',
      })

      expect(result.deploymentId).toBeDefined()
      expect(result.status).toBe('pending')
      expect(mockSupabase.insert).toHaveBeenCalled()
    })

    it('should throw error if instance not found', async () => {
      mockInstanceService.getInstanceById.mockResolvedValue(null)

      const engine = new TemplateDeploymentEngine()

      await expect(
        engine.deployTemplate({
          instanceId: 'non-existent',
          templateId: 'template-123',
          templateType: 'kickoff',
          userId: 'user-123',
        })
      ).rejects.toThrow('Instance not found')
    })
  })

  describe('getDeploymentStatus', () => {
    it('should return deployment status', async () => {
      const mockDeployment = {
        id: 'deployment-123',
        status: 'in_progress',
        progress: 50,
        current_step: 'Installing modules',
        error_message: null,
        started_at: '2024-01-01T00:00:00Z',
        completed_at: null,
        duration_seconds: null,
      }

      mockSupabase.single.mockResolvedValue({
        data: mockDeployment,
        error: null,
      })

      const engine = new TemplateDeploymentEngine()
      const status = await engine.getDeploymentStatus('deployment-123')

      expect(status.deploymentId).toBe('deployment-123')
      expect(status.status).toBe('in_progress')
      expect(status.progress).toBe(50)
      expect(status.currentStep).toBe('Installing modules')
    })

    it('should throw error if deployment not found', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      })

      const engine = new TemplateDeploymentEngine()

      await expect(engine.getDeploymentStatus('non-existent')).rejects.toThrow(
        'Deployment not found'
      )
    })
  })

  describe('getDeploymentLogs', () => {
    it('should return deployment logs', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          deployment_id: 'deployment-123',
          level: 'info',
          message: 'Deployment started',
          details: {},
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'log-2',
          deployment_id: 'deployment-123',
          level: 'error',
          message: 'Module installation failed',
          details: { module: 'sale' },
          created_at: '2024-01-01T00:01:00Z',
        },
      ]

      mockSupabase.select.mockResolvedValue({
        data: mockLogs,
        error: null,
      })

      const engine = new TemplateDeploymentEngine()
      const logs = await engine.getDeploymentLogs('deployment-123')

      expect(logs).toHaveLength(2)
      expect(logs[0].level).toBe('info')
      expect(logs[1].level).toBe('error')
    })
  })
})
