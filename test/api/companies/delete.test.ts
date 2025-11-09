import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DELETE } from '@/app/api/companies/[id]/route'
import { NextRequest } from 'next/server'

// Mock Supabase server client
const mockGetUser = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockDelete = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}))

describe('DELETE /api/companies/[id]', () => {
  const companyId = 'test-company-id'

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup mock chain for profile query
    const profileQueryChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: mockSingle,
    }

    // Setup mock chain for delete query
    const deleteQueryChain = {
      delete: vi.fn().mockReturnThis(),
      eq: mockEq,
    }

    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return profileQueryChain
      }
      if (table === 'companies') {
        return deleteQueryChain
      }
      return {}
    })
  })

  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const request = new NextRequest(`http://localhost/api/companies/${companyId}`)
    const params = Promise.resolve({ id: companyId })
    const response = await DELETE(request, { params })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 403 when user is not super admin', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    })
    mockSingle.mockResolvedValue({
      data: { role: 'company_user' },
    })

    const request = new NextRequest(`http://localhost/api/companies/${companyId}`)
    const params = Promise.resolve({ id: companyId })
    const response = await DELETE(request, { params })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Forbidden')
  })

  it('successfully deletes company when user is super admin', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'admin-123' } },
    })
    mockSingle.mockResolvedValue({
      data: { role: 'super_admin' },
    })
    mockEq.mockResolvedValue({ error: null })

    const request = new NextRequest(`http://localhost/api/companies/${companyId}`)
    const params = Promise.resolve({ id: companyId })
    const response = await DELETE(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockFrom).toHaveBeenCalledWith('companies')
  })

  it('returns 400 when database delete fails', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'admin-123' } },
    })
    mockSingle.mockResolvedValue({
      data: { role: 'super_admin' },
    })
    mockEq.mockResolvedValue({
      error: { message: 'Database error' },
    })

    const request = new NextRequest(`http://localhost/api/companies/${companyId}`)
    const params = Promise.resolve({ id: companyId })
    const response = await DELETE(request, { params })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Database error')
  })

  it('returns 500 when unexpected error occurs', async () => {
    mockGetUser.mockRejectedValue(new Error('Unexpected error'))

    const request = new NextRequest(`http://localhost/api/companies/${companyId}`)
    const params = Promise.resolve({ id: companyId })
    const response = await DELETE(request, { params })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Unexpected error')
  })
})
