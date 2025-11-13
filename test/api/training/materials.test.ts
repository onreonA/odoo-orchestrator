/**
 * Training Materials API Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/training/materials/route'

// Mock dependencies
vi.mock('@/lib/services/training-service', () => ({
  TrainingService: {
    getMaterials: vi.fn(),
    createMaterial: vi.fn(),
  },
}))

import { TrainingService } from '@/lib/services/training-service'

describe('Training Materials API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/training/materials', () => {
    it('should return training materials for authenticated user', async () => {
      vi.mocked(TrainingService.getMaterials).mockResolvedValue({
        data: [
          {
            id: 'material-1',
            title: 'Odoo Temelleri',
            description: 'Temel kullanım',
            type: 'document',
            category: 'general',
          },
        ],
        error: null,
      })

      const request = new NextRequest('http://localhost:3001/api/training/materials')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(data.data.length).toBe(1)
    })

    it('should filter by category', async () => {
      vi.mocked(TrainingService.getMaterials).mockResolvedValue({
        data: [],
        error: null,
      })

      const request = new NextRequest(
        'http://localhost:3001/api/training/materials?category=odoo-basics'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(TrainingService.getMaterials).toHaveBeenCalledWith({
        category: 'odoo-basics',
      })
    })
  })

  describe('POST /api/training/materials', () => {
    it('should create training material successfully', async () => {
      vi.mocked(TrainingService.createMaterial).mockResolvedValue({
        data: {
          id: 'material-1',
          title: 'Yeni Materyal',
          description: 'Açıklama',
          type: 'document',
        },
        error: null,
      })

      const request = new NextRequest('http://localhost:3001/api/training/materials', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Yeni Materyal',
          description: 'Açıklama',
          type: 'document',
          content_url: 'https://example.com',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
    })

    it('should return 400 if required fields missing', async () => {
      vi.mocked(TrainingService.createMaterial).mockResolvedValue({
        data: null,
        error: { message: 'Missing required fields' },
      })

      const request = new NextRequest('http://localhost:3001/api/training/materials', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })
  })
})
