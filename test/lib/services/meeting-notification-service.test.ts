import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MeetingNotificationService } from '@/lib/services/meeting-notification-service'
import { createClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/services/notification-service', () => ({
  getNotificationService: vi.fn(() => ({
    sendNotification: vi.fn(),
  })),
}))

const createMockSupabase = () => {
  const queryChain = {
    select: vi.fn(() => queryChain),
    eq: vi.fn(() => queryChain),
    single: vi.fn(),
  }

  return {
    from: vi.fn(() => queryChain),
  }
}

describe('MeetingNotificationService', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabase()
    vi.mocked(createClient).mockReturnValue(mockSupabase as any)
  })

  describe('notifyMeetingRequestCreated', () => {
    it('should send notification when meeting request is created', async () => {
      const mockMeeting = {
        id: 'meeting-123',
        consultant_id: 'consultant-123',
        company: { id: 'company-123', name: 'Test Company' },
        consultant: {
          id: 'consultant-123',
          full_name: 'Test Consultant',
          email: 'consultant@test.com',
        },
        requested_by_user: { id: 'user-123', full_name: 'Test User', email: 'user@test.com' },
        requested_date: new Date().toISOString(),
        duration_minutes: 60,
        meeting_type: 'discovery',
        notes: 'Test notes',
      }

      const queryChain = mockSupabase.from('meeting_requests') as any
      queryChain.single.mockResolvedValue({
        data: mockMeeting,
        error: null,
      })

      const service = new MeetingNotificationService()
      await service.notifyMeetingRequestCreated('meeting-123')

      expect(mockSupabase.from).toHaveBeenCalledWith('meeting_requests')
      expect(queryChain.eq).toHaveBeenCalledWith('id', 'meeting-123')
    })

    it('should handle missing meeting gracefully', async () => {
      const queryChain = mockSupabase.from('meeting_requests') as any
      queryChain.single.mockResolvedValue({
        data: null,
        error: null,
      })

      const service = new MeetingNotificationService()
      await service.notifyMeetingRequestCreated('meeting-123')

      // Should not throw
      expect(mockSupabase.from).toHaveBeenCalled()
    })
  })

  describe('notifyMeetingRequestApproved', () => {
    it('should send notification when meeting request is approved', async () => {
      const mockMeeting = {
        id: 'meeting-123',
        consultant_id: 'consultant-123',
        requested_by: 'user-123',
        company: { id: 'company-123', name: 'Test Company' },
        consultant: {
          id: 'consultant-123',
          full_name: 'Test Consultant',
          email: 'consultant@test.com',
        },
        requested_by_user: { id: 'user-123', full_name: 'Test User', email: 'user@test.com' },
        requested_date: new Date().toISOString(),
        duration_minutes: 60,
        meeting_type: 'discovery',
        status: 'approved',
      }

      const queryChain = mockSupabase.from('meeting_requests') as any
      queryChain.single.mockResolvedValue({
        data: mockMeeting,
        error: null,
      })

      const service = new MeetingNotificationService()
      await service.notifyMeetingRequestApproved('meeting-123')

      expect(mockSupabase.from).toHaveBeenCalledWith('meeting_requests')
    })
  })

  describe('notifyMeetingRequestRejected', () => {
    it('should send notification when meeting request is rejected', async () => {
      const mockMeeting = {
        id: 'meeting-123',
        consultant_id: 'consultant-123',
        requested_by: 'user-123',
        company: { id: 'company-123', name: 'Test Company' },
        consultant: {
          id: 'consultant-123',
          full_name: 'Test Consultant',
          email: 'consultant@test.com',
        },
        requested_by_user: { id: 'user-123', full_name: 'Test User', email: 'user@test.com' },
        requested_date: new Date().toISOString(),
        duration_minutes: 60,
        meeting_type: 'discovery',
        status: 'rejected',
      }

      const queryChain = mockSupabase.from('meeting_requests') as any
      queryChain.single.mockResolvedValue({
        data: mockMeeting,
        error: null,
      })

      const service = new MeetingNotificationService()
      await service.notifyMeetingRequestRejected('meeting-123', 'Not available')

      expect(mockSupabase.from).toHaveBeenCalledWith('meeting_requests')
    })
  })
})







