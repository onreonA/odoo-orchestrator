/**
 * Admin Users API Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/admin/users/route'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock permission helpers
vi.mock('@/lib/utils/permissions', () => ({
  requireRole: vi.fn(),
  requirePermission: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { requireRole, requirePermission } from '@/lib/utils/permissions'

describe('Admin Users API', () => {
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

  describe('GET /api/admin/users', () => {
    it('should return users for company_admin', async () => {
      vi.mocked(requireRole).mockResolvedValue({
        allowed: true,
        userId: 'user-id',
        role: 'company_admin',
      })

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { company_id: 'company-id', role: 'company_admin' },
          error: null,
        }),
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'user-1',
              email: 'user1@example.com',
              full_name: 'User 1',
              role: 'company_user',
              company_id: 'company-id',
              created_at: '2024-01-01',
            },
            {
              id: 'user-2',
              email: 'user2@example.com',
              full_name: 'User 2',
              role: 'company_user',
              company_id: 'company-id',
              created_at: '2024-01-02',
            },
          ],
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = new NextRequest('http://localhost:3001/api/admin/users')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)
      expect(data.data[0].email).toBe('user1@example.com')
    })

    it('should return all users for super_admin', async () => {
      vi.mocked(requireRole).mockResolvedValue({
        allowed: true,
        userId: 'user-id',
        role: 'super_admin',
      })

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { company_id: null, role: 'super_admin' },
          error: null,
        }),
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'user-1',
              email: 'user1@example.com',
              full_name: 'User 1',
              role: 'company_user',
              company_id: 'company-1',
              created_at: '2024-01-01',
            },
          ],
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const request = new NextRequest('http://localhost:3001/api/admin/users')
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

      const request = new NextRequest('http://localhost:3001/api/admin/users')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBeDefined()
    })
  })

  describe('POST /api/admin/users', () => {
    it('should create user for company_admin', async () => {
      vi.mocked(requirePermission).mockResolvedValue({
        allowed: true,
        userId: 'user-id',
      })

      const mockProfileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { company_id: 'company-id', role: 'company_admin' },
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockProfileQuery)
      mockSupabase.auth = {
        admin: {
          createUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'new-user-id' } },
            error: null,
          }),
          deleteUser: vi.fn().mockResolvedValue({}),
        },
        getUser: vi.fn(),
      } as any

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'new-user-id',
            email: 'newuser@example.com',
            full_name: 'New User',
            role: 'company_user',
            company_id: 'company-id',
          },
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValueOnce(mockProfileQuery).mockReturnValueOnce(mockInsertQuery)

      const request = new NextRequest('http://localhost:3001/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newuser@example.com',
          full_name: 'New User',
          role: 'company_user',
          password: 'password123',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.email).toBe('newuser@example.com')
    })

    it('should return 400 for missing email', async () => {
      vi.mocked(requirePermission).mockResolvedValue({
        allowed: true,
        userId: 'user-id',
      })

      const request = new NextRequest('http://localhost:3001/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          full_name: 'New User',
          role: 'company_user',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Email')
    })

    it('should return 403 for unauthorized user', async () => {
      vi.mocked(requirePermission).mockResolvedValue({
        allowed: false,
        userId: 'user-id',
        reason: 'Permission denied',
      })

      const request = new NextRequest('http://localhost:3001/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newuser@example.com',
          role: 'company_user',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBeDefined()
    })
  })
})

