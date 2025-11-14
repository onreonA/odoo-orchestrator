import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TaskService } from '@/lib/services/task-service'
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

describe('TaskService', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabase()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  describe('createTask', () => {
    it('should create a task successfully', async () => {
      const mockTask = {
        id: 'task-123',
        company_id: 'company-123',
        title: 'Test Task',
        description: 'Test Description',
        type: 'kickoff_task',
        status: 'pending',
        priority: 'medium',
        due_date: '2024-12-31T00:00:00Z',
        can_start: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      mockSupabase.insert.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: mockTask,
        error: null,
      } as any)

      const service = new TaskService()
      const result = await service.createTask({
        company_id: 'company-123',
        title: 'Test Task',
        description: 'Test Description',
        type: 'kickoff_task',
        priority: 'medium',
        due_date: '2024-12-31T00:00:00Z',
      })

      expect(result).toBeDefined()
      expect(result.id).toBe('task-123')
      expect(result.title).toBe('Test Task')
      expect(mockSupabase.insert).toHaveBeenCalled()
    })

    it('should create task with dependencies', async () => {
      const mockTask = {
        id: 'task-123',
        company_id: 'company-123',
        title: 'Test Task',
        type: 'kickoff_task',
        status: 'pending',
        priority: 'medium',
        can_start: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      mockSupabase.insert.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValueOnce({
        data: mockTask,
        error: null,
      } as any)

      // Mock dependency insert
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'dep-123',
          task_id: 'task-123',
          depends_on_task_id: 'task-456',
          dependency_type: 'finish_to_start',
        },
        error: null,
      } as any)

      const service = new TaskService()
      const result = await service.createTask({
        company_id: 'company-123',
        title: 'Test Task',
        depends_on: ['task-456'],
      })

      expect(result).toBeDefined()
      expect(mockSupabase.insert).toHaveBeenCalled()
    })

    it('should throw error when creation fails', async () => {
      mockSupabase.insert.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      } as any)

      const service = new TaskService()
      await expect(
        service.createTask({
          company_id: 'company-123',
          title: 'Test Task',
        })
      ).rejects.toThrow('Failed to create task')
    })
  })

  describe('getTaskById', () => {
    it('should return task when found', async () => {
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

      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: mockTask,
        error: null,
      } as any)

      const service = new TaskService()
      const result = await service.getTaskById('task-123')

      expect(result).toBeDefined()
      expect(result?.id).toBe('task-123')
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'task-123')
    })

    it('should return null when task not found', async () => {
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      } as any)

      const service = new TaskService()
      const result = await service.getTaskById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('completeTask', () => {
    it('should complete a task successfully', async () => {
      const mockTask = {
        id: 'task-123',
        status: 'completed',
        completed_at: '2024-01-01T12:00:00Z',
        completed_by: 'user-123',
      }

      mockSupabase.update.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: mockTask,
        error: null,
      } as any)

      const service = new TaskService()
      const result = await service.completeTask('task-123', 'user-123')

      expect(result).toBeDefined()
      expect(result.status).toBe('completed')
      expect(result.completed_by).toBe('user-123')
      expect(mockSupabase.update).toHaveBeenCalled()
    })
  })

  describe('addTaskDependency', () => {
    it('should add a task dependency', async () => {
      mockSupabase.insert.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'dep-123',
          task_id: 'task-123',
          depends_on_task_id: 'task-456',
          dependency_type: 'finish_to_start',
          created_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      } as any)

      const service = new TaskService()
      const result = await service.addTaskDependency('task-123', 'task-456', 'finish_to_start')

      expect(result).toBeDefined()
      expect(result.depends_on_task_id).toBe('task-456')
      expect(mockSupabase.insert).toHaveBeenCalled()
    })
  })
})

