import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'
import { getMeetingNotificationService } from '@/lib/services/meeting-notification-service'
import { POST } from '@/app/api/consultant/meetings/request/route'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/services/meeting-notification-service', () => ({
  getMeetingNotificationService: vi.fn(),
}))

describe('Consultant Meeting Request API', () => {
  let mockSupabase: any
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  }

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      insert: vi.fn(() => mockSupabase),
      eq: vi.fn(() => mockSupabase),
      gte: vi.fn(() => mockSupabase),
      lte: vi.fn(() => mockSupabase),
      single: vi.fn(),
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.clearAllMocks()
  })

  it('should create meeting request successfully', async () => {
    const mockMeeting = {
      id: 'meeting-1',
      consultant_id: 'consultant-123',
      company_id: 'company-123',
      requested_by: mockUser.id,
      requested_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      duration_minutes: 60,
      meeting_type: 'discovery',
      status: 'pending',
    }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    })

    mockSupabase.single
      .mockResolvedValueOnce({
        data: { company_id: 'company-123' },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { privacy_settings: { allow_meeting_requests: true } },
        error: null,
      })
      .mockResolvedValueOnce({
        data: mockMeeting,
        error: null,
      })

    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.insert.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.gte.mockReturnValue(mockSupabase)
    mockSupabase.lte.mockReturnValue(mockSupabase)

    const mockNotificationService = {
      notifyMeetingRequestCreated: vi.fn().mockResolvedValue(undefined),
    }

    vi.mocked(getMeetingNotificationService).mockReturnValue(mockNotificationService as any)

    const request = new Request('http://localhost/api/consultant/meetings/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consultant_id: 'consultant-123',
        requested_date: new Date(Date.now() + 86400000).toISOString(),
        duration_minutes: 60,
        meeting_type: 'discovery',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.meeting).toBeDefined()
  })

  it('should return 401 if not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
    })

    const request = new Request('http://localhost/api/consultant/meetings/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consultant_id: 'consultant-123',
        requested_date: new Date(Date.now() + 86400000).toISOString(),
        duration_minutes: 60,
        meeting_type: 'discovery',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 400 if required fields are missing', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    })

    mockSupabase.single.mockResolvedValue({
      data: { company_id: 'company-123' },
      error: null,
    })

    const request = new Request('http://localhost/api/consultant/meetings/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consultant_id: 'consultant-123',
        // Missing required fields
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing required fields')
  })

  it('should return 400 if requested date is in the past', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    })

    mockSupabase.single.mockResolvedValue({
      data: { company_id: 'company-123' },
      error: null,
    })

    const request = new Request('http://localhost/api/consultant/meetings/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consultant_id: 'consultant-123',
        requested_date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        duration_minutes: 60,
        meeting_type: 'discovery',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Requested date must be in the future')
  })

  it('should return 403 if consultant does not accept meeting requests', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    })

    mockSupabase.single
      .mockResolvedValueOnce({
        data: { company_id: 'company-123' },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { privacy_settings: { allow_meeting_requests: false } },
        error: null,
      })

    const request = new Request('http://localhost/api/consultant/meetings/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consultant_id: 'consultant-123',
        requested_date: new Date(Date.now() + 86400000).toISOString(),
        duration_minutes: 60,
        meeting_type: 'discovery',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Consultant does not accept meeting requests')
  })
})



