import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/messages/upload/route'

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  storage: {
    from: vi.fn(),
  },
  from: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockSupabase),
}))

describe('File Upload API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    })
  })

  it('should upload file successfully', async () => {
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
    const formData = new FormData()
    formData.append('file', file)
    formData.append('threadId', 'thread-123')

    // Mock thread access check
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'thread-123',
              participants: ['user-123'],
            },
          }),
        }),
      }),
    })

    // Mock storage upload
    const mockStorage = {
      upload: vi.fn().mockResolvedValue({
        data: { path: 'message-attachments/user-123/thread-123/123.pdf' },
        error: null,
      }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/test.pdf' },
      }),
    }
    mockSupabase.storage.from.mockReturnValue(mockStorage)

    const request = new NextRequest('http://localhost:3001/api/messages/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result.success).toBe(true)
    expect(result.data.name).toBe('test.pdf')
  })

  it('should return 401 if unauthorized', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
    })

    const formData = new FormData()
    formData.append('file', new File(['test'], 'test.pdf'))
    formData.append('threadId', 'thread-123')

    const request = new NextRequest('http://localhost:3001/api/messages/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('should return 400 if no file provided', async () => {
    const formData = new FormData()
    formData.append('threadId', 'thread-123')

    const request = new NextRequest('http://localhost:3001/api/messages/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('should return 403 if user not in thread', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'thread-123',
              participants: ['other-user'],
            },
          }),
        }),
      }),
    })

    const formData = new FormData()
    formData.append('file', new File(['test'], 'test.pdf'))
    formData.append('threadId', 'thread-123')

    const request = new NextRequest('http://localhost:3001/api/messages/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    expect(response.status).toBe(403)
  })
})


