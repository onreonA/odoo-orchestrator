import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MessagingService } from '@/lib/services/messaging-service'
import { createClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Create a chainable query mock
const createChainableQuery = (finalResult: any) => {
  const query = {
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    select: vi.fn(() => query),
    insert: vi.fn(() => query),
    update: vi.fn(() => query),
    delete: vi.fn(() => query),
    single: vi.fn(() => Promise.resolve(finalResult)),
    contains: vi.fn(() => query),
    limit: vi.fn(() => query),
    range: vi.fn(() => query),
    neq: vi.fn(() => query),
  }
  // Make query methods return the query itself for chaining
  query.order.mockImplementation(() => query)
  query.eq.mockImplementation(() => query)
  query.contains.mockImplementation(() => query)
  query.limit.mockImplementation(() => query)
  query.range.mockImplementation(() => query)
  query.neq.mockImplementation(() => query)
  // When awaited, return the final result
  Object.defineProperty(query, 'then', {
    value: (resolve: any) => resolve(finalResult),
    writable: true,
  })
  return query
}

const createMockSupabase = () => {
  const mockSupabase = {
    from: vi.fn(),
  }
  return mockSupabase
}

describe('MessagingService', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>

  beforeEach(() => {
    mockSupabase = createMockSupabase()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  describe('getThreads', () => {
    it('should fetch threads for user', async () => {
      const mockThreads = [
        {
          id: 'thread-1',
          title: 'Test Thread',
          thread_type: 'direct',
          participants: ['user-123'],
        },
      ]

      const query = createChainableQuery({ data: mockThreads, error: null })
      mockSupabase.from.mockReturnValue(query)

      const result = await MessagingService.getThreads('user-123')

      expect(mockSupabase.from).toHaveBeenCalledWith('message_threads')
      expect(query.contains).toHaveBeenCalledWith('participants', ['user-123'])
      expect(result.data).toEqual(mockThreads)
    })
  })

  describe('getMessages', () => {
    it('should fetch messages for thread', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          thread_id: 'thread-1',
          sender_id: 'user-123',
          content: 'Test message',
          message_type: 'text',
        },
      ]

      const query = createChainableQuery({ data: mockMessages, error: null })
      mockSupabase.from.mockReturnValue(query)

      const result = await MessagingService.getMessages('thread-1')

      expect(mockSupabase.from).toHaveBeenCalledWith('messages')
      expect(query.eq).toHaveBeenCalledWith('thread_id', 'thread-1')
      expect(result.data).toEqual(mockMessages)
    })
  })

  describe('createMessage', () => {
    it('should create message with attachments', async () => {
      const input = {
        thread_id: 'thread-1',
        content: 'Test message',
        attachments: [
          {
            name: 'test.pdf',
            url: 'https://example.com/test.pdf',
            size: 1024,
            type: 'application/pdf',
          },
        ],
      }

      const mockMessage = {
        id: 'msg-1',
        ...input,
        sender_id: 'user-123',
        message_type: 'text',
        ai_enhanced: false,
        read_by: ['user-123'],
        created_at: new Date().toISOString(),
      }

      const mockThread = {
        id: 'thread-1',
        participants: ['user-123', 'user-456'],
        unread_count: 0,
      }

      // Mock message insert
      const insertQuery = createChainableQuery({ data: mockMessage, error: null })
      insertQuery.select.mockReturnValue(insertQuery)
      insertQuery.single.mockResolvedValue({ data: mockMessage, error: null })
      mockSupabase.from.mockReturnValueOnce(insertQuery)

      // Mock thread get (for unread count update)
      const threadQuery = createChainableQuery({ data: mockThread, error: null })
      mockSupabase.from.mockReturnValueOnce(threadQuery)

      // Mock thread updates (last_message_at and unread_count)
      const updateQuery1 = createChainableQuery({ error: null })
      const updateQuery2 = createChainableQuery({ error: null })
      mockSupabase.from.mockReturnValueOnce(updateQuery1)
      mockSupabase.from.mockReturnValueOnce(updateQuery2)

      const result = await MessagingService.createMessage(input, 'user-123')

      expect(result.data).toEqual(mockMessage)
    })

    it('should create AI response message', async () => {
      const input = {
        thread_id: 'thread-1',
        content: 'AI response',
        message_type: 'ai_response' as const,
      }

      const mockMessage = {
        id: 'msg-1',
        ...input,
        sender_id: 'user-123',
        ai_enhanced: true,
        read_by: ['user-123'],
        created_at: new Date().toISOString(),
      }

      const mockThread = {
        id: 'thread-1',
        participants: ['user-123'],
        unread_count: 0,
      }

      // Mock message insert
      const insertQuery = createChainableQuery({ data: mockMessage, error: null })
      insertQuery.select.mockReturnValue(insertQuery)
      insertQuery.single.mockResolvedValue({ data: mockMessage, error: null })
      mockSupabase.from.mockReturnValueOnce(insertQuery)

      // Mock thread get
      const threadQuery = createChainableQuery({ data: mockThread, error: null })
      mockSupabase.from.mockReturnValueOnce(threadQuery)

      // Mock thread updates
      const updateQuery1 = createChainableQuery({ error: null })
      mockSupabase.from.mockReturnValueOnce(updateQuery1)

      const result = await MessagingService.createMessage(input, 'user-123')

      expect(result.data?.ai_enhanced).toBe(true)
    })
  })

  describe('getNotifications', () => {
    it('should fetch notifications for user', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          user_id: 'user-123',
          notification_type: 'message',
          title: 'New message',
          message: 'You have a new message',
          read: false,
        },
      ]

      // getNotifications calls eq multiple times (user_id and status/read)
      // So we need a chainable query that supports multiple eq calls
      const query = createChainableQuery({ data: mockNotifications, error: null })
      mockSupabase.from.mockReturnValue(query)

      const result = await MessagingService.getNotifications('user-123')

      expect(mockSupabase.from).toHaveBeenCalledWith('notifications')
      expect(query.eq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(result.data).toEqual(mockNotifications)
    })
  })
})
