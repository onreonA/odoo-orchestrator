/**
 * User Permissions API Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/user/permissions/route'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock permission helpers
vi.mock('@/lib/utils/permissions', () => ({
  getUserPermissions: vi.fn(),
  getUserRole: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { getUserPermissions, getUserRole } from '@/lib/utils/permissions'

describe('User Permissions API', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  describe('GET /api/user/permissions', () => {
    it('should return user permissions and role', async () => {
      vi.mocked(getUserRole).mockResolvedValue('company_admin')
      vi.mocked(getUserPermissions).mockResolvedValue({
        canViewAllCompanies: false,
        canManageCompanies: false,
        canManageUsers: true,
        canManageProjects: true,
        canViewProjects: true,
        canManageSupportTickets: true,
        canViewSupportTickets: true,
        canManageTemplates: false,
        canViewTemplates: true,
        canManageDiscoveries: true,
        canViewDiscoveries: true,
        canAccessAdminPanel: true,
        canAccessCustomerPortal: true,
      })

      const request = new NextRequest('http://localhost:3001/api/user/permissions')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.role).toBe('company_admin')
      expect(data.data.permissions.canManageUsers).toBe(true)
      expect(data.data.permissions.canAccessAdminPanel).toBe(true)
    })

    it('should return 401 if user not found', async () => {
      vi.mocked(getUserRole).mockResolvedValue(null)
      vi.mocked(getUserPermissions).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3001/api/user/permissions')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('User not found')
    })

    it('should handle errors', async () => {
      vi.mocked(getUserRole).mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3001/api/user/permissions')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Database error')
    })
  })
})

