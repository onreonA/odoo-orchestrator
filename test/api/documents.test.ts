/**
 * Documents API Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/documents/route'

// Mock dependencies
vi.mock('@/lib/services/document-service', () => ({
  DocumentService: {
    getDocuments: vi.fn(),
    createDocument: vi.fn(),
  },
}))

import { DocumentService } from '@/lib/services/document-service'

describe('Documents API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/documents', () => {
    it('should return documents for authenticated user', async () => {
      vi.mocked(DocumentService.getDocuments).mockResolvedValue({
        data: [
          {
            id: 'doc-1',
            title: 'Test Document',
            category: 'general',
            company_id: 'company-id',
            uploaded_by: 'user-id',
            file_name: 'test.pdf',
            file_path: 'documents/test.pdf',
            created_at: new Date().toISOString(),
          },
        ],
        error: null,
      })

      const request = new NextRequest('http://localhost:3001/api/documents')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(data.data.length).toBe(1)
    })

    it('should filter by category', async () => {
      vi.mocked(DocumentService.getDocuments).mockResolvedValue({
        data: [],
        error: null,
      })

      const request = new NextRequest('http://localhost:3001/api/documents?category=training')
      await GET(request)

      expect(DocumentService.getDocuments).toHaveBeenCalledWith({ category: 'training' })
    })

    it('should filter by search term', async () => {
      vi.mocked(DocumentService.getDocuments).mockResolvedValue({
        data: [],
        error: null,
      })

      const request = new NextRequest('http://localhost:3001/api/documents?search=test')
      await GET(request)

      expect(DocumentService.getDocuments).toHaveBeenCalledWith({ search: 'test' })
    })
  })

  describe('POST /api/documents', () => {
    it('should create document successfully', async () => {
      vi.mocked(DocumentService.createDocument).mockResolvedValue({
        data: {
          id: 'doc-1',
          title: 'New Document',
          category: 'general',
          company_id: 'company-id',
          uploaded_by: 'user-id',
          file_name: 'test.pdf',
          file_path: 'documents/test.pdf',
          created_at: new Date().toISOString(),
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
      expect(data.data).toBeDefined()
      expect(data.data.title).toBe('New Document')
    })

    it('should return 400 if required fields missing', async () => {
      const request = new NextRequest('http://localhost:3001/api/documents', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Document',
          // Missing category, file_name, file_path
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('required')
    })
  })
})

