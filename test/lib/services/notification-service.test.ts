import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotificationService } from '@/lib/services/notification-service'
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

describe('NotificationService', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabase()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  describe('sendNotification', () => {
    it('should send a notification successfully', async () => {
      const mockNotification = {
        id: 'notif-123',
        user_id: 'user-123',
        notification_type: 'task',
        detail_type: 'task_assigned',
        title: 'New Task Assigned',
        message: 'You have been assigned a new task',
        is_read: false,
        sent_via: ['email', 'platform'],
        created_at: '2024-01-01T00:00:00Z',
      }

      mockSupabase.insert.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: mockNotification,
        error: null,
      } as any)

      const service = new NotificationService()
      const result = await service.sendNotification({
        user_id: 'user-123',
        detail_type: 'task_assigned',
        title: 'New Task Assigned',
        message: 'You have been assigned a new task',
        sent_via: ['email', 'platform'],
      })

      expect(result).toBeDefined()
      expect(result.id).toBe('notif-123')
      expect(result.detail_type).toBe('task_assigned')
      expect(mockSupabase.insert).toHaveBeenCalled()
    })

    it('should send notification with related task', async () => {
      const mockNotification = {
        id: 'notif-123',
        user_id: 'user-123',
        notification_type: 'task',
        detail_type: 'task_assigned',
        title: 'New Task Assigned',
        message: 'You have been assigned a new task',
        related_task_id: 'task-123',
        is_read: false,
        created_at: '2024-01-01T00:00:00Z',
      }

      mockSupabase.insert.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: mockNotification,
        error: null,
      } as any)

      const service = new NotificationService()
      const result = await service.sendNotification({
        user_id: 'user-123',
        detail_type: 'task_assigned',
        title: 'New Task Assigned',
        message: 'You have been assigned a new task',
        related_task_id: 'task-123',
      })

      expect(result).toBeDefined()
      expect(result.related_task_id).toBe('task-123')
    })

    it('should throw error when sending fails', async () => {
      mockSupabase.insert.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      } as any)

      const service = new NotificationService()
      await expect(
        service.sendNotification({
          user_id: 'user-123',
          detail_type: 'task_assigned',
          title: 'Test',
          message: 'Test message',
        })
      ).rejects.toThrow('Failed to send notification')
    })
  })

  describe('getUserNotifications', () => {
    it('should return notifications for a user', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          user_id: 'user-123',
          notification_type: 'task',
          detail_type: 'task_assigned',
          title: 'Task 1',
          message: 'Message 1',
          is_read: false,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'notif-2',
          user_id: 'user-123',
          notification_type: 'task',
          detail_type: 'task_due',
          title: 'Task 2',
          message: 'Message 2',
          is_read: true,
          created_at: '2024-01-02T00:00:00Z',
        },
      ]

      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.order.mockResolvedValue({
        data: mockNotifications,
        error: null,
      } as any)

      const service = new NotificationService()
      const result = await service.getUserNotifications('user-123')

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('notif-1')
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-123')
    })
  })

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const mockNotification = {
        id: 'notif-123',
        is_read: true,
        read_at: '2024-01-01T12:00:00Z',
      }

      mockSupabase.update.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: mockNotification,
        error: null,
      } as any)

      const service = new NotificationService()
      const result = await service.markAsRead('notif-123')

      expect(result).toBeDefined()
      expect(result.is_read).toBe(true)
      expect(mockSupabase.update).toHaveBeenCalled()
    })
  })
})
