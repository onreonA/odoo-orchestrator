/**
 * Admin Stats API Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/admin/stats/route'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock permission helpers
vi.mock('@/lib/utils/permissions', () => ({
  requireRole: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/utils/permissions'

describe('Admin Stats API', () => {
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

  describe('GET /api/admin/stats', () => {
    it('should return stats for company_admin', async () => {
      vi.mocked(requireRole).mockResolvedValue({
        allowed: true,
        userId: 'user-id',
        role: 'company_admin',
      })

      // Mock profile query
      const mockProfileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { company_id: 'company-id', role: 'company_admin' },
          error: null,
        }),
      }

      // Mock company query
      const mockCompanyQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { name: 'Test Company' },
          error: null,
        }),
      }

      // Mock projects query - needs to be chainable
      const mockProjectsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      }
      // Make methods return the query itself for chaining
      mockProjectsQuery.select.mockReturnValue(mockProjectsQuery)
      mockProjectsQuery.eq.mockReturnValue(mockProjectsQuery)
      // When awaited, return the final result
      Object.defineProperty(mockProjectsQuery, 'then', {
        value: (resolve: any) =>
          resolve({
            data: [
              { id: 'project-1', status: 'in_progress' },
              { id: 'project-2', status: 'completed' },
              { id: 'project-3', status: 'testing' },
            ],
            error: null,
          }),
        writable: true,
      })

      // Mock users query - needs to be chainable
      const mockUsersQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      }
      mockUsersQuery.select.mockReturnValue(mockUsersQuery)
      mockUsersQuery.eq.mockReturnValue(mockUsersQuery)
      Object.defineProperty(mockUsersQuery, 'then', {
        value: (resolve: any) =>
          resolve({
            data: [{ id: 'user-1' }, { id: 'user-2' }],
            error: null,
          }),
        writable: true,
      })

      // Mock tickets query - needs to be chainable
      const mockTicketsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      }
      mockTicketsQuery.select.mockReturnValue(mockTicketsQuery)
      mockTicketsQuery.eq.mockReturnValue(mockTicketsQuery)
      Object.defineProperty(mockTicketsQuery, 'then', {
        value: (resolve: any) =>
          resolve({
            data: [
              { id: 'ticket-1', status: 'open' },
              { id: 'ticket-2', status: 'in_progress' },
              { id: 'ticket-3', status: 'resolved' },
            ],
            error: null,
          }),
        writable: true,
      })

      // Mock from() to return different queries based on call order
      let callCount = 0
      mockSupabase.from.mockImplementation(() => {
        callCount++
        if (callCount === 1) return mockProfileQuery // profiles
        if (callCount === 2) return mockCompanyQuery // companies
        if (callCount === 3) return mockProjectsQuery // projects
        if (callCount === 4) return mockUsersQuery // profiles (users)
        return mockTicketsQuery // support_tickets
      })

      const request = new NextRequest('http://localhost:3001/api/admin/stats')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.totalProjects).toBe(3)
      expect(data.data.activeProjects).toBe(2) // in_progress + testing
      expect(data.data.completedProjects).toBe(1)
      expect(data.data.totalUsers).toBe(2)
      expect(data.data.openTickets).toBe(2) // open + in_progress
      expect(data.data.resolvedTickets).toBe(1)
      expect(data.data.companyName).toBe('Test Company')
    })

    it('should return stats for super_admin (all companies)', async () => {
      vi.mocked(requireRole).mockResolvedValue({
        allowed: true,
        userId: 'user-id',
        role: 'super_admin',
      })

      const mockProfileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { company_id: null, role: 'super_admin' },
          error: null,
        }),
      }

      const mockProjectsQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [{ id: 'project-1', status: 'in_progress' }],
          error: null,
        }),
      }

      const mockUsersQuery = {
        select: vi.fn().mockResolvedValue({
          data: [{ id: 'user-1' }],
          error: null,
        }),
      }

      const mockTicketsQuery = {
        select: vi.fn().mockResolvedValue({
          data: [{ id: 'ticket-1', status: 'open' }],
          error: null,
        }),
      }

      mockSupabase.from
        .mockReturnValueOnce(mockProfileQuery)
        .mockReturnValueOnce(mockProjectsQuery)
        .mockReturnValueOnce(mockUsersQuery)
        .mockReturnValueOnce(mockTicketsQuery)

      const request = new NextRequest('http://localhost:3001/api/admin/stats')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 403 for unauthorized user', async () => {
      vi.mocked(requireRole).mockResolvedValue({
        allowed: false,
        userId: 'user-id',
        role: 'company_user',
        reason: 'Permission denied',
      })

      const request = new NextRequest('http://localhost:3001/api/admin/stats')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBeDefined()
    })
  })
})
