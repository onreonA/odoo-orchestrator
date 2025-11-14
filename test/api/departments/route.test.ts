import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/departments/route'
import { DepartmentService } from '@/lib/services/department-service'

vi.mock('@/lib/supabase/server')
vi.mock('@/lib/services/department-service')

describe('GET /api/departments', () => {
  const mockGetUser = vi.fn()
  const mockFrom = vi.fn()
  const mockSelect = vi.fn()
  const mockEq = vi.fn()
  const mockSingle = vi.fn()

  const mockCreateClient = vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  }))

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(require('@/lib/supabase/server').createClient).mockResolvedValue(
      mockCreateClient() as any
    )
    mockFrom.mockReturnValue({
      select: mockSelect,
    })
    mockSelect.mockReturnValue({
      eq: mockEq,
    })
    mockEq.mockReturnValue({
      single: mockSingle,
    })
  })

  it('should return departments for a company', async () => {
    const mockUser = { id: 'user-123' }
    const mockProfile = {
      id: 'user-123',
      role: 'super_admin',
      company_id: 'company-123',
    }
    const mockDepartments = [
      {
        id: 'dept-1',
        company_id: 'company-123',
        name: 'IT Department',
        technical_name: 'it_department',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ]

    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })
    mockSingle.mockResolvedValue({
      data: mockProfile,
      error: null,
    })

    const mockDepartmentService = {
      getDepartmentsByCompany: vi.fn().mockResolvedValue(mockDepartments),
    }
    vi.mocked(DepartmentService).mockImplementation(() => mockDepartmentService as any)

    const request = new NextRequest('http://localhost:3001/api/departments?company_id=company-123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.departments).toHaveLength(1)
    expect(data.departments[0].name).toBe('IT Department')
  })

  it('should return 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const request = new NextRequest('http://localhost:3001/api/departments?company_id=company-123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 400 when company_id is missing', async () => {
    const mockUser = { id: 'user-123' }
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    const request = new NextRequest('http://localhost:3001/api/departments')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('company_id is required')
  })
})

describe('POST /api/departments', () => {
  const mockGetUser = vi.fn()
  const mockFrom = vi.fn()
  const mockSelect = vi.fn()
  const mockEq = vi.fn()
  const mockSingle = vi.fn()

  const mockCreateClient = vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  }))

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(require('@/lib/supabase/server').createClient).mockResolvedValue(
      mockCreateClient() as any
    )
    mockFrom.mockReturnValue({
      select: mockSelect,
    })
    mockSelect.mockReturnValue({
      eq: mockEq,
    })
    mockEq.mockReturnValue({
      single: mockSingle,
    })
  })

  it('should create a department successfully', async () => {
    const mockUser = { id: 'user-123' }
    const mockProfile = {
      id: 'user-123',
      role: 'super_admin',
      company_id: 'company-123',
    }
    const mockDepartment = {
      id: 'dept-123',
      company_id: 'company-123',
      name: 'IT Department',
      technical_name: 'it_department',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }

    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })
    mockSingle.mockResolvedValue({
      data: mockProfile,
      error: null,
    })

    const mockDepartmentService = {
      createDepartment: vi.fn().mockResolvedValue(mockDepartment),
    }
    vi.mocked(DepartmentService).mockImplementation(() => mockDepartmentService as any)

    const request = new NextRequest('http://localhost:3001/api/departments', {
      method: 'POST',
      body: JSON.stringify({
        company_id: 'company-123',
        name: 'IT Department',
        technical_name: 'it_department',
      }),
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.department).toBeDefined()
    expect(data.department.name).toBe('IT Department')
  })

  it('should return 400 when required fields are missing', async () => {
    const mockUser = { id: 'user-123' }
    const mockProfile = {
      id: 'user-123',
      role: 'super_admin',
      company_id: 'company-123',
    }

    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })
    mockSingle.mockResolvedValue({
      data: mockProfile,
      error: null,
    })

    const request = new NextRequest('http://localhost:3001/api/departments', {
      method: 'POST',
      body: JSON.stringify({
        company_id: 'company-123',
        // Missing name and technical_name
      }),
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('required')
  })
})


