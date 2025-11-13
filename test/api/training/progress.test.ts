/**
 * Training Progress API Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/training/progress/route'

// Mock dependencies
vi.mock('@/lib/services/training-service', () => ({
  TrainingService: {
    getUserProgress: vi.fn(),
    updateProgress: vi.fn(),
  },
}))

import { TrainingService } from '@/lib/services/training-service'

describe('Training Progress API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/training/progress', () => {
    it('should return training progress for authenticated user', async () => {
      vi.mocked(TrainingService.getUserProgress).mockResolvedValue({
        data: [
          {
            id: 'progress-1',
            user_id: 'user-id',
            material_id: 'material-1',
            status: 'in_progress',
            progress_percentage: 50,
          },
        ],
        error: null,
      })

      const request = new NextRequest('http://localhost:3001/api/training/progress')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(data.data.length).toBe(1)
    })
  })

  describe('POST /api/training/progress', () => {
    it('should update training progress successfully', async () => {
      vi.mocked(TrainingService.updateProgress).mockResolvedValue({
        data: {
          id: 'progress-1',
          user_id: 'user-id',
          material_id: 'material-1',
          progress_percentage: 75,
          status: 'in_progress',
        },
        error: null,
      })

      const request = new NextRequest('http://localhost:3001/api/training/progress', {
        method: 'POST',
        body: JSON.stringify({
          materialId: 'material-1',
          progress: {
            progress_percentage: 75,
            status: 'in_progress',
          },
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(data.data.progress_percentage).toBe(75)
    })

    it('should return 400 if materialId missing', async () => {
      const request = new NextRequest('http://localhost:3001/api/training/progress', {
        method: 'POST',
        body: JSON.stringify({
          progress: {
            progress_percentage: 75,
          },
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('materialId')
    })
  })
})
