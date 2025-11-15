import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MeetingPreparationService } from '@/lib/services/meeting-preparation-service'
import { createClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

const createMockSupabase = () => {
  const createQueryChain = () => ({
    select: vi.fn(() => createQueryChain()),
    eq: vi.fn(() => createQueryChain()),
    not: vi.fn(() => createQueryChain()),
    order: vi.fn(() => createQueryChain()),
    limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
  })

  const createSelectChain = () => ({
    select: vi.fn(() => createSelectChain()),
    eq: vi.fn(() => createSelectChain()),
    not: vi.fn(() => createSelectChain()),
    order: vi.fn(() => createSelectChain()),
    limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
  })

  const createUpdateChain = () => ({
    update: vi.fn(() => createUpdateChain()),
    eq: vi.fn(() => Promise.resolve({ error: null })),
  })

  let meetingRequestsCallCount = 0
  let companiesCallCount = 0
  let projectsCallCount = 0

  return {
    from: vi.fn((table: string) => {
      if (table === 'meeting_requests') {
        meetingRequestsCallCount++
        return {
          select: vi.fn(() => {
            if (meetingRequestsCallCount === 1) {
              // First call: get meeting
              return createSelectChain()
            } else {
              // Subsequent calls: get previous meetings
              return createQueryChain()
            }
          }),
          update: vi.fn(() => createUpdateChain()),
        }
      }
      if (table === 'companies') {
        companiesCallCount++
        return {
          select: vi.fn(() => createQueryChain()),
        }
      }
      if (table === 'projects' || table === 'discoveries') {
        projectsCallCount++
        return {
          select: vi.fn(() => createQueryChain()),
        }
      }
      return createQueryChain()
    }),
  }
}

describe('MeetingPreparationService', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabase()
    vi.mocked(createClient).mockReturnValue(mockSupabase as any)
  })

  describe('prepareMeeting', () => {
    it('should prepare meeting successfully', async () => {
      const mockMeeting = {
        id: 'meeting-123',
        company_id: 'company-123',
        consultant_id: 'consultant-123',
        meeting_type: 'discovery',
        requested_date: new Date().toISOString(),
        duration_minutes: 60,
        company: {
          id: 'company-123',
          name: 'Test Company',
          description: 'Test description',
        },
      }

      // Override mock functions for this specific test
      let meetingCallCount = 0
      const originalFrom = mockSupabase.from
      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'meeting_requests') {
          meetingCallCount++
          return {
            select: vi.fn(() => {
              const chain: any = {
                eq: vi.fn(() => chain),
                not: vi.fn(() => chain),
                order: vi.fn(() => chain),
                limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
                single: vi.fn(() => {
                  if (meetingCallCount === 1) {
                    return Promise.resolve({ data: mockMeeting, error: null })
                  }
                  return Promise.resolve({ data: [], error: null })
                }),
              }
              return chain
            }),
            update: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: null })),
            })),
          }
        }
        if (table === 'companies') {
          return {
            select: vi.fn(() => {
              const chain: any = {
                eq: vi.fn(() => chain),
                single: vi.fn(() =>
                  Promise.resolve({
                    data: mockMeeting.company,
                    error: null,
                  })
                ),
              }
              return chain
            }),
          }
        }
        if (table === 'projects') {
          return {
            select: vi.fn(() => {
              const chain: any = {
                eq: vi.fn(() => chain),
                limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
              }
              return chain
            }),
          }
        }
        return originalFrom(table)
      })

      const service = new MeetingPreparationService()
      const preparation = await service.prepareMeeting('meeting-123')

      expect(preparation.meetingId).toBe('meeting-123')
      expect(preparation.previousMeetingNotes).toBeInstanceOf(Array)
      expect(preparation.missingInformation).toBeInstanceOf(Array)
      expect(preparation.questionList).toBeInstanceOf(Array)
    })

    it('should throw error if meeting not found', async () => {
      const originalFrom = mockSupabase.from
      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'meeting_requests') {
          return {
            select: vi.fn(() => {
              const chain: any = {
                eq: vi.fn(() => chain),
                single: vi.fn(() =>
                  Promise.resolve({
                    data: null,
                    error: null,
                  })
                ),
              }
              return chain
            }),
          }
        }
        return originalFrom(table)
      })

      const service = new MeetingPreparationService()

      await expect(service.prepareMeeting('meeting-123')).rejects.toThrow('Meeting not found')
    })
  })

  describe('getPreparation', () => {
    it('should get preparation if exists', async () => {
      const mockMeeting = {
        preparation_data: {
          previousMeetingNotes: ['Note 1'],
          missingInformation: ['Info 1'],
          questionList: ['Question 1'],
          relatedDocuments: [],
          preparationSummary: 'Summary',
        },
      }

      const originalFrom = mockSupabase.from
      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'meeting_requests') {
          return {
            select: vi.fn(() => {
              const chain: any = {
                eq: vi.fn(() => chain),
                single: vi.fn(() =>
                  Promise.resolve({
                    data: mockMeeting,
                    error: null,
                  })
                ),
              }
              return chain
            }),
          }
        }
        return originalFrom(table)
      })

      const service = new MeetingPreparationService()
      const preparation = await service.getPreparation('meeting-123')

      expect(preparation).not.toBeNull()
      expect(preparation?.meetingId).toBe('meeting-123')
    })

    it('should return null if preparation not found', async () => {
      const originalFrom = mockSupabase.from
      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'meeting_requests') {
          return {
            select: vi.fn(() => {
              const chain: any = {
                eq: vi.fn(() => chain),
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { preparation_data: null },
                    error: null,
                  })
                ),
              }
              return chain
            }),
          }
        }
        return originalFrom(table)
      })

      const service = new MeetingPreparationService()
      const preparation = await service.getPreparation('meeting-123')

      expect(preparation).toBeNull()
    })
  })
})
