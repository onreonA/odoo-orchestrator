import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/odoo/test-connection/route'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { OdooClient } from '@/lib/odoo/client'

vi.mock('@/lib/supabase/server')
vi.mock('@/lib/odoo/client', () => ({
  OdooClient: vi.fn(),
}))

describe('POST /api/odoo/test-connection', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => mockSupabase),
    update: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
  }

  beforeEach(() => {
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })
    mockSupabase.update.mockResolvedValue({ error: null })
  })

  it('should test Odoo connection successfully', async () => {
    const mockTestConnection = vi.fn().mockResolvedValue({ success: true, version: '19.0' })
    vi.mocked(OdooClient).mockImplementation(function (this: any, config: any) {
      this.testConnection = mockTestConnection
      return this
    } as any)

    const request = new NextRequest('http://localhost/api/odoo/test-connection', {
      method: 'POST',
      body: JSON.stringify({
        url: 'https://odoo.example.com',
        database: 'test_db',
        username: 'admin',
        password: 'password',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.version).toBe('19.0')
  })

  it('should return 401 if not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    })

    const request = new NextRequest('http://localhost/api/odoo/test-connection', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request)

    expect(response.status).toBe(401)
  })

  it('should return 400 if missing required fields', async () => {
    const request = new NextRequest('http://localhost/api/odoo/test-connection', {
      method: 'POST',
      body: JSON.stringify({
        url: 'https://odoo.example.com',
        // Missing database, username, password
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('should handle connection failure', async () => {
    const mockTestConnection = vi.fn().mockResolvedValue({
      success: false,
      error: 'Connection failed',
    })
    vi.mocked(OdooClient).mockImplementation(function (this: any, config: any) {
      this.testConnection = mockTestConnection
      return this
    } as any)

    const request = new NextRequest('http://localhost/api/odoo/test-connection', {
      method: 'POST',
      body: JSON.stringify({
        url: 'https://odoo.example.com',
        database: 'test_db',
        username: 'admin',
        password: 'wrong_password',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(data.success).toBe(false)
    expect(data.error).toBeDefined()
  })
})

