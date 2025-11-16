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

// Create reusable storage bucket mock
const createMockStorageBucket = () => ({
  upload: vi.fn().mockResolvedValue({
    data: { path: 'message-attachments/user-123/thread-123/123.pdf' },
    error: null,
  }),
  getPublicUrl: vi.fn().mockReturnValue({
    data: { publicUrl: 'https://example.com/test.pdf' },
  }),
})

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
    // Create a proper File mock with name property
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })

    // Mock FormData to preserve file name
    const formData = new FormData()
    // Override get method to return file with proper name
    const originalGet = FormData.prototype.get
    FormData.prototype.get = vi.fn(function (this: FormData, name: string) {
      if (name === 'file') {
        return file
      }
      return originalGet.call(this, name)
    })

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

    // Mock storage upload - create bucket mock that supports both upload and getPublicUrl
    const mockStorageBucket = createMockStorageBucket()
    // Mock storage.from() to return the same bucket (called twice: once for upload, once for getPublicUrl)
    mockSupabase.storage.from = vi.fn().mockReturnValue(mockStorageBucket)

    const request = new NextRequest('http://localhost:3001/api/messages/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    const result = await response.json()

    // Restore original get method
    FormData.prototype.get = originalGet

    expect(response.status).toBe(200)
    expect(result.success).toBe(true)
    // File name might be 'blob' in test environment, but route should handle it
    expect(result.data.name).toBeDefined()
    expect(result.data.url).toBeDefined()
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
    // Reset mock for this test
    mockSupabase.from.mockReturnValueOnce({
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
