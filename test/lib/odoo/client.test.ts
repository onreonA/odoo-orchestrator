import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OdooClient } from '@/lib/odoo/client'

// Mock xmlrpc
const createMockClient = (shouldFailAuth = false) => ({
  methodCall: vi.fn((method, params, callback) => {
    if (method === 'authenticate') {
      if (shouldFailAuth) {
        callback(new Error('Invalid credentials'), null)
      } else {
        callback(null, 1) // uid = 1
      }
    } else if (method === 'execute_kw') {
      const [, , , model, action] = params
      if (action === 'search') {
        callback(null, [1, 2, 3])
      } else if (action === 'read') {
        callback(null, [{ id: 1, name: 'Test' }])
      } else if (action === 'create') {
        callback(null, 1)
      } else if (action === 'write' || action === 'unlink') {
        callback(null, true)
      }
    }
  }),
})

vi.mock('xmlrpc', () => ({
  default: {
    createClient: vi.fn(() => createMockClient()),
  },
}))

describe('OdooClient', () => {
  const config = {
    url: 'https://odoo.example.com',
    database: 'test_db',
    username: 'admin',
    password: 'password',
  }

  let client: OdooClient

  beforeEach(() => {
    client = new OdooClient(config)
  })

  describe('connect', () => {
    it('should authenticate and return uid', async () => {
      const uid = await client.connect()
      expect(uid).toBe(1)
    })

    it('should throw error on authentication failure', async () => {
      const xmlrpc = await import('xmlrpc')
      // Constructor creates models first, then common
      // Mock models client first (won't be used for auth)
      vi.mocked(xmlrpc.default.createClient).mockReturnValueOnce(createMockClient(false) as any)
      // Mock common client to fail authentication (used for connect)
      vi.mocked(xmlrpc.default.createClient).mockReturnValueOnce(createMockClient(true) as any)

      const failingClient = new OdooClient(config)
      await expect(failingClient.connect()).rejects.toThrow('Odoo authentication failed')
    })
  })

  describe('search', () => {
    it('should search and return IDs', async () => {
      await client.connect()
      const result = await client.search('res.partner', [])
      expect(result).toEqual([1, 2, 3])
    })
  })

  describe('read', () => {
    it('should read records', async () => {
      await client.connect()
      const result = await client.read('res.partner', [1])
      expect(result).toEqual([{ id: 1, name: 'Test' }])
    })
  })

  describe('create', () => {
    it('should create record and return ID', async () => {
      await client.connect()
      const result = await client.create('res.partner', { name: 'Test' })
      expect(result.id).toBe(1)
    })
  })

  describe('write', () => {
    it('should update records', async () => {
      await client.connect()
      const result = await client.write('res.partner', [1], { name: 'Updated' })
      expect(result).toBe(true)
    })
  })

  describe('delete', () => {
    it('should delete records', async () => {
      await client.connect()
      const result = await client.delete('res.partner', [1])
      expect(result).toBe(true)
    })
  })

  describe('testConnection', () => {
    it('should return success on valid connection', async () => {
      const result = await client.testConnection()
      expect(result.success).toBe(true)
      expect(result.version).toBe('19.0')
    })
  })
})
