/**
 * Document Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DocumentService } from '@/lib/services/document-service'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'

describe('DocumentService', () => {
  const mockSupabase = {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
    storage: {
      from: vi.fn(),
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  describe('getDocuments', () => {
    it('should return documents for authenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      const mockProfileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { company_id: 'company-id' },
          error: null,
        }),
      }

      const mockDocumentsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
      }
      // Make methods return the query itself for chaining
      mockDocumentsQuery.select.mockReturnValue(mockDocumentsQuery)
      mockDocumentsQuery.eq.mockReturnValue(mockDocumentsQuery)
      mockDocumentsQuery.order.mockReturnValue(mockDocumentsQuery)
      mockDocumentsQuery.or.mockReturnValue(mockDocumentsQuery)
      mockDocumentsQuery.contains.mockReturnValue(mockDocumentsQuery)
      // When awaited, return the final result
      Object.defineProperty(mockDocumentsQuery, 'then', {
        value: (resolve: any) =>
          resolve({
            data: [
              {
                id: 'doc-1',
                title: 'Test Document',
                category: 'general',
                company_id: 'company-id',
              },
            ],
            error: null,
          }),
        writable: true,
      })

      mockSupabase.from
        .mockReturnValueOnce(mockProfileQuery)
        .mockReturnValueOnce(mockDocumentsQuery)

      const { data, error } = await DocumentService.getDocuments()

      expect(error).toBeNull()
      expect(data).toHaveLength(1)
      expect(data?.[0].title).toBe('Test Document')
    })

    it('should filter by category', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      const mockProfileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { company_id: 'company-id' },
          error: null,
        }),
      }

      const mockDocumentsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
      }
      mockDocumentsQuery.select.mockReturnValue(mockDocumentsQuery)
      mockDocumentsQuery.eq.mockReturnValue(mockDocumentsQuery)
      mockDocumentsQuery.order.mockReturnValue(mockDocumentsQuery)
      mockDocumentsQuery.or.mockReturnValue(mockDocumentsQuery)
      mockDocumentsQuery.contains.mockReturnValue(mockDocumentsQuery)
      Object.defineProperty(mockDocumentsQuery, 'then', {
        value: (resolve: any) =>
          resolve({
            data: [],
            error: null,
          }),
        writable: true,
      })

      mockSupabase.from
        .mockReturnValueOnce(mockProfileQuery)
        .mockReturnValueOnce(mockDocumentsQuery)

      const { data, error } = await DocumentService.getDocuments({ category: 'training' })

      expect(error).toBeNull()
      expect(mockDocumentsQuery.eq).toHaveBeenCalledWith('category', 'training')
    })

    it('should filter by search term', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      const mockProfileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { company_id: 'company-id' },
          error: null,
        }),
      }

      const mockDocumentsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
      }
      mockDocumentsQuery.select.mockReturnValue(mockDocumentsQuery)
      mockDocumentsQuery.eq.mockReturnValue(mockDocumentsQuery)
      mockDocumentsQuery.order.mockReturnValue(mockDocumentsQuery)
      mockDocumentsQuery.or.mockReturnValue(mockDocumentsQuery)
      mockDocumentsQuery.contains.mockReturnValue(mockDocumentsQuery)
      Object.defineProperty(mockDocumentsQuery, 'then', {
        value: (resolve: any) =>
          resolve({
            data: [],
            error: null,
          }),
        writable: true,
      })

      mockSupabase.from
        .mockReturnValueOnce(mockProfileQuery)
        .mockReturnValueOnce(mockDocumentsQuery)

      const { data, error } = await DocumentService.getDocuments({ search: 'test' })

      expect(error).toBeNull()
      expect(mockDocumentsQuery.or).toHaveBeenCalled()
    })

    it('should return error for unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const { data, error } = await DocumentService.getDocuments()

      expect(data).toBeNull()
      expect(error).toBeDefined()
      expect(error?.message).toBe('Unauthorized')
    })
  })

  describe('getDocumentById', () => {
    it('should return document by id', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'doc-1',
            title: 'Test Document',
            category: 'general',
          },
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const { data, error } = await DocumentService.getDocumentById('doc-1')

      expect(error).toBeNull()
      expect(data?.id).toBe('doc-1')
      expect(data?.title).toBe('Test Document')
    })

    it('should return error if document not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const { data, error } = await DocumentService.getDocumentById('doc-1')

      expect(data).toBeNull()
      expect(error).toBeDefined()
    })
  })

  describe('createDocument', () => {
    it('should create document for authenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      const mockProfileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { company_id: 'company-id' },
          error: null,
        }),
      }

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'doc-1',
            title: 'New Document',
            company_id: 'company-id',
            uploaded_by: 'user-id',
          },
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValueOnce(mockProfileQuery).mockReturnValueOnce(mockInsertQuery)

      const { data, error } = await DocumentService.createDocument({
        title: 'New Document',
        category: 'general',
        file_name: 'test.pdf',
        file_path: 'documents/test.pdf',
      })

      expect(error).toBeNull()
      expect(data?.title).toBe('New Document')
      expect(data?.uploaded_by).toBe('user-id')
    })

    it('should return error for unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const { data, error } = await DocumentService.createDocument({
        title: 'New Document',
        category: 'general',
        file_name: 'test.pdf',
        file_path: 'documents/test.pdf',
      })

      expect(data).toBeNull()
      expect(error).toBeDefined()
    })
  })

  describe('updateDocument', () => {
    it('should update document', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'doc-1',
            title: 'Updated Document',
          },
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const { data, error } = await DocumentService.updateDocument('doc-1', {
        title: 'Updated Document',
      })

      expect(error).toBeNull()
      expect(data?.title).toBe('Updated Document')
    })
  })

  describe('deleteDocument', () => {
    it('should delete document and file from storage', async () => {
      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { file_path: 'documents/company-id/file.pdf' },
          error: null,
        }),
      }

      const mockDeleteQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      }

      const mockStorage = {
        remove: vi.fn().mockResolvedValue({ error: null }),
      }

      mockSupabase.from.mockReturnValueOnce(mockSelectQuery).mockReturnValueOnce(mockDeleteQuery)
      mockSupabase.storage.from.mockReturnValue(mockStorage)

      const { error } = await DocumentService.deleteDocument('doc-1')

      expect(error).toBeNull()
      expect(mockStorage.remove).toHaveBeenCalled()
    })
  })

  describe('getCategories', () => {
    it('should return list of categories', async () => {
      const categories = await DocumentService.getCategories()

      expect(categories).toContain('general')
      expect(categories).toContain('training')
      expect(categories).toContain('technical')
    })
  })

  describe('getDocumentStats', () => {
    it('should return document statistics', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      const mockProfileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { company_id: 'company-id' },
          error: null,
        }),
      }

      const mockStatsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      }
      mockStatsQuery.select.mockReturnValue(mockStatsQuery)
      mockStatsQuery.eq.mockReturnValue(mockStatsQuery)
      Object.defineProperty(mockStatsQuery, 'then', {
        value: (resolve: any) =>
          resolve({
            data: [
              { id: 'doc-1', category: 'general', file_size: 1024 },
              { id: 'doc-2', category: 'training', file_size: 2048 },
              { id: 'doc-3', category: 'general', file_size: 512 },
            ],
            error: null,
          }),
        writable: true,
      })

      mockSupabase.from.mockReturnValueOnce(mockProfileQuery).mockReturnValueOnce(mockStatsQuery)

      const { data, error } = await DocumentService.getDocumentStats()

      expect(error).toBeNull()
      expect(data?.total).toBe(3)
      expect(data?.byCategory.general).toBe(2)
      expect(data?.byCategory.training).toBe(1)
      expect(data?.totalSize).toBe(3584)
    })
  })
})
