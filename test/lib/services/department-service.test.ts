import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DepartmentService } from '@/lib/services/department-service'
import { createClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock Supabase client with chainable methods
const createMockSupabase = () => {
  const mockSupabase = {
    from: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    insert: vi.fn(() => mockSupabase),
    update: vi.fn(() => mockSupabase),
    delete: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    order: vi.fn(() => mockSupabase),
    single: vi.fn(),
  }
  return mockSupabase
}

describe('DepartmentService', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabase()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  describe('createDepartment', () => {
    it('should create a department successfully without manager', async () => {
      const mockDepartment = {
        id: 'dept-123',
        company_id: 'company-123',
        name: 'IT Department',
        technical_name: 'it_department',
        description: 'IT Department Description',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      // Mock insert().select().single() chain for department creation
      mockSupabase.insert.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: mockDepartment,
        error: null,
      } as any)

      const service = new DepartmentService()
      const result = await service.createDepartment({
        company_id: 'company-123',
        name: 'IT Department',
        technical_name: 'it_department',
        description: 'IT Department Description',
      })

      expect(result).toBeDefined()
      expect(result.id).toBe('dept-123')
      expect(result.name).toBe('IT Department')
      expect(mockSupabase.insert).toHaveBeenCalled()
    })

    it('should create a department with manager (simplified)', async () => {
      const mockDepartment = {
        id: 'dept-123',
        company_id: 'company-123',
        name: 'IT Department',
        technical_name: 'it_department',
        manager_id: 'user-123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      // Mock insert().select().single() chain for department creation
      mockSupabase.insert.mockReturnValueOnce(mockSupabase)
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.single.mockResolvedValueOnce({
        data: mockDepartment,
        error: null,
      } as any)

      // Mock addMember call - insert().select().single() for member creation
      mockSupabase.insert.mockReturnValueOnce(mockSupabase)
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'member-123',
          department_id: 'dept-123',
          user_id: 'user-123',
          role: 'manager',
          created_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      } as any)

      // Mock updateDepartment call - update().eq().select().single()
      mockSupabase.update.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.single.mockResolvedValueOnce({
        data: mockDepartment,
        error: null,
      } as any)

      // Mock getDepartmentById call inside updateDepartment - select().eq().single()
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'dept-123',
          company_id: 'company-123',
          name: 'IT Department',
          manager_id: null,
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      } as any)

      // Mock delete call inside updateDepartment - delete().eq().eq()
      mockSupabase.delete.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)

      // Mock second addMember call inside updateDepartment - insert().select().single()
      mockSupabase.insert.mockReturnValueOnce(mockSupabase)
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'member-123',
          department_id: 'dept-123',
          user_id: 'user-123',
          role: 'manager',
          created_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      } as any)

      // Mock second updateDepartment call (recursive) - update().eq().select().single()
      mockSupabase.update.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.single.mockResolvedValueOnce({
        data: mockDepartment,
        error: null,
      } as any)

      const service = new DepartmentService()
      const result = await service.createDepartment({
        company_id: 'company-123',
        name: 'IT Department',
        technical_name: 'it_department',
        manager_id: 'user-123',
      })

      expect(result).toBeDefined()
      expect(result.id).toBe('dept-123')
      expect(result.name).toBe('IT Department')
      expect(mockSupabase.insert).toHaveBeenCalled()
    })

    it('should throw error when creation fails', async () => {
      mockSupabase.insert.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      } as any)

      const service = new DepartmentService()
      await expect(
        service.createDepartment({
          company_id: 'company-123',
          name: 'IT Department',
          technical_name: 'it_department',
        })
      ).rejects.toThrow('Failed to create department')
    })
  })

  describe('getDepartmentsByCompany', () => {
    it('should return departments for a company', async () => {
      const mockDepartments = [
        {
          id: 'dept-1',
          company_id: 'company-123',
          name: 'IT Department',
          technical_name: 'it_department',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'dept-2',
          company_id: 'company-123',
          name: 'HR Department',
          technical_name: 'hr_department',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ]

      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.order.mockResolvedValue({
        data: mockDepartments,
        error: null,
      } as any)

      const service = new DepartmentService()
      const result = await service.getDepartmentsByCompany('company-123')

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('IT Department')
      expect(mockSupabase.eq).toHaveBeenCalledWith('company_id', 'company-123')
    })

    it('should return empty array when no departments found', async () => {
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.order.mockResolvedValue({
        data: [],
        error: null,
      } as any)

      const service = new DepartmentService()
      const result = await service.getDepartmentsByCompany('company-123')

      expect(result).toEqual([])
    })
  })

  describe('getDepartmentById', () => {
    it('should return department when found', async () => {
      const mockDepartment = {
        id: 'dept-123',
        company_id: 'company-123',
        name: 'IT Department',
        technical_name: 'it_department',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: mockDepartment,
        error: null,
      } as any)

      const service = new DepartmentService()
      const result = await service.getDepartmentById('dept-123')

      expect(result).toBeDefined()
      expect(result?.id).toBe('dept-123')
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'dept-123')
    })

    it('should return null when department not found', async () => {
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      } as any)

      const service = new DepartmentService()
      const result = await service.getDepartmentById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('addMember', () => {
    it('should add a member to department', async () => {
      // Mock insert().select().single() chain for member creation
      mockSupabase.insert.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'member-123',
          department_id: 'dept-123',
          user_id: 'user-123',
          role: 'member',
          created_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      } as any)

      const service = new DepartmentService()
      const result = await service.addMember('company-123', 'dept-123', 'user-123', 'member')

      expect(result).toBeDefined()
      expect(result.user_id).toBe('user-123')
      expect(mockSupabase.insert).toHaveBeenCalled()
    })

    it('should update department manager_id when role is manager', async () => {
      // Mock insert() fails with duplicate error, then update() succeeds
      mockSupabase.insert.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: '23505', message: 'Duplicate key' },
      } as any)

      // Mock update().eq().eq().select().single() chain
      mockSupabase.update.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'member-123',
          department_id: 'dept-123',
          user_id: 'user-123',
          role: 'manager',
          created_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      } as any)

      // Mock updateDepartment call - update().eq().select().single()
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'dept-123',
          company_id: 'company-123',
          name: 'IT Department',
          manager_id: 'user-123',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      } as any)

      const service = new DepartmentService()
      const result = await service.addMember('company-123', 'dept-123', 'user-123', 'manager')

      expect(result).toBeDefined()
      expect(result.role).toBe('manager')
      expect(mockSupabase.insert).toHaveBeenCalled()
    })
  })
})

