import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotificationService } from '@/lib/services/notification-service'
import { createClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

const createMockSupabase = () => {
  const insertChain = {
    insert: vi.fn(() => insertChain),
  }

  const selectChain = {
    select: vi.fn(() => selectChain),
    eq: vi.fn(() => selectChain),
    order: vi.fn(() => selectChain),
    limit: vi.fn(() => selectChain),
  }

  const updateChain = {
    update: vi.fn(() => updateChain),
    eq: vi.fn(() => updateChain),
  }

  return {
    from: vi.fn((table: string) => {
      if (table === 'notifications') {
        return {
          insert: vi.fn(() => ({ data: null, error: null })),
          select: vi.fn(() => selectChain),
          update: vi.fn(() => updateChain),
        }
      }
      return selectChain
    }),
  }
}

describe('NotificationService', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabase()
    vi.mocked(createClient).mockReturnValue(mockSupabase as any)
  })

  describe('sendNotification', () => {
    it('should send a notification successfully', async () => {
      const service = new NotificationService()

      await service.sendNotification({
        userId: 'user-123',
        title: 'Test Notification',
        message: 'Test message',
        notificationType: 'test',
      })

      expect(mockSupabase.from).toHaveBeenCalledWith('notifications')
    })

    it('should throw error on failure', async () => {
      const errorSupabase = {
        from: vi.fn(() => ({
          insert: vi.fn(() => ({ error: { message: 'Insert failed' } })),
        })),
      }
      vi.mocked(createClient).mockReturnValue(errorSupabase as any)

      const service = new NotificationService()

      await expect(
        service.sendNotification({
          userId: 'user-123',
          title: 'Test',
          message: 'Test',
          notificationType: 'test',
        })
      ).rejects.toThrow('Failed to send notification')
    })
  })

  describe('getUserNotifications', () => {
    it('should get notifications for a user', async () => {
      const mockNotifications = [
        { id: 'notif-1', user_id: 'user-123', title: 'Test 1', message: 'Message 1' },
        { id: 'notif-2', user_id: 'user-123', title: 'Test 2', message: 'Message 2' },
      ]

      const queryChain = mockSupabase.from('notifications').select() as any
      queryChain.limit.mockResolvedValue({
        data: mockNotifications,
        error: null,
      })

      const service = new NotificationService()
      const result = await service.getUserNotifications('user-123', 50)

      expect(mockSupabase.from).toHaveBeenCalledWith('notifications')
    })
  })

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const updateChain = mockSupabase.from('notifications').update() as any
      updateChain.eq.mockResolvedValue({ error: null })

      const service = new NotificationService()
      await service.markAsRead('notif-123')

      expect(mockSupabase.from).toHaveBeenCalledWith('notifications')
    })
  })

  describe('getUnreadCount', () => {
    it('should get unread notifications count', async () => {
      const queryChain = mockSupabase.from('notifications').select() as any
      queryChain.eq.mockReturnValue(queryChain)
      queryChain.select.mockResolvedValue({
        count: 5,
        error: null,
      })

      const service = new NotificationService()
      const count = await service.getUnreadCount('user-123')

      expect(mockSupabase.from).toHaveBeenCalledWith('notifications')
    })
  })
})
