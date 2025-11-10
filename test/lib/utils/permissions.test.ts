/**
 * Permission Helpers Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { requirePermission, requireRole, requireCompanyAccess, requireProjectAccess } from '@/lib/utils/permissions'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock PermissionsService
vi.mock('@/lib/services/permissions-service', () => ({
  PermissionsService: {
    checkPermission: vi.fn(),
    getUserRole: vi.fn(),
    getUserCompanyId: vi.fn(),
    canAccessCompany: vi.fn(),
    canAccessProject: vi.fn(),
  },
}))

import { createClient } from '@/lib/supabase/server'
import { PermissionsService } from '@/lib/services/permissions-service'

describe('Permission Helpers', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  describe('requirePermission', () => {
    it('should return allowed for authorized user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      vi.mocked(PermissionsService.checkPermission).mockResolvedValue({
        allowed: true,
      })

      const result = await requirePermission({
        resource: 'company',
        action: 'view',
      })

      expect(result.allowed).toBe(true)
      expect(result.userId).toBe('user-id')
    })

    it('should return denied for unauthorized user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await requirePermission({
        resource: 'company',
        action: 'view',
      })

      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('Unauthorized')
    })

    it('should return denied when permission check fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      vi.mocked(PermissionsService.checkPermission).mockResolvedValue({
        allowed: false,
        reason: 'Permission denied',
      })

      const result = await requirePermission({
        resource: 'company',
        action: 'delete',
      })

      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('Permission denied')
    })
  })

  describe('requireRole', () => {
    it('should return allowed for authorized role', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      vi.mocked(PermissionsService.getUserRole).mockResolvedValue('company_admin')

      const result = await requireRole(['super_admin', 'company_admin'])

      expect(result.allowed).toBe(true)
      expect(result.role).toBe('company_admin')
    })

    it('should return denied for unauthorized role', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      vi.mocked(PermissionsService.getUserRole).mockResolvedValue('company_user')

      const result = await requireRole(['super_admin', 'company_admin'])

      expect(result.allowed).toBe(false)
      expect(result.role).toBe('company_user')
      expect(result.reason).toContain('not allowed')
    })

    it('should return denied when user not found', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await requireRole(['super_admin'])

      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('Unauthorized')
    })
  })

  describe('requireCompanyAccess', () => {
    it('should return allowed for authorized access', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      vi.mocked(PermissionsService.canAccessCompany).mockResolvedValue(true)

      const result = await requireCompanyAccess('company-id')

      expect(result.allowed).toBe(true)
      expect(result.userId).toBe('user-id')
    })

    it('should return denied for unauthorized access', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      vi.mocked(PermissionsService.canAccessCompany).mockResolvedValue(false)

      const result = await requireCompanyAccess('company-id')

      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('Access denied to this company')
    })
  })

  describe('requireProjectAccess', () => {
    it('should return allowed for authorized access', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      vi.mocked(PermissionsService.canAccessProject).mockResolvedValue(true)

      const result = await requireProjectAccess('project-id')

      expect(result.allowed).toBe(true)
      expect(result.userId).toBe('user-id')
    })

    it('should return denied for unauthorized access', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      vi.mocked(PermissionsService.canAccessProject).mockResolvedValue(false)

      const result = await requireProjectAccess('project-id')

      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('Access denied to this project')
    })
  })
})

