import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DeploymentMonitoringService } from '@/lib/services/deployment-monitoring-service'
import { createClient } from '@/lib/supabase/server'
import { getTemplateDeploymentEngine } from '@/lib/services/template-deployment-engine'

vi.mock('@/lib/supabase/server')
vi.mock('@/lib/services/template-deployment-engine')

describe('DeploymentMonitoringService', () => {
  const createMockSupabase = () => {
    const createSelectChain = () => ({
      select: vi.fn(() => createSelectChain()),
      eq: vi.fn(() => createSelectChain()),
      in: vi.fn(() => createSelectChain()),
      order: vi.fn(() => createSelectChain()),
      limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
      gte: vi.fn(() => createSelectChain()),
      lte: vi.fn(() => createSelectChain()),
      range: vi.fn(() => Promise.resolve({ data: [], error: null })),
      single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })

    return {
      from: vi.fn(() => createSelectChain()),
    }
  }

  let mockSupabase: ReturnType<typeof createMockSupabase>

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabase()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  describe('getDeploymentStatus', () => {
    it('should return deployment status', async () => {
      const mockDeployment = {
        id: 'deployment-123',
        status: 'success',
        progress: 100,
        current_step: 'Completed',
        error_message: null,
        started_at: '2024-01-01T00:00:00Z',
        completed_at: '2024-01-01T00:05:00Z',
        duration_seconds: 300,
      }

      const originalFrom = mockSupabase.from
      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'template_deployments') {
          return {
            select: vi.fn(() => {
              const chain: any = {
                eq: vi.fn(() => chain),
                single: vi.fn(() => Promise.resolve({
                  data: mockDeployment,
                  error: null,
                })),
              }
              return chain
            }),
          }
        }
        return originalFrom(table)
      })

      const service = new DeploymentMonitoringService()
      const status = await service.getDeploymentStatus('deployment-123')

      expect(status.deploymentId).toBe('deployment-123')
      expect(status.status).toBe('success')
      expect(status.progress).toBe(100)
      expect(status.durationSeconds).toBe(300)
    })

    it('should throw error if deployment not found', async () => {
      const originalFrom = mockSupabase.from
      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'template_deployments') {
          return {
            select: vi.fn(() => {
              const chain: any = {
                eq: vi.fn(() => chain),
                single: vi.fn(() => Promise.resolve({
                  data: null,
                  error: { message: 'Not found' },
                })),
              }
              return chain
            }),
          }
        }
        return originalFrom(table)
      })

      const service = new DeploymentMonitoringService()

      await expect(service.getDeploymentStatus('non-existent')).rejects.toThrow(
        'Deployment not found'
      )
    })
  })

  describe('getDeploymentLogs', () => {
    it('should return filtered logs', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          deployment_id: 'deployment-123',
          level: 'info',
          message: 'Info log',
          details: {},
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'log-2',
          deployment_id: 'deployment-123',
          level: 'error',
          message: 'Error log',
          details: {},
          created_at: '2024-01-01T00:01:00Z',
        },
      ]

      const originalFrom = mockSupabase.from
      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'deployment_logs') {
          return {
            select: vi.fn(() => {
              const chain: any = {
                eq: vi.fn(() => chain),
                order: vi.fn(() => chain),
                limit: vi.fn(() => Promise.resolve({
                  data: mockLogs,
                  error: null,
                })),
              }
              return chain
            }),
          }
        }
        return originalFrom(table)
      })

      const service = new DeploymentMonitoringService()
      const logs = await service.getDeploymentLogs('deployment-123', {
        level: 'error',
        limit: 10,
      })

      expect(logs).toBeDefined()
      expect(Array.isArray(logs)).toBe(true)
    })
  })

  describe('getDeploymentMetrics', () => {
    it('should calculate deployment metrics', async () => {
      const mockDeployments = [
        {
          id: 'deployment-1',
          template_type: 'kickoff',
          status: 'success',
          duration_seconds: 300,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'deployment-2',
          template_type: 'kickoff',
          status: 'failed',
          duration_seconds: null,
          created_at: '2024-01-02T00:00:00Z',
        },
        {
          id: 'deployment-3',
          template_type: 'bom',
          status: 'success',
          duration_seconds: 200,
          created_at: '2024-01-03T00:00:00Z',
        },
      ]

      const originalFrom = mockSupabase.from
      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'template_deployments') {
          const queryResult = Promise.resolve({
            data: mockDeployments,
            error: null,
          })
          
          return {
            select: vi.fn(() => {
              const chain: any = {
                eq: vi.fn(() => chain),
                gte: vi.fn(() => chain),
                lte: vi.fn(() => chain),
                order: vi.fn(() => queryResult),
              }
              // Make chain itself thenable
              chain.then = queryResult.then.bind(queryResult)
              chain.catch = queryResult.catch.bind(queryResult)
              return chain
            }),
          }
        }
        return originalFrom(table)
      })

      const service = new DeploymentMonitoringService()
      const metrics = await service.getDeploymentMetrics()

      expect(metrics.totalDeployments).toBe(3)
      expect(metrics.successfulDeployments).toBe(2)
      expect(metrics.failedDeployments).toBe(1)
      expect(metrics.deploymentsByType.kickoff).toBe(2)
      expect(metrics.deploymentsByType.bom).toBe(1)
    })
  })

  describe('getActiveDeployments', () => {
    it('should return active deployments', async () => {
      const mockDeployments = [
        {
          id: 'deployment-1',
          status: 'in_progress',
          progress: 50,
          current_step: 'Installing modules',
          error_message: null,
          started_at: '2024-01-01T00:00:00Z',
          completed_at: null,
          duration_seconds: null,
        },
        {
          id: 'deployment-2',
          status: 'pending',
          progress: 0,
          current_step: null,
          error_message: null,
          started_at: null,
          completed_at: null,
          duration_seconds: null,
        },
      ]

      const originalFrom = mockSupabase.from
      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'template_deployments') {
          return {
            select: vi.fn(() => {
              const chain: any = {
                in: vi.fn(() => chain),
                order: vi.fn(() => Promise.resolve({
                  data: mockDeployments,
                  error: null,
                })),
              }
              return chain
            }),
          }
        }
        return originalFrom(table)
      })

      const service = new DeploymentMonitoringService()
      const active = await service.getActiveDeployments()

      expect(active).toHaveLength(2)
      expect(active[0].status).toBe('in_progress')
      expect(active[1].status).toBe('pending')
    })
  })
})
