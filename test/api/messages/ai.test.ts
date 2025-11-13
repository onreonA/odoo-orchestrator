import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/messages/ai/route'

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockSupabase),
}))

vi.mock('@/lib/services/messaging-service', () => ({
  MessagingService: {
    getThreadById: vi.fn(),
    getMessages: vi.fn(),
    createMessage: vi.fn(),
  },
}))

vi.mock('@/lib/ai/openai', () => ({
  openai: {
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  },
}))

import { MessagingService } from '@/lib/services/messaging-service'
import { openai } from '@/lib/ai/openai'

describe('AI Chat API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    })
  })

  it('should generate AI response successfully', async () => {
    // Mock thread
    vi.mocked(MessagingService.getThreadById).mockResolvedValue({
      data: {
        id: 'thread-123',
        participants: ['user-123'],
        company_id: null,
      },
      error: null,
    })

    // Mock messages
    vi.mocked(MessagingService.getMessages).mockResolvedValue({
      data: [],
      error: null,
    })

    // Mock OpenAI response
    vi.mocked(openai.chat.completions.create).mockResolvedValue({
      choices: [
        {
          message: {
            content: 'AI response text',
            role: 'assistant',
          },
        },
      ],
    } as any)

    // Mock message creation
    vi.mocked(MessagingService.createMessage).mockResolvedValue({
      data: {
        id: 'msg-123',
        thread_id: 'thread-123',
        content: 'AI response text',
        message_type: 'ai_response',
      },
      error: null,
    })

    const request = new NextRequest('http://localhost:3001/api/messages/ai', {
      method: 'POST',
      body: JSON.stringify({
        threadId: 'thread-123',
        message: 'Test question',
      }),
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result.success).toBe(true)
    expect(result.data.response).toBe('AI response text')
  })

  it('should return 401 if unauthorized', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
    })

    const request = new NextRequest('http://localhost:3001/api/messages/ai', {
      method: 'POST',
      body: JSON.stringify({
        threadId: 'thread-123',
        message: 'Test',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('should return 400 if missing fields', async () => {
    const request = new NextRequest('http://localhost:3001/api/messages/ai', {
      method: 'POST',
      body: JSON.stringify({
        threadId: 'thread-123',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('should return 403 if user not in thread', async () => {
    vi.mocked(MessagingService.getThreadById).mockResolvedValue({
      data: {
        id: 'thread-123',
        participants: ['other-user'],
      },
      error: null,
    })

    const request = new NextRequest('http://localhost:3001/api/messages/ai', {
      method: 'POST',
      body: JSON.stringify({
        threadId: 'thread-123',
        message: 'Test',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(403)
  })
})
