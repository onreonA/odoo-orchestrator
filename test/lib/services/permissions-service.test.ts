/**
 * Permissions Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PermissionsService } from '@/lib/services/permissions-service'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'

describe('PermissionsService', () => {
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

  describe('getUserRole', () => {
    it('should return user role', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { role: 'company_admin' },
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const role = await PermissionsService.getUserRole('user-id')

      expect(role).toBe('company_admin')
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
      expect(mockQuery.select).toHaveBeenCalledWith('role')
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'user-id')
      expect(mockQuery.single).toHaveBeenCalled()
    })

    it('should return null if user not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const role = await PermissionsService.getUserRole('user-id')

      expect(role).toBeNull()
    })
  })

  describe('getUserCompanyId', () => {
    it('should return company_id', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { company_id: 'company-id' },
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const companyId = await PermissionsService.getUserCompanyId('user-id')

      expect(companyId).toBe('company-id')
    })

    it('should return null if company_id not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { company_id: null },
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const companyId = await PermissionsService.getUserCompanyId('user-id')

      expect(companyId).toBeNull()
    })
  })

  describe('getPermissionsForRole', () => {
    it('should return correct permissions for super_admin', () => {
      const permissions = PermissionsService.getPermissionsForRole('super_admin')

      expect(permissions.canViewAllCompanies).toBe(true)
      expect(permissions.canManageCompanies).toBe(true)
      expect(permissions.canManageUsers).toBe(true)
      expect(permissions.canManageProjects).toBe(true)
      expect(permissions.canAccessAdminPanel).toBe(true)
    })

    it('should return correct permissions for company_admin', () => {
      const permissions = PermissionsService.getPermissionsForRole('company_admin')

      expect(permissions.canViewAllCompanies).toBe(false)
      expect(permissions.canManageCompanies).toBe(false) // Only own company
      expect(permissions.canManageUsers).toBe(true)
      expect(permissions.canManageProjects).toBe(true)
      expect(permissions.canAccessAdminPanel).toBe(true)
    })

    it('should return correct permissions for company_user', () => {
      const permissions = PermissionsService.getPermissionsForRole('company_user')

      expect(permissions.canViewAllCompanies).toBe(false)
      expect(permissions.canManageCompanies).toBe(false)
      expect(permissions.canManageUsers).toBe(false)
      expect(permissions.canManageProjects).toBe(false)
      expect(permissions.canViewProjects).toBe(true)
      expect(permissions.canAccessAdminPanel).toBe(false)
      expect(permissions.canAccessCustomerPortal).toBe(true)
    })

    it('should return correct permissions for company_viewer', () => {
      const permissions = PermissionsService.getPermissionsForRole('company_viewer')

      expect(permissions.canViewAllCompanies).toBe(false)
      expect(permissions.canManageCompanies).toBe(false)
      expect(permissions.canManageUsers).toBe(false)
      expect(permissions.canManageProjects).toBe(false)
      expect(permissions.canViewProjects).toBe(true)
      expect(permissions.canManageSupportTickets).toBe(false)
      expect(permissions.canAccessAdminPanel).toBe(false)
      expect(permissions.canAccessCustomerPortal).toBe(true)
    })
  })

  describe('checkPermission', () => {
    beforeEach(() => {
      // Mock getUserRole
      vi.spyOn(PermissionsService, 'getUserRole').mockResolvedValue('company_admin')
      vi.spyOn(PermissionsService, 'getUserCompanyId').mockResolvedValue('company-id')
    })

    it('should allow super_admin for all actions', async () => {
      vi.spyOn(PermissionsService, 'getUserRole').mockResolvedValue('super_admin')

      const result = await PermissionsService.checkPermission('user-id', {
        resource: 'company',
        action: 'delete',
        resourceId: 'any-company-id',
      })

      expect(result.allowed).toBe(true)
    })

    it('should check company access for company_admin', async () => {
      // Company admin can manage their own company
      // The check compares userCompanyId with resourceId
      // But canManageCompanies is false for company_admin, so it will return false
      // This is correct behavior - company_admin should use canAccessCompany instead
      vi.spyOn(PermissionsService, 'getUserCompanyId').mockResolvedValue('company-id')

      const result = await PermissionsService.checkPermission('user-id', {
        resource: 'company',
        action: 'update',
        resourceId: 'company-id', // Same company
      })

      // Company admin has canManageCompanies = false, so checkPermission returns false
      // This is expected - use canAccessCompany for company-level checks
      expect(result.allowed).toBe(false)
    })

    it('should deny access for different company', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { company_id: 'other-company-id' },
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await PermissionsService.checkPermission('user-id', {
        resource: 'company',
        action: 'update',
        resourceId: 'different-company-id',
      })

      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('own company')
    })

    it('should check project access', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { company_id: 'company-id' },
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await PermissionsService.checkPermission('user-id', {
        resource: 'project',
        action: 'view',
        resourceId: 'project-id',
      })

      expect(result.allowed).toBe(true)
    })
  })

  describe('canAccessCompany', () => {
    it('should allow super_admin for all companies', async () => {
      vi.spyOn(PermissionsService, 'getUserRole').mockResolvedValue('super_admin')

      const canAccess = await PermissionsService.canAccessCompany('user-id', 'any-company-id')

      expect(canAccess).toBe(true)
    })

    it('should allow company_admin for own company', async () => {
      vi.spyOn(PermissionsService, 'getUserRole').mockResolvedValue('company_admin')
      vi.spyOn(PermissionsService, 'getUserCompanyId').mockResolvedValue('company-id')

      const canAccess = await PermissionsService.canAccessCompany('user-id', 'company-id')

      expect(canAccess).toBe(true)
    })

    it('should deny company_admin for different company', async () => {
      vi.spyOn(PermissionsService, 'getUserRole').mockResolvedValue('company_admin')
      vi.spyOn(PermissionsService, 'getUserCompanyId').mockResolvedValue('company-id')

      const canAccess = await PermissionsService.canAccessCompany('user-id', 'other-company-id')

      expect(canAccess).toBe(false)
    })
  })

  describe('canAccessProject', () => {
    it('should allow super_admin for all projects', async () => {
      vi.spyOn(PermissionsService, 'getUserRole').mockResolvedValue('super_admin')

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { company_id: 'any-company-id' },
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const canAccess = await PermissionsService.canAccessProject('user-id', 'project-id')

      expect(canAccess).toBe(true)
    })

    it('should allow access for own company project', async () => {
      vi.spyOn(PermissionsService, 'getUserRole').mockResolvedValue('company_admin')
      vi.spyOn(PermissionsService, 'getUserCompanyId').mockResolvedValue('company-id')

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { company_id: 'company-id' },
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const canAccess = await PermissionsService.canAccessProject('user-id', 'project-id')

      expect(canAccess).toBe(true)
    })

    it('should deny access for different company project', async () => {
      vi.spyOn(PermissionsService, 'getUserRole').mockResolvedValue('company_admin')
      vi.spyOn(PermissionsService, 'getUserCompanyId').mockResolvedValue('company-id')

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { company_id: 'other-company-id' },
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const canAccess = await PermissionsService.canAccessProject('user-id', 'project-id')

      expect(canAccess).toBe(false)
    })
  })
})

