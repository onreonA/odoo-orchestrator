/**
 * Activities API Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/activities/route'

// Mock dependencies
vi.mock('@/lib/services/activity-log-service', () => ({
  ActivityLogService: {
    getActivities: vi.fn(),
    logActivity: vi.fn(),
  },
}))

import { ActivityLogService } from '@/lib/services/activity-log-service'

describe('Activities API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/activities', () => {
    it('should return activities for authenticated user', async () => {
      vi.mocked(ActivityLogService.getActivities).mockResolvedValue({
        data: [
          {
            id: 'log-1',
            action: 'create',
            entity_type: 'document',
            description: 'Document created',
            created_at: new Date().toISOString(),
          },
        ],
        error: null,
      })

      const request = new NextRequest('http://localhost:3001/api/activities')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(data.data.length).toBe(1)
    })

    it('should filter by entityType', async () => {
      vi.mocked(ActivityLogService.getActivities).mockResolvedValue({
        data: [],
        error: null,
      })

      const request = new NextRequest('http://localhost:3001/api/activities?entityType=document')
      await GET(request)

      expect(ActivityLogService.getActivities).toHaveBeenCalledWith({
        entityType: 'document',
      })
    })

    it('should filter by date range', async () => {
      vi.mocked(ActivityLogService.getActivities).mockResolvedValue({
        data: [],
        error: null,
      })

      const startDate = new Date('2024-01-01').toISOString()
      const endDate = new Date('2024-12-31').toISOString()

      const request = new NextRequest(
        `http://localhost:3001/api/activities?startDate=${startDate}&endDate=${endDate}`
      )
      await GET(request)

      expect(ActivityLogService.getActivities).toHaveBeenCalledWith({
        startDate,
        endDate,
      })
    })
  })

  describe('POST /api/activities', () => {
    it('should log activity successfully', async () => {
      vi.mocked(ActivityLogService.logActivity).mockResolvedValue({
        data: {
          id: 'log-1',
          action: 'create',
          entity_type: 'document',
          description: 'Document created',
          created_at: new Date().toISOString(),
        },
        error: null,
      })

      const request = new NextRequest('http://localhost:3001/api/activities', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create',
          entityType: 'document',
          description: 'Document created',
          entityId: 'doc-1',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(data.data.action).toBe('create')
    })

    it('should return 400 if required fields missing', async () => {
      const request = new NextRequest('http://localhost:3001/api/activities', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create',
          // Missing entityType and description
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('required')
    })
  })
})
