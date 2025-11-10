/**
 * Portal Projects API Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/portal/projects/route'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'

describe('Portal Projects API', () => {
  const mockSupabase = {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  describe('GET /api/portal/projects', () => {
    it('should return projects for authenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      // Mock profile query
      const mockProfileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { company_id: 'company-id', role: 'company_user' },
          error: null,
        }),
      }

      // Mock projects query
      const mockProjectsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'project-1',
              name: 'Project 1',
              status: 'in_progress',
              phase: 'development',
              company_id: 'company-id',
              completion_percentage: 75,
              planned_go_live: '2024-12-31',
              actual_go_live: null,
            },
          ],
          error: null,
        }),
      }

      // Mock modules query
      const mockModulesQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [
            { name: 'Sales', status: 'deployed' },
            { name: 'Inventory', status: 'testing' },
          ],
          error: null,
        }),
      }

      mockSupabase.from
        .mockReturnValueOnce(mockProfileQuery) // profiles
        .mockReturnValueOnce(mockProjectsQuery) // projects
        .mockReturnValue(mockModulesQuery) // odoo_modules (for each project)

      const request = new NextRequest('http://localhost:3001/api/portal/projects')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].name).toBe('Project 1')
      expect(data.data[0].progress).toBe(75)
      expect(data.data[0].milestones).toHaveLength(1)
      expect(data.data[0].modules).toHaveLength(2)
      expect(data.data[0].training).toBeDefined()
      expect(data.data[0].dataMigration).toBeDefined()
    })

    it('should return empty array if user has no company', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      const mockProfileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { company_id: null, role: 'company_user' },
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockProfileQuery)

      const request = new NextRequest('http://localhost:3001/api/portal/projects')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
    })

    it('should return 401 for unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const request = new NextRequest('http://localhost:3001/api/portal/projects')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should include milestone with correct status', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      const mockProfileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { company_id: 'company-id', role: 'company_user' },
          error: null,
        }),
      }

      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 10)

      const mockProjectsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'project-1',
              name: 'Project 1',
              status: 'in_progress',
              phase: 'development',
              company_id: 'company-id',
              completion_percentage: 75,
              planned_go_live: pastDate.toISOString().split('T')[0],
              actual_go_live: null,
            },
          ],
          error: null,
        }),
      }

      const mockModulesQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }

      mockSupabase.from
        .mockReturnValueOnce(mockProfileQuery)
        .mockReturnValueOnce(mockProjectsQuery)
        .mockReturnValue(mockModulesQuery)

      const request = new NextRequest('http://localhost:3001/api/portal/projects')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data[0].milestones[0].status).toBe('overdue')
    })
  })
})

