import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/ai/discovery/route'
import { createClient } from '@/lib/supabase/server'

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Create a shared mock function
const mockRunFullDiscoveryFn = vi.fn()

vi.mock('@/lib/ai/agents/discovery-agent', () => {
  // Return a real class that uses the mock function
  return {
    DiscoveryAgent: class {
      constructor(
        public companyId: string,
        public projectId?: string
      ) {}
      async runFullDiscovery(audioFile: File | Buffer) {
        return mockRunFullDiscoveryFn(audioFile)
      }
    },
  }
})

describe('POST /api/ai/discovery', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => mockSupabase),
    insert: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    single: vi.fn(),
    eq: vi.fn(() => mockSupabase),
  }

  const mockDiscoveryResult = {
    transcript: 'Test transcript',
    extractedInfo: {
      companyInfo: { name: 'Test Company' },
      processes: [{ name: 'Sales Process' }],
      requirements: [],
    },
    moduleSuggestions: [],
    report: 'Test report',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })
    mockSupabase.single.mockResolvedValue({
      data: { id: 'discovery-123' },
      error: null,
    })
    mockRunFullDiscoveryFn.mockResolvedValue(mockDiscoveryResult)
  })

  it('should process discovery successfully', async () => {
    const formData = new FormData()
    const audioFile = new File(['audio content'], 'test.m4a', { type: 'audio/mp4' })
    formData.append('audio', audioFile)
    formData.append('companyId', 'company-123')

    const request = new NextRequest('http://localhost/api/ai/discovery', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.id).toBe('discovery-123')
    expect(mockRunFullDiscoveryFn).toHaveBeenCalled()
    // Check that it was called with a File-like object (check properties instead of instanceof)
    const callArgs = mockRunFullDiscoveryFn.mock.calls[0]
    expect(callArgs[0]).toBeDefined()
    expect(callArgs[0]).toHaveProperty('size')
    expect(callArgs[0]).toHaveProperty('type')
  })

  it('should return 401 if unauthorized', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    })

    const formData = new FormData()
    const audioFile = new File(['audio'], 'test.m4a', { type: 'audio/mp4' })
    formData.append('audio', audioFile)
    formData.append('companyId', 'company-123')

    const request = new NextRequest('http://localhost/api/ai/discovery', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.error).toBe('Unauthorized')
  })

  it('should return 400 if missing required fields', async () => {
    const formData = new FormData()
    // Missing companyId

    const request = new NextRequest('http://localhost/api/ai/discovery', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toContain('Missing required fields')
  })

  it('should handle Discovery Agent errors', async () => {
    mockRunFullDiscoveryFn.mockRejectedValueOnce(new Error('Whisper API failed'))

    const formData = new FormData()
    const audioFile = new File(['audio'], 'test.m4a', { type: 'audio/mp4' })
    formData.append('audio', audioFile)
    formData.append('companyId', 'company-123')

    const request = new NextRequest('http://localhost/api/ai/discovery', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.error).toContain('Discovery Agent failed')
  })

  it('should handle database save errors gracefully', async () => {
    // Mock database error
    mockSupabase.insert.mockReturnValueOnce(mockSupabase)
    mockSupabase.select.mockReturnValueOnce(mockSupabase)
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database error', details: 'Test error', hint: null, code: '23505' },
    })

    const formData = new FormData()
    const audioFile = new File(['audio'], 'test.m4a', { type: 'audio/mp4' })
    formData.append('audio', audioFile)
    formData.append('companyId', 'company-123')

    const request = new NextRequest('http://localhost/api/ai/discovery', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    const json = await response.json()

    // Should still return success but with warning
    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.warning).toContain('failed to save')
  })
})
