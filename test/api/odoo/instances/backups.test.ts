import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from '@/lib/supabase/server'
import { getOdooInstanceService } from '@/lib/services/odoo-instance-service'
import { GET, POST } from '@/app/api/odoo/instances/[id]/backups/route'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/services/odoo-instance-service', () => ({
  getOdooInstanceService: vi.fn(),
}))

describe('Odoo Instance Backups API', () => {
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
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    vi.clearAllMocks()
  })

  describe('GET /api/odoo/instances/[id]/backups', () => {
    it('should list backups successfully', async () => {
      const mockBackups = [
        {
          id: 'backup-1',
          instance_id: 'instance-123',
          backup_id: 'backup-123',
          backup_type: 'manual',
          size_mb: 150,
          status: 'completed',
          created_at: new Date().toISOString(),
        },
        {
          id: 'backup-2',
          instance_id: 'instance-123',
          backup_id: 'backup-124',
          backup_type: 'automatic',
          size_mb: 145,
          status: 'completed',
          created_at: new Date().toISOString(),
        },
      ]

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      const mockService = {
        listBackups: vi.fn().mockResolvedValue(mockBackups),
      }

      vi.mocked(getOdooInstanceService).mockReturnValue(mockService as any)

      const request = new Request('http://localhost/api/odoo/instances/instance-123/backups')
      const response = await GET(request, { params: Promise.resolve({ id: 'instance-123' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.backups).toEqual(mockBackups)
      expect(mockService.listBackups).toHaveBeenCalledWith('instance-123')
    })

    it('should return empty array if no backups', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      const mockService = {
        listBackups: vi.fn().mockResolvedValue([]),
      }

      vi.mocked(getOdooInstanceService).mockReturnValue(mockService as any)

      const request = new Request('http://localhost/api/odoo/instances/instance-123/backups')
      const response = await GET(request, { params: Promise.resolve({ id: 'instance-123' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.backups).toEqual([])
    })

    it('should return 401 if not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const request = new Request('http://localhost/api/odoo/instances/instance-123/backups')
      const response = await GET(request, { params: Promise.resolve({ id: 'instance-123' }) })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should handle service errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      const mockService = {
        listBackups: vi.fn().mockRejectedValue(new Error('Instance not found')),
      }

      vi.mocked(getOdooInstanceService).mockReturnValue(mockService as any)

      const request = new Request('http://localhost/api/odoo/instances/instance-123/backups')
      const response = await GET(request, { params: Promise.resolve({ id: 'instance-123' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Instance not found')
    })
  })

  describe('POST /api/odoo/instances/[id]/backups', () => {
    it('should create backup successfully', async () => {
      const mockBackup = {
        id: 'backup-1',
        instance_id: 'instance-123',
        backup_id: 'backup-123',
        backup_type: 'manual',
        status: 'creating',
        created_at: new Date().toISOString(),
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      const mockService = {
        createBackup: vi.fn().mockResolvedValue(mockBackup),
      }

      vi.mocked(getOdooInstanceService).mockReturnValue(mockService as any)

      const request = new Request('http://localhost/api/odoo/instances/instance-123/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'manual' }),
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'instance-123' }) })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.backup).toEqual(mockBackup)
      expect(mockService.createBackup).toHaveBeenCalledWith('instance-123', 'manual')
    })

    it('should use default backup type if not provided', async () => {
      const mockBackup = {
        id: 'backup-1',
        backup_type: 'manual',
        status: 'creating',
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      const mockService = {
        createBackup: vi.fn().mockResolvedValue(mockBackup),
      }

      vi.mocked(getOdooInstanceService).mockReturnValue(mockService as any)

      const request = new Request('http://localhost/api/odoo/instances/instance-123/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'instance-123' }) })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(mockService.createBackup).toHaveBeenCalledWith('instance-123', 'manual')
    })

    it('should return 401 if not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const request = new Request('http://localhost/api/odoo/instances/instance-123/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'manual' }),
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'instance-123' }) })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should handle service errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      })

      const mockService = {
        createBackup: vi.fn().mockRejectedValue(new Error('Backup creation failed')),
      }

      vi.mocked(getOdooInstanceService).mockReturnValue(mockService as any)

      const request = new Request('http://localhost/api/odoo/instances/instance-123/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'manual' }),
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'instance-123' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Backup creation failed')
    })
  })
})
