import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/tasks/route'
import { TaskService } from '@/lib/services/task-service'

vi.mock('@/lib/supabase/server')
vi.mock('@/lib/services/task-service')

describe('GET /api/tasks', () => {
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

  it('should return tasks for a company', async () => {
    const mockUser = { id: 'user-123' }
    const mockProfile = {
      id: 'user-123',
      role: 'super_admin',
      company_id: 'company-123',
    }
    const mockTasks = [
      {
        id: 'task-1',
        company_id: 'company-123',
        title: 'Test Task',
        type: 'kickoff_task',
        status: 'pending',
        priority: 'medium',
        can_start: true,
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

    const mockTaskService = {
      getTasks: vi.fn().mockResolvedValue(mockTasks),
    }
    vi.mocked(TaskService).mockImplementation(() => mockTaskService as any)

    const request = new NextRequest('http://localhost:3001/api/tasks?company_id=company-123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.tasks).toHaveLength(1)
    expect(data.tasks[0].title).toBe('Test Task')
  })

  it('should return 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const request = new NextRequest('http://localhost:3001/api/tasks?company_id=company-123')
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

    const request = new NextRequest('http://localhost:3001/api/tasks')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('company_id is required')
  })
})

describe('POST /api/tasks', () => {
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

  it('should create a task successfully', async () => {
    const mockUser = { id: 'user-123' }
    const mockProfile = {
      id: 'user-123',
      role: 'super_admin',
      company_id: 'company-123',
    }
    const mockTask = {
      id: 'task-123',
      company_id: 'company-123',
      title: 'Test Task',
      type: 'kickoff_task',
      status: 'pending',
      priority: 'medium',
      can_start: true,
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

    const mockTaskService = {
      createTask: vi.fn().mockResolvedValue(mockTask),
    }
    vi.mocked(TaskService).mockImplementation(() => mockTaskService as any)

    const request = new NextRequest('http://localhost:3001/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        company_id: 'company-123',
        title: 'Test Task',
      }),
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.task).toBeDefined()
    expect(data.task.title).toBe('Test Task')
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

    const request = new NextRequest('http://localhost:3001/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        company_id: 'company-123',
        // Missing title
      }),
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('required')
  })
})


