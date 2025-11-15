import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProjectPhaseService } from '@/lib/services/project-phase-service'
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

describe('ProjectPhaseService', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabase()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  describe('createPhase', () => {
    it('should create a phase successfully', async () => {
      const mockPhase = {
        id: 'phase-123',
        project_id: 'project-123',
        name: 'Phase 1',
        description: 'First phase',
        phase_number: 1,
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-03-31T00:00:00Z',
        status: 'pending',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      mockSupabase.insert.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: mockPhase,
        error: null,
      } as any)

      const service = new ProjectPhaseService()
      const result = await service.createPhase({
        project_id: 'project-123',
        name: 'Phase 1',
        description: 'First phase',
        phase_number: 1,
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-03-31T00:00:00Z',
      })

      expect(result).toBeDefined()
      expect(result.id).toBe('phase-123')
      expect(result.name).toBe('Phase 1')
      expect(mockSupabase.insert).toHaveBeenCalled()
    })

    it('should throw error when creation fails', async () => {
      mockSupabase.insert.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      } as any)

      const service = new ProjectPhaseService()
      await expect(
        service.createPhase({
          project_id: 'project-123',
          name: 'Phase 1',
          phase_number: 1,
          start_date: '2024-01-01T00:00:00Z',
          end_date: '2024-03-31T00:00:00Z',
        })
      ).rejects.toThrow('Failed to create phase')
    })
  })

  describe('createMilestone', () => {
    it('should create a milestone successfully', async () => {
      const mockMilestone = {
        id: 'milestone-123',
        project_id: 'project-123',
        phase_id: 'phase-123',
        title: 'Milestone 1',
        description: 'First milestone',
        due_date: '2024-02-15T00:00:00Z',
        deliverables: ['Deliverable 1', 'Deliverable 2'],
        status: 'pending',
        created_at: '2024-01-01T00:00:00Z',
      }

      mockSupabase.insert.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: mockMilestone,
        error: null,
      } as any)

      const service = new ProjectPhaseService()
      const result = await service.createMilestone({
        project_id: 'project-123',
        phase_id: 'phase-123',
        title: 'Milestone 1',
        description: 'First milestone',
        due_date: '2024-02-15T00:00:00Z',
        deliverables: ['Deliverable 1', 'Deliverable 2'],
      })

      expect(result).toBeDefined()
      expect(result.id).toBe('milestone-123')
      expect(result.title).toBe('Milestone 1')
      expect(mockSupabase.insert).toHaveBeenCalled()
    })
  })

  describe('getPhasesByProject', () => {
    it('should return phases for a project', async () => {
      const mockPhases = [
        {
          id: 'phase-1',
          project_id: 'project-123',
          name: 'Phase 1',
          phase_number: 1,
          start_date: '2024-01-01T00:00:00Z',
          end_date: '2024-03-31T00:00:00Z',
          status: 'pending',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'phase-2',
          project_id: 'project-123',
          name: 'Phase 2',
          phase_number: 2,
          start_date: '2024-04-01T00:00:00Z',
          end_date: '2024-06-30T00:00:00Z',
          status: 'pending',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ]

      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.order.mockResolvedValue({
        data: mockPhases,
        error: null,
      } as any)

      const service = new ProjectPhaseService()
      const result = await service.getPhasesByProject('project-123')

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Phase 1')
      expect(mockSupabase.eq).toHaveBeenCalledWith('project_id', 'project-123')
    })
  })

  describe('getMilestonesByPhase', () => {
    it('should return milestones for a phase', async () => {
      const mockMilestones = [
        {
          id: 'milestone-1',
          project_id: 'project-123',
          phase_id: 'phase-123',
          title: 'Milestone 1',
          due_date: '2024-02-15T00:00:00Z',
          status: 'pending',
          created_at: '2024-01-01T00:00:00Z',
        },
      ]

      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.order.mockResolvedValue({
        data: mockMilestones,
        error: null,
      } as any)

      const service = new ProjectPhaseService()
      const result = await service.getMilestonesByPhase('phase-123')

      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Milestone 1')
      expect(mockSupabase.eq).toHaveBeenCalledWith('phase_id', 'phase-123')
    })
  })
})
