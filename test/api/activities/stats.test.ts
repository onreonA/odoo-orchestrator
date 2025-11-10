/**
 * Activity Stats API Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/activities/stats/route'

// Mock dependencies
vi.mock('@/lib/services/activity-log-service', () => ({
  ActivityLogService: {
    getActivityStats: vi.fn(),
  },
}))

import { ActivityLogService } from '@/lib/services/activity-log-service'

describe('Activity Stats API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/activities/stats', () => {
    it('should return activity statistics', async () => {
      vi.mocked(ActivityLogService.getActivityStats).mockResolvedValue({
        data: {
          total: 100,
          last24Hours: 10,
          last7Days: 50,
          byAction: {
            create: 40,
            update: 30,
            delete: 20,
            view: 10,
          },
          byEntityType: {
            document: 50,
            project: 30,
            ticket: 20,
          },
        },
        error: null,
      })

      const request = new NextRequest('http://localhost:3001/api/activities/stats')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(data.data.total).toBe(100)
      expect(data.data.last24Hours).toBe(10)
      expect(data.data.byAction).toBeDefined()
      expect(data.data.byEntityType).toBeDefined()
    })

    it('should filter by companyId', async () => {
      vi.mocked(ActivityLogService.getActivityStats).mockResolvedValue({
        data: {
          total: 50,
          last24Hours: 5,
          last7Days: 25,
          byAction: {},
          byEntityType: {},
        },
        error: null,
      })

      const request = new NextRequest('http://localhost:3001/api/activities/stats?companyId=company-1')
      await GET(request)

      expect(ActivityLogService.getActivityStats).toHaveBeenCalledWith('company-1')
    })

    it('should handle errors', async () => {
      vi.mocked(ActivityLogService.getActivityStats).mockResolvedValue({
        data: null,
        error: { message: 'Error fetching stats' },
      })

      const request = new NextRequest('http://localhost:3001/api/activities/stats')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Error fetching stats')
    })
  })
})

