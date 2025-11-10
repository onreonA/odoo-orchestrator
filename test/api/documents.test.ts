/**
 * Documents API Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/documents/route'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock DocumentService
vi.mock('@/lib/services/document-service', () => ({
  DocumentService: {
    getDocuments: vi.fn(),
    createDocument: vi.fn(),
  },
}))

import { createClient } from '@/lib/supabase/server'
import { DocumentService } from '@/lib/services/document-service'

describe('Documents API', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
  })

  describe('GET /api/documents', () => {
    it('should return documents list', async () => {
      vi.mocked(DocumentService.getDocuments).mockResolvedValue({
        data: [
          {
            id: 'doc-1',
            title: 'Test Document',
            category: 'general',
            company_id: 'company-id',
            file_name: 'test.pdf',
            file_path: 'documents/test.pdf',
            version: 1,
            is_public: false,
            access_level: 'company',
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        ],
        error: null,
      })

      const request = new NextRequest('http://localhost:3001/api/documents')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
    })

    it('should filter by category', async () => {
      vi.mocked(DocumentService.getDocuments).mockResolvedValue({
        data: [],
        error: null,
      })

      const request = new NextRequest('http://localhost:3001/api/documents?category=training')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(DocumentService.getDocuments).toHaveBeenCalledWith({
        category: 'training',
        companyId: undefined,
        projectId: undefined,
        search: undefined,
        tags: undefined,
      })
    })

    it('should filter by search term', async () => {
      vi.mocked(DocumentService.getDocuments).mockResolvedValue({
        data: [],
        error: null,
      })

      const request = new NextRequest('http://localhost:3001/api/documents?search=test')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(DocumentService.getDocuments).toHaveBeenCalledWith({
        search: 'test',
        companyId: undefined,
        projectId: undefined,
        category: undefined,
        tags: undefined,
      })
    })

    it('should handle errors', async () => {
      vi.mocked(DocumentService.getDocuments).mockResolvedValue({
        data: null,
        error: { message: 'Error fetching documents' },
      })

      const request = new NextRequest('http://localhost:3001/api/documents')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Error fetching documents')
    })
  })

  describe('POST /api/documents', () => {
    it('should create document', async () => {
      vi.mocked(DocumentService.createDocument).mockResolvedValue({
        data: {
          id: 'doc-1',
          title: 'New Document',
          category: 'general',
          company_id: 'company-id',
          file_name: 'test.pdf',
          file_path: 'documents/test.pdf',
          version: 1,
          is_public: false,
          access_level: 'company',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        error: null,
      })

      const request = new NextRequest('http://localhost:3001/api/documents', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Document',
          category: 'general',
          file_name: 'test.pdf',
          file_path: 'documents/test.pdf',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.title).toBe('New Document')
    })

    it('should handle creation errors', async () => {
      vi.mocked(DocumentService.createDocument).mockResolvedValue({
        data: null,
        error: { message: 'Error creating document' },
      })

      const request = new NextRequest('http://localhost:3001/api/documents', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Document',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Error creating document')
    })
  })
})

